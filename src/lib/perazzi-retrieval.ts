import { Pool } from "pg";
import type { PoolClient } from "pg";
import { registerType, toSql } from "pgvector/pg";
import { createEmbeddings } from "@/lib/aiClient";
import { getPgSslDiagnostics, getPgSslOptions } from "@/lib/pgSsl";
import type {
  PerazziAssistantRequest,
  RetrievedChunk,
  Archetype,
  ArchetypeVector,
} from "@/types/perazzi-assistant";
import type { RetrievalHints } from "@/lib/perazzi-intents";
import { logTlsDiagForDb } from "@/lib/tlsDiag";

const EMBEDDING_MODEL = process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-large";
const CHUNK_LIMIT = Number(process.env.PERAZZI_RETRIEVAL_LIMIT ?? 12);
const TOP_RETURNED_CHUNKS_CAP = 15;

type RetrievedChunkScoreBreakdown = {
  chunkId: string;
  baseScore: number;
  boost: number;
  archetypeBoost: number;
  finalScore: number;
};

export type RerankMetrics = {
  rerankEnabled: boolean;
  // effective SQL limit used to pull candidates (>= final limit)
  candidateLimit: number;
  // top returned chunks only, capped (no content)
  topReturnedChunks: RetrievedChunkScoreBreakdown[];
};

export function isEnvTrue(value?: string): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function getRerankCandidateLimit(finalLimit: number): number {
  const raw = Number(process.env.PERAZZI_RERANK_CANDIDATE_LIMIT);
  const DEFAULT = 60;
  const MAX = 200;

  const parsed = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT;
  return Math.max(finalLimit, Math.min(parsed, MAX));
}

let pgPool: Pool | null = null;

export async function retrievePerazziContext(
  body: PerazziAssistantRequest,
  hints?: RetrievalHints,
): Promise<{ chunks: RetrievedChunk[]; maxScore: number; rerankMetrics: RerankMetrics }> {
  const rerankEnabled = isEnvTrue(process.env.PERAZZI_ENABLE_RERANK);
  const candidateLimit = rerankEnabled ? getRerankCandidateLimit(CHUNK_LIMIT) : CHUNK_LIMIT;

  const emptyMetrics: RerankMetrics = {
    rerankEnabled,
    candidateLimit,
    topReturnedChunks: [],
  };

  const question = extractLatestUserMessage(body.messages);
  if (!question) {
    return { chunks: [], maxScore: 0, rerankMetrics: emptyMetrics };
  }

  let embeddingResponse;
  try {
    embeddingResponse = await createEmbeddings({
      model: EMBEDDING_MODEL,
      input: question,
    });
  } catch (error) {
    if (isConnectionError(error)) {
      throw new OpenAIConnectionError("Unable to reach OpenAI embeddings endpoint", { cause: error });
    }
    throw error;
  }
  const queryEmbedding = embeddingResponse.data[0]?.embedding ?? [];
  if (!queryEmbedding.length) {
    return { chunks: [], maxScore: 0, rerankMetrics: emptyMetrics };
  }

  const pool = await getPgPool();
  const client = await pool.connect();

  try {
    const { chunks, maxBaseScore, rerankMetrics } = await fetchV2Chunks({
      client,
      queryEmbedding,
      limit: CHUNK_LIMIT,
      hints,
      candidateLimit,
      context: body.context,
      rerankEnabled,
    });
    return { chunks, maxScore: maxBaseScore, rerankMetrics };
  } finally {
    client.release();
  }
}

export async function retrievePerazziContextWithEmbedding(opts: {
  queryEmbedding: number[];
  limit?: number;
  candidateLimit?: number;
  hints?: RetrievalHints;
  context?: PerazziAssistantRequest["context"];
  rerankEnabled?: boolean;
}): Promise<{ chunks: RetrievedChunk[]; maxScore: number; rerankMetrics: RerankMetrics }> {
  const {
    queryEmbedding,
    limit,
    candidateLimit,
    hints,
    context,
    rerankEnabled = isEnvTrue(process.env.PERAZZI_ENABLE_RERANK),
  } = opts;

  const effectiveLimit = Number.isFinite(limit) && Number(limit) > 0
    ? Math.floor(Number(limit))
    : CHUNK_LIMIT;
  const parsedCandidateLimit = Number.isFinite(candidateLimit) && Number(candidateLimit) > 0
    ? Math.floor(Number(candidateLimit))
    : null;
  const effectiveCandidateLimit = rerankEnabled
    ? (parsedCandidateLimit ?? getRerankCandidateLimit(effectiveLimit))
    : effectiveLimit;

  const emptyMetrics: RerankMetrics = {
    rerankEnabled,
    candidateLimit: effectiveCandidateLimit,
    topReturnedChunks: [],
  };

  if (!queryEmbedding.length) {
    return { chunks: [], maxScore: 0, rerankMetrics: emptyMetrics };
  }

  const pool = await getPgPool();
  const client = await pool.connect();

  try {
    const { chunks, maxBaseScore, rerankMetrics } = await fetchV2Chunks({
      client,
      queryEmbedding,
      limit: effectiveLimit,
      hints,
      candidateLimit: effectiveCandidateLimit,
      context,
      rerankEnabled,
    });
    return { chunks, maxScore: maxBaseScore, rerankMetrics };
  } finally {
    client.release();
  }
}

export function buildLanguageFallbacks(locale?: string | null): string[] {
  const base = getBaseLanguage(locale);
  if (base && base !== "en") {
    return [base, "en"];
  }
  return ["en"];
}

export function getBaseLanguage(locale?: string | null) {
  if (!locale) return null;
  const match = /^[a-z]{2}/.exec(locale.toLowerCase());
  return match ? match[0] : null;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, idx) => sum + val * (b[idx] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (!normA || !normB) return 0;
  return dot / (normA * normB);
}

export function computeBoost(
  metadata: Record<string, unknown>,
  context?: PerazziAssistantRequest["context"],
  hints?: RetrievalHints,
): number {
  let boost = 0;
  const audience = String(
    metadata.audience ?? (metadata as { metadata?: { audience?: unknown } })?.metadata?.audience ?? "",
  ).toLowerCase();
  const mode = context?.mode?.toLowerCase();
  if (mode && audience === mode) boost += 0.05;

  const slug = context?.modelSlug?.toLowerCase();
  if (slug) {
    const title = String(metadata.title ?? metadata.summary ?? "").toLowerCase();
    const relatedEntities: Array<Record<string, string>> =
      (metadata.related_entities as Array<Record<string, string>>) ?? [];
    const entityIds: string[] = Array.isArray(metadata.entity_ids)
      ? (metadata.entity_ids as unknown[]).map((id) => String(id).toLowerCase())
      : [];
    if (
      relatedEntities.some(
        (entity) => entity.entity_id?.toLowerCase() === slug,
      ) || entityIds.includes(slug)
    ) {
      boost += 0.08;
    } else if (title.includes(slug)) {
      boost += 0.03;
    }
  }

  const contextPlatform = context?.platformSlug?.toLowerCase();
  let metadataPlatforms: string[] = [];
  if (Array.isArray(metadata.platform_tags)) {
    metadataPlatforms = (metadata.platform_tags as unknown[]).map((value) => String(value).toLowerCase());
  } else if (metadata.platform) {
    metadataPlatforms = [String(metadata.platform).toLowerCase()];
  }
  if (contextPlatform && metadataPlatforms.includes(contextPlatform)) {
    boost += 0.1;
  }
  if (hints?.topics?.length) {
    const hintPlatforms = hints.topics
      .filter((t) => t.startsWith("platform_"))
      .map((t) => t.replace("platform_", ""));
    if (hintPlatforms.some((p) => metadataPlatforms.includes(p))) {
      boost += 0.08;
    }
  }

  if (hints?.topics?.length) {
    const chunkTopics: string[] = Array.isArray(metadata.topics)
      ? (metadata.topics as unknown[]).map((value) => String(value).toLowerCase())
      : [];
    if (chunkTopics.some((topic) => hints.topics.includes(topic))) {
      boost += 0.12;
    }
  }

  // Discipline alignment
  if (hints?.topics?.length) {
    const hintDisciplines = hints.topics
      .filter((t) => t.startsWith("discipline_"))
      .map((t) => t.replace("discipline_", ""));
    const chunkDisciplines: string[] = Array.isArray(metadata.discipline_tags)
      ? (metadata.discipline_tags as unknown[]).map((d) => String(d).toLowerCase())
      : [];
    if (hintDisciplines.some((d) => chunkDisciplines.includes(d))) {
      boost += 0.06;
    }
  }

  // Grade alignment
  if (hints?.topics?.length) {
    const hintGrades = hints.topics.filter((t) => t.startsWith("grade_"));
    const chunkTopics: string[] = Array.isArray(metadata.topics)
      ? (metadata.topics as unknown[]).map((value) => String(value).toLowerCase())
      : [];
    if (hintGrades.some((g) => chunkTopics.includes(g))) {
      boost += 0.05;
    }
  }

  // Rib alignment
  if (hints?.topics?.length) {
    const chunkTopics: string[] = Array.isArray(metadata.topics)
      ? (metadata.topics as unknown[]).map((value) => String(value).toLowerCase())
      : [];
    if (hints.topics.includes("rib_adjustable") && chunkTopics.includes("rib_adjustable")) {
      boost += 0.05;
    }
    if (hints.topics.includes("rib_fixed") && chunkTopics.includes("rib_fixed")) {
      boost += 0.05;
    }
    const notchHints = hints.topics.filter((t) => t.startsWith("rib_notch_"));
    if (notchHints.some((n) => chunkTopics.includes(n))) {
      boost += 0.05;
    }
  }

  const focusEntities = hints?.focusEntities ?? [];
  if (focusEntities.length) {
    const entityIds: string[] = Array.isArray(metadata.entity_ids)
      ? (metadata.entity_ids as unknown[]).map((value) => String(value).toLowerCase())
      : [];
    if (entityIds.some((id) => focusEntities.includes(id))) {
      boost += 0.15;
    }
  }

  if (hints?.keywords?.length) {
    const haystack = [metadata.title, metadata.summary, metadata.source_path]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");
    if (hints.keywords.some((keyword) => haystack.includes(keyword))) {
      boost += 0.05;
    }
  }

  const sourcePath = String(metadata.source_path ?? metadata.sourcePath ?? "").toLowerCase();
  if (sourcePath.includes("pricing_and_models")) {
    boost += 0.08;
  }
  if (sourcePath.includes("sanity_info")) {
    boost -= 0.02;
  }
  return boost;
}

function normalizeStringToken(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toLowerCase();
  if (!s) return null;
  if (s === "null" || s === "undefined") return null;
  return s;
}

function createNormalizedTokenCollector(): {
  out: string[];
  push: (value: unknown) => void;
} {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (value: unknown) => {
    const token = normalizeStringToken(value);
    if (!token) return;
    if (seen.has(token)) return;
    seen.add(token);
    out.push(token);
  };

  return { out, push };
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function walkStringWithJsonFallback(
  raw: string,
  depth: number,
  walk: (value: unknown, depth: number) => void,
  push: (value: unknown) => void,
): void {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const parsed = tryParseJson(trimmed);
  if (parsed !== null) {
    walk(parsed, depth + 1);
    return;
  }

  // Fallback: comma-separated strings
  if (trimmed.includes(",")) {
    for (const part of trimmed.split(",")) push(part);
    return;
  }

  push(trimmed);
}

// Accepts jsonb coming back from PG as object/array/string/null
// Returns normalized string[] lowercased + trimmed + de-duped
export function parseJsonbStringArray(value: unknown): string[] {
  const { out, push } = createNormalizedTokenCollector();

  const walkArray = (items: unknown[], depth: number) => {
    for (const item of items) walk(item, depth + 1);
  };

  const walkObject = (obj: Record<string, unknown>, depth: number) => {
    // Handles odd cases like {"0":"owner","1":"prospect"} or nested structures
    for (const item of Object.values(obj)) {
      walk(item, depth + 1);
    }
  };

  const walkPrimitive = (v: unknown) => {
    // number/boolean/etc => stringify + normalize
    push(v);
  };

  const walk = (v: unknown, depth: number) => {
    if (v === null || v === undefined) return;
    if (depth > 4) return;

    if (Array.isArray(v)) {
      walkArray(v, depth);
      return;
    }

    if (typeof v === "string") {
      walkStringWithJsonFallback(v, depth, walk, push);
      return;
    }

    if (typeof v === "object") {
      walkObject(v as Record<string, unknown>, depth);
      return;
    }

    walkPrimitive(v);
  };

  walk(value, 0);
  return out;
}

// Parses chunk.related_entities jsonb into stable lowercase entity id/slug list
export function extractRelatedEntityIds(value: unknown): string[] {
  const { out, push } = createNormalizedTokenCollector();

  const extractFromObject = (obj: Record<string, unknown>) => {
    // Priority order for IDs
    push(obj.entity_id ?? obj.entityId ?? obj.slug ?? obj.id ?? obj.code);
  };

  const walkArray = (items: unknown[], depth: number) => {
    for (const item of items) walk(item, depth + 1);
  };

  const walkObject = (obj: Record<string, unknown>) => {
    extractFromObject(obj);
  };

  const walkPrimitive = (v: unknown) => {
    // number/boolean/etc => stringify + normalize
    push(v);
  };

  const walk = (v: unknown, depth: number) => {
    if (v === null || v === undefined) return;
    if (depth > 4) return;

    if (Array.isArray(v)) {
      walkArray(v, depth);
      return;
    }

    if (typeof v === "string") {
      walkStringWithJsonFallback(v, depth, walk, push);
      return;
    }

    if (typeof v === "object") {
      walkObject(v as Record<string, unknown>);
      return;
    }

    walkPrimitive(v);
  };

  walk(value, 0);
  return out;
}

type RetrievedRow = {
  chunk_id: string;
  content: string;
  heading_path: string | null;
  document_path: string;
  document_title: string | null;
  category: string | null;
  doc_type: string | null;
  distance: number;
  score: number;

  // Chunk metadata (unused for now)
  chunk_primary_modes?: unknown;
  chunk_archetype_bias?: unknown;
  chunk_section_labels?: unknown;
  chunk_disciplines?: unknown;
  chunk_platforms?: unknown;
  chunk_audiences?: unknown;
  chunk_context_tags?: unknown;
  chunk_related_entities?: unknown;
  chunk_guardrail_flags?: unknown;
  chunk_visibility?: string | null;
  chunk_confidentiality?: string | null;
  chunk_language?: string | null;

  // Document metadata (unused for now)
  doc_disciplines?: unknown;
  doc_platforms?: unknown;
  doc_audiences?: unknown;
  doc_tags?: unknown;
  doc_pricing_sensitive?: boolean | null;
  doc_visibility?: string | null;
  doc_confidentiality?: string | null;
  doc_guardrail_flags?: unknown;
  doc_language?: string | null;
  doc_summary?: string | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getSortedFiniteNumbers(values: unknown[]): number[] {
  const out: number[] = [];
  for (const v of values) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    out.push(n);
  }
  out.sort((a, b) => a - b);
  return out;
}

function quantileSorted(valuesAsc: number[], p: number): number | null {
  if (!valuesAsc.length) return null;
  const clampedP = clamp(p, 0, 1);
  const idx = Math.floor((valuesAsc.length - 1) * clampedP);
  return valuesAsc[idx] ?? null;
}

function summarizeScoresForDebug(values: unknown[]): {
  count: number;
  min: number | null;
  p50: number | null;
  p90: number | null;
  max: number | null;
} {
  const sorted = getSortedFiniteNumbers(values);
  return {
    count: sorted.length,
    min: sorted.length ? (sorted[0] ?? null) : null,
    p50: quantileSorted(sorted, 0.5),
    p90: quantileSorted(sorted, 0.9),
    max: sorted.at(-1) ?? null,
  };
}

function getRerankTuningV2Enabled(): boolean {
  return isEnvTrue(process.env.PERAZZI_RERANK_TUNING_V2);
}

function getRerankTuningV2MaxBoost(): number {
  const raw = Number(process.env.PERAZZI_RERANK_TUNING_V2_MAX_BOOST);
  if (Number.isFinite(raw) && raw > 0 && raw <= 0.5) return raw;
  return 0.25;
}

function getRerankTuningV2BoostMinBase(): number {
  const raw = Number(process.env.PERAZZI_RERANK_TUNING_V2_BOOST_MIN_BASE);
  if (Number.isFinite(raw) && raw >= -1 && raw <= 1) return raw;
  return 0.15;
}

function getRerankTuningV2BoostRamp(): number {
  const raw = Number(process.env.PERAZZI_RERANK_TUNING_V2_BOOST_RAMP);
  if (Number.isFinite(raw) && raw > 0 && raw <= 2) return raw;
  return 0.35;
}

function getRerankTuningV2BoostScale(baseScore: number): number {
  const minBase = getRerankTuningV2BoostMinBase();
  const ramp = getRerankTuningV2BoostRamp();
  if (!Number.isFinite(baseScore)) return 0;
  if (baseScore <= minBase) return 0;
  return clamp((baseScore - minBase) / ramp, 0, 1);
}

function countOverlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let count = 0;
  for (const item of a) {
    if (setB.has(item)) count += 1;
  }
  return count;
}

function normalizeStringArray(values: unknown[] | undefined): string[] {
  if (!values?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const token = normalizeStringToken(v);
    if (!token) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

type BoostV2Parts = {
  mode: number;
  platform: number;
  discipline: number;
  entity: number;
  topical: number;
  keywords: number;
  total: number;
  cappedTotal: number;
  maxBoost: number;
};

const KEYWORD_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "from",
  "with",
  "without",
  "by",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "how",
  "what",
  "which",
  "why",
  "when",
  "where",
  "who",
]);

function tokenizeKeywordText(value: string): string[] {
  const matches = value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return matches.filter((t) => t.length >= 3 && !KEYWORD_STOPWORDS.has(t));
}

function countKeywordMatchesStrict(keywords: string[], haystackText: string): number {
  if (!keywords.length) return 0;
  const haystackTokens = new Set(tokenizeKeywordText(haystackText));
  let matchCount = 0;
  for (const kw of keywords) {
    const kwTokens = tokenizeKeywordText(kw);
    if (!kwTokens.length) continue;
    if (kwTokens.every((t) => haystackTokens.has(t))) matchCount += 1;
  }
  return matchCount;
}

function computeModeBoostV2(
  mode: string | null,
  chunkModes: string[],
  tuningV2Enabled: boolean,
): number {
  if (!mode || !chunkModes.includes(mode)) return 0;
  return tuningV2Enabled ? 0.05 : 0.06;
}

function computePlatformBoostV2(opts: {
  tuningV2Enabled: boolean;
  contextPlatform: string | null;
  topics: string[];
  allPlatforms: string[];
}): number {
  const {
    tuningV2Enabled,
    contextPlatform,
    topics,
    allPlatforms,
  } = opts;

  if (tuningV2Enabled) {
    let boost = 0;
    if (contextPlatform && allPlatforms.includes(contextPlatform)) {
      boost = Math.max(boost, 0.08);
    }
    if (topics.length) {
      const hintPlatforms = topics
        .filter((t) => t.startsWith("platform_"))
        .map((t) => t.replace("platform_", ""))
        .filter(Boolean);
      if (countOverlap(hintPlatforms, allPlatforms) > 0) {
        boost = Math.max(boost, 0.06);
      }
    }
    return boost;
  }

  let boost = 0;
  if (contextPlatform && allPlatforms.includes(contextPlatform)) {
    boost += 0.1; // guideline: +0.05 to +0.12
  }
  if (topics.length) {
    const hintPlatforms = topics
      .filter((t) => t.startsWith("platform_"))
      .map((t) => t.replace("platform_", ""))
      .filter(Boolean);
    if (countOverlap(hintPlatforms, allPlatforms) > 0) {
      boost += 0.08;
    }
  }
  return boost;
}

function computeDisciplineBoostV2(opts: {
  topics: string[];
  allDisciplines: string[];
  tuningV2Enabled: boolean;
}): number {
  const { topics, allDisciplines, tuningV2Enabled } = opts;
  if (!topics.length) return 0;

  const hintDisciplines = topics
    .filter((t) => t.startsWith("discipline_"))
    .map((t) => t.replace("discipline_", ""))
    .filter(Boolean);
  if (countOverlap(hintDisciplines, allDisciplines) > 0) {
    return tuningV2Enabled ? 0.05 : 0.06; // guideline: +0.03 to +0.08
  }
  return 0;
}

function computeEntityBoostV2(opts: {
  contextModel: string | null;
  focusEntities: string[];
  relatedEntityIds: string[];
  tuningV2Enabled: boolean;
}): number {
  const {
    contextModel,
    focusEntities,
    relatedEntityIds,
    tuningV2Enabled,
  } = opts;

  let boost = 0;
  if (contextModel && relatedEntityIds.includes(contextModel)) {
    boost = Math.max(boost, 0.12);
  }
  if (focusEntities.length && countOverlap(focusEntities, relatedEntityIds) > 0) {
    boost = Math.max(boost, tuningV2Enabled ? 0.12 : 0.15);
  }
  return boost; // guideline: +0.10 to +0.20
}

function computeTopicalBoostV2(opts: {
  topics: string[];
  chunkContextTags: string[];
  chunkSectionLabels: string[];
  docTags: string[];
  tuningV2Enabled: boolean;
}): number {
  const {
    topics,
    chunkContextTags,
    chunkSectionLabels,
    docTags,
    tuningV2Enabled,
  } = opts;

  // Only count "non-platform / non-discipline" topics here to avoid double counting
  const topicalTopics = topics.filter(
    (t) => !t.startsWith("platform_") && !t.startsWith("discipline_"),
  );
  if (!topicalTopics.length) return 0;

  if (tuningV2Enabled) {
    const inContextTags = countOverlap(topicalTopics, chunkContextTags) > 0;
    const inSectionLabels = countOverlap(topicalTopics, chunkSectionLabels) > 0;
    const inDocTags = countOverlap(topicalTopics, docTags) > 0;
    return Math.max(
      inContextTags ? 0.05 : 0,
      inSectionLabels ? 0.03 : 0,
      inDocTags ? 0.03 : 0,
    );
  }

  let boost = 0;
  if (countOverlap(topicalTopics, chunkContextTags) > 0) {
    boost += 0.06;
  }
  if (countOverlap(topicalTopics, chunkSectionLabels) > 0) {
    boost += 0.04;
  }
  if (countOverlap(topicalTopics, docTags) > 0) {
    boost += 0.04;
  }
  return boost;
}

function computeKeywordBoostV2(opts: {
  keywords: string[];
  tuningV2Enabled: boolean;
  row: RetrievedRow;
  chunkContextTags: string[];
  chunkSectionLabels: string[];
  docTags: string[];
}): number {
  const {
    keywords,
    tuningV2Enabled,
    row,
    chunkContextTags,
    chunkSectionLabels,
    docTags,
  } = opts;

  if (!keywords.length) return 0;

  if (tuningV2Enabled) {
    // Strict keyword matching to reduce substring noise and double-counting with tags/topics.
    const haystack = [
      String(row.document_title ?? ""),
      String(row.document_path ?? ""),
      String(row.heading_path ?? ""),
      String(row.doc_summary ?? ""),
    ].join(" ");

    const matchCount = countKeywordMatchesStrict(keywords, haystack);
    if (matchCount > 0) {
      // 1 match => 0.02, 2 => 0.03, 3+ => 0.04
      return clamp(0.01 + 0.01 * Math.min(matchCount, 3), 0, 0.04);
    }
    return 0;
  }

  const haystackParts: string[] = [
    String(row.document_title ?? ""),
    String(row.document_path ?? ""),
    String(row.heading_path ?? ""),
    String(row.doc_summary ?? ""),
    // Include tags/labels as text
    chunkContextTags.join(" "),
    chunkSectionLabels.join(" "),
    docTags.join(" "),
  ];

  const haystack = haystackParts.join(" ").toLowerCase();

  let matchCount = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) matchCount += 1;
  }

  // Small, bounded keyword boost
  if (matchCount > 0) {
    // 1 match => 0.03, 2 => 0.04, 3 => 0.05, 4+ => 0.06
    return clamp(0.02 + 0.01 * Math.min(matchCount, 4), 0, 0.06);
  }
  return 0;
}

function computeBoostV2WithParts(
  row: RetrievedRow,
  context?: PerazziAssistantRequest["context"],
  hints?: RetrievalHints,
  opts?: { tuningV2Enabled?: boolean },
): { boost: number; parts: BoostV2Parts } {
  const tuningV2Enabled = opts?.tuningV2Enabled ?? getRerankTuningV2Enabled();
  const maxBoost = tuningV2Enabled ? getRerankTuningV2MaxBoost() : 0.5;

  let boost = 0;
  const parts: BoostV2Parts = {
    mode: 0,
    platform: 0,
    discipline: 0,
    entity: 0,
    topical: 0,
    keywords: 0,
    total: 0,
    cappedTotal: 0,
    maxBoost,
  };

  const mode = normalizeStringToken(context?.mode);
  const contextPlatform = normalizeStringToken(context?.platformSlug);
  const contextModel = normalizeStringToken(context?.modelSlug);

  const topics = normalizeStringArray(hints?.topics);
  const keywords = normalizeStringArray(hints?.keywords)
    // Avoid ultra-short noisy tokens
    .filter((k) => k.length >= 3);

  const focusEntities = normalizeStringArray(hints?.focusEntities);

  // ---------- Parse jsonb fields ----------
  const chunkModes = parseJsonbStringArray(row.chunk_primary_modes);

  const docPlatforms = parseJsonbStringArray(row.doc_platforms);
  const chunkPlatforms = parseJsonbStringArray(row.chunk_platforms);
  const allPlatforms = Array.from(new Set([...docPlatforms, ...chunkPlatforms]));

  const docDisciplines = parseJsonbStringArray(row.doc_disciplines);
  const chunkDisciplines = parseJsonbStringArray(row.chunk_disciplines);
  const allDisciplines = Array.from(new Set([...docDisciplines, ...chunkDisciplines]));

  const docTags = parseJsonbStringArray(row.doc_tags);
  const chunkContextTags = parseJsonbStringArray(row.chunk_context_tags);
  const chunkSectionLabels = parseJsonbStringArray(row.chunk_section_labels);

  const relatedEntityIds = extractRelatedEntityIds(row.chunk_related_entities);

  // ---------- Mode alignment ----------
  parts.mode = computeModeBoostV2(mode, chunkModes, tuningV2Enabled);
  boost += parts.mode; // guideline: +0.03 to +0.08

  // ---------- Platform alignment ----------
  parts.platform = computePlatformBoostV2({
    tuningV2Enabled,
    contextPlatform,
    topics,
    allPlatforms,
  });
  boost += parts.platform;

  // ---------- Discipline alignment ----------
  parts.discipline = computeDisciplineBoostV2({
    topics,
    allDisciplines,
    tuningV2Enabled,
  });
  boost += parts.discipline; // guideline: +0.03 to +0.08

  // ---------- Entity alignment (strong) ----------
  parts.entity = computeEntityBoostV2({
    contextModel,
    focusEntities,
    relatedEntityIds,
    tuningV2Enabled,
  });
  boost += parts.entity; // guideline: +0.10 to +0.20

  // ---------- Topic alignment (tags/labels) ----------
  parts.topical = computeTopicalBoostV2({
    topics,
    chunkContextTags,
    chunkSectionLabels,
    docTags,
    tuningV2Enabled,
  });
  boost += parts.topical;

  // ---------- Keyword alignment ----------
  parts.keywords = computeKeywordBoostV2({
    keywords,
    tuningV2Enabled,
    row,
    chunkContextTags,
    chunkSectionLabels,
    docTags,
  });
  boost += parts.keywords;

  if (!Number.isFinite(boost)) {
    parts.total = 0;
    parts.cappedTotal = 0;
    return { boost: 0, parts };
  }

  // Hard clamp to keep this a "nudge", not an override
  parts.total = boost;
  const capped = clamp(boost, -0.1, maxBoost);
  parts.cappedTotal = capped;
  return { boost: capped, parts };
}

export function computeBoostV2(
  row: RetrievedRow,
  context?: PerazziAssistantRequest["context"],
  hints?: RetrievalHints,
): number {
  return computeBoostV2WithParts(row, context, hints).boost;
}

const ARCHETYPE_KEYS_LOWER: Archetype[] = [
  "loyalist",
  "prestige",
  "analyst",
  "achiever",
  "legacy",
];

function normalizeArchetypeVectorForBoost(
  vec: ArchetypeVector,
): ArchetypeVector {
  // Defensive normalize: clamp negatives to 0, normalize to sum=1
  const cleaned: ArchetypeVector = { ...vec };
  let sum = 0;

  for (const key of ARCHETYPE_KEYS_LOWER) {
    const v = Number(cleaned[key] ?? 0);
    const safe = Number.isFinite(v) ? Math.max(0, v) : 0;
    cleaned[key] = safe;
    sum += safe;
  }

  if (sum <= 0) {
    // Fallback to a neutral vector if someone passes garbage
    const neutral = 1 / ARCHETYPE_KEYS_LOWER.length;
    const out: ArchetypeVector = { ...vec };
    for (const key of ARCHETYPE_KEYS_LOWER) out[key] = neutral;
    return out;
  }

  const out: ArchetypeVector = { ...vec };
  for (const key of ARCHETYPE_KEYS_LOWER) out[key] = (cleaned[key] ?? 0) / sum;
  return out;
}

function getArchetypeConfidenceMargin(vec: ArchetypeVector): number {
  // margin = best - runnerUp, bounded [0..1]
  const values = ARCHETYPE_KEYS_LOWER.map((key) => Number(vec[key] ?? 0))
    .map((v) => (Number.isFinite(v) ? Math.max(0, v) : 0))
    .sort((a, b) => b - a);

  const best = values[0] ?? 0;
  const runner = values[1] ?? 0;
  return clamp(best - runner, 0, 1);
}

function getArchetypeConfidenceMin(): number {
  const raw = Number(process.env.PERAZZI_ARCHETYPE_CONFIDENCE_MIN);
  // default from roadmap: ~0.08
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 0.08;
}

export function getArchetypeBoostK(): number {
  const raw = Number(process.env.PERAZZI_ARCHETYPE_BOOST_K);
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
  return 0.08; // safe default
}

export function computeArchetypeBoost(
  userVector: ArchetypeVector | null | undefined,
  chunkArchetypeBias: unknown,
  archetypeConfidenceMargin?: number | null,
): number {
  if (!userVector) return 0;

  // Parse and validate bias keys from chunk jsonb
  const biasRaw = parseJsonbStringArray(chunkArchetypeBias);

  if (!biasRaw.length) return 0;

  // Filter to recognized archetype keys only
  const biasSet = new Set<string>(biasRaw);
  const biasKeys = ARCHETYPE_KEYS_LOWER.filter((k) => biasSet.has(k));

  // If bias is empty after filtering, no archetype signal.
  if (!biasKeys.length) return 0;

  // If the chunk claims it matches "everything", archetype should not move it.
  if (biasKeys.length === ARCHETYPE_KEYS_LOWER.length) return 0;

  const vec = normalizeArchetypeVectorForBoost(userVector);

  // alignment = sum of user weights for biased archetypes
  let alignment = 0;
  for (const key of biasKeys) {
    alignment += Number(vec[key] ?? 0);
  }
  alignment = clamp(alignment, 0, 1);

  // specialization: 1.0 when very specific, 0.0 when broad (all 5, handled above)
  const specialization = clamp(
    1 - biasKeys.length / ARCHETYPE_KEYS_LOWER.length,
    0,
    1,
  );

  // confidenceFactor: scale by margin so mixed vectors don't dominate ranking
  const margin =
    archetypeConfidenceMargin ?? getArchetypeConfidenceMargin(vec);

  const confMin = getArchetypeConfidenceMin();
  const confidenceFactor =
    confMin > 0 ? clamp(margin / confMin, 0, 1) : 1;

  // Boost coefficient K now tunable via ENV
  const K = getArchetypeBoostK();

  const boost = K * alignment * specialization * confidenceFactor;

  if (!Number.isFinite(boost)) return 0;

  // Archetype boost should be a small positive nudge only
  return clamp(boost, 0, 0.15);
}

async function fetchV2Chunks(opts: {
  client: PoolClient;
  queryEmbedding: number[];
  limit: number;
  candidateLimit?: number;
  hints?: RetrievalHints;
  context?: PerazziAssistantRequest["context"];
  rerankEnabled?: boolean;
}): Promise<{ chunks: RetrievedChunk[]; maxBaseScore: number; rerankMetrics: RerankMetrics }> {
  const {
    client,
    queryEmbedding,
    limit,
    candidateLimit,
    hints,
    context,
    rerankEnabled,
  } = opts;
  const retrievalDebugEnabled = isEnvTrue(process.env.PERAZZI_ENABLE_RETRIEVAL_DEBUG);
  const rerankTuningV2Enabled = getRerankTuningV2Enabled();
  const rerankDebugBreakdownEnabled =
    retrievalDebugEnabled && isEnvTrue(process.env.PERAZZI_RERANK_DEBUG_BREAKDOWN);
  const rerankTuningV2Config = rerankTuningV2Enabled
    ? {
        maxBoost: getRerankTuningV2MaxBoost(),
        boostMinBase: getRerankTuningV2BoostMinBase(),
        boostRamp: getRerankTuningV2BoostRamp(),
      }
    : null;
  const embeddingParam = toSql(queryEmbedding);
  const effectiveCandidateLimit = Math.max(candidateLimit ?? limit, limit);
  const knnPreselectEnabled = isEnvTrue(process.env.PERAZZI_ENABLE_VECTOR_KNN_PRESELECT);
  const knnOverfetchMultiplierRaw = Number(process.env.PERAZZI_VECTOR_KNN_OVERFETCH_MULTIPLIER);
  const knnOverfetchMultiplier = Number.isFinite(knnOverfetchMultiplierRaw) && knnOverfetchMultiplierRaw > 0
    ? Math.max(1, Math.min(Math.floor(knnOverfetchMultiplierRaw), 10))
    : 3;
  const knnLimit = effectiveCandidateLimit * knnOverfetchMultiplier;

  const sql = knnPreselectEnabled
    ? `
        with knn as materialized (
          select
            e.chunk_id,
            (e.embedding::halfvec(3072) <=> $1::halfvec(3072)) as distance
          from public.embeddings e
          order by (e.embedding::halfvec(3072) <=> $1::halfvec(3072)) asc
          limit $2
        ),
        ranked as (
          select
            cd.chunk_id,
            cd.content,
            cd.heading_path,

            cd.document_path,
            cd.document_title,
            cd.category,
            cd.doc_type,

            cd.chunk_primary_modes,
            cd.chunk_archetype_bias,
            cd.chunk_section_labels,
            cd.chunk_disciplines,
            cd.chunk_platforms,
            cd.chunk_audiences,
            cd.chunk_context_tags,
            cd.chunk_related_entities,
            cd.chunk_guardrail_flags,
            cd.chunk_visibility,
            cd.chunk_confidentiality,
            cd.chunk_language,

            cd.doc_disciplines,
            cd.doc_platforms,
            cd.doc_audiences,
            cd.doc_tags,
            cd.doc_pricing_sensitive,
            cd.doc_visibility,
            cd.doc_confidentiality,
            cd.doc_guardrail_flags,
            cd.doc_language,
            cd.doc_summary,

            knn.distance
          from knn
          join lateral (
            select
              c.id as chunk_id,
              c.text as content,
              c.heading_path,

              d.path as document_path,
              d.title as document_title,
              d.category,
              d.doc_type,

              c.primary_modes as chunk_primary_modes,
              c.archetype_bias as chunk_archetype_bias,
              c.section_labels as chunk_section_labels,
              c.disciplines as chunk_disciplines,
              c.platforms as chunk_platforms,
              c.audiences as chunk_audiences,
              c.context_tags as chunk_context_tags,
              c.related_entities as chunk_related_entities,
              c.guardrail_flags as chunk_guardrail_flags,
              c.visibility as chunk_visibility,
              c.confidentiality as chunk_confidentiality,
              c.language as chunk_language,

              d.disciplines as doc_disciplines,
              d.platforms as doc_platforms,
              d.audiences as doc_audiences,
              d.tags as doc_tags,
              d.pricing_sensitive as doc_pricing_sensitive,
              d.visibility as doc_visibility,
              d.confidentiality as doc_confidentiality,
              d.guardrail_flags as doc_guardrail_flags,
              d.language as doc_language,
              d.summary as doc_summary
            from public.chunks c
            join public.documents d on d.id = c.document_id
            where
              c.id = knn.chunk_id
              and d.status = 'active'
              and coalesce(c.visibility, 'public') = 'public'
              and coalesce(d.visibility, 'public') = 'public'
              and coalesce(d.confidentiality, 'normal') = 'normal'
              and coalesce(c.confidentiality, 'normal') = 'normal'
          ) cd on true
          order by knn.distance asc
          limit $3
        )
        select
          ranked.*,
          (1.0 - ranked.distance) as score
        from ranked
      `
    : `
        with ranked as (
          select
            c.id as chunk_id,
            c.text as content,
            c.heading_path,

            d.path as document_path,
            d.title as document_title,
            d.category,
            d.doc_type,

            c.primary_modes as chunk_primary_modes,
            c.archetype_bias as chunk_archetype_bias,
            c.section_labels as chunk_section_labels,
            c.disciplines as chunk_disciplines,
            c.platforms as chunk_platforms,
            c.audiences as chunk_audiences,
            c.context_tags as chunk_context_tags,
            c.related_entities as chunk_related_entities,
            c.guardrail_flags as chunk_guardrail_flags,
            c.visibility as chunk_visibility,
            c.confidentiality as chunk_confidentiality,
            c.language as chunk_language,

            d.disciplines as doc_disciplines,
            d.platforms as doc_platforms,
            d.audiences as doc_audiences,
            d.tags as doc_tags,
            d.pricing_sensitive as doc_pricing_sensitive,
            d.visibility as doc_visibility,
            d.confidentiality as doc_confidentiality,
            d.guardrail_flags as doc_guardrail_flags,
            d.language as doc_language,
            d.summary as doc_summary,

            (e.embedding::halfvec(3072) <=> $1::halfvec(3072)) as distance
          from public.embeddings e
          join public.chunks c on c.id = e.chunk_id
          join public.documents d on d.id = c.document_id
          where
            d.status = 'active'
            and coalesce(c.visibility, 'public') = 'public'
            and coalesce(d.visibility, 'public') = 'public'
            and coalesce(d.confidentiality, 'normal') = 'normal'
            and coalesce(c.confidentiality, 'normal') = 'normal'
          order by (e.embedding::halfvec(3072) <=> $1::halfvec(3072)) asc
          limit $2
        )
        select
          ranked.*,
          (1.0 - ranked.distance) as score
        from ranked
      `;

  const params = knnPreselectEnabled
    ? [embeddingParam, knnLimit, effectiveCandidateLimit]
    : [embeddingParam, effectiveCandidateLimit];

  const { rows } = await client.query(sql, params);

  const typedRows = rows as RetrievedRow[];
  const logRetrievalDebug = (payload: Record<string, unknown>) => {
    if (!retrievalDebugEnabled) return;
    console.info(JSON.stringify({ type: "perazzi-retrieval-debug", ...payload }));
  };
  const maxBaseScore = typedRows.reduce((max, row) => {
    const s = Number(row.score ?? 0);
    if (Number.isNaN(s)) return max;
    return Math.max(max, s);
  }, 0);
  const candidateBaseScoreStats = summarizeScoresForDebug(typedRows.map((r) => r.score));

  if (!rerankEnabled) {
    const results = typedRows.map((row) => {
      const title =
        row.document_title ??
        row.document_path ??
        "Perazzi Reference";

      const baseScore = row.score ?? 0;

      return {
        chunkId: row.chunk_id,
        title,
        sourcePath: row.document_path ?? "PGPT/unknown",
        content: row.content ?? "",
        baseScore,
        score: baseScore,
        documentPath: row.document_path ?? undefined,
        headingPath: row.heading_path ?? undefined,
        category: row.category ?? null,
        docType: row.doc_type ?? null,
      };
    });

    const sliced = results.slice(0, limit);

    logRetrievalDebug({
      rerankEnabled: false,
      rerankTuningV2Enabled,
      rerankTuningV2Config,
      candidateBaseScoreStats,
      knnPreselectEnabled,
      knnOverfetchMultiplier: knnPreselectEnabled ? knnOverfetchMultiplier : null,
      knnLimit: knnPreselectEnabled ? knnLimit : null,
      candidateCount: typedRows.length,
      returnedCount: sliced.length,
      limit,
      effectiveCandidateLimit,
      top: typedRows.slice(0, Math.min(limit, TOP_RETURNED_CHUNKS_CAP)).map((row, idx) => {
        const baseScore = Number(row.score ?? 0);
        return {
          rank: idx + 1,
          chunkId: row.chunk_id,
          documentPath: row.document_path ?? null,
          baseScore,
          boost: 0,
          archetypeBoost: 0,
          finalScore: baseScore,
          primaryModes: parseJsonbStringArray(row.chunk_primary_modes),
          archetypeBias: parseJsonbStringArray(row.chunk_archetype_bias),
        };
      }),
    });

    const topReturnedChunks: RetrievedChunkScoreBreakdown[] = sliced
      .slice(0, Math.min(TOP_RETURNED_CHUNKS_CAP, sliced.length))
      .map((c) => ({
        chunkId: c.chunkId,
        baseScore: Number(c.baseScore ?? 0),
        boost: 0,
        archetypeBoost: 0,
        finalScore: Number(c.baseScore ?? 0),
      }));

    const rerankMetrics: RerankMetrics = {
      rerankEnabled: false,
      candidateLimit: effectiveCandidateLimit,
      topReturnedChunks,
    };

    return { chunks: sliced, maxBaseScore, rerankMetrics };
  }

  const userVector = context?.archetypeVector ?? null;
  const normalized = userVector ? normalizeArchetypeVectorForBoost(userVector) : null;
  const margin = normalized ? getArchetypeConfidenceMargin(normalized) : null;

  const scored = typedRows.map((row) => {
    const baseScore = Number(row.score ?? 0);
    const boostInfo = computeBoostV2WithParts(row, context, hints, {
      tuningV2Enabled: rerankTuningV2Enabled,
    });
    const rawBoost = boostInfo.boost;
    const rawArchetypeBoost = computeArchetypeBoost(userVector, row.chunk_archetype_bias, margin);
    const boostScale = rerankTuningV2Enabled ? getRerankTuningV2BoostScale(baseScore) : 1;
    const boost = rawBoost * boostScale;
    const archetypeBoost = rawArchetypeBoost * boostScale;
    const finalScore = baseScore + boost + archetypeBoost;

    return {
      row,
      baseScore,
      boost,
      archetypeBoost,
      finalScore,
      boostScale: rerankTuningV2Enabled ? boostScale : null,
      boostParts: rerankDebugBreakdownEnabled ? boostInfo.parts : undefined,
      boostRaw: rerankDebugBreakdownEnabled ? rawBoost : undefined,
      archetypeBoostRaw: rerankDebugBreakdownEnabled ? rawArchetypeBoost : undefined,
    };
  });

  scored.sort((a, b) => {
    const diff = b.finalScore - a.finalScore;
    if (diff !== 0) return diff;

    const baseDiff = b.baseScore - a.baseScore;
    if (baseDiff !== 0) return baseDiff;

    return a.row.chunk_id.localeCompare(b.row.chunk_id);
  });

  const top = scored.slice(0, limit);

  logRetrievalDebug({
    rerankEnabled: true,
    rerankTuningV2Enabled,
    rerankTuningV2Config,
    candidateBaseScoreStats,
    knnPreselectEnabled,
    knnOverfetchMultiplier: knnPreselectEnabled ? knnOverfetchMultiplier : null,
    knnLimit: knnPreselectEnabled ? knnLimit : null,
    candidateCount: typedRows.length,
    returnedCount: top.length,
    limit,
    effectiveCandidateLimit,
    top: top.slice(0, TOP_RETURNED_CHUNKS_CAP).map((item, idx) => ({
      rank: idx + 1,
      chunkId: item.row.chunk_id,
      documentPath: item.row.document_path ?? null,
      baseScore: item.baseScore,
      boost: item.boost,
      boostScale: item.boostScale ?? undefined,
      boostRaw: (item as { boostRaw?: number }).boostRaw,
      boostParts: (item as { boostParts?: BoostV2Parts }).boostParts,
      archetypeBoost: item.archetypeBoost,
      archetypeBoostRaw: (item as { archetypeBoostRaw?: number }).archetypeBoostRaw,
      finalScore: item.finalScore,
      primaryModes: parseJsonbStringArray(item.row.chunk_primary_modes),
      archetypeBias: parseJsonbStringArray(item.row.chunk_archetype_bias),
    })),
  });

  const results: RetrievedChunk[] = top.map(({ row, baseScore, finalScore }) => {
    const title =
      row.document_title ??
      row.document_path ??
      "Perazzi Reference";
    return {
      chunkId: row.chunk_id,
      title,
      sourcePath: row.document_path ?? "PGPT/unknown",
      content: row.content ?? "",
      baseScore,
      score: finalScore,
      documentPath: row.document_path ?? undefined,
      headingPath: row.heading_path ?? undefined,
      category: row.category ?? null,
      docType: row.doc_type ?? null,
    };
  });

  const topReturnedChunks: RetrievedChunkScoreBreakdown[] = top
    .slice(0, Math.min(TOP_RETURNED_CHUNKS_CAP, top.length))
    .map((item) => ({
      chunkId: item.row.chunk_id,
      baseScore: Number(item.baseScore ?? 0),
      boost: Number(item.boost ?? 0),
      archetypeBoost: Number(item.archetypeBoost ?? 0),
      finalScore: Number(item.finalScore ?? 0),
    }));

  const rerankMetrics: RerankMetrics = {
    rerankEnabled: true,
    candidateLimit: effectiveCandidateLimit,
    topReturnedChunks,
  };

  return { chunks: results, maxBaseScore, rerankMetrics };
}

async function getPgPool(): Promise<Pool> {
  if (pgPool) return pgPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      JSON.stringify({
        type: "perazzi-db-debug",
        error: "MISSING_DATABASE_URL",
        nodeEnv: process.env.NODE_ENV ?? "unset",
        vercelEnv: process.env.VERCEL_ENV ?? "unset",
      }),
    );
    throw new Error("DATABASE_URL is required for retrieval.");
  }

  // Safe debug: log only the hostname, never credentials
  try {
    const url = new URL(connectionString);
    console.info(
      JSON.stringify({
        type: "perazzi-db-debug",
        dbHost: url.hostname,
        nodeEnv: process.env.NODE_ENV ?? "unset",
        vercelEnv: process.env.VERCEL_ENV ?? "unset",
      }),
    );
  } catch {
    console.info(
      JSON.stringify({
        type: "perazzi-db-debug",
        error: "DB_URL_PARSE_ERROR",
        nodeEnv: process.env.NODE_ENV ?? "unset",
        vercelEnv: process.env.VERCEL_ENV ?? "unset",
      }),
    );
  }

  const sslOptions = getPgSslOptions();
  const { sslMode, hasCa } = getPgSslDiagnostics();
  logTlsDiagForDb("pg.retrieval.pool", connectionString, sslMode, { hasCa });
  pgPool = new Pool({
    connectionString,
    ssl: sslOptions,
  });

  const client = await pgPool.connect();
  try {
    await registerType(client);
  } finally {
    client.release();
  }

  return pgPool;
}

export function extractLatestUserMessage(messages: PerazziAssistantRequest["messages"]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].content;
    }
  }
  return null;
}

export function isConnectionError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { cause?: unknown; code?: unknown; message?: unknown };
  const cause = candidate.cause;
  const causeCode =
    typeof cause === "object" && cause !== null && "code" in cause
      ? (cause as { code?: unknown }).code
      : undefined;
  const causeMessage =
    typeof cause === "object" && cause !== null && "message" in cause
      ? (cause as { message?: unknown }).message
      : undefined;
  const code = (causeCode as string | undefined) ?? (candidate.code as string | undefined);
  const message = ((candidate.message ?? causeMessage) as string | undefined)?.toString().toLowerCase() ?? "";
  return (
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "EAI_AGAIN" ||
    message.includes("connection error") ||
    message.includes("fetch failed")
  );
}

export class OpenAIConnectionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "OpenAIConnectionError";
  }
}
