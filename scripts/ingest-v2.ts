import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import minimist from "minimist";
import { randomUUID } from "node:crypto";
import process from "node:process";
import type { Pool, PoolClient } from "pg";
import { createEmbeddings } from "@/lib/aiClient";
import {
  DEFAULT_ANALYSIS_OPTIONS,
  parseNumberOption,
  runChunkAnalysis,
  runSyntheticParagraphAnalysis,
} from "./ingest-v2/analysis";
import { chunkDocument } from "./ingest-v2/chunking/index";
import { parseSourceCorpus, readDocumentFile } from "./ingest-v2/corpus";
import { createPool, upsertDocumentRow } from "./ingest-v2/db";
import { parseDocumentMetadata } from "./ingest-v2/metadata";
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
} from "./ingest-v2/metadata-utils";
import {
  estimateTokens,
  preprocessForEmbedding,
  stableStringify,
} from "./ingest-v2/utils";
import type {
  ActiveDoc,
  ChunkInput,
  DocumentMetadata,
  IngestOptions,
  IngestStats,
} from "./ingest-v2/types";

const HELP_TEXT = `\
PerazziGPT v2 ingestion\n\n
tsx scripts/ingest-v2.ts [--full] [--dry-run] [--audit]\n\nFlags:\n  --full            Force re-ingest of all documents\n  --dry-run         Read-only; print NEW/UPDATED/REPAIR/SKIPPED with reasons\n  --audit           Read-only; print only docs needing attention\n  --analyze-chunks  Chunk size analysis only\n  --analyze-synthetic  Synthetic paragraph analysis only\n`;

const REQUIRED_ENV = ["DATABASE_URL"] as const;
const INGEST_LOCK_KEY = "perazzi-ingest-v2";

const DEFAULT_EMBED_RETRY_LIMIT = 3;
const DEFAULT_EMBED_RETRY_BASE_MS = 500;
const DEFAULT_EMBED_RETRY_MAX_MS = 4000;

type IngestRunOptions = IngestOptions & {
  audit: boolean;
};

type IngestRunStats = IngestStats & {
  repaired: number;
  failed: number;
  warnings: number;
};

type DocAction = "new" | "updated" | "repaired" | "skipped";

type DocIntegrity = {
  chunkCount: number;
  expectedChunkCount: number | null;
  embeddingCount: number;
};

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

function printHelp(): void {
  console.log(HELP_TEXT.trim());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEnvNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  const err = error as {
    status?: number;
    code?: string;
    message?: string;
    name?: string;
  };
  const status = err.status;
  if (status === 408 || status === 429) return true;
  if (status && status >= 500 && status <= 599) return true;
  const code = err.code ?? "";
  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "EAI_AGAIN"
  ) {
    return true;
  }
  const message = (err.message ?? "").toLowerCase();
  if (
    message.includes("rate limit") ||
    message.includes("timeout") ||
    message.includes("temporar") ||
    message.includes("overloaded")
  ) {
    return true;
  }
  return false;
}

async function withRetry<T>(
  work: () => Promise<T>,
  options: {
    attempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    label: string;
  },
): Promise<T> {
  const { attempts, baseDelayMs, maxDelayMs, label } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < attempts && isRetryableError(error);
      if (!shouldRetry) break;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[warn] Embedding batch failed (${label}). Retrying in ${delay}ms... ${message}`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

async function tryAcquireAdvisoryLock(pool: Pool): Promise<boolean> {
  const result = await pool.query<{ locked: boolean }>(
    "select pg_try_advisory_lock(hashtext($1)) as locked",
    [INGEST_LOCK_KEY],
  );
  return result.rows[0]?.locked ?? false;
}

async function releaseAdvisoryLock(pool: Pool): Promise<void> {
  await pool.query("select pg_advisory_unlock(hashtext($1))", [
    INGEST_LOCK_KEY,
  ]);
}

async function fetchExistingDocumentRow(
  pool: Pool,
  docPath: string,
): Promise<{ id: string; source_checksum: string | null } | null> {
  const existing = await pool.query<{
    id: string;
    source_checksum: string | null;
  }>("select id, source_checksum from public.documents where path = $1", [
    docPath,
  ]);

  if (!existing.rowCount) return null;
  return existing.rows[0] ?? null;
}

async function fetchDocIntegrity(
  pool: Pool,
  documentId: string,
): Promise<DocIntegrity> {
  const chunkRes = await pool.query<{
    count: number;
    expected: number | null;
  }>(
    `
      select count(*)::int as count,
             max(chunk_count)::int as expected
      from public.chunks
      where document_id = $1
    `,
    [documentId],
  );

  const chunkRow = chunkRes.rows[0];
  const chunkCount = Number(chunkRow?.count ?? 0);
  const expectedChunkCount = chunkRow?.expected ?? null;

  const embedRes = await pool.query<{ count: number }>(
    `
      select count(*)::int as count
      from public.embeddings
      inner join public.chunks on chunks.id = embeddings.chunk_id
      where chunks.document_id = $1
    `,
    [documentId],
  );

  const embeddingCount = Number(embedRes.rows[0]?.count ?? 0);
  return { chunkCount, expectedChunkCount, embeddingCount };
}

function computeRepairReasons(integrity: DocIntegrity): string[] {
  const reasons: string[] = [];

  if (integrity.chunkCount === 0) {
    reasons.push("missing chunks");
  }
  if (
    integrity.expectedChunkCount !== null &&
    integrity.chunkCount !== integrity.expectedChunkCount
  ) {
    reasons.push(
      `chunk count mismatch (${integrity.chunkCount} of ${integrity.expectedChunkCount})`,
    );
  }
  if (integrity.chunkCount > 0 && integrity.embeddingCount < integrity.chunkCount) {
    reasons.push(
      `missing embeddings (${integrity.embeddingCount} of ${integrity.chunkCount})`,
    );
  }

  return reasons;
}

function computeMetadataOnlyWarnings(integrity: DocIntegrity): string[] {
  const warnings: string[] = [];
  if (integrity.chunkCount > 0) {
    warnings.push(`metadata-only has ${integrity.chunkCount} chunks`);
  }
  if (integrity.embeddingCount > 0) {
    warnings.push(`metadata-only has ${integrity.embeddingCount} embeddings`);
  }
  return warnings;
}

function recordActionStats(stats: IngestRunStats, action: DocAction): void {
  switch (action) {
    case "new":
      stats.newCount += 1;
      break;
    case "updated":
      stats.updated += 1;
      break;
    case "repaired":
      stats.repaired += 1;
      break;
    case "skipped":
      stats.skipped += 1;
      break;
  }
}

function formatActionLabel(action: DocAction): string {
  switch (action) {
    case "new":
      return "NEW";
    case "updated":
      return "UPDATED";
    case "repaired":
      return "REPAIR";
    case "skipped":
      return "SKIPPED";
  }
}

function logPlannedAction(
  mode: "dry-run" | "audit",
  action: DocAction,
  doc: ActiveDoc,
  details: string[],
): void {
  const suffix = details.length ? ` (${details.join("; ")})` : "";
  console.log(`[${mode}] ${formatActionLabel(action)} ${doc.path}${suffix}`);
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

function buildChunkMetadata(
  chunk: ChunkInput,
  docMeta: NormalizedDocMetadata,
): ChunkMetadataValues {
  const labelPlatforms: string[] = [];
  const labelDisciplines: string[] = [];
  const relatedEntities: string[] = [];
  const labels = chunk.sectionLabels ?? [];

  for (const label of labels) {
    const match = /^(model|base-model|platform|disciplines?):(.+)$/i.exec(label);
    if (!match) continue;
    const prefix = match[1]?.toLowerCase();
    const value = match[2]?.trim();
    if (!prefix || !value) continue;

    if (prefix === "model" || prefix === "base-model") {
      relatedEntities.push(...normalizeRelatedEntities([value]));
      continue;
    }

    if (prefix === "platform") {
      const platform = mapPlatformToken(value);
      if (platform) {
        labelPlatforms.push(platform);
        relatedEntities.push(platform);
        if (platform === "ht") {
          relatedEntities.push("high-tech");
        }
      }
      continue;
    }

    if (prefix === "discipline" || prefix === "disciplines") {
      labelDisciplines.push(...mapDisciplineToken(value));
    }
  }

  let normalizedRelated = normalizeRelatedEntities(relatedEntities);
  if (
    normalizedRelated.some((entity) => entity === "ht" || entity === "high-tech")
  ) {
    normalizedRelated = dedupeStable([
      ...normalizedRelated,
      "ht",
      "high-tech",
    ]);
  }

  const inferredPlatforms: string[] = [];
  if (docMeta.platforms.length === 0) {
    for (const entity of normalizedRelated) {
      const inferred = inferPlatformFromRelatedSlug(entity);
      if (inferred) inferredPlatforms.push(inferred);
    }
  }

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

async function withTransaction<T>(
  client: PoolClient,
  work: () => Promise<T>,
): Promise<T> {
  await client.query("begin");
  try {
    const result = await work();
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
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

async function insertChunkRowsWithIds(
  client: PoolClient,
  documentId: string,
  chunks: ChunkInput[],
  chunkIds: string[],
  docMeta: Partial<DocumentMetadata>,
): Promise<void> {
  const chunkCount = chunks.length;
  const normalizedDocMeta = normalizeDocMetadata(docMeta);

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const id = chunkIds[i];
    if (!id) {
      throw new Error("Missing chunk id for insert");
    }
    const chunkMeta = buildChunkMetadata(chunk, normalizedDocMeta);
    const values = buildChunkInsertValues(
      documentId,
      chunkCount,
      chunk,
      chunkMeta,
    );
    await client.query(
      `
        insert into public.chunks (
          id, document_id, chunk_index, chunk_count, text,
          heading, heading_path, section_labels, primary_modes, archetype_bias,
          token_count, language, platforms, disciplines, audiences, context_tags, related_entities
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `,
      [id, ...values],
    );
  }
}

async function insertEmbeddingRowsWithIds(
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

async function generateEmbeddingsForChunks(
  doc: ActiveDoc,
  chunks: ChunkInput[],
): Promise<{ embeddings: number[][]; embedModel: string }> {
  if (chunks.length === 0) {
    return { embeddings: [], embedModel: "" };
  }

  const embedModel = process.env.PERAZZI_EMBED_MODEL || "text-embedding-3-large";
  const batchSize = parseEnvNumber(process.env.EMBED_BATCH_SIZE, 64);
  const attempts = parseEnvNumber(
    process.env.EMBED_RETRY_LIMIT,
    DEFAULT_EMBED_RETRY_LIMIT,
  );
  const baseDelayMs = parseEnvNumber(
    process.env.EMBED_RETRY_BASE_MS,
    DEFAULT_EMBED_RETRY_BASE_MS,
  );
  const maxDelayMs = parseEnvNumber(
    process.env.EMBED_RETRY_MAX_MS,
    DEFAULT_EMBED_RETRY_MAX_MS,
  );

  const embeddings: number[][] = [];
  const totalBatches = Math.ceil(chunks.length / batchSize);

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const inputs = batch.map((c) =>
      preprocessForEmbedding(c.text, doc.pricingSensitive),
    );
    const batchIndex = Math.floor(i / batchSize) + 1;

    const response = await withRetry(
      () =>
        createEmbeddings({
          model: embedModel,
          input: inputs,
        }),
      {
        attempts,
        baseDelayMs,
        maxDelayMs,
        label: `${doc.path} batch ${batchIndex}/${totalBatches}`,
      },
    );

    const batchEmbeddings = response.data.map((item) => item.embedding);
    if (batchEmbeddings.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch for ${doc.path}: expected ${batch.length}, got ${batchEmbeddings.length}`,
      );
    }
    embeddings.push(...batchEmbeddings);
  }

  return { embeddings, embedModel };
}

async function replaceChunksAndEmbeddingsAtomic(
  pool: Pool,
  documentId: string,
  chunks: ChunkInput[],
  chunkIds: string[],
  embeddings: number[][],
  embedModel: string,
  docMeta: Partial<DocumentMetadata>,
): Promise<void> {
  if (chunks.length !== chunkIds.length) {
    throw new Error("Chunk id count does not match chunk count");
  }
  if (chunks.length !== embeddings.length && chunks.length !== 0) {
    throw new Error("Embedding count does not match chunk count");
  }

  const client = await pool.connect();
  try {
    await withTransaction(client, async () => {
      await clearDocumentChunks(client, documentId);
      if (chunks.length === 0) return;
      await insertChunkRowsWithIds(client, documentId, chunks, chunkIds, docMeta);
      await insertEmbeddingRowsWithIds(client, chunkIds, embeddings, embedModel);
    });
  } finally {
    client.release();
  }
}

function buildDryRunDetails(options: {
  action: DocAction;
  checksumChanged: boolean;
  needsRepair: boolean;
  repairReasons: string[];
  doc: ActiveDoc;
  integrity: DocIntegrity | null;
  previewChunkCount: number | null;
  metadataWarnings: string[];
  full: boolean;
}): string[] {
  const {
    action,
    checksumChanged,
    needsRepair,
    repairReasons,
    doc,
    integrity,
    previewChunkCount,
    metadataWarnings,
    full,
  } = options;
  const details: string[] = [];

  if (action === "new") {
    details.push("no document row");
  }
  if (checksumChanged && action !== "new") {
    details.push(full ? "full refresh" : "checksum changed");
  }
  if (needsRepair) {
    details.push(...repairReasons);
  }
  if (doc.embedMode === "metadata-only") {
    details.push("metadata-only");
  }
  if (previewChunkCount !== null && doc.embedMode === "full") {
    details.push(`expected chunks=${previewChunkCount}`);
  }
  if (integrity) {
    if (action === "skipped" || needsRepair) {
      details.push(
        `db chunks=${integrity.chunkCount}, embeddings=${integrity.embeddingCount}`,
      );
    }
  }
  if (metadataWarnings.length) {
    details.push(...metadataWarnings);
  }

  return details;
}

async function processDocument(
  pool: Pool,
  doc: ActiveDoc,
  opts: IngestRunOptions,
  stats: IngestRunStats,
): Promise<void> {
  stats.scanned += 1;

  const { rawText, checksum } = await readDocumentFile(doc);

  const existing = await fetchExistingDocumentRow(pool, doc.path);
  const hasRow = Boolean(existing);
  const checksumChanged =
    opts.full || !hasRow || existing?.source_checksum !== checksum;

  let integrity: DocIntegrity | null = null;
  let repairReasons: string[] = [];
  let metadataWarnings: string[] = [];

  if (hasRow) {
    integrity = await fetchDocIntegrity(pool, existing!.id);
    if (doc.embedMode === "full") {
      repairReasons = computeRepairReasons(integrity);
    } else if (doc.embedMode === "metadata-only") {
      metadataWarnings = computeMetadataOnlyWarnings(integrity);
    }
  }

  const needsRepair =
    !checksumChanged && doc.embedMode === "full" && repairReasons.length > 0;

  const action: DocAction = !hasRow
    ? "new"
    : checksumChanged
      ? "updated"
      : needsRepair
        ? "repaired"
        : "skipped";

  let previewChunkCount: number | null = null;
  if ((opts.dryRun || opts.audit) && action !== "skipped") {
    if (doc.embedMode === "full") {
      const chunkInputs = chunkDocument(doc, rawText);
      previewChunkCount = chunkInputs.length;
    }
  }

  if (opts.dryRun) {
    const details = buildDryRunDetails({
      action,
      checksumChanged,
      needsRepair,
      repairReasons,
      doc,
      integrity,
      previewChunkCount,
      metadataWarnings,
      full: opts.full,
    });
    logPlannedAction("dry-run", action, doc, details);
    recordActionStats(stats, action);
    return;
  }

  if (opts.audit) {
    const details = buildDryRunDetails({
      action,
      checksumChanged,
      needsRepair,
      repairReasons,
      doc,
      integrity,
      previewChunkCount,
      metadataWarnings,
      full: opts.full,
    });
    if (action !== "skipped" || metadataWarnings.length > 0) {
      logPlannedAction("audit", action, doc, details);
    }
    recordActionStats(stats, action);
    return;
  }

  if (action === "skipped") {
    recordActionStats(stats, action);
    return;
  }

  const meta = parseDocumentMetadata(rawText, doc.docType);
  const existingId = existing?.id ?? null;

  if (doc.embedMode === "metadata-only") {
    if (action === "new" || action === "updated") {
      await upsertDocumentRow(pool, doc, checksum, meta, {
        forceUpdate: opts.full,
      });
    }
    if (metadataWarnings.length) {
      console.warn("[warn] Metadata-only doc has existing embeddings", {
        path: doc.path,
        details: metadataWarnings,
      });
      stats.warnings += 1;
    }
    recordActionStats(stats, action);
    return;
  }

  const chunkInputs = chunkDocument(doc, rawText);
  const chunkIds = chunkInputs.map(() => randomUUID());
  const { embeddings, embedModel } = await generateEmbeddingsForChunks(
    doc,
    chunkInputs,
  );

  let documentId = existingId;
  if (action === "new") {
    const upsertResult = await upsertDocumentRow(pool, doc, checksum, meta, {
      forceUpdate: opts.full,
    });
    documentId = upsertResult.documentId;
  }

  if (!documentId) {
    throw new Error(`Missing document id for ${doc.path}`);
  }

  await replaceChunksAndEmbeddingsAtomic(
    pool,
    documentId,
    chunkInputs,
    chunkIds,
    embeddings,
    embedModel,
    meta,
  );

  if (action === "updated") {
    await upsertDocumentRow(pool, doc, checksum, meta, {
      forceUpdate: opts.full,
    });
  }

  console.log(
    "[ok]",
    formatActionLabel(action),
    doc.path,
    `chunks=${chunkInputs.length}`,
  );
  stats.chunksWritten += chunkInputs.length;
  recordActionStats(stats, action);
}

function printIngestSummary(stats: IngestRunStats, opts: IngestRunOptions): void {
  const title = opts.audit
    ? "---- Audit Summary ----"
    : opts.dryRun
      ? "---- Dry-run Summary ----"
      : "---- Ingest Summary ----";

  console.log(title);
  console.log("Docs scanned:", stats.scanned);
  console.log("Docs new:", stats.newCount);
  console.log("Docs updated:", stats.updated);
  console.log("Docs repaired:", stats.repaired);
  console.log("Docs skipped:", stats.skipped);
  if (!opts.audit && !opts.dryRun) {
    console.log("Chunks written:", stats.chunksWritten);
  }
  if (stats.failed > 0) {
    console.log("Docs failed:", stats.failed);
  }
  if (stats.warnings > 0) {
    console.log("Warnings:", stats.warnings);
  }

  if (opts.audit) {
    console.log("Use --dry-run for a full plan, or --full to apply.");
  }
  if (stats.failed > 0 && !opts.audit && !opts.dryRun) {
    console.log("Rerun the same command to retry failed docs safely.");
  }
}

async function runIngest(pool: Pool, opts: IngestRunOptions): Promise<void> {
  const docs = await parseSourceCorpus();
  const stats: IngestRunStats = {
    scanned: 0,
    newCount: 0,
    updated: 0,
    repaired: 0,
    skipped: 0,
    chunksWritten: 0,
    failed: 0,
    warnings: 0,
  };

  for (const doc of docs) {
    try {
      await processDocument(pool, doc, opts, stats);
    } catch (error) {
      stats.failed += 1;
      console.error("Error processing document", { path: doc.path, error });
    }
  }

  printIngestSummary(stats, opts);

  if (stats.failed > 0) {
    process.exitCode = 1;
  }
}

function assertEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error("Missing required env vars:", missing.join(", "));
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const argv = minimist(rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs);
  const analyzeChunks = Boolean(argv["analyze-chunks"]);
  const analyzeSynthetic = Boolean(argv["analyze-synthetic"]);

  if (argv.help || argv.h) {
    printHelp();
    return;
  }

  if (analyzeSynthetic) {
    try {
      await runSyntheticParagraphAnalysis();
    } catch (err) {
      console.error("Fatal synthetic analysis error:", err);
      process.exitCode = 1;
    }
    return;
  }

  if (analyzeChunks) {
    const top = parseNumberOption(argv.top, DEFAULT_ANALYSIS_OPTIONS.top);
    const maxChars = parseNumberOption(
      argv["max-chars"],
      DEFAULT_ANALYSIS_OPTIONS.maxChars,
    );
    const maxTokens = parseNumberOption(
      argv["max-tokens"],
      DEFAULT_ANALYSIS_OPTIONS.maxTokens,
    );

    try {
      await runChunkAnalysis({ top, maxChars, maxTokens });
    } catch (err) {
      console.error("Fatal chunk analysis error:", err);
      process.exitCode = 1;
    }
    return;
  }

  const full = Boolean(argv.full);
  const dryRun = Boolean(argv["dry-run"]);
  const audit = Boolean(argv.audit);

  if (dryRun && audit) {
    console.error("Use only one of --dry-run or --audit.");
    process.exit(1);
  }

  assertEnv();

  const pool = createPool();
  const shouldLock = !dryRun && !audit;
  let lockAcquired = false;

  try {
    if (shouldLock) {
      lockAcquired = await tryAcquireAdvisoryLock(pool);
      if (!lockAcquired) {
        console.error(
          "Another ingest run is already in progress. Try again later.",
        );
        process.exitCode = 1;
        return;
      }
    }

    await runIngest(pool, { full, dryRun, audit });
  } catch (err) {
    console.error("Fatal ingest error:", err);
    process.exitCode = 1;
  } finally {
    if (lockAcquired) {
      try {
        await releaseAdvisoryLock(pool);
      } catch (error) {
        console.error("Failed to release advisory lock:", error);
      }
    }
    await pool.end();
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
