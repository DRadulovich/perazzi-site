import type { ChunkInput, ModelDetailsRecord, OlympicMedalEntry } from "../types";
import { slugify } from "../utils";

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

export function chunkModelDetailsV2(rawText: string): ChunkInput[] {
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

export function chunkOlympicMedalsV2(rawText: string): ChunkInput[] {
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
