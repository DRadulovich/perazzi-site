import { Pool } from "pg";
import type { PoolClient } from "pg";
import { registerType } from "pgvector/pg";
import { createEmbeddings } from "@/lib/aiClient";
import type { PerazziAssistantRequest, RetrievedChunk } from "@/types/perazzi-assistant";
import type { RetrievalHints } from "@/lib/perazzi-intents";

const EMBEDDING_MODEL = process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-large";
const CHUNK_LIMIT = Number(process.env.PERAZZI_RETRIEVAL_LIMIT ?? 12);

let pgPool: Pool | null = null;

export async function retrievePerazziContext(
  body: PerazziAssistantRequest,
  hints?: RetrievalHints,
): Promise<{ chunks: RetrievedChunk[]; maxScore: number }> {
  const _hints = hints;
  void _hints;
  const question = extractLatestUserMessage(body.messages);
  if (!question) {
    return { chunks: [], maxScore: 0 };
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
    return { chunks: [], maxScore: 0 };
  }

  const pool = await getPgPool();
  const client = await pool.connect();

  try {
    const chunks = await fetchV2Chunks({
      client,
      queryEmbedding,
      limit: CHUNK_LIMIT,
      hints,
    });
    const maxScore = chunks.reduce((max, c) => (c.score > max ? c.score : max), 0);
    return { chunks, maxScore };
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
  const match = locale.toLowerCase().match(/^[a-z]{2}/);
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
  const metadataPlatforms: string[] = Array.isArray(metadata.platform_tags)
    ? (metadata.platform_tags as unknown[]).map((value) => String(value).toLowerCase())
    : metadata.platform
      ? [String(metadata.platform).toLowerCase()]
      : [];
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

  if (hints?.focusEntities?.length) {
    const entityIds: string[] = Array.isArray(metadata.entity_ids)
      ? (metadata.entity_ids as unknown[]).map((value) => String(value).toLowerCase())
      : [];
    if (entityIds.some((id) => hints.focusEntities!.includes(id))) {
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

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Accepts jsonb coming back from PG as object/array/string/null
// Returns normalized string[] lowercased + trimmed + de-duped
export function parseJsonbStringArray(value: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (v: unknown) => {
    const token = normalizeStringToken(v);
    if (!token) return;
    if (seen.has(token)) return;
    seen.add(token);
    out.push(token);
  };

  const walk = (v: unknown, depth: number) => {
    if (v === null || v === undefined) return;
    if (depth > 4) return;

    if (Array.isArray(v)) {
      for (const item of v) walk(item, depth + 1);
      return;
    }

    if (typeof v === "string") {
      const trimmed = v.trim();
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
      return;
    }

    if (typeof v === "object") {
      // Handles odd cases like {"0":"owner","1":"prospect"} or nested structures
      for (const item of Object.values(v as Record<string, unknown>)) {
        walk(item, depth + 1);
      }
      return;
    }

    // number/boolean/etc => stringify + normalize
    push(v);
  };

  walk(value, 0);
  return out;
}

// Parses chunk.related_entities jsonb into stable lowercase entity id/slug list
export function extractRelatedEntityIds(value: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (v: unknown) => {
    const token = normalizeStringToken(v);
    if (!token) return;
    if (seen.has(token)) return;
    seen.add(token);
    out.push(token);
  };

  const extractFromObject = (obj: Record<string, unknown>) => {
    // Priority order for IDs
    push(obj.entity_id ?? obj.entityId ?? obj.slug ?? obj.id ?? obj.code);
  };

  const walk = (v: unknown, depth: number) => {
    if (v === null || v === undefined) return;
    if (depth > 4) return;

    if (Array.isArray(v)) {
      for (const item of v) walk(item, depth + 1);
      return;
    }

    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return;

      const parsed = tryParseJson(trimmed);
      if (parsed !== null) {
        walk(parsed, depth + 1);
        return;
      }

      // Could be a single id/slug, or comma-separated fallback
      if (trimmed.includes(",")) {
        for (const part of trimmed.split(",")) push(part);
        return;
      }

      push(trimmed);
      return;
    }

    if (typeof v === "object") {
      extractFromObject(v as Record<string, unknown>);
      return;
    }

    // number/boolean/etc => stringify + normalize
    push(v);
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

export function computeBoostV2(
  row: RetrievedRow,
  context?: PerazziAssistantRequest["context"],
  hints?: RetrievalHints,
): number {
  let boost = 0;

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
  if (mode && chunkModes.includes(mode)) {
    boost += 0.06; // guideline: +0.03 to +0.08
  }

  // ---------- Platform alignment ----------
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

  // ---------- Discipline alignment ----------
  if (topics.length) {
    const hintDisciplines = topics
      .filter((t) => t.startsWith("discipline_"))
      .map((t) => t.replace("discipline_", ""))
      .filter(Boolean);
    if (countOverlap(hintDisciplines, allDisciplines) > 0) {
      boost += 0.06; // guideline: +0.03 to +0.08
    }
  }

  // ---------- Entity alignment (strong) ----------
  // Prefer max-style (don't stack too hard)
  let entityBoost = 0;
  if (contextModel && relatedEntityIds.includes(contextModel)) {
    entityBoost = Math.max(entityBoost, 0.12);
  }
  if (focusEntities.length && countOverlap(focusEntities, relatedEntityIds) > 0) {
    entityBoost = Math.max(entityBoost, 0.15);
  }
  boost += entityBoost; // guideline: +0.10 to +0.20

  // ---------- Topic alignment (tags/labels) ----------
  // Only count "non-platform / non-discipline" topics here to avoid double counting
  const topicalTopics = topics.filter(
    (t) => !t.startsWith("platform_") && !t.startsWith("discipline_"),
  );
  if (topicalTopics.length) {
    if (countOverlap(topicalTopics, chunkContextTags) > 0) boost += 0.06;
    if (countOverlap(topicalTopics, chunkSectionLabels) > 0) boost += 0.04;
    if (countOverlap(topicalTopics, docTags) > 0) boost += 0.04;
  }

  // ---------- Keyword alignment ----------
  if (keywords.length) {
    const haystackParts: string[] = [];

    haystackParts.push(String(row.document_title ?? ""));
    haystackParts.push(String(row.document_path ?? ""));
    haystackParts.push(String(row.heading_path ?? ""));
    haystackParts.push(String(row.doc_summary ?? ""));

    // Include tags/labels as text
    haystackParts.push(chunkContextTags.join(" "));
    haystackParts.push(chunkSectionLabels.join(" "));
    haystackParts.push(docTags.join(" "));

    const haystack = haystackParts.join(" ").toLowerCase();

    let matchCount = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) matchCount += 1;
    }

    // Small, bounded keyword boost
    if (matchCount > 0) {
      // 1 match => 0.03, 2 => 0.04, 3 => 0.05, 4+ => 0.06
      boost += clamp(0.02 + 0.01 * Math.min(matchCount, 4), 0, 0.06);
    }
  }

  if (!Number.isFinite(boost)) return 0;

  // Hard clamp to keep this a "nudge", not an override
  return clamp(boost, -0.1, 0.5);
}

async function fetchV2Chunks(opts: {
  client: PoolClient;
  queryEmbedding: number[];
  limit: number;
  candidateLimit?: number;
  hints?: RetrievalHints;
}): Promise<RetrievedChunk[]> {
  const { client, queryEmbedding, limit, candidateLimit, hints: _hints } = opts;
  void _hints;
  const embeddingParam = JSON.stringify(queryEmbedding);
  const effectiveCandidateLimit = Math.max(candidateLimit ?? limit, limit);

  const { rows } = await client.query(
    `
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
        order by distance asc
        limit $2
      )
      select
        ranked.*,
        (1.0 - ranked.distance) as score
      from ranked
    `,
    [embeddingParam, effectiveCandidateLimit],
  );
  console.info(
    JSON.stringify({
      type: "perazzi-retrieval-debug",
      rowsCount: rows.length,
      firstRow: rows[0]
        ? {
            distance: (rows[0] as any).distance ?? null,
            score: (rows[0] as any).score ?? null,
          }
        : null,
    }),
  );

  const typedRows = rows as RetrievedRow[];

  const results = typedRows.map((row) => {
    const title =
      row.document_title ??
      row.document_path ??
      "Perazzi Reference";

    return {
      chunkId: row.chunk_id,
      title,
      sourcePath: row.document_path ?? "V2-PGPT/unknown",
      content: row.content ?? "",
      baseScore: row.score ?? 0,
      score: row.score ?? 0,
      documentPath: row.document_path ?? undefined,
      headingPath: row.heading_path ?? undefined,
      category: row.category ?? null,
      docType: row.doc_type ?? null,
    };
  });

  return results.slice(0, limit);
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

  pgPool = new Pool({
    connectionString,
    ssl: process.env.PGSSL_MODE === "require" ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pgPool.connect();
  try {
    await registerType(client);
  } finally {
    client.release();
  }

  return pgPool;
}

function extractLatestUserMessage(messages: PerazziAssistantRequest["messages"]): string | null {
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
