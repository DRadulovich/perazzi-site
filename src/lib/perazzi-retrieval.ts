import { Pool } from "pg";
import type { PoolClient } from "pg";
import { registerType } from "pgvector/pg";
import OpenAI from "openai";
import type { PerazziAssistantRequest, RetrievedChunk } from "@/types/perazzi-assistant";
import type { RetrievalHints } from "@/lib/perazzi-intents";

const EMBEDDING_MODEL = process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-large";
const CHUNK_LIMIT = Number(process.env.PERAZZI_RETRIEVAL_LIMIT ?? 12);

let pgPool: Pool | null = null;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    embeddingResponse = await openai.embeddings.create({
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
};

async function fetchV2Chunks(opts: {
  client: PoolClient;
  queryEmbedding: number[];
  limit: number;
  hints?: RetrievalHints;
}): Promise<RetrievedChunk[]> {
  const { client, queryEmbedding, limit, hints: _hints } = opts;
  void _hints;
  const embeddingParam = JSON.stringify(queryEmbedding);

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
          (e.embedding::halfvec(3072) <=> $1::halfvec(3072)) as distance
        from public.embeddings e
        join public.chunks c on c.id = e.chunk_id
        join public.documents d on d.id = c.document_id
        where d.status = 'active'
          and coalesce(c.visibility, 'public') = 'public'
        order by distance asc
        limit $2
      )
      select
        chunk_id,
        content,
        heading_path,
        document_path,
        document_title,
        category,
        doc_type,
        distance,
        (1.0 - distance) as score
      from ranked
    `,
    [embeddingParam, limit],
  );

  const typedRows = rows as RetrievedRow[];

  return typedRows.map((row) => {
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
}

async function getPgPool(): Promise<Pool> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for retrieval.");
  }
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL_MODE === "require" ? { rejectUnauthorized: false } : undefined,
    });
    const client = await pgPool.connect();
    try {
      await registerType(client);
    } finally {
      client.release();
    }
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
