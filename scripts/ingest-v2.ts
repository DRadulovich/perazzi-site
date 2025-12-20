import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import minimist from "minimist";
import { Pool, PoolClient } from "pg";
import { createEmbeddings } from "@/lib/aiClient";
import stringify from "json-stable-stringify";

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

interface ModelDetailsRecord {
  name?: string;
  slug?: string;
  id?: string;
  platform?: string;
  platformSlug?: string;
  category?: string;
  specText?: string;
  disciplines?: string[];
  gauges?: string[];
  barrelConfig?: string;
}

interface OlympicMedalEntry {
  Athlete?: string;
  Event?: string;
  Medal?: string;
  Olympics?: string;
  "Perazzi Model"?: string;
  Country?: string;
  Evidence?: string;
  Sources?: Array<string | number | boolean | null | undefined>;
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

const REQUIRED_ENV = ["DATABASE_URL"] as const;

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / TOKEN_ESTIMATE_DIVISOR));
}

function slugify(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(?:^-+|-+$)/g, "") || undefined;
}

function sanitizePricingText(text: string): string {
  return text.replaceAll(/[$€£]?\d[\d,]*(\.\d+)?/g, "<NUM>");
}

function stableStringify(value: unknown): string {
  // Ensure deterministic ordering for objects before persistence
  const serialized = stringify(value);
  if (serialized === undefined) {
    // json-stable-stringify can yield undefined (e.g., for top-level undefined); fall back to empty string
    return "";
  }
  return serialized;
}

function preprocessForEmbedding(text: string, pricingSensitive: boolean): string {
  let cleaned = text.replaceAll(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replaceAll(/\s+/g, " ").trim();
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
  if (!match?.index) return null;

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
  const titleMatch = /^#\s+(.+)$/m.exec(rawText);
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
    return { documentId, isNew, isChanged };
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
    meta.disciplines ? stableStringify(meta.disciplines) : null,
    meta.platforms ? stableStringify(meta.platforms) : null,
    meta.audiences ? stableStringify(meta.audiences) : null,
    meta.tags ? stableStringify(meta.tags) : null,
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isModelDetailsRecord(value: unknown): value is ModelDetailsRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const stringFields = [
    "name",
    "slug",
    "id",
    "platform",
    "platformSlug",
    "category",
    "specText",
    "barrelConfig",
  ] as const;
  if (
    stringFields.some(
      (field) =>
        record[field] !== undefined && typeof record[field] !== "string",
    )
  ) {
    return false;
  }

  const arrayFields = ["disciplines", "gauges"] as const;
  return arrayFields.every((field) => {
    const valueAt = record[field];
    return valueAt === undefined || isStringArray(valueAt);
  });
}

function isOlympicMedalEntry(value: unknown): value is OlympicMedalEntry {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const stringFields = [
    "Athlete",
    "Event",
    "Medal",
    "Olympics",
    "Perazzi Model",
    "Country",
    "Evidence",
  ] as const;
  if (
    stringFields.some(
      (field) =>
        record[field] !== undefined && typeof record[field] !== "string",
    )
  ) {
    return false;
  }

  const sources = record.Sources;
  return sources === undefined || Array.isArray(sources);
}

function parseJsonArray<T>(
  rawText: string,
  guard: (value: unknown) => value is T,
  contextLabel: string,
): T[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.warn("Failed to parse JSON", { context: contextLabel });
    return [];
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return [];
  }

  return parsed.filter((entry): entry is T => guard(entry));
}

function chunkModelDetailsV2(rawText: string): ChunkInput[] {
  const records = parseJsonArray<ModelDetailsRecord>(
    rawText,
    isModelDetailsRecord,
    "chunkModelDetailsV2",
  );

  if (!records.length) {
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
        record.disciplines?.length
          ? `Disciplines: ${record.disciplines.join(", ")}`
          : "",
        record.gauges?.length ? `Gauges: ${record.gauges.join(", ")}` : "",
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

function buildHelperSectionLabels(
  doc: ActiveDoc,
  heading?: string,
  headingPath?: string,
): string[] {
  const labels: string[] = [];
  labels.push(doc.docType);
  if (heading) {
    const headingSlug = slugify(heading);
    if (headingSlug) labels.push(headingSlug);
  }
  if (headingPath) {
    const pathSlug = slugify(headingPath);
    if (pathSlug) labels.push(pathSlug);
  }

  if (doc.docType === "discipline-index" && heading) {
    const normalized = heading.toLowerCase().replace(/\s+/g, "-");
    labels.push(`disciplines:${normalized}`);
  }

  if (doc.docType === "platform-guide" && heading) {
    const match = /platform:\s*(.+)/i.exec(heading);
    const platformSlug = slugify(match ? match[1] : heading);
    if (platformSlug) labels.push(`platform:${platformSlug}`);
  }

  if (doc.docType === "base-model-index" && heading) {
    const baseSlug = slugify(heading);
    if (baseSlug) labels.push(`base-model:${baseSlug}`);
  }

  if (doc.docType === "model-spec-text" && heading) {
    const modelSlug = slugify(heading);
    if (modelSlug) labels.push(`model:${modelSlug}`);
  }

  return labels;
}

function chunkHeadingBlocksForHelperDocs(
  doc: ActiveDoc,
  rawText: string,
): ChunkInput[] {
  const sections = parseSections(rawText);
  const chunks: ChunkInput[] = [];
  let chunkIndex = 0;
  const primaryModes = ["Prospect", "Owner"];
  const archetypeBias: string[] = []; // neutral unless content skews otherwise

  for (const section of sections) {
    const content = section.content.join("\n").trim();
    const hasHeading = Boolean(section.heading);
    if (!hasHeading && !content) continue;

    const text = [
      section.heading ? section.heading.trim() : "",
      content,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!text) continue;

    const labels = buildHelperSectionLabels(
      doc,
      section.heading,
      section.headingPath,
    );

    chunks.push({
      text,
      chunkIndex,
      heading: section.heading ?? undefined,
      headingPath: section.headingPath ?? undefined,
      sectionLabels: labels.length ? labels : undefined,
      primaryModes,
      archetypeBias,
    });
    chunkIndex += 1;
  }

  return chunks;
}

function chunkOlympicMedalsV2(rawText: string): ChunkInput[] {
  const records = parseJsonArray<OlympicMedalEntry>(
    rawText,
    isOlympicMedalEntry,
    "chunkOlympicMedalsV2",
  );

  if (!records.length) {
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
      entry.Sources.forEach((source) => {
        if (source === null || source === undefined) return;
        const text = source.toString().trim();
        if (text) lines.push(`- ${text}`);
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

interface Section {
  heading?: string;
  headingPath?: string;
  content: string[];
}

function parseSections(rawText: string): Section[] {
  const lines = rawText.split(/\r?\n/);
  const stack: { level: number; text: string }[] = [];
  const sections: Section[] = [
    { heading: undefined, headingPath: undefined, content: [] },
  ];

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      while (stack.length && stack.at(-1)!.level >= level) {
        stack.pop();
      }
      stack.push({ level, text });
      const headingPath = stack.map((h) => h.text).join(" > ");
      sections.push({ heading: text, headingPath, content: [] });
    } else {
      sections.at(-1)!.content.push(line);
    }
  }

  return sections;
}

function createChunkFromBuffer(
  buffer: string[],
  chunkIndex: number,
  section: Section,
  primaryModes: string[],
  archetypeBias: string[],
): ChunkInput | null {
  if (!buffer.length) return null;
  const text = buffer.join("\n\n").trim();
  if (!text) return null;

  const labels = section.heading
    ? [slugify(section.heading), slugify(section.headingPath)].filter(Boolean)
    : undefined;

  return {
    text,
    chunkIndex,
    heading: section.heading,
    headingPath: section.headingPath,
    sectionLabels: labels as string[] | undefined,
    primaryModes,
    archetypeBias,
  };
}

function processSectionIntoParagraphChunks(
  section: Section,
  primaryModes: string[],
  archetypeBias: string[],
  startChunkIndex: number,
): ChunkInput[] {
  const sectionText = section.content.join("\n").trim();
  if (!sectionText) return [];

  const paragraphs = sectionText.split(/\n{2,}/);
  const chunks: ChunkInput[] = [];
  let buffer: string[] = [];
  let bufferTokens = 0;
  let chunkIndex = startChunkIndex;

  const flushBuffer = () => {
    const chunk = createChunkFromBuffer(
      buffer,
      chunkIndex,
      section,
      primaryModes,
      archetypeBias,
    );
    if (chunk) {
      chunks.push(chunk);
      chunkIndex += 1;
    }
    buffer = [];
    bufferTokens = 0;
  };

  for (const para of paragraphs) {
    const paraText = para.trim();
    if (!paraText) continue;
    const paraTokens = estimateTokens(paraText);
    if (bufferTokens + paraTokens > MAX_TOKENS && bufferTokens > TARGET_TOKENS) {
      flushBuffer();
    }
    buffer.push(paraText);
    bufferTokens += paraTokens;
    if (bufferTokens >= TARGET_TOKENS) {
      flushBuffer();
    }
  }

  flushBuffer();
  return chunks;
}

function chunkMarkdownLike(doc: ActiveDoc, rawText: string): ChunkInput[] {
  const sections = parseSections(rawText);
  const chunks: ChunkInput[] = [];
  let chunkIndex = 0;
  const primaryModes = defaultModesForCategory(doc.category);
  const archetypeBias = defaultArchetypes();

  for (const section of sections) {
    const sectionChunks = processSectionIntoParagraphChunks(
      section,
      primaryModes,
      archetypeBias,
      chunkIndex,
    );
    chunks.push(...sectionChunks);
    chunkIndex += sectionChunks.length;
  }

  return chunks;
}

function chunkDocument(doc: ActiveDoc, rawText: string): ChunkInput[] {
  const lowerPath = doc.path.toLowerCase();
  const helperDocTypes = new Set([
    "model-spec-text",
    "base-model-index",
    "discipline-index",
    "platform-guide",
  ]);

  if (helperDocTypes.has(doc.docType)) {
    return chunkHeadingBlocksForHelperDocs(doc, rawText);
  }

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
          chunk.sectionLabels ? stableStringify(chunk.sectionLabels) : null,
          chunk.primaryModes ? stableStringify(chunk.primaryModes) : null,
          chunk.archetypeBias ? stableStringify(chunk.archetypeBias) : null,
        ],
      );
      insertedChunks.push({ id: res.rows[0].id, text: chunk.text });
    }

    await client.query("commit");
    await embedChunks(client, insertedChunks, doc, options);
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
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

    for (let j = 0; j < batch.length; j++) {
      const embedding = response.data[j]?.embedding;
      if (!embedding) {
        throw new Error("Missing embedding in response");
      }
      const embeddingText = stableStringify(embedding); // "[0.1,0.2,...]"

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

interface IngestStats {
  scanned: number;
  newCount: number;
  updated: number;
  skipped: number;
  chunksWritten: number;
}

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
    { dryRun: opts.dryRun },
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

  const meta = parseDocumentMetadata(rawText);
  const upsertResult = await upsertDocumentRow(
    pool,
    doc,
    checksum,
    meta,
    { forceUpdate: opts.full },
  );

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

async function runIngest(
  pool: Pool,
  opts: IngestOptions,
): Promise<void> {
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

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error("Missing required env vars:", missing.join(", "));
    process.exit(1);
  }
}

function createPool(): Pool {
  const sslMode = (process.env.PGSSL_MODE ?? "").toLowerCase();
  const ssl =
    sslMode && sslMode !== "disable"
      ? true
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
