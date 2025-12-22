import { randomUUID } from "node:crypto";
import { Pool, PoolClient } from "pg";
import { createEmbeddings } from "@/lib/aiClient";
import { getPgSslOptions } from "@/lib/pgSsl";
import type { ActiveDoc, ChunkInput, DocumentMetadata } from "./types";
import { preprocessForEmbedding, stableStringify } from "./utils";

const DOCUMENT_UPSERT_QUERY = `
  insert into public.documents (
    path, title, summary, category, doc_type, status, embed_mode, pricing_sensitive,
    series_part_number, series_part_roman, series_part_title,
    series_chapter_code, series_chapter_title, series_chapter_global_index, series_chapter_part_index,
    language, disciplines, platforms, audiences, tags,
    source_checksum, last_updated
  )
  values (
    $1, $2, $3, $4, $5, $6, $7, $8,
    $9, $10, $11,
    $12, $13, $14, $15,
    $16, $17, $18, $19, $20,
    $21, now()
  )
  on conflict (path) do update set
    title = excluded.title,
    summary = excluded.summary,
    category = excluded.category,
    doc_type = excluded.doc_type,
    status = excluded.status,
    embed_mode = excluded.embed_mode,
    pricing_sensitive = excluded.pricing_sensitive,
    series_part_number = excluded.series_part_number,
    series_part_roman = excluded.series_part_roman,
    series_part_title = excluded.series_part_title,
    series_chapter_code = excluded.series_chapter_code,
    series_chapter_title = excluded.series_chapter_title,
    series_chapter_global_index = excluded.series_chapter_global_index,
    series_chapter_part_index = excluded.series_chapter_part_index,
    language = excluded.language,
    disciplines = excluded.disciplines,
    platforms = excluded.platforms,
    audiences = excluded.audiences,
    tags = excluded.tags,
    source_checksum = excluded.source_checksum,
    last_updated = now()
  returning id
`;

interface ExistingDocumentRow {
  id: string;
  source_checksum: string | null;
}

interface DocumentChangeStatus {
  documentId?: string;
  isNew: boolean;
  isChanged: boolean;
}

export function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: getPgSslOptions(),
  });
}

async function fetchExistingDocumentRow(
  pool: Pool,
  docPath: string,
): Promise<ExistingDocumentRow | null> {
  const existing = await pool.query<ExistingDocumentRow>(
    "select id, source_checksum from public.documents where path = $1",
    [docPath],
  );
  if (!existing.rowCount) return null;
  return existing.rows[0] ?? null;
}

function evaluateDocumentChange(
  existing: ExistingDocumentRow | null,
  checksum: string,
  forceUpdate = false,
): DocumentChangeStatus {
  if (!existing) {
    return { documentId: undefined, isNew: true, isChanged: true };
  }

  if (forceUpdate) {
    return { documentId: existing.id, isNew: false, isChanged: true };
  }

  const isChanged = existing.source_checksum !== checksum;
  return { documentId: existing.id, isNew: false, isChanged };
}

function buildDocumentValues(
  doc: ActiveDoc,
  meta: Partial<DocumentMetadata>,
  checksum: string,
): unknown[] {
  return [
    doc.path,
    meta.title ?? null,
    meta.summary ?? null,
    doc.category,
    doc.docType,
    doc.status,
    doc.embedMode,
    doc.pricingSensitive,
    meta.series_part_number ?? null,
    meta.series_part_roman ?? null,
    meta.series_part_title ?? null,
    meta.series_chapter_code ?? null,
    meta.series_chapter_title ?? null,
    meta.series_chapter_global_index ?? null,
    meta.series_chapter_part_index ?? null,
    meta.language ?? null,
    meta.disciplines ? stableStringify(meta.disciplines) : null,
    meta.platforms ? stableStringify(meta.platforms) : null,
    meta.audiences ? stableStringify(meta.audiences) : null,
    meta.tags ? stableStringify(meta.tags) : null,
    checksum,
  ];
}

async function executeDocumentUpsert(
  pool: Pool,
  values: unknown[],
): Promise<string> {
  const result = await pool.query<{ id: string }>(DOCUMENT_UPSERT_QUERY, values);
  return result.rows[0].id;
}

export async function upsertDocumentRow(
  pool: Pool,
  doc: ActiveDoc,
  checksum: string,
  meta: Partial<DocumentMetadata>,
  options: { forceUpdate?: boolean } = {},
): Promise<{ documentId: string; isNew: boolean; isChanged: boolean }> {
  const existing = await fetchExistingDocumentRow(pool, doc.path);
  const status = evaluateDocumentChange(existing, checksum, options.forceUpdate);

  if (!status.isChanged) {
    return {
      documentId: status.documentId ?? existing!.id,
      isNew: status.isNew,
      isChanged: status.isChanged,
    };
  }

  const values = buildDocumentValues(doc, meta, checksum);
  const documentId = await executeDocumentUpsert(pool, values);

  return { documentId, isNew: status.isNew, isChanged: status.isChanged };
}

async function withTransaction<T>(
  client: PoolClient,
  work: () => Promise<T>,
): Promise<T> {
  await client.query("begin");
  try {
    const result = await work();
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
}

async function clearDocumentChunks(
  client: PoolClient,
  documentId: string,
): Promise<void> {
  await client.query(
    `
    delete from public.embeddings
    using public.chunks
    where embeddings.chunk_id = chunks.id
      and chunks.document_id = $1
  `,
    [documentId],
  );
  await client.query("delete from public.chunks where document_id = $1", [
    documentId,
  ]);
}

function buildChunkInsertValues(
  documentId: string,
  chunkCount: number,
  chunk: ChunkInput,
): unknown[] {
  return [
    documentId,
    chunk.chunkIndex,
    chunkCount,
    chunk.text,
    chunk.heading ?? null,
    chunk.headingPath ?? null,
    chunk.sectionLabels ? stableStringify(chunk.sectionLabels) : null,
    chunk.primaryModes ? stableStringify(chunk.primaryModes) : null,
    chunk.archetypeBias ? stableStringify(chunk.archetypeBias) : null,
  ];
}

async function insertChunkRows(
  client: PoolClient,
  documentId: string,
  chunks: ChunkInput[],
): Promise<{ id: string; text: string }[]> {
  const insertedChunks: { id: string; text: string }[] = [];
  const chunkCount = chunks.length;

  for (const chunk of chunks) {
    const id = randomUUID();
    const values = buildChunkInsertValues(documentId, chunkCount, chunk);
    const res = await client.query<{ id: string }>(
      `
        insert into public.chunks (
          id, document_id, chunk_index, chunk_count, text,
          heading, heading_path, section_labels, primary_modes, archetype_bias
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning id
      `,
      [id, ...values],
    );
    insertedChunks.push({ id: res.rows[0].id, text: chunk.text });
  }

  return insertedChunks;
}

async function insertEmbeddingRows(
  client: PoolClient,
  chunkIds: string[],
  embeddings: number[][],
  embedModel: string,
): Promise<void> {
  for (let j = 0; j < chunkIds.length; j += 1) {
    const embedding = embeddings[j];
    if (!embedding) {
      throw new Error("Missing embedding in response");
    }
    const embeddingText = stableStringify(embedding);

    await client.query(
      `
        insert into public.embeddings (chunk_id, embedding_model, embedding)
        values ($1, $2, $3::vector)
      `,
      [chunkIds[j], embedModel, embeddingText],
    );
  }
}

async function embedChunks(
  client: PoolClient,
  chunks: { id: string; text: string }[],
  doc: ActiveDoc,
  options: { dryRun: boolean },
): Promise<void> {
  if (options.dryRun) {
    console.log("[dry-run] Would embed chunks", { count: chunks.length });
    return;
  }

  const embedModel = process.env.PERAZZI_EMBED_MODEL || "text-embedding-3-large";
  const batchSize = Number.parseInt(process.env.EMBED_BATCH_SIZE || "64", 10);

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const inputs = batch.map((c) =>
      preprocessForEmbedding(c.text, doc.pricingSensitive),
    );
    const response = await createEmbeddings({
      model: embedModel,
      input: inputs,
    });

    await insertEmbeddingRows(
      client,
      batch.map((chunk) => chunk.id),
      response.data.map((item) => item.embedding),
      embedModel,
    );
  }
}

export async function replaceChunksAndEmbeddings(
  pool: Pool,
  documentId: string,
  doc: ActiveDoc,
  chunks: ChunkInput[],
  options: { dryRun: boolean },
): Promise<void> {
  if (options.dryRun) {
    console.log("[dry-run] Would write chunks", {
      count: chunks.length,
      path: doc.path,
    });
    return;
  }

  const client = await pool.connect();
  try {
    const insertedChunks = await withTransaction(client, async () => {
      await clearDocumentChunks(client, documentId);
      return insertChunkRows(client, documentId, chunks);
    });

    await embedChunks(client, insertedChunks, doc, options);
  } finally {
    client.release();
  }
}
