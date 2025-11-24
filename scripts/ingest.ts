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

type ChunkDef = {
  text: string;
  words: number;
  headings: string[];
  topics?: string[];
  disciplines?: string[];
  platforms?: string[];
  geo?: string[];
  entityIds?: string[];
  structuredRefs?: Array<Record<string, any>>;
  guardrailFlags?: string[];
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
const SANITY_ROOT = path.join(PROJECT_ROOT, "PerazziGPT", "Sanity_Info");

type SanityLookups = {
  platforms: Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      disciplineIds: string[];
      summary?: string;
    }
  >;
  disciplines: Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
    }
  >;
  gauges: Map<
    string,
    {
      id: string;
      name: string;
      notes?: string;
    }
  >;
};

const sanityLookups: SanityLookups = loadSanityLookups();
const PLATFORM_SLUGS = new Set(Array.from(sanityLookups.platforms.values()).map((p) => p.slug));

function loadConfig(): ChunkingConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config not found at ${CONFIG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

const config = loadConfig();

function loadSanityArray<T = any>(fileName: string): T[] {
  const filePath = path.join(SANITY_ROOT, fileName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const contents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(contents) as T[];
  } catch {
    return [];
  }
}

function loadSanityLookups(): SanityLookups {
  const platformEntries = loadSanityArray<any>("platform.json").map((item) => ({
    id: item._id,
    name: item.name ?? item.title ?? "Perazzi Platform",
    slug: item.slug?.current ?? slugify(item.name ?? "perazzi-platform"),
    disciplineIds: (item.disciplines ?? []).map((ref: any) => ref?._ref).filter(Boolean),
    summary: item.snippet?.text ?? "",
  }));

  const disciplineEntries = loadSanityArray<any>("discipline.json").map((item) => ({
    id: item._id,
    name: item.name ?? "Discipline",
    slug: item.slug?.current ?? slugify(item.name ?? "discipline"),
  }));

  const gaugeEntries = loadSanityArray<any>("gauge.json").map((item) => ({
    id: item._id,
    name: item.name ?? "Gauge",
    notes: item.handlingNotes ?? "",
  }));

  return {
    platforms: new Map(platformEntries.map((entry) => [entry.id, entry])),
    disciplines: new Map(disciplineEntries.map((entry) => [entry.id, entry])),
    gauges: new Map(gaugeEntries.map((entry) => [entry.id, entry])),
  };
}

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

function dedupeLower(values?: Array<string | null | undefined>, fallback: string[] = []) {
  const normalized = (values ?? [])
    .map((val) => (val ?? "").toString().trim().toLowerCase())
    .filter(Boolean);
  const unique = Array.from(new Set(normalized));
  return unique.length ? unique : fallback;
}

function dedupeExact(values?: Array<string | null | undefined>, fallback: string[] = []) {
  const normalized = (values ?? []).map((val) => (val ?? "").toString().trim()).filter(Boolean);
  const unique = Array.from(new Set(normalized));
  return unique.length ? unique : fallback;
}

function inferTopicsFromPath(filePath: string): string[] {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("Phase_1_Documents")) return ["policies", "guardrails"];
  if (normalized.includes("Brand_Info")) return ["heritage", "history"];
  if (normalized.includes("Live_Site_Narratives")) return ["heritage", "storytelling"];
  if (normalized.includes("Company_Info/Authorized_Dealers")) return ["dealers", "service", "network"];
  if (normalized.includes("Company_Info/Recommended_Service_Centers"))
    return ["service", "care", "network"];
  if (normalized.includes("Company_Info/Athletes")) return ["olympic", "athletes"];
  if (normalized.includes("Company_Info/Olympic_Medals")) return ["olympic", "athletes", "heritage"];
  if (normalized.includes("Company_Info/Scheduled_Events")) return ["events"];
  if (normalized.includes("Gun_Info/Manufacture_Year")) return ["models", "heritage"];
  if (normalized.includes("Gun_Info/Rib_Information")) return ["specs", "models"];
  if (normalized.includes("Sanity_Info/models")) return ["models", "specs", "platforms"];
  if (normalized.includes("Sanity_Info/authorizedDealer")) return ["dealers", "service"];
  if (normalized.includes("Sanity_Info/recommendedServiceCenter")) return ["service", "care"];
  if (normalized.includes("Pricing_And_Models")) return ["models", "specs"];
  return ["general"];
}

function inferGeoFromPath(filePath: string): string[] {
  if (filePath.includes("Authorized_Dealers") || filePath.includes("authorizedDealer")) {
    return ["north-america"];
  }
  if (filePath.includes("Scheduled_Events") || filePath.includes("heritageEvent")) {
    return ["global"];
  }
  return ["global"];
}

function inferGuardrailFlags(filePath: string, chunkText: string, rule: ChunkRule): string[] {
  if (/Consumer_Warning_Notice/.test(filePath)) return ["contains_legal_language"];
  if (/Phase_1_Documents/.test(filePath)) return ["policy_reference"];
  if (/Pricing_And_Models/.test(filePath)) {
    const pricingSignal = /\$\s*\d|USD|MSRP|Retail/i.test(chunkText);
    return pricingSignal ? ["contains_pricing_fields"] : [];
  }
  if (/Warranty/i.test(filePath)) return ["contains_warranty_language"];
  return rule.type === "prompt" ? ["policy_reference"] : [];
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

function splitIntoChunksFromParagraphs(
  paragraphs: string[],
  opts: { targetWords: number; maxWords: number; overlapWords: number; allowOverflow?: boolean },
): ChunkDef[] {
  const chunks: ChunkDef[] = [];
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

function chunkMarkdown(filePath: string, text: string, rule: ChunkRule): ChunkDef[] {
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

function chunkJson(filePath: string, text: string, rule: ChunkRule): ChunkDef[] {
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
  const chunks: ChunkDef[] = [];
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
  const chunks: ChunkDef[] = [];
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

function chunkModelDetails(filePath: string, text: string): ChunkDef[] {
  const records: any[] = JSON.parse(text);
  if (!Array.isArray(records) || !records.length) return [];
  const chunks: ChunkDef[] = [];
  records.forEach((record) => {
    const name: string = record.name ?? record.slug ?? record.id ?? "Perazzi Model";
    const slug: string | undefined = record.slug ?? record.id ?? undefined;
    const platform: string | undefined = record.platform ?? record.platformSlug ?? undefined;
    const disciplines: string[] = Array.isArray(record.disciplines)
      ? record.disciplines.map((d: any) => (d ?? "").toString().toLowerCase()).filter(Boolean)
      : [];
    const topics: string[] = Array.isArray(record.topics)
      ? record.topics.map((t: any) => (t ?? "").toString().toLowerCase()).filter(Boolean)
      : [];
    const grade: string | undefined = record.grade ? record.grade.toString().toLowerCase() : undefined;
    const ribType: string | undefined = record.rib?.type ? record.rib.type.toString().toLowerCase() : undefined;
    const ribNotch: number | null =
      record.rib?.adjustableNotch !== undefined && record.rib?.adjustableNotch !== null
        ? Number(record.rib.adjustableNotch)
        : null;
    const triggerType: string | undefined = record.trigger?.type ? record.trigger.type.toString().toLowerCase() : undefined;
    const springs: string[] = Array.isArray(record.trigger?.springs)
      ? record.trigger.springs.map((s: any) => (s ?? "").toString().toLowerCase()).filter(Boolean)
      : [];
    const specText: string = record.specText || "";
    const textBody =
      specText ||
      [
        name ? `Model name: ${name}` : "",
        platform ? `Platform: ${platform}` : "",
        record.category ? `Category: ${record.category}` : "",
        record.disciplines ? `Disciplines: ${(record.disciplines as any[]).join(", ")}` : "",
        record.gauges ? `Gauges: ${(record.gauges as any[]).join(", ")}` : "",
        record.barrelConfig ? `Barrel: ${record.barrelConfig}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    const words = countWords(textBody);
    const entityIds: string[] = [];
    if (slug) entityIds.push(slug);
    if (record.id && record.id !== slug) entityIds.push(String(record.id));
    if (record.baseModel) entityIds.push(String(record.baseModel));
    const topicTags = new Set<string>(["models", "specs", ...topics]);
    disciplines.forEach((d) => topicTags.add(`discipline_${d}`));
    if (platform) topicTags.add(`platform_${platform}`);
    if (grade) topicTags.add(`grade_${slugify(grade)}`);
    if (ribType) topicTags.add(`rib_${ribType}`);
    if (ribNotch && Number.isFinite(ribNotch)) topicTags.add(`rib_notch_${ribNotch}`);
    if (triggerType) topicTags.add(`trigger_${triggerType}`);
    springs.forEach((s) => topicTags.add(`trigger_spring_${s}`));
    const structuredRefs = [
      {
        type: "model_spec",
        slug,
        name,
        platform,
        baseModel: record.baseModel ?? null,
        category: record.category ?? null,
        disciplines,
        gauges: record.gauges ?? [],
        barrelConfig: record.barrelConfig ?? null,
        trigger: record.trigger ?? null,
        rib: record.rib ?? null,
        grade: record.grade ?? null,
      },
    ];
    chunks.push({
      text: textBody,
      words,
      headings: [`### ${name}`],
      topics: Array.from(topicTags),
      disciplines,
      platforms: platform ? [platform] : [],
      entityIds,
      structuredRefs,
    });
  });
  return chunks;
}

function chunkSanityModels(filePath: string, text: string): ChunkDef[] {
  const models: any[] = JSON.parse(text);
  return models.map((model) => {
    const name: string = model.s_model_name ?? "Perazzi Model";
    const slug = slugify(name);
    const platformRef = model.s_platform_id?._ref;
    const platformMeta = platformRef ? sanityLookups.platforms.get(platformRef) : undefined;
    const platformName = platformMeta?.name ?? "Perazzi Platform";
    const platformSlug = platformMeta?.slug ?? null;
    const disciplineSlugs =
      platformMeta?.disciplineIds
        .map((id) => sanityLookups.disciplines.get(id ?? ""))
        .filter(Boolean)
        .map((disc) => disc!.slug) ?? [];
    const disciplineNames =
      platformMeta?.disciplineIds
        .map((id) => sanityLookups.disciplines.get(id ?? ""))
        .filter(Boolean)
        .map((disc) => disc!.name) ?? [];
    const gaugeRefs = [model.s_gauge_id_1, model.s_gauge_id_2, model.s_gauge_id_3]
      .map((ref) => (typeof ref === "object" ? ref?._ref : null))
      .filter(Boolean) as string[];
    const gaugeNames = gaugeRefs
      .map((id) => sanityLookups.gauges.get(id)?.name)
      .filter(Boolean);
    const gaugeNotes = gaugeRefs
      .map((id) => sanityLookups.gauges.get(id)?.notes)
      .filter(Boolean);
    const ribTypes = [model.s_rib_type_id_1, model.s_rib_type_id_2, model.s_rib_type_id_3]
      .map((value: string) => value?.trim())
      .filter(Boolean);
    const triggerTypes = [model.s_trigger_type_id_1, model.s_trigger_type_id_2]
      .map((value: string) => value?.trim())
      .filter(Boolean);
    const triggerSprings = [model.s_trigger_spring_id_1, model.s_trigger_spring_id_2]
      .map((value: string) => value?.trim())
      .filter(Boolean);
    const version = model.s_version_id ?? "";
    const useCase = model.s_use_id ? model.s_use_id.toString() : "Competition";
    const summaryLines = [
      `### ${name}`,
      `**Platform:** ${platformName}`,
      version ? `**Designation:** ${version}` : null,
      gaugeNames.length ? `**Gauge options:** ${gaugeNames.join(", ")}` : null,
      ribTypes.length ? `**Rib type(s):** ${ribTypes.join(", ")}` : null,
      triggerTypes.length ? `**Trigger:** ${triggerTypes.join(", ")}` : null,
      triggerSprings.length ? `**Trigger springs:** ${triggerSprings.join(", ")}` : null,
      disciplineNames.length ? `**Disciplines:** ${disciplineNames.join(", ")}` : null,
      `**Use case:** ${useCase}`,
    ]
      .filter(Boolean)
      .map((line) => line!.trim());

    if (gaugeNotes.length) {
      summaryLines.push(`**Gauge handling notes:** ${gaugeNotes.join(" ")}`);
    }
    if (platformMeta?.summary) {
      summaryLines.push(`> ${platformMeta.summary.trim()}`);
    }

    const textBlock = summaryLines.join("\n");

    return {
      text: textBlock,
      words: countWords(textBlock),
      headings: [`### ${name}`],
      topics: ["models", "specs", "platforms"],
      disciplines: disciplineSlugs,
      platforms: platformSlug ? [platformSlug] : [],
      entityIds: [model._id, slug],
      structuredRefs: [
        {
          type: "model_overview",
          slug,
          platform: platformSlug,
          name,
          version,
          disciplines: disciplineSlugs,
          gauge: gaugeNames,
          ribTypes,
          triggerTypes,
          useCase,
        },
      ],
    };
  });
}

function chunkSanityDealers(filePath: string, text: string): ChunkDef[] {
  const dealers: any[] = JSON.parse(text);
  return dealers.map((dealer) => {
    const name: string = dealer.dealerName ?? "Authorized Dealer";
    const location = [dealer.city, dealer.state].filter(Boolean).join(", ");
    const geo =
      dealer.state && typeof dealer.state === "string" ? [slugify(dealer.state)] : ["north-america"];
    const lines = [
      `### ${name}`,
      location ? `**Location:** ${location}` : null,
      dealer.address ? `**Address:** ${dealer.address}` : null,
      dealer.phone ? `**Phone:** ${dealer.phone}` : null,
      dealer.email ? `**Email:** ${dealer.email}` : null,
      dealer.hours ? `**Hours:** ${dealer.hours}` : null,
      dealer.notes ? `**Notes:** ${dealer.notes}` : null,
    ]
      .filter(Boolean)
      .map((line) => line!.trim());
    const textBlock = lines.join("\n");
    return {
      text: textBlock,
      words: countWords(textBlock),
      headings: [`### ${name}`],
      topics: ["dealers", "service", "network"],
      geo,
      entityIds: [dealer._id, slugify(name)],
      structuredRefs: [
        {
          type: "authorized_dealer",
          id: dealer._id,
          name,
          location,
        },
      ],
    };
  });
}

function chunkOlympicMedals(filePath: string, text: string): ChunkDef[] {
  const records: any[] = JSON.parse(text);
  return records.map((entry, idx) => {
    const athlete: string = entry.Athlete ?? "Perazzi Olympian";
    const event: string = entry.Event ?? "";
    const medal: string = entry.Medal ?? "";
    const year: string = entry.Olympics ?? "";
    const perazziModel: string = entry["Perazzi Model"] ?? "";
    const disciplineTags = extractDisciplinesFromEvent(event);
    const lines = [
      `### ${athlete}`,
      entry.Country ? `**Country:** ${entry.Country}` : null,
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
        lines.push(`- ${source}`);
      });
    }
    const textBlock = lines.join("\n");
    return {
      text: textBlock,
      words: countWords(textBlock),
      headings: [`### ${athlete}`],
      topics: ["olympic", "athletes", "heritage"],
      disciplines: disciplineTags,
      geo: entry.Country ? [slugify(entry.Country)] : ["global"],
      entityIds: [slugify(athlete), `olympic-${idx}`],
      structuredRefs: [
        {
          type: "olympic_result",
          athlete,
          event,
          medal,
          olympics: year,
          model: perazziModel,
        },
      ],
    };
  });
}

function extractDisciplinesFromEvent(event: string): string[] {
  const normalized = (event ?? "").toLowerCase();
  const tags: string[] = [];
  if (normalized.includes("skeet")) tags.push("skeet");
  if (normalized.includes("trap")) tags.push("trap");
  if (normalized.includes("double")) tags.push("double_trap");
  if (normalized.includes("helice") || normalized.includes("pigeon")) tags.push("helice");
  return Array.from(new Set(tags));
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
  topics?: string[];
  disciplines?: string[];
  platforms?: string[];
  geo?: string[];
  entityIds?: string[];
  structuredRefs?: Array<Record<string, any>>;
}) {
  const {
    filePath,
    chunkText,
    chunkIndex,
    chunkCount,
    tokens,
    audience,
    docId,
    type,
    lastUpdated,
    rule,
    guardrailFlags,
    topics,
    disciplines,
    platforms,
    geo,
    entityIds,
    structuredRefs,
  } = opts;
  const title = firstHeadingOrFallback(chunkText, type);
  const summary = chunkText.split(/\n+/)[0]?.slice(0, 280) ?? "";
  const normalizedTopics = dedupeLower(topics, inferTopicsFromPath(filePath));
  const normalizedDisciplines = dedupeLower(disciplines, ["general"]);
  const normalizedPlatforms = dedupeLower(
    (platforms ?? []).filter((platform) => PLATFORM_SLUGS.has(platform)),
    []
  );
  const normalizedGeo = dedupeLower(geo, inferGeoFromPath(filePath));
  const normalizedEntityIds = dedupeExact(entityIds, []);
  const baseMetadata = {
    id: docId,
    chunk_id: `${docId}#chunk-${String(chunkIndex + 1).padStart(2, "0")}`,
    type,
    subtype: rule.type ?? type,
    title,
    summary,
    language: "en",
    audience,
    discipline: normalizedDisciplines[0] ?? "general",
    discipline_tags: normalizedDisciplines,
    platform: normalizedPlatforms[0] ?? "general",
    platform_tags: normalizedPlatforms,
    topics: normalizedTopics,
    persona: inferPersona(audience, filePath),
    region: normalizedGeo[0] ?? "global",
    geo_tags: normalizedGeo,
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
    guardrail_flags: dedupeLower(guardrailFlags),
    pricing_sensitive: guardrailFlags.length > 0,
    legal_reviewed: null,
    author: "Perazzi Concierge Automation",
    approver: "Perazzi Concierge Automation",
    stakeholders: [],
    cta_links: [],
    context_tags: normalizedTopics,
    related_entities: normalizedEntityIds,
    structured_refs: structuredRefs ?? [],
    safety_notes: "",
    escalation_path: "none",
    off_topic_response: "",
    entity_ids: normalizedEntityIds,
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
    const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
    let chunkDefs: ChunkDef[] = [];
    if (ext === ".json") {
      if (relPath.endsWith("PerazziGPT/DEVELOPER/corpus_models_details.json")) {
        chunkDefs = chunkModelDetails(filePath, text);
      } else if (relPath.endsWith("Sanity_Info/models.json")) {
        chunkDefs = chunkSanityModels(filePath, text);
      } else if (relPath.endsWith("Sanity_Info/authorizedDealer.json")) {
        chunkDefs = chunkSanityDealers(filePath, text);
      } else if (relPath.endsWith("Company_Info/Olympic_Medals.json")) {
        chunkDefs = chunkOlympicMedals(filePath, text);
      } else {
        chunkDefs = chunkJson(filePath, text, rule);
      }
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
        guardrailFlags: chunkDef.guardrailFlags ?? inferGuardrailFlags(filePath, chunkDef.text, rule),
        topics: chunkDef.topics,
        disciplines: chunkDef.disciplines,
        platforms: chunkDef.platforms,
        geo: chunkDef.geo,
        entityIds: chunkDef.entityIds,
        structuredRefs: chunkDef.structuredRefs,
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
