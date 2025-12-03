import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createHash, randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import process from "process";
import minimist from "minimist";
import OpenAI from "openai";
import { Pool, PoolClient } from "pg";

type Status = "active" | "planned" | "deprecated";
type EmbedMode = "full" | "metadata-only" | "ignore";

interface ActiveDoc {
  path: string;
  category: string;
  docType: string;
  status: Status;
  embedMode: EmbedMode;
  pricingSensitive: boolean;
}

interface DocumentMetadata {
  title?: string;
  summary?: string;
  series_part_number?: number | null;
  series_part_roman?: string | null;
  series_part_title?: string | null;
  series_chapter_code?: string | null;
  series_chapter_title?: string | null;
  series_chapter_global_index?: number | null;
  series_chapter_part_index?: number | null;
  language?: string | null;
  disciplines?: string[] | null;
  platforms?: string[] | null;
  audiences?: string[] | null;
  tags?: string[] | null;
}

interface ChunkInput {
  text: string;
  chunkIndex: number;
  heading?: string;
  headingPath?: string;
  sectionLabels?: string[];
  primaryModes?: string[];
  archetypeBias?: string[];
}

interface IngestOptions {
  full: boolean;
  dryRun: boolean;
}

const TARGET_TOKENS = 1000;
const MAX_TOKENS = 1600;
const TOKEN_ESTIMATE_DIVISOR = 4; // rough characters-to-tokens approximation

const REQUIRED_ENV = ["DATABASE_URL", "OPENAI_API_KEY"] as const;

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / TOKEN_ESTIMATE_DIVISOR));
}

function slugify(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || undefined;
}

function sanitizePricingText(text: string): string {
  return text.replace(/[$€£]?\d[\d,]*(\.\d+)?/g, "<NUM>");
}

function preprocessForEmbedding(text: string, pricingSensitive: boolean): string {
  let cleaned = text.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (pricingSensitive) {
    cleaned = sanitizePricingText(cleaned);
  }
  return cleaned;
}

async function parseSourceCorpus(): Promise<ActiveDoc[]> {
  const corpusPath =
    "V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_source-corpus.md";
  const raw = await readFile(path.resolve(process.cwd(), corpusPath), "utf8");
  const lines = raw.split(/\r?\n/);
  const docs: ActiveDoc[] = [];

  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    if (line.includes("Path") && line.includes("Category")) continue;
    if (/^\|\s*-+/.test(line)) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.length < 6) continue;

    const [filePath, category, docType, statusRaw, pricingRaw, embedModeRaw] =
      cells;
    const status = statusRaw.toLowerCase() as Status;
    const embedMode = embedModeRaw.toLowerCase() as EmbedMode;

    const doc: ActiveDoc = {
      path: filePath,
      category,
      docType,
      status,
      embedMode,
      pricingSensitive: pricingRaw.toLowerCase() === "true",
    };

    if (doc.status === "active" && doc.embedMode !== "ignore") {
      docs.push(doc);
    }
  }

  return docs;
}

async function readDocumentFile(
  doc: ActiveDoc,
): Promise<{ rawText: string; checksum: string }> {
  const absolutePath = path.resolve(process.cwd(), doc.path);
  const rawText = await readFile(absolutePath, "utf8");
  const checksum = createHash("sha256").update(rawText, "utf8").digest("hex");
  return { rawText, checksum };
}

function extractSection(rawText: string, heading: RegExp): string | null {
  const match = heading.exec(rawText);
  if (!match || match.index === undefined) return null;

  const start = match.index;
  const rest = rawText.slice(start + match[0].length);
  const nextHeading = rest.search(/\n##\s+/);
  if (nextHeading === -1) return rest.trim();
  return rest.slice(0, nextHeading).trim();
}

function parseListValue(value: string | undefined): string[] | null {
  if (!value) return null;
  return value
    .split(/[,|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseDocumentMetadata(rawText: string): Partial<DocumentMetadata> {
  const meta: Partial<DocumentMetadata> = {};
  const titleMatch = rawText.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    meta.title = titleMatch[1].trim();
  }

  const metaSection = extractSection(rawText, /##\s*0\.\s*Metadata/i);
  if (!metaSection) return meta;

  const lines = metaSection.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    if (!line.includes(":")) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!value) continue;

    switch (key) {
      case "title":
        meta.title = value;
        break;
      case "summary":
        meta.summary = value;
        break;
      case "series_part_number":
        meta.series_part_number = Number.parseInt(value, 10);
        break;
      case "series_part_roman":
        meta.series_part_roman = value;
        break;
      case "series_part_title":
        meta.series_part_title = value;
        break;
      case "series_chapter_code":
        meta.series_chapter_code = value;
        break;
      case "series_chapter_title":
        meta.series_chapter_title = value;
        break;
      case "series_chapter_global_index":
        meta.series_chapter_global_index = Number.parseInt(value, 10);
        break;
      case "series_chapter_part_index":
        meta.series_chapter_part_index = Number.parseInt(value, 10);
        break;
      case "language":
        meta.language = value;
        break;
      case "disciplines":
        meta.disciplines = parseListValue(value);
        break;
      case "platforms":
        meta.platforms = parseListValue(value);
        break;
      case "audiences":
        meta.audiences = parseListValue(value);
        break;
      case "tags":
        meta.tags = parseListValue(value);
        break;
      default:
        break;
    }
  }

  return meta;
}

async function upsertDocumentRow(
  pool: Pool,
  doc: ActiveDoc,
  checksum: string,
  meta: Partial<DocumentMetadata>,
  options: { forceUpdate?: boolean } = {},
): Promise<{ documentId: string; isNew: boolean; isChanged: boolean }> {
  const existing = await pool.query<{
    id: string;
    source_checksum: string | null;
  }>("select id, source_checksum from public.documents where path = $1", [
    doc.path,
  ]);

  let isNew = false;
  let isChanged = false;
  let documentId = existing.rows[0]?.id;

  if (!existing.rowCount) {
    isNew = true;
    isChanged = true;
  } else if (options.forceUpdate) {
    isChanged = true;
  } else if (existing.rows[0].source_checksum !== checksum) {
    isChanged = true;
  }

  if (!isChanged) {
    return { documentId: documentId!, isNew, isChanged };
  }

  const query = `
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

  const values = [
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
    meta.disciplines ? JSON.stringify(meta.disciplines) : null,
    meta.platforms ? JSON.stringify(meta.platforms) : null,
    meta.audiences ? JSON.stringify(meta.audiences) : null,
    meta.tags ? JSON.stringify(meta.tags) : null,
    checksum,
  ];

  const result = await pool.query<{ id: string }>(query, values);
  documentId = result.rows[0].id;

  return { documentId, isNew, isChanged };
}

function defaultModesForCategory(category: string): string[] {
  if (category === "operational") return ["Navigation"];
  return ["Prospect", "Owner", "Navigation"];
}

function defaultArchetypes(): string[] {
  return ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"];
}

function chunkModelDetailsV2(rawText: string): ChunkInput[] {
  let records: any[];
  try {
    records = JSON.parse(rawText);
  } catch {
    console.warn("[chunkModelDetailsV2] Failed to parse JSON");
    return [];
  }

  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const chunks: ChunkInput[] = [];

  records.forEach((record, index) => {
    const name: string =
      record.name ?? record.slug ?? record.id ?? "Perazzi Model";

    const platform: string | undefined =
      record.platform ?? record.platformSlug ?? undefined;

    const category: string | undefined = record.category ?? undefined;

    const specText: string = record.specText || "";

    const textBody =
      specText ||
      [
        name ? `Model name: ${name}` : "",
        platform ? `Platform: ${platform}` : "",
        category ? `Category: ${category}` : "",
        Array.isArray(record.disciplines) && record.disciplines.length
          ? `Disciplines: ${(record.disciplines as any[]).join(", ")}`
          : "",
        Array.isArray(record.gauges) && record.gauges.length
          ? `Gauges: ${(record.gauges as any[]).join(", ")}`
          : "",
        record.barrelConfig ? `Barrel: ${record.barrelConfig}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

    if (!textBody.trim()) return;

    const heading = `### ${name}`;
    const headingPath = `Models > ${name}`;
    const labels: string[] = ["model-details"];

    const nameSlug = slugify(name);
    if (nameSlug) labels.push(nameSlug);
    if (platform) {
      labels.push(`platform:${platform.toString().toLowerCase()}`);
    }

    chunks.push({
      text: textBody,
      chunkIndex: index,
      heading,
      headingPath,
      sectionLabels: labels,
      primaryModes: ["Prospect", "Owner"],
      archetypeBias: ["Analyst", "Achiever", "Prestige"],
    });
  });

  return chunks;
}

function chunkOlympicMedalsV2(rawText: string): ChunkInput[] {
  let records: any[];
  try {
    records = JSON.parse(rawText);
  } catch {
    console.warn("[chunkOlympicMedalsV2] Failed to parse JSON");
    return [];
  }

  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const chunks: ChunkInput[] = [];

  records.forEach((entry, index) => {
    const athlete: string = entry.Athlete ?? "Perazzi Olympian";
    const event: string = entry.Event ?? "";
    const medal: string = entry.Medal ?? "";
    const year: string = entry.Olympics ?? "";
    const perazziModel: string = entry["Perazzi Model"] ?? "";
    const country: string = entry.Country ?? "";

    const lines: string[] = [
      `### ${athlete}`,
      country ? `**Country:** ${country}` : null,
      event ? `**Event:** ${event}` : null,
      medal ? `**Medal:** ${medal}` : null,
      year ? `**Olympics:** ${year}` : null,
      perazziModel ? `**Perazzi platform:** ${perazziModel}` : null,
      entry.Evidence ? `**Highlights:** ${entry.Evidence}` : null,
    ]
      .filter(Boolean)
      .map((line) => line!.trim());

    if (Array.isArray(entry.Sources) && entry.Sources.length) {
      lines.push("**Sources:**");
      entry.Sources.forEach((source: string) => {
        if (source && source.toString().trim()) {
          lines.push(`- ${source.toString().trim()}`);
        }
      });
    }

    const textBlock = lines.join("\n").trim();
    if (!textBlock) return;

    const heading = `### ${athlete}`;
    const headingPath = `Olympic Medals > ${athlete}`;
    const labels: string[] = ["olympic-medals"];

    const athleteSlug = slugify(athlete);
    if (athleteSlug) labels.push(athleteSlug);

    chunks.push({
      text: textBlock,
      chunkIndex: index,
      heading,
      headingPath,
      sectionLabels: labels,
      primaryModes: ["Prospect", "Owner"],
      archetypeBias: ["Loyalist", "Achiever", "Legacy"],
    });
  });

  return chunks;
}

function chunkMarkdownLike(doc: ActiveDoc, rawText: string): ChunkInput[] {
  const lines = rawText.split(/\r?\n/);
  const stack: { level: number; text: string }[] = [];
  const sections: { heading?: string; headingPath?: string; content: string[] }[] =
    [{ heading: undefined, headingPath: undefined, content: [] }];

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      while (stack.length && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack.push({ level, text });
      const headingPath = stack.map((h) => h.text).join(" > ");
      sections.push({ heading: text, headingPath, content: [] });
    } else {
      sections[sections.length - 1].content.push(line);
    }
  }

  const chunks: ChunkInput[] = [];
  let chunkIndex = 0;
  const primaryModes = defaultModesForCategory(doc.category);
  const archetypeBias = defaultArchetypes();

  for (const section of sections) {
    const sectionText = section.content.join("\n").trim();
    if (!sectionText) continue;

    const paragraphs = sectionText.split(/\n{2,}/);
    let buffer: string[] = [];
    let bufferTokens = 0;

    const flushBuffer = () => {
      if (!buffer.length) return;
      const text = buffer.join("\n\n").trim();
      if (!text) {
        buffer = [];
        bufferTokens = 0;
        return;
      }
      const labels = section.heading
        ? [slugify(section.heading), slugify(section.headingPath)].filter(
            Boolean,
          )
        : undefined;

      chunks.push({
        text,
        chunkIndex,
        heading: section.heading,
        headingPath: section.headingPath,
        sectionLabels: labels as string[] | undefined,
        primaryModes,
        archetypeBias,
      });
      chunkIndex += 1;
      buffer = [];
      bufferTokens = 0;
    };

    for (const para of paragraphs) {
      const paraText = para.trim();
      if (!paraText) continue;
      const paraTokens = estimateTokens(paraText);
      if (
        bufferTokens + paraTokens > MAX_TOKENS &&
        bufferTokens > TARGET_TOKENS
      ) {
        flushBuffer();
      }
      buffer.push(paraText);
      bufferTokens += paraTokens;
      if (bufferTokens >= TARGET_TOKENS) {
        flushBuffer();
      }
    }

    flushBuffer();
  }

  return chunks;
}

function chunkDocument(doc: ActiveDoc, rawText: string): ChunkInput[] {
  const lowerPath = doc.path.toLowerCase();
  if (lowerPath.endsWith(".json")) {
    if (
      doc.path.includes(
        "/V2_Gun-Info-Docs/V2_RAG_corpus-models-details.json",
      )
    ) {
      return chunkModelDetailsV2(rawText);
    }
    if (doc.path.includes("/V2_Company-Info-Docs/V2_olympic-medals.json")) {
      return chunkOlympicMedalsV2(rawText);
    }
    // Fallback: treat JSON as markdown-like text
    return chunkMarkdownLike(doc, rawText);
  }

  return chunkMarkdownLike(doc, rawText);
}

async function replaceChunksAndEmbeddings(
  pool: Pool,
  openai: OpenAI,
  documentId: string,
  doc: ActiveDoc,
  chunks: ChunkInput[],
  options: { dryRun: boolean },
): Promise<void> {
  if (options.dryRun) {
    console.log(
      `[dry-run] Would write ${chunks.length} chunks for ${doc.path}`,
    );
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
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

    const chunkCount = chunks.length;
    const insertedChunks: { id: string; text: string }[] = [];
    for (const chunk of chunks) {
      const id = randomUUID();
      const res = await client.query<{ id: string }>(
        `
          insert into public.chunks (
            id, document_id, chunk_index, chunk_count, text,
            heading, heading_path, section_labels, primary_modes, archetype_bias
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          returning id
        `,
        [
          id,
          documentId,
          chunk.chunkIndex,
          chunkCount,
          chunk.text,
          chunk.heading ?? null,
          chunk.headingPath ?? null,
          chunk.sectionLabels ? JSON.stringify(chunk.sectionLabels) : null,
          chunk.primaryModes ? JSON.stringify(chunk.primaryModes) : null,
          chunk.archetypeBias ? JSON.stringify(chunk.archetypeBias) : null,
        ],
      );
      insertedChunks.push({ id: res.rows[0].id, text: chunk.text });
    }

    await client.query("commit");
    await embedChunks(openai, client, insertedChunks, doc, options);
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

async function embedChunks(
  openai: OpenAI,
  client: PoolClient,
  chunks: { id: string; text: string }[],
  doc: ActiveDoc,
  options: { dryRun: boolean },
): Promise<void> {
  if (options.dryRun) {
    console.log(`[dry-run] Would embed ${chunks.length} chunks`);
    return;
  }

  const embedModel = process.env.PERAZZI_EMBED_MODEL || "text-embedding-3-large";
  const batchSize = Number.parseInt(process.env.EMBED_BATCH_SIZE || "64", 10);

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const inputs = batch.map((c) =>
      preprocessForEmbedding(c.text, doc.pricingSensitive),
    );
    const response = await openai.embeddings.create({
      model: embedModel,
      input: inputs,
    });

    for (let j = 0; j < batch.length; j++) {
      const embedding = response.data[j]?.embedding;
      if (!embedding) {
        throw new Error("Missing embedding in response");
      }
      const embeddingText = JSON.stringify(embedding); // "[0.1,0.2,...]"

      await client.query(
        `
          insert into public.embeddings (chunk_id, embedding_model, embedding)
          values ($1, $2, $3::vector)
        `,
        [batch[j].id, embedModel, embeddingText],
      );
    }
  }
}

async function runIngest(
  pool: Pool,
  openai: OpenAI,
  opts: IngestOptions,
): Promise<void> {
  const docs = await parseSourceCorpus();
  let scanned = 0;
  let newCount = 0;
  let updated = 0;
  let skipped = 0;
  let chunksWritten = 0;

  for (const doc of docs) {
    scanned += 1;
    let rawText: string;
    let checksum: string;
    try {
      const res = await readDocumentFile(doc);
      rawText = res.rawText;
      checksum = res.checksum;
    } catch (err) {
      console.error(`Error reading ${doc.path}:`, err);
      continue;
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
      const statusLabel = !hasRow
        ? "NEW"
        : checksumChanged
          ? "UPDATED"
          : "SKIPPED";
      console.log(`[dry-run] ${statusLabel} ${doc.path}`);
      if (!checksumChanged) skipped += 1;
      else if (!hasRow) newCount += 1;
      else updated += 1;
      continue;
    }

    try {
      const meta = parseDocumentMetadata(rawText);
      const upsertResult = await upsertDocumentRow(
        pool,
        doc,
        checksum,
        meta,
        { forceUpdate: opts.full },
      );

      let status: "new" | "updated" | "skipped";
      if (upsertResult.isNew) status = "new";
      else if (upsertResult.isChanged) status = "updated";
      else status = "skipped";

      if (status === "new") newCount += 1;
      else if (status === "updated") updated += 1;
      else skipped += 1;

      if (doc.embedMode === "metadata-only") {
        console.log(
          `[info] Metadata-only doc, skipping chunking: ${doc.path}`,
        );
        continue;
      }

      if (status === "skipped") {
        continue;
      }

      const chunkInputs = chunkDocument(doc, rawText);
      chunksWritten += chunkInputs.length;
      await replaceChunksAndEmbeddings(
        pool,
        openai,
        upsertResult.documentId,
        doc,
        chunkInputs,
        { dryRun: opts.dryRun },
      );
      console.log(
        `[ok] Ingested ${chunkInputs.length} chunks for ${doc.path}`,
      );
    } catch (err) {
      console.error(`Error processing ${doc.path}:`, err);
      throw err;
    }
  }

  console.log("---- Ingest Summary ----");
  console.log(`Docs scanned: ${scanned}`);
  console.log(`Docs new: ${newCount}`);
  console.log(`Docs updated: ${updated}`);
  console.log(`Docs skipped: ${skipped}`);
  console.log(`Chunks written: ${chunksWritten}`);
}

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function createPool(): Pool {
  const sslMode = process.env.PGSSL_MODE;
  const ssl =
    sslMode && sslMode !== "disable"
      ? { rejectUnauthorized: sslMode === "verify-full" }
      : undefined;

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl,
  });
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  const full = Boolean(argv.full);
  const dryRun = Boolean(argv["dry-run"]);

  assertEnv();

  const pool = createPool();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    await runIngest(pool, openai, { full, dryRun });
  } catch (err) {
    console.error("Fatal ingest error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
