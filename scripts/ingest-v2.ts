import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import minimist from "minimist";
import process from "node:process";
import type { Pool } from "pg";
import {
  DEFAULT_ANALYSIS_OPTIONS,
  parseNumberOption,
  runChunkAnalysis,
  runSyntheticParagraphAnalysis,
} from "./ingest-v2/analysis";
import { chunkDocument } from "./ingest-v2/chunking/index";
import { parseSourceCorpus, readDocumentFile } from "./ingest-v2/corpus";
import { createPool, replaceChunksAndEmbeddings, upsertDocumentRow } from "./ingest-v2/db";
import { parseDocumentMetadata } from "./ingest-v2/metadata";
import type {
  ActiveDoc,
  DocumentMetadata,
  IngestOptions,
  IngestStats,
} from "./ingest-v2/types";

const REQUIRED_ENV = ["DATABASE_URL"] as const;

async function handleDryRunDocument(
  doc: ActiveDoc,
  hasRow: boolean,
  checksumChanged: boolean,
  stats: IngestStats,
): Promise<void> {
  let statusLabel: string;
  if (hasRow && checksumChanged) {
    statusLabel = "UPDATED";
    stats.updated += 1;
  } else if (hasRow) {
    statusLabel = "SKIPPED";
    stats.skipped += 1;
  } else {
    statusLabel = "NEW";
    stats.newCount += 1;
  }
  console.log("[dry-run]", statusLabel, doc.path);
}

async function processDocumentChunks(
  pool: Pool,
  doc: ActiveDoc,
  rawText: string,
  upsertResult: { documentId: string; isNew: boolean; isChanged: boolean },
  meta: Partial<DocumentMetadata>,
  opts: IngestOptions,
): Promise<number> {
  if (doc.embedMode === "metadata-only") {
    console.log("[info] Metadata-only doc, skipping chunking:", doc.path);
    return 0;
  }

  let status: string;
  if (upsertResult.isNew) {
    status = "new";
  } else if (upsertResult.isChanged) {
    status = "updated";
  } else {
    status = "skipped";
  }

  if (status === "skipped") {
    return 0;
  }

  const chunkInputs = chunkDocument(doc, rawText);
  await replaceChunksAndEmbeddings(
    pool,
    upsertResult.documentId,
    doc,
    chunkInputs,
    meta,
    {
      dryRun: opts.dryRun,
    },
  );
  console.log("[ok] Ingested chunks", {
    count: chunkInputs.length,
    path: doc.path,
  });
  return chunkInputs.length;
}

async function processDocument(
  pool: Pool,
  doc: ActiveDoc,
  opts: IngestOptions,
  stats: IngestStats,
): Promise<void> {
  stats.scanned += 1;

  let rawText: string;
  let checksum: string;
  try {
    const res = await readDocumentFile(doc);
    rawText = res.rawText;
    checksum = res.checksum;
  } catch (err) {
    console.error("Error reading document", { path: doc.path, err });
    return;
  }

  const existing = await pool.query<{
    id: string;
    source_checksum: string | null;
  }>("select id, source_checksum from public.documents where path = $1", [
    doc.path,
  ]);

  const rowCount = existing.rowCount ?? 0;
  const hasRow = rowCount > 0;
  const checksumChanged =
    opts.full || !hasRow || existing.rows[0].source_checksum !== checksum;

  if (opts.dryRun) {
    await handleDryRunDocument(doc, hasRow, checksumChanged, stats);
    return;
  }

  const meta = parseDocumentMetadata(rawText, doc.docType);
  const upsertResult = await upsertDocumentRow(pool, doc, checksum, meta, {
    forceUpdate: opts.full,
  });

  if (upsertResult.isNew) {
    stats.newCount += 1;
  } else if (upsertResult.isChanged) {
    stats.updated += 1;
  } else {
    stats.skipped += 1;
  }

  const chunksCount = await processDocumentChunks(
    pool,
    doc,
    rawText,
    upsertResult,
    meta,
    opts,
  );
  stats.chunksWritten += chunksCount;
}

function printIngestSummary(stats: IngestStats): void {
  console.log("---- Ingest Summary ----");
  console.log("Docs scanned:", stats.scanned);
  console.log("Docs new:", stats.newCount);
  console.log("Docs updated:", stats.updated);
  console.log("Docs skipped:", stats.skipped);
  console.log("Chunks written:", stats.chunksWritten);
}

async function runIngest(pool: Pool, opts: IngestOptions): Promise<void> {
  const docs = await parseSourceCorpus();
  const stats: IngestStats = {
    scanned: 0,
    newCount: 0,
    updated: 0,
    skipped: 0,
    chunksWritten: 0,
  };

  for (const doc of docs) {
    try {
      await processDocument(pool, doc, opts, stats);
    } catch (err) {
      console.error("Error processing document", { path: doc.path, err });
      throw err;
    }
  }

  printIngestSummary(stats);
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

  assertEnv();

  const pool = createPool();

  try {
    await runIngest(pool, { full, dryRun });
  } catch (err) {
    console.error("Fatal ingest error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
