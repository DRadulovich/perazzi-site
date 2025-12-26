import { slugify } from "./utils";

const PLATFORM_CANONICAL = ["mx", "ht", "tm", "dc", "sho"] as const;
const DISCIPLINE_CANONICAL = ["trap", "skeet", "sporting", "game"] as const;
const AUDIENCE_CANONICAL = ["prospect", "owner", "navigation"] as const;
const TAG_ALLOWLIST = new Set([
  "platforms",
  "models",
  "specs",
  "disciplines",
  "dealers",
  "service",
  "network",
  "care",
  "olympic",
  "athletes",
  "heritage",
  "history",
  "events",
  "pricing_policies",
  "bespoke",
  "rib_adjustable",
  "rib_fixed",
  "grade_sc3",
  "grade_sco",
  "grade_lusso",
]);

type Platform = (typeof PLATFORM_CANONICAL)[number];

function stripPrefix(value: string): string {
  return value.replace(/^[a-z][a-z0-9_-]*:/i, "");
}

function normalizeDescriptor(value: string): string {
  return stripPrefix(value)
    .toLowerCase()
    .trim()
    .replaceAll(/[_-]+/g, " ")
    .replaceAll(/\s+/g, " ");
}

function normalizeTagToken(value: string): string | null {
  const normalized = stripPrefix(value)
    .toLowerCase()
    .trim()
    .replaceAll(/[\s-]+/g, "_");
  return normalized || null;
}

export function dedupeStable(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function normalizeLanguage(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized || "en";
}

export function mapPlatformToken(value: string): Platform | null {
  const normalized = normalizeDescriptor(value);
  if (!normalized) return null;
  const compact = normalized.replaceAll(/\s+/g, "");

  if (PLATFORM_CANONICAL.includes(normalized as Platform)) {
    return normalized as Platform;
  }
  if (normalized === "mx platform" || normalized === "mx series") {
    return "mx";
  }
  if (normalized === "high tech" || normalized === "hts") {
    return "ht";
  }
  if (
    normalized === "tm series" ||
    /^tm\d+x?$/.test(compact)
  ) {
    return "tm";
  }
  if (normalized === "dc series") {
    return "dc";
  }
  if (normalized === "sho series" || normalized === "sidelock") {
    return "sho";
  }

  return null;
}

export function mapDisciplineToken(value: string): string[] {
  const normalized = normalizeDescriptor(value);
  if (!normalized) return [];

  if (normalized === "sporting" || normalized === "sporting clays") {
    return ["sporting"];
  }
  if (normalized === "clays" || normalized === "fitasc") {
    return ["sporting"];
  }
  if (normalized === "bunker" || normalized === "olympic trap") {
    return ["trap"];
  }
  if (
    normalized === "helice" ||
    normalized === "zz" ||
    normalized === "live pigeon" ||
    normalized === "pigeon"
  ) {
    return ["sporting", "game"];
  }
  if (DISCIPLINE_CANONICAL.includes(normalized as (typeof DISCIPLINE_CANONICAL)[number])) {
    return [normalized];
  }

  return [];
}

export function normalizePlatforms(values: string[] | null | undefined): string[] {
  const mapped: string[] = [];
  for (const value of values ?? []) {
    const platform = mapPlatformToken(value);
    if (platform) mapped.push(platform);
  }
  return dedupeStable(mapped);
}

export function normalizeDisciplines(
  values: string[] | null | undefined,
): string[] {
  const mapped: string[] = [];
  for (const value of values ?? []) {
    mapped.push(...mapDisciplineToken(value));
  }
  return dedupeStable(mapped);
}

export function normalizeAudiences(values: string[] | null | undefined): string[] {
  const mapped: string[] = [];
  for (const value of values ?? []) {
    const normalized = normalizeDescriptor(value).replaceAll(/\s+/g, "");
    if (AUDIENCE_CANONICAL.includes(normalized as (typeof AUDIENCE_CANONICAL)[number])) {
      mapped.push(normalized);
    }
  }
  return dedupeStable(mapped);
}

export function normalizeTags(values: string[] | null | undefined): string[] {
  const mapped: string[] = [];
  for (const value of values ?? []) {
    const normalized = normalizeTagToken(value);
    if (!normalized) continue;
    if (TAG_ALLOWLIST.has(normalized) || /^rib_notch_\d+$/.test(normalized)) {
      mapped.push(normalized);
    }
  }
  return dedupeStable(mapped);
}

export function normalizeRelatedEntities(
  values: string[] | null | undefined,
): string[] {
  const mapped: string[] = [];
  for (const value of values ?? []) {
    const slug = slugify(stripPrefix(value));
    if (slug) mapped.push(slug);
  }
  return dedupeStable(mapped);
}

export function inferPlatformFromRelatedSlug(value: string): Platform | null {
  const slug = value.toLowerCase();
  if (slug.includes("high-tech") || slug.startsWith("ht")) return "ht";
  if (slug.startsWith("mx")) return "mx";
  if (slug.startsWith("tm")) return "tm";
  if (slug.startsWith("dc")) return "dc";
  if (slug.startsWith("sho")) return "sho";
  return null;
}
