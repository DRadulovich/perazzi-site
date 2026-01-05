import type { DocumentMetadata } from "./types";
import {
  normalizeAudiences,
  normalizeDisciplines,
  normalizeLanguage,
  normalizePlatforms,
  normalizeTags,
} from "./metadata-utils";

const METADATA_HEADING = /^##\s*(?:0+\.?\s*)?metadata\b.*$/im;

const DOC_TYPE_DEFAULTS: Record<
  string,
  Partial<Pick<DocumentMetadata, "audiences" | "tags" | "platforms" | "disciplines">>
> = {
  "site-map": {
    audiences: ["navigation"],
    tags: [],
    platforms: [],
    disciplines: [],
  },
  "learning-map": {
    audiences: ["navigation"],
    tags: [],
    platforms: [],
    disciplines: [],
  },
  "platform-guide": {
    audiences: ["prospect", "owner"],
    tags: ["platforms", "models"],
    platforms: [],
  },
  "discipline-index": {
    audiences: ["prospect", "owner"],
    tags: ["disciplines", "models"],
    disciplines: [],
  },
  "base-model-index": {
    audiences: ["prospect", "owner"],
    tags: ["models"],
  },
  "model-spec-text": {
    audiences: ["prospect", "owner"],
    tags: ["models", "specs"],
  },
  "configuration-guide": {
    audiences: ["prospect", "owner"],
    tags: ["specs"],
  },
  "dealer-directory": {
    audiences: ["prospect", "owner"],
    tags: ["dealers", "service", "network"],
  },
  "service-centers": {
    audiences: ["prospect", "owner"],
    tags: ["service", "care", "network"],
  },
  events: {
    audiences: ["prospect", "owner"],
    tags: ["events"],
  },
  athletes: {
    audiences: ["prospect", "owner"],
    tags: ["athletes", "olympic", "heritage"],
  },
  "achievement-record": {
    audiences: ["prospect", "owner"],
    tags: ["olympic", "athletes", "heritage"],
  },
  "brand-strategy": {
    audiences: ["prospect", "owner"],
    tags: ["heritage", "history", "models"],
  },
  "brand-ethos": {
    audiences: ["prospect", "owner"],
    tags: ["heritage"],
  },
  "craftsmanship-handbook": {
    audiences: ["prospect", "owner"],
    tags: ["bespoke", "heritage"],
  },
  "serial-year-mapping": {
    audiences: ["prospect", "owner"],
    tags: ["history"],
  },
  "tone-guidance": {
    audiences: ["prospect", "owner"],
    tags: [],
  },
  "audience-psychology": {
    audiences: ["prospect", "owner"],
    tags: [],
  },
  "safety-notice": {
    audiences: ["prospect", "owner"],
    tags: [],
  },
};

function extractSectionWithRange(
  rawText: string,
  heading: RegExp,
): { section: string | null; start: number | null; end: number | null } {
  const match = heading.exec(rawText);
  if (match?.index == null) {
    return { section: null, start: null, end: null };
  }

  const start = match.index;
  const rest = rawText.slice(start + match[0].length);
  const nextHeading = rest.search(/\n##\s+/);
  if (nextHeading === -1) {
    return { section: rest.trim(), start, end: rawText.length };
  }
  const end = start + match[0].length + nextHeading;
  return { section: rest.slice(0, nextHeading).trim(), start, end };
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*[-*+]\s+/, "");
}

function normalizeMetaKey(rawKey: string): string {
  return rawKey
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/(?:^_+|_+$)/g, "");
}

function parseListValue(value: string | undefined): string[] | null {
  if (!value) return null;
  return value
    .split(/[,|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function isHeadingParagraph(paragraph: string): boolean {
  return /^#{1,6}\s+/.test(paragraph.trim());
}

function isBulletHeavyParagraph(paragraph: string): boolean {
  const lines = paragraph.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return false;
  const bulletLines = lines.filter((line) => /^\s*[-*+]\s+\S/.test(line)).length;
  return bulletLines > 0 && bulletLines >= Math.ceil(lines.length / 2);
}

function normalizeSummaryText(text: string): string {
  const singleLine = text.replaceAll(/\s+/g, " ").trim();
  if (singleLine.length <= 280) return singleLine;
  const truncated = singleLine.slice(0, 280);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace <= 0) return truncated.trimEnd();
  return truncated.slice(0, lastSpace).trimEnd();
}

function buildSummaryFallback(
  rawText: string,
  metaRange: { start: number | null; end: number | null },
  title: string | undefined,
): string {
  let content =
    metaRange.end == null ? rawText : rawText.slice(metaRange.end);
  content = content.replace(/^#\s+.*\n+/, "");
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const paragraph of paragraphs) {
    if (isHeadingParagraph(paragraph)) continue;
    if (isBulletHeavyParagraph(paragraph)) continue;
    if (paragraph.length < 40) continue;
    return normalizeSummaryText(paragraph);
  }

  if (title?.trim()) return title.trim();
  return "Perazzi reference document.";
}

function applyDocTypeDefaults(
  meta: Partial<DocumentMetadata>,
  docType: string | undefined,
  seenKeys: Set<string>,
): void {
  if (!docType) return;
  const defaults = DOC_TYPE_DEFAULTS[docType];
  if (!defaults) return;

  for (const key of ["audiences", "tags", "platforms", "disciplines"] as const) {
    if (seenKeys.has(key)) continue;
    if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;
    meta[key] = defaults[key] ?? [];
  }
}

export function parseDocumentMetadata(
  rawText: string,
  docType?: string,
): Partial<DocumentMetadata> {
  const meta: Partial<DocumentMetadata> = {};
  const seenKeys = new Set<string>();
  const titleMatch = /^#\s+(.+)$/m.exec(rawText);
  if (titleMatch) {
    meta.title = titleMatch[1].trim();
  }

  const metaRange = extractSectionWithRange(rawText, METADATA_HEADING);
  if (metaRange.section) {
    const lines = metaRange.section.split(/\r?\n/).map((l) => l.trim());
    for (const rawLine of lines) {
      const line = stripListMarker(rawLine);
      if (!line.includes(":")) continue;
      const [rawKey, ...rest] = line.split(":");
      const key = normalizeMetaKey(rawKey);
      const value = rest.join(":").trim();
      if (!value) continue;
      seenKeys.add(key);

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
  }

  if (meta.summary) {
    meta.summary = normalizeSummaryText(meta.summary);
  } else {
    meta.summary = buildSummaryFallback(rawText, metaRange, meta.title);
  }

  applyDocTypeDefaults(meta, docType, seenKeys);

  meta.language = normalizeLanguage(meta.language);
  meta.platforms = normalizePlatforms(meta.platforms);
  meta.disciplines = normalizeDisciplines(meta.disciplines);
  meta.audiences = normalizeAudiences(meta.audiences);
  meta.tags = normalizeTags(meta.tags);

  return meta;
}
