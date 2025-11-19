import { Pool } from "pg";
import { registerType, toSql } from "pgvector/pg";
import OpenAI from "openai";
import type { PerazziAssistantRequest, RetrievedChunk } from "@/types/perazzi-assistant";

const EMBEDDING_MODEL = process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-small";
const CHUNKS_TABLE = sanitizeTableName(process.env.PGVECTOR_TABLE ?? "perazzi_chunks");
const CHUNK_LIMIT = Number(process.env.PERAZZI_RETRIEVAL_LIMIT ?? 8);

let pgPool: Pool | null = null;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function retrievePerazziContext(
  body: PerazziAssistantRequest,
): Promise<{ chunks: RetrievedChunk[]; maxScore: number }> {
  const question = extractLatestUserMessage(body.messages);
  if (!question) {
    return { chunks: [], maxScore: 0 };
  }

  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: question,
  });
  const queryEmbedding = embeddingResponse.data[0]?.embedding ?? [];
  if (!queryEmbedding.length) {
    return { chunks: [], maxScore: 0 };
  }

  const languages = buildLanguageFallbacks(body.context?.locale);
  const pool = await getPgPool();
  const client = await pool.connect();

  try {
    for (const language of languages) {
      const rows = await client.query(
        `
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
        ORDER BY embedding <=> $2::vector
        LIMIT $3;
      `,
        [language, toSql(queryEmbedding), CHUNK_LIMIT * 2],
      );

      if (rows.rowCount) {
        const chunks = rows.rows
          .map((row) => {
            const metadata = row.metadata ?? {};
            const chunkEmbedding = Array.isArray(row.embedding)
              ? (row.embedding as number[])
              : null;
            const baseScore = chunkEmbedding
              ? cosineSimilarity(queryEmbedding, chunkEmbedding)
              : 0;
            const boostedScore = baseScore + computeBoost(metadata, body.context);
            return mapRowToChunk(row, metadata, boostedScore);
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, CHUNK_LIMIT);

        const maxScore = chunks[0]?.score ?? 0;
        return { chunks, maxScore };
      }
    }
  } finally {
    client.release();
  }

  return { chunks: [], maxScore: 0 };
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
    if (
      relatedEntities.some(
        (entity) => entity.entity_id?.toLowerCase() === slug,
      )
    ) {
      boost += 0.08;
    } else if (title.includes(slug)) {
      boost += 0.03;
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
