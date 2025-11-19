#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { execSync } from "node:child_process";
import minimist from "minimist";
import fg from "fast-glob";
import { Minimatch } from "minimatch";
import { parse as parseCsv } from "csv-parse/sync";
import OpenAI from "openai";
import { Pool } from "pg";
import { registerType, toSql } from "pgvector/pg";
import { encoding_for_model, get_encoding } from "@dqbd/tiktoken";

type ChunkRule = {
  glob: string;
  type?: string;
  target_words?: number;
  max_words?: number;
  max_tokens?: number;
  overlap_words?: number;
  target_rows?: number;
  target_entries?: number;
  objects_per_chunk?: number;
  describe_columns?: string[];
  exclude_columns?: string[];
  allow_overflow?: boolean;
};

type ChunkingConfig = {
  defaults: {
    target_words: number;
    max_words: number;
    max_tokens: number;
    overlap_words: number;
    max_overlap_delta: number;
  };
  rules: ChunkRule[];
};

type ChunkRecord = {
  docId: string;
  chunkId: string;
  text: string;
  metadata: Record<string, any>;
  tokens: number;
  words: number;
  headingCoverage: string[];
};

type CoverageEntry = {
  doc_id: string;
  path: string;
  chunk_count: number;
  total_tokens: number;
  last_updated: string;
  guardrail_flags: string[];
};

const argv = minimist(process.argv.slice(2), {
  boolean: ["dry-run", "lint", "strict", "emit-metadata"],
  string: ["config", "doc", "env"],
  default: {
    config: "PerazziGPT/Phase_2_Documents/chunking.config.json",
    env: process.env.NODE_ENV ?? "development",
  },
});

const DRY_RUN = Boolean(argv["dry-run"]);
const RUN_LINT = Boolean(argv["lint"]);
const STRICT = Boolean(argv["strict"]);
const EMIT_METADATA = Boolean(argv["emit-metadata"]);
const DOC_FILTER = argv.doc ? String(argv.doc) : null;
const CONFIG_PATH = path.resolve(process.cwd(), String(argv.config));
const PROJECT_ROOT = process.cwd();

function loadConfig(): ChunkingConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config not found at ${CONFIG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

const config = loadConfig();

function slugify(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function fileToDocId(filePath: string): string {
  const rel = path.relative(PROJECT_ROOT, filePath);
  return slugify(rel);
}

function fileToType(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  if (/Shotguns_Landing/i.test(base)) return "shotguns_landing";
  if (/Bespoke_Journey/i.test(base)) return "bespoke_overview";
  if (/Service_Philosophy/i.test(base)) return "service_home";
  if (/Heritage_Timeline/i.test(base)) return "heritage_home";
  return slugify(base);
}

function inferAudience(filePath: string): string {
  if (filePath.includes("Phase_1_Documents") || filePath.includes("Brand_Info") || filePath.includes("docs/assistant-spec.md")) {
    return "internal";
  }
  if (filePath.includes("Service") || filePath.includes("Company_Info/Recommended_Service_Centers")) {
    return "owner";
  }
  return "prospect";
}

function inferVisibility(audience: string): string {
  return audience === "internal" ? "concierge_only" : "public";
}

function inferConfidentiality(audience: string): string {
  return audience === "internal" ? "internal" : "public";
}

function inferPersona(audience: string, filePath: string): string {
  if (audience === "internal") return "docent";
  if (filePath.includes("Service")) return "service_seeker";
  return audience === "owner" ? "service_seeker" : "first_time_buyer";
}

function inferSourceUrl(filePath: string): string {
  if (/Shotguns_Landing/i.test(filePath)) return "/shotguns";
  if (/Bespoke_Journey/i.test(filePath)) return "/bespoke";
  if (/Service_Philosophy/i.test(filePath)) return "/service";
  if (/Heritage_Timeline/i.test(filePath)) return "/heritage";
  return `internal://${path.relative(PROJECT_ROOT, filePath)}`;
}

function getRuleForFile(filePath: string): ChunkRule {
  const rel = path.relative(PROJECT_ROOT, filePath);
  for (const rule of config.rules) {
    const matcher = new Minimatch(rule.glob, { dot: true, nobrace: false, nocase: true });
    if (matcher.match(rel)) {
      return { ...config.defaults, ...rule };
    }
  }
  throw new Error(`No chunking rule matched ${rel}`);
}

function looksLikeHeading(text: string): boolean {
  return /^#{1,6}\s/.test(text) || (/^[A-Z][A-Za-z0-9 &'’:-]+$/.test(text) && text.trim().length < 80);
}

function splitParagraphs(text: string): string[] {
  const normalized = text
    .replace(/([:.])\s+-\s+/g, "$1\n- ")
    .replace(/\s+(?=\[\d+\])/g, "\n");
  const lines = normalized.split(/\r?\n/);
  const paragraphs: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length) {
      paragraphs.push(buffer.join("\n").trim());
      buffer = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trimEnd();
    if (!trimmed.trim()) {
      flush();
      return;
    }
    if (looksLikeHeading(trimmed)) {
      flush();
      paragraphs.push(trimmed.trim());
      return;
    }
    if (/^\[\d+\]/.test(trimmed.trim())) {
      flush();
      paragraphs.push(trimmed.trim());
      return;
    }
    buffer.push(trimmed);
  });
  flush();
  return paragraphs.filter(Boolean);
}

function breakParagraph(paragraph: string, maxWords: number): string[] {
  if (countWords(paragraph) <= maxWords) return [paragraph];
  if (/^[-*•]\s/.test(paragraph.trim())) {
    return paragraph
      .split(/\n(?=[-*•]\s*)/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .flatMap((entry) => {
        if (countWords(entry) > maxWords) {
          const clean = entry.replace(/^[-*•]\s*/, "");
          return breakParagraph(clean, maxWords).map((frag) => `- ${frag}`);
        }
        return [entry];
      });
  }
  const sentencePattern = /(?<=[.!?])\s+(?=[A-Z0-9"'])/;
  const sentences = paragraph.split(sentencePattern);
  const fragments: string[] = [];
  let current: string[] = [];
  let currentWords = 0;
  const pushCurrent = () => {
    if (current.length) {
      fragments.push(current.join(" ").trim());
      current = [];
      currentWords = 0;
    }
  };
  sentences.forEach((sentence) => {
    const words = countWords(sentence);
    if (!sentence.trim()) return;
    if (currentWords + words > maxWords && currentWords > 0) {
      pushCurrent();
    }
    current.push(sentence.trim());
    currentWords += words;
  });
  pushCurrent();
  if (!fragments.length) {
    fragments.push(paragraph);
  }
  const finalFragments: string[] = [];
  fragments.forEach((fragment) => {
    if (countWords(fragment) <= maxWords) {
      finalFragments.push(fragment);
      return;
    }
    const words = fragment.split(/\s+/);
    for (let i = 0; i < words.length; i += maxWords) {
      finalFragments.push(words.slice(i, i + maxWords).join(" "));
    }
  });
  return finalFragments.filter(Boolean);
}

function expandParagraphs(paragraphs: string[], maxWords: number) {
  const expanded: string[] = [];
  paragraphs.forEach((para) => {
    if (looksLikeHeading(para)) {
      expanded.push(para);
      return;
    }
    if (countWords(para) > maxWords) {
      expanded.push(...breakParagraph(para, maxWords));
    } else {
      expanded.push(para);
    }
  });
  return expanded;
}

function countWords(text: string): number {
  const matches = text.trim().match(/\b[\w'-]+\b/g);
  return matches ? matches.length : 0;
}

function lastWords(text: string, wordCount: number): string {
  if (wordCount <= 0) return "";
  const words = text.trim().split(/\s+/);
  const slice = words.slice(Math.max(0, words.length - wordCount));
  return slice.join(" ");
}

function splitIntoChunksFromParagraphs(paragraphs: string[], opts: { targetWords: number; maxWords: number; overlapWords: number; allowOverflow?: boolean }) {
  const chunks: { text: string; words: number; headings: string[] }[] = [];
  let buffer: string[] = [];
  let bufferWords = 0;
  let overlapCarry = "";
  let referenceCount = 0;

  const pushChunk = () => {
    if (!buffer.length && !overlapCarry.trim()) return;
    const chunkText = [overlapCarry, ...buffer].filter(Boolean).join("\n\n").trim();
    if (!chunkText) {
      buffer = [];
      overlapCarry = "";
      bufferWords = 0;
      return;
    }
    const words = countWords(chunkText);
    const headings = buffer.filter((p) => /^#{1,6}\s/.test(p));
    chunks.push({ text: chunkText, words, headings });
    overlapCarry = opts.overlapWords ? lastWords(chunkText, opts.overlapWords) : "";
    buffer = [];
    bufferWords = 0;
    referenceCount = 0;
  };

  paragraphs.forEach((para) => {
    const isHeading = looksLikeHeading(para);
    const paraWords = countWords(para);
    const isReference = /^\[\d+\]/.test(para.trim());
    if (isHeading && bufferWords > 0) {
      pushChunk();
      overlapCarry = "";
      referenceCount = 0;
    }
    if (isReference && bufferWords > 0 && !referenceCount) {
      pushChunk();
      overlapCarry = "";
    }
    const limit = opts.maxWords || config.defaults.max_words;
    const target = opts.targetWords || config.defaults.target_words;
    if (!opts.allowOverflow && bufferWords > 0 && bufferWords + paraWords > limit) {
      pushChunk();
      overlapCarry = "";
      referenceCount = 0;
    }
    buffer.push(para);
    bufferWords += paraWords;
    if (isReference) {
      referenceCount += 1;
      if (referenceCount >= 10) {
        pushChunk();
        overlapCarry = "";
        referenceCount = 0;
      }
      return;
    } else {
      referenceCount = 0;
    }
    if (!opts.allowOverflow && bufferWords >= limit) {
      pushChunk();
      return;
    }
    if (bufferWords >= target && bufferWords >= Math.min(200, target)) {
      pushChunk();
    }
  });
  pushChunk();
  return chunks;
}

function chunkMarkdown(filePath: string, text: string, rule: ChunkRule) {
  const rawParagraphs = splitParagraphs(text);
  const limit = rule.max_words ?? config.defaults.max_words;
  const paragraphs = expandParagraphs(rawParagraphs, limit);
  return splitIntoChunksFromParagraphs(paragraphs, {
    targetWords: rule.target_words ?? config.defaults.target_words,
    maxWords: rule.max_words ?? config.defaults.max_words,
    overlapWords: rule.overlap_words ?? config.defaults.overlap_words,
    allowOverflow: rule.allow_overflow,
  });
}

function chunkJson(filePath: string, text: string, rule: ChunkRule) {
  const json = JSON.parse(text);
  let entries: any[] = [];
  if (Array.isArray(json)) {
    entries = json;
  } else if (Array.isArray(json.models)) {
    entries = json.models;
  } else if (Array.isArray(json.items)) {
    entries = json.items;
  } else {
    entries = Object.values(json).filter((val) => Array.isArray(val)).flat();
  }
  const size = rule.objects_per_chunk ?? 1;
  const chunks: { text: string; words: number; headings: string[] }[] = [];
  for (let i = 0; i < entries.length; i += size) {
    const slice = entries.slice(i, i + size);
    const body = slice
      .map((entry, idx) => {
        const title = entry.model_name || entry.name || entry.title || `Entry ${i + idx + 1}`;
        return [`### ${title}`, "```json", JSON.stringify(entry, null, 2), "```"].join("\n");
      })
      .join("\n\n");
    chunks.push({ text: body, words: countWords(body), headings: [] });
  }
  return chunks;
}

function chunkCsv(filePath: string, text: string, rule: ChunkRule) {
  const records = parseCsv(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
  if (!records.length) {
    return [];
  }
  const firstRecord = records[0];
  const columnKeys = Object.keys(firstRecord);
  const columnLookup = new Map(columnKeys.map((col) => [col.toLowerCase(), col]));
  const resolvedDescribe = (rule.describe_columns ?? columnKeys)
    .map((name) => columnLookup.get(name.toLowerCase()) ?? name)
    .filter((name) => columnKeys.includes(name));
  const excludeCols = new Set((rule.exclude_columns ?? []).map((col) => columnLookup.get(col.toLowerCase()) ?? col));
  const filteredCols = resolvedDescribe.filter((col) => !excludeCols.has(col) && !/price/i.test(col));
  if (!filteredCols.length) {
    filteredCols.push(
      ...columnKeys.filter((key) => !/price/i.test(key))
    );
  }
  const target = rule.target_words ?? 200;
  const chunks: { text: string; words: number; headings: string[] }[] = [];
  let buffer: string[] = [];
  let bufferWords = 0;
  records.forEach((record, idx) => {
    const lines = filteredCols
      .map((col) => {
        const val = record[col];
        return val ? `${col}: ${val}` : "";
      })
      .filter(Boolean);
    if (!lines.length) return;
    buffer.push(`- ${lines.join(" | ")}`);
    bufferWords += countWords(lines.join(" "));
    if (bufferWords >= target) {
      const textChunk = buffer.join("\n");
      chunks.push({ text: textChunk, words: bufferWords, headings: [] });
      buffer = [];
      bufferWords = 0;
    }
  });
  if (buffer.length) {
    const textChunk = buffer.join("\n");
    chunks.push({ text: textChunk, words: bufferWords, headings: [] });
  }
  return chunks;
}

function extractHeadings(text: string): string[] {
  return (text.match(/^#{1,6}\s.+$/gm) ?? []).map((h) => h.trim());
}

function firstHeadingOrFallback(text: string, fallback: string) {
  const match = text.match(/^#{1,6}\s(.+)$/m);
  return match ? match[1].trim() : fallback;
}

const gitSha = (() => {
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
})();

function buildMetadata(opts: {
  filePath: string;
  chunkText: string;
  chunkIndex: number;
  chunkCount: number;
  tokens: number;
  audience: string;
  docId: string;
  type: string;
  lastUpdated: Date;
  rule: ChunkRule;
  guardrailFlags: string[];
}) {
  const { filePath, chunkText, chunkIndex, chunkCount, tokens, audience, docId, type, lastUpdated, rule, guardrailFlags } = opts;
  const title = firstHeadingOrFallback(chunkText, type);
  const summary = chunkText.split(/\n+/)[0]?.slice(0, 280) ?? "";
  const baseMetadata = {
    id: docId,
    chunk_id: `${docId}#chunk-${String(chunkIndex + 1).padStart(2, "0")}`,
    type,
    subtype: rule.type ?? type,
    title,
    summary,
    language: "en",
    audience,
    discipline: "general",
    platform: "general",
    persona: inferPersona(audience, filePath),
    region: "global",
    market_notes: "",
    locale_variant: "en-US",
    source_path: path.relative(PROJECT_ROOT, filePath),
    source_url: inferSourceUrl(filePath),
    source_version: gitSha,
    source_checksum: crypto.createHash("sha256").update(chunkText).digest("hex"),
    last_updated: lastUpdated.toISOString(),
    effective_from: lastUpdated.toISOString(),
    expires_on: null,
    ingested_at: new Date().toISOString(),
    embedding_model: process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-large",
    token_count: tokens,
    chunk_index: chunkIndex + 1,
    chunk_count: chunkCount,
    embedding_norm: null,
    visibility: inferVisibility(audience),
    confidentiality: inferConfidentiality(audience),
    guardrail_flags: guardrailFlags,
    pricing_sensitive: guardrailFlags.length > 0,
    legal_reviewed: null,
    author: "Perazzi Concierge Automation",
    approver: "Perazzi Concierge Automation",
    stakeholders: [],
    cta_links: [],
    context_tags: [],
    related_entities: [],
    structured_refs: [],
    safety_notes: "",
    escalation_path: "none",
    off_topic_response: "",
  };
  return baseMetadata;
}

async function main() {
  const patterns = config.rules.map((r) => r.glob);
  let files: string[];
  if (DOC_FILTER) {
    const candidate = path.isAbsolute(DOC_FILTER) ? DOC_FILTER : path.join(PROJECT_ROOT, DOC_FILTER);
    files = [candidate];
  } else {
    files = await fg(patterns, { cwd: PROJECT_ROOT, dot: true, absolute: true });
  }
  if (!files.length) {
    console.log("No files matched chunking configuration.");
    return;
  }

  const chunkRecords: ChunkRecord[] = [];
  const coverage: CoverageEntry[] = [];
  const lintErrors: string[] = [];
  const lintWarnings: string[] = [];
  const debugDoc = process.env.DEBUG_CHUNK_DOC ?? "";

  const encoding = (() => {
    try {
      return encoding_for_model(process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-large");
    } catch {
      return get_encoding("cl100k_base");
    }
  })();

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, "utf8");
    const rule = getRuleForFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let chunkDefs: { text: string; words: number; headings: string[] }[] = [];
    if (ext === ".json") {
      chunkDefs = chunkJson(filePath, text, rule);
    } else if (ext === ".csv") {
      chunkDefs = chunkCsv(filePath, text, rule);
    } else {
      chunkDefs = chunkMarkdown(filePath, text, rule);
    }
    if (!chunkDefs.length) {
      lintErrors.push(`No chunks produced for ${path.relative(PROJECT_ROOT, filePath)}`);
      continue;
    }
    const docId = fileToDocId(filePath);
    const type = fileToType(filePath);
    const audience = inferAudience(filePath);
    const headings = extractHeadings(text);
    const guardrailFlags = filePath.includes("Pricing_And_Models") ? ["contains_pricing_fields"] : [];
    const stats = fs.statSync(filePath);
    chunkDefs.forEach((chunkDef, idx) => {
      const tokens = encoding.encode(chunkDef.text).length;
      if (!rule.allow_overflow) {
        const wordLimit =
          (rule.max_words ?? config.defaults.max_words) +
          (rule.overlap_words ?? config.defaults.overlap_words ?? 0) +
          (config.defaults.max_overlap_delta ?? 0);
        if (chunkDef.words > wordLimit) {
          lintErrors.push(
            `Chunk ${idx + 1} in ${path.relative(PROJECT_ROOT, filePath)} exceeds max_words (${chunkDef.words})`
          );
        }
        const tokenLimit =
          (rule.max_tokens ?? config.defaults.max_tokens) +
          (rule.overlap_words ?? config.defaults.overlap_words ?? 0) +
          (config.defaults.max_overlap_delta ?? 0);
        if (tokens > tokenLimit) {
          lintErrors.push(
            `Chunk ${idx + 1} in ${path.relative(PROJECT_ROOT, filePath)} exceeds max_tokens (${tokens})`
          );
        }
      }
      const metadata = buildMetadata({
        filePath,
        chunkText: chunkDef.text,
        chunkIndex: idx,
        chunkCount: chunkDefs.length,
        tokens,
        audience,
        docId,
        type,
        lastUpdated: stats.mtime,
        rule,
        guardrailFlags,
      });
      chunkRecords.push({
        docId,
        chunkId: metadata.chunk_id,
        text: chunkDef.text,
        metadata,
        tokens,
        words: chunkDef.words,
        headingCoverage: chunkDef.headings,
      });
      if (debugDoc && docId.includes(debugDoc)) {
        console.log(
          `[debug] ${metadata.chunk_id} words=${chunkDef.words} tokens=${tokens} summary="${metadata.summary.slice(
            0,
            60
          )}"`
        );
      }
    });
    const headingSet = new Set<string>();
    chunkDefs.forEach((chunk) => {
      chunk.headings.forEach((h) => headingSet.add(h.trim()));
    });
    headings.forEach((head) => {
      if (!headingSet.has(head.trim())) {
        const msg = `Heading "${head}" from ${path.relative(PROJECT_ROOT, filePath)} missing in chunks`;
        if (STRICT) {
          lintErrors.push(msg);
        } else {
          lintWarnings.push(msg);
        }
      }
    });
    const guardFlagsDoc = filePath.includes("Pricing_And_Models") ? ["contains_pricing_fields"] : [];
    coverage.push({
      doc_id: docId,
      path: path.relative(PROJECT_ROOT, filePath),
      chunk_count: chunkDefs.length,
      total_tokens: chunkDefs.reduce((sum, d) => sum + encoding.encode(d.text).length, 0),
      last_updated: stats.mtime.toISOString(),
      guardrail_flags: guardFlagsDoc,
    });
  }

  encoding.free();

  if (RUN_LINT) {
    if (lintWarnings.length) {
      console.warn("Lint warnings:");
      lintWarnings.forEach((w) => console.warn(`  • ${w}`));
    }
    if (lintErrors.length) {
      console.error("Lint errors:");
      lintErrors.forEach((e) => console.error(`  • ${e}`));
      process.exit(1);
    }
  }

  if (EMIT_METADATA) {
    console.log(JSON.stringify(chunkRecords.map((c) => c.metadata), null, 2));
  }

  const reportDir = path.join(PROJECT_ROOT, "tmp", "ingestion-reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total_chunks: chunkRecords.length,
        documents: coverage,
      },
      null,
      2
    )
  );

  if (DRY_RUN) {
    console.log(`Dry run complete – ${chunkRecords.length} chunks prepared.`);
    console.log(`Report written to ${path.relative(PROJECT_ROOT, reportPath)}`);
    return;
  }

  await ingestChunks(chunkRecords);
  console.log(`Ingestion complete – ${chunkRecords.length} chunks written.`);
  console.log(`Report written to ${path.relative(PROJECT_ROOT, reportPath)}`);
}

async function ingestChunks(chunks: ChunkRecord[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required");
  }
  const model = process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-large";
  const batchSize = Number(process.env.EMBED_BATCH_SIZE ?? 32);
  const tableName = process.env.PGVECTOR_TABLE ?? "perazzi_chunks";
  const dimension = Number(process.env.PGVECTOR_DIM ?? 1536);

  const openai = new OpenAI({ apiKey });
  const pool = new Pool({
    connectionString: dbUrl,
    max: 5,
    ssl: process.env.PGSSL_MODE === "require" ? { rejectUnauthorized: false } : undefined,
  });
  const typeClient = await pool.connect();
  await registerType(typeClient);
  typeClient.release();

  await pool.query("CREATE EXTENSION IF NOT EXISTS vector;");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      chunk_id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB NOT NULL,
      embedding VECTOR(${dimension}) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS ${tableName}_doc_id_idx ON ${tableName} (doc_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS ${tableName}_metadata_idx ON ${tableName} USING GIN (metadata);`);
  const opClass = process.env.PGVECTOR_OP_CLASS ?? "vector_l2_ops";
  if (dimension <= 2000) {
    await pool.query(
      `CREATE INDEX IF NOT EXISTS ${tableName}_embedding_idx ON ${tableName} USING ivfflat (embedding ${opClass}) WITH (lists = 100);`
    );
  } else {
    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS ${tableName}_embedding_hnsw_idx ON ${tableName} USING hnsw (embedding ${opClass}) WITH (m = 32, ef_construction = 64);`
      );
    } catch (error) {
      console.warn(
        `HNSW index creation failed (dimension ${dimension}). Falling back to sequential scan queries.`,
        error instanceof Error ? error.message : error
      );
    }
  }

  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model,
      input: slice.map((chunk) => chunk.text),
    });
    if (response.data.length !== slice.length) {
      throw new Error("Embedding response size mismatch");
    }
    const vectors = response.data;
    for (let j = 0; j < slice.length; j++) {
      const record = slice[j];
      const vector = vectors[j].embedding;
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      record.metadata.embedding_norm = norm;
      await pool.query(
        `
        INSERT INTO ${tableName} (chunk_id, doc_id, content, metadata, embedding)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (chunk_id)
        DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata, embedding = EXCLUDED.embedding, updated_at = now();
      `,
        [record.chunkId, record.docId, record.text, record.metadata, toSql(vector)]
      );
      if (norm < 0.5 || norm > 1.5) {
        console.warn(`Embedding norm out of range for ${record.chunkId}: ${norm.toFixed(4)}`);
      }
    }
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
