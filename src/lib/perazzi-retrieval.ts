import { Pool } from "pg";
import { registerType, toSql } from "pgvector/pg";
import OpenAI from "openai";
import type { PerazziAssistantRequest, RetrievedChunk } from "@/types/perazzi-assistant";
import type { RetrievalHints } from "@/lib/perazzi-intents";

const EMBEDDING_MODEL = process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-small";
const CHUNKS_TABLE = sanitizeTableName(process.env.PGVECTOR_TABLE ?? "perazzi_chunks");
const CHUNK_LIMIT = Number(process.env.PERAZZI_RETRIEVAL_LIMIT ?? 8);

let pgPool: Pool | null = null;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type QueryFilter = {
  topics?: string[];
  excludeChunkIds?: string[];
};

export async function retrievePerazziContext(
  body: PerazziAssistantRequest,
  hints?: RetrievalHints,
): Promise<{ chunks: RetrievedChunk[]; maxScore: number }> {
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

  const languages = buildLanguageFallbacks(body.context?.locale);
  const pool = await getPgPool();
  const client = await pool.connect();

  try {
    const topicFilters = Array.from(new Set((hints?.topics ?? []).filter(Boolean)));
    const targetedChunks =
      topicFilters.length > 0
        ? await fetchChunksForFilter({
            client,
            languages,
            queryEmbedding,
            context: body.context,
            hints,
            limit: CHUNK_LIMIT,
            filter: { topics: topicFilters },
          })
        : [];

    const excludeIds = targetedChunks.map((chunk) => chunk.chunkId);
    const generalChunks = await fetchChunksForFilter({
      client,
      languages,
      queryEmbedding,
      context: body.context,
      hints,
      limit: CHUNK_LIMIT * 2,
      filter: excludeIds.length ? { excludeChunkIds: excludeIds } : undefined,
    });

    const combined = [...targetedChunks, ...generalChunks];
    const deduped = dedupeChunks(combined).slice(0, CHUNK_LIMIT);
    const maxScore = deduped[0]?.score ?? 0;
    return { chunks: deduped, maxScore };
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
  metadata: Record<string, any>,
  context?: PerazziAssistantRequest["context"],
  hints?: RetrievalHints,
): number {
  let boost = 0;
  const audience = (metadata.audience ?? metadata?.metadata?.audience ?? "")
    .toString()
    .toLowerCase();
  const mode = context?.mode?.toLowerCase();
  if (mode && audience === mode) boost += 0.05;

  const slug = context?.modelSlug?.toLowerCase();
  if (slug) {
    const title = (metadata.title ?? metadata.summary ?? "")
      .toString()
      .toLowerCase();
    const relatedEntities: Array<Record<string, string>> =
      metadata.related_entities ?? [];
    const entityIds: string[] = Array.isArray(metadata.entity_ids) ? metadata.entity_ids.map((id: any) => String(id).toLowerCase()) : [];
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

  if (hints?.topics?.length) {
    const chunkTopics: string[] = Array.isArray(metadata.topics)
      ? metadata.topics.map((value: any) => value.toString().toLowerCase())
      : [];
    if (chunkTopics.some((topic) => hints.topics.includes(topic))) {
      boost += 0.12;
    }
  }

  if (hints?.focusEntities?.length) {
    const entityIds: string[] = Array.isArray(metadata.entity_ids)
      ? metadata.entity_ids.map((value: any) => value.toString().toLowerCase())
      : [];
    if (entityIds.some((id) => hints.focusEntities!.includes(id))) {
      boost += 0.15;
    }
  }

  if (hints?.keywords?.length) {
    const haystack = [
      metadata.title,
      metadata.summary,
      metadata.source_path,
    ]
      .map((value) => (value ?? "").toString().toLowerCase())
      .join(" ");
    if (hints.keywords.some((keyword) => haystack.includes(keyword))) {
      boost += 0.05;
    }
  }
  return boost;
}

function mapRowToChunk(
  row: any,
  metadata: Record<string, any>,
  score: number,
): RetrievedChunk {
  const title =
    metadata.title ??
    metadata.summary ??
    metadata.type ??
    "Perazzi Reference";
  const sourcePath =
    metadata.source_path ?? metadata.sourcePath ?? "PerazziGPT/unknown.md";
  return {
    chunkId: row.chunk_id,
    title,
    sourcePath,
    content: row.content ?? "",
    score,
  };
}

async function fetchChunksForFilter(opts: {
  client: any;
  languages: string[];
  queryEmbedding: number[];
  context?: PerazziAssistantRequest["context"];
  hints?: RetrievalHints;
  limit: number;
  filter?: QueryFilter;
}): Promise<RetrievedChunk[]> {
  const { client, languages, queryEmbedding, context, hints, limit, filter } = opts;
  for (const language of languages) {
    const rows = await client.query(
      buildQuery(filter),
      buildParams({ language, queryEmbedding, limit, filter }),
    );
    if (rows.rowCount) {
      return rows.rows
        .map((row: any) => {
          const metadata = row.metadata ?? {};
          const chunkEmbedding = Array.isArray(row.embedding)
            ? (row.embedding as number[])
            : null;
          const baseScore = chunkEmbedding
            ? cosineSimilarity(queryEmbedding, chunkEmbedding)
            : 0;
          const boostedScore = baseScore + computeBoost(metadata, context, hints);
          return mapRowToChunk(row, metadata, boostedScore);
        })
        .sort((a: RetrievedChunk, b: RetrievedChunk) => b.score - a.score)
        .slice(0, limit);
    }
  }
  return [];
}

function buildQuery(filter?: QueryFilter) {
  let paramIndex = 4;
  let topicClause = "";
  let excludeClause = "";
  if (filter?.topics?.length) {
    topicClause = ` AND metadata->'topics' ?| $${paramIndex}`;
    paramIndex += 1;
  }
  if (filter?.excludeChunkIds?.length) {
    excludeClause = ` AND NOT (chunk_id = ANY($${paramIndex}))`;
  }
  return `
    SELECT chunk_id, content, metadata, embedding
    FROM ${CHUNKS_TABLE}
    WHERE (metadata->>'language') = $1
      AND COALESCE(metadata->>'pricing_sensitive', 'false') = 'false'
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          COALESCE(metadata->'guardrail_flags', '[]'::jsonb)
        ) AS flag(value)
        WHERE flag.value LIKE 'contains_pricing%'
      )
      ${topicClause}
      ${excludeClause}
    ORDER BY embedding <=> $2::vector
    LIMIT $3;
  `;
}

function buildParams({
  language,
  queryEmbedding,
  limit,
  filter,
}: {
  language: string;
  queryEmbedding: number[];
  limit: number;
  filter?: QueryFilter;
}) {
  const params: any[] = [language, toSql(queryEmbedding), limit];
  if (filter?.topics?.length) {
    params.push(filter.topics);
  }
  if (filter?.excludeChunkIds?.length) {
    params.push(filter.excludeChunkIds);
  }
  return params;
}

function dedupeChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();
  const result: RetrievedChunk[] = [];
  chunks.forEach((chunk) => {
    if (!seen.has(chunk.chunkId)) {
      seen.add(chunk.chunkId);
      result.push(chunk);
    }
  });
  return result.sort((a, b) => b.score - a.score);
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

function sanitizeTableName(name: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("Invalid table name for pgvector chunks.");
  }
  return name;
}

export function isConnectionError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as any;
  const cause = candidate.cause;
  const code = (cause && cause.code) || candidate.code;
  return code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "EAI_AGAIN";
}

export class OpenAIConnectionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "OpenAIConnectionError";
  }
}
