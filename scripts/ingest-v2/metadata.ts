import type { DocumentMetadata } from "./types";

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

export function parseDocumentMetadata(
  rawText: string,
): Partial<DocumentMetadata> {
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
