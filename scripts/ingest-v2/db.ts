import { randomUUID } from "node:crypto";
import { Pool, PoolClient } from "pg";
import { createEmbeddings } from "@/lib/aiClient";
import { getPgSslOptions } from "@/lib/pgSsl";
import type { ActiveDoc, ChunkInput, DocumentMetadata } from "./types";
import {
  dedupeStable,
  inferPlatformFromRelatedSlug,
  mapDisciplineToken,
  mapPlatformToken,
  normalizeAudiences,
  normalizeDisciplines,
  normalizeLanguage,
  normalizePlatforms,
  normalizeRelatedEntities,
  normalizeTags,
} from "./metadata-utils";
import { estimateTokens, preprocessForEmbedding, stableStringify } from "./utils";

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
    summary = coalesce(excluded.summary, documents.summary),
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
    language = coalesce(excluded.language, documents.language),
    disciplines = coalesce(excluded.disciplines, documents.disciplines),
    platforms = coalesce(excluded.platforms, documents.platforms),
    audiences = coalesce(excluded.audiences, documents.audiences),
    tags = coalesce(excluded.tags, documents.tags),
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
  const summary = meta.summary ?? meta.title ?? "Perazzi reference document.";
  const language = normalizeLanguage(meta.language);
  const disciplines = normalizeDisciplines(meta.disciplines);
  const platforms = normalizePlatforms(meta.platforms);
  const audiences = normalizeAudiences(meta.audiences);
  const tags = normalizeTags(meta.tags);

  return [
    doc.path,
    meta.title ?? null,
    summary,
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
    language,
    stableStringify(disciplines),
    stableStringify(platforms),
    stableStringify(audiences),
    stableStringify(tags),
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

interface NormalizedDocMetadata {
  language: string;
  platforms: string[];
  disciplines: string[];
  audiences: string[];
  tags: string[];
}

interface ChunkMetadataValues {
  tokenCount: number | null;
  language: string;
  platforms: string[];
  disciplines: string[];
  audiences: string[];
  contextTags: string[];
  relatedEntities: string[];
}

function normalizeDocMetadata(
  meta: Partial<DocumentMetadata>,
): NormalizedDocMetadata {
  return {
    language: normalizeLanguage(meta.language),
    platforms: normalizePlatforms(meta.platforms),
    disciplines: normalizeDisciplines(meta.disciplines),
    audiences: normalizeAudiences(meta.audiences),
    tags: normalizeTags(meta.tags),
  };
}

function detectChunkTagsFromText(text: string): string[] {
  const tags: string[] = [];

  if (/(?:\badjustable|\bhigh|\bnotch)\s+rib\b/i.test(text)) {
    tags.push("rib_adjustable");
  }
  if (/\bfixed\s+rib\b/i.test(text)) {
    tags.push("rib_fixed");
  }

  const ribNotchRegexes = [
    /\b(\d+)\s*[- ]\s*notch\b[^\n.]{0,40}\brib\b/gi,
    /\brib\b[^\n.]{0,40}\b(\d+)\s*[- ]\s*notch\b/gi,
  ];
  for (const regex of ribNotchRegexes) {
    for (const match of text.matchAll(regex)) {
      if (match[1]) tags.push(`rib_notch_${match[1]}`);
    }
  }

  if (/\bsc3\b/i.test(text)) tags.push("grade_sc3");
  if (/\bsco\b/i.test(text) || /\bsideplates?\b/i.test(text)) {
    tags.push("grade_sco");
  }
  if (/\blusso\b/i.test(text)) tags.push("grade_lusso");

  return tags;
}

interface LabelMetadata {
  labelPlatforms: string[];
  labelDisciplines: string[];
  relatedEntities: string[];
}

type LabelHandler = (value: string, meta: LabelMetadata) => void;

const LABEL_PATTERN = /^(model|base-model|platform|disciplines?):(.+)$/i;

const LABEL_HANDLERS: Record<string, LabelHandler> = {
  model: handleModelLabel,
  "base-model": handleModelLabel,
  platform: handlePlatformLabel,
  discipline: handleDisciplineLabel,
  disciplines: handleDisciplineLabel,
};

function handleModelLabel(value: string, meta: LabelMetadata): void {
  meta.relatedEntities.push(...normalizeRelatedEntities([value]));
}

function handlePlatformLabel(value: string, meta: LabelMetadata): void {
  const platform = mapPlatformToken(value);
  if (!platform) return;
  meta.labelPlatforms.push(platform);
  meta.relatedEntities.push(platform);
  if (platform === "ht") {
    meta.relatedEntities.push("high-tech");
  }
}

function handleDisciplineLabel(value: string, meta: LabelMetadata): void {
  meta.labelDisciplines.push(...mapDisciplineToken(value));
}

function collectLabelMetadata(labels: string[]): LabelMetadata {
  const meta: LabelMetadata = {
    labelPlatforms: [],
    labelDisciplines: [],
    relatedEntities: [],
  };

  for (const label of labels) {
    const match = LABEL_PATTERN.exec(label);
    if (!match) continue;

    const prefix = match[1]?.toLowerCase();
    const value = match[2]?.trim();
    if (!prefix || !value) continue;

    const handler = LABEL_HANDLERS[prefix];
    if (!handler) continue;
    handler(value, meta);
  }

  return meta;
}

function ensureHighTechVariants(entities: string[]): string[] {
  if (entities.some((entity) => entity === "ht" || entity === "high-tech")) {
    return dedupeStable([...entities, "ht", "high-tech"]);
  }

  return entities;
}

function inferPlatformsFromRelated(
  relatedEntities: string[],
  docPlatforms: string[],
): string[] {
  if (docPlatforms.length > 0) return [];

  const inferredPlatforms: string[] = [];
  for (const entity of relatedEntities) {
    const inferred = inferPlatformFromRelatedSlug(entity);
    if (inferred) inferredPlatforms.push(inferred);
  }

  return inferredPlatforms;
}

function buildChunkMetadata(
  chunk: ChunkInput,
  docMeta: NormalizedDocMetadata,
): ChunkMetadataValues {
  const labels = chunk.sectionLabels ?? [];
  const { labelPlatforms, labelDisciplines, relatedEntities } =
    collectLabelMetadata(labels);

  const normalizedRelated = ensureHighTechVariants(
    normalizeRelatedEntities(relatedEntities),
  );
  const inferredPlatforms = inferPlatformsFromRelated(
    normalizedRelated,
    docMeta.platforms,
  );

  const platforms = normalizePlatforms([
    ...docMeta.platforms,
    ...labelPlatforms,
    ...inferredPlatforms,
  ]);
  const disciplines = normalizeDisciplines([
    ...docMeta.disciplines,
    ...labelDisciplines,
  ]);
  const contextTags = normalizeTags([
    ...docMeta.tags,
    ...detectChunkTagsFromText(chunk.text),
  ]);

  return {
    tokenCount: estimateTokens(chunk.text),
    language: docMeta.language,
    platforms,
    disciplines,
    audiences: docMeta.audiences,
    contextTags,
    relatedEntities: normalizedRelated,
  };
}

function buildChunkInsertValues(
  documentId: string,
  chunkCount: number,
  chunk: ChunkInput,
  meta: ChunkMetadataValues,
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
    meta.tokenCount ?? null,
    meta.language,
    stableStringify(meta.platforms),
    stableStringify(meta.disciplines),
    stableStringify(meta.audiences),
    stableStringify(meta.contextTags),
    stableStringify(meta.relatedEntities),
  ];
}

async function insertChunkRows(
  client: PoolClient,
  documentId: string,
  chunks: ChunkInput[],
  docMeta: Partial<DocumentMetadata>,
): Promise<{ id: string; text: string }[]> {
  const insertedChunks: { id: string; text: string }[] = [];
  const chunkCount = chunks.length;
  const normalizedDocMeta = normalizeDocMetadata(docMeta);

  for (const chunk of chunks) {
    const id = randomUUID();
    const chunkMeta = buildChunkMetadata(chunk, normalizedDocMeta);
    const values = buildChunkInsertValues(
      documentId,
      chunkCount,
      chunk,
      chunkMeta,
    );
    const res = await client.query<{ id: string }>(
      `
        insert into public.chunks (
          id, document_id, chunk_index, chunk_count, text,
          heading, heading_path, section_labels, primary_modes, archetype_bias,
          token_count, language, platforms, disciplines, audiences, context_tags, related_entities
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
  docMeta: Partial<DocumentMetadata>,
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
      return insertChunkRows(client, documentId, chunks, docMeta);
    });

    await embedChunks(client, insertedChunks, doc, options);
  } finally {
    client.release();
  }
}
