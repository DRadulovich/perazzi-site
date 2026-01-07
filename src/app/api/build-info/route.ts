import type { SanityClient } from "@sanity/client";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { NextRequest, NextResponse } from "next/server";
import { sanityClient as baseClient } from "../../../../sanity/client";
import { getSanityImageUrl, hasValidSanityImage } from "@/lib/sanityImage";
import {
  buildConfiguratorQuery,
  disciplineFallback,
  disciplineQuery,
  gaugeFallback,
  gaugeQuery,
  gradeFallback,
  gradeQuery,
  modelFallback,
  modelGradeQuery,
  modelQuery,
  platformFallback,
  platformQuery,
  triggerTypeQuery,
} from "./queries";

const skipFields = new Set(["RIB_TAPER_20", "RIB_TAPER_28_410", "RIB_TAPER_SXS"]);

type PortableTextChild = { text?: string | null };
type PortableTextBlock = {
  children?: PortableTextChild[];
  text?: string | null;
};
type PortableTextValue = string | PortableTextBlock | Array<PortableTextBlock | string> | null | undefined;
type ConfiguratorImage = SanityImageSource | { asset?: SanityImageSource | null } | null | undefined;
type ConfiguratorItem = {
  _id?: string;
  stepId?: string;
  optionValue?: string;
  title?: string;
  description?: PortableTextValue;
  platform?: string | null;
  grade?: string | null;
  gauge?: string | null;
  trigger?: string | null;
  discipline?: string | null;
  image?: ConfiguratorImage;
};
type BuildConfiguratorDoc = Record<string, ConfiguratorItem[] | undefined>;
type SearchRow = {
  _id?: string;
  title?: string;
  description?: PortableTextValue;
  overview?: PortableTextValue;
  platform?: string | null;
  gauges?: Array<string | null | undefined>;
  triggerTypes?: Array<string | null | undefined>;
  grade?: string | null;
  recommendedPlatforms?: string[];
  popularModels?: string[];
  image?: ConfiguratorImage;
};
type ModelGradeRow = { grade?: string | null };
type BuildInfoItem = {
  id: string;
  title: string;
  description: string;
  platform: string | null;
  gauges: string[];
  triggerTypes: string[];
  grade: string | null;
  recommendedPlatforms: string[];
  popularModels: string[];
  imageUrl: string | null;
  fullImageUrl: string | null;
};
type SearchContext = {
  term: string;
  altTerm: string;
  compactTerm: string;
  looseTerm: string;
  lowerValue: string;
};

const PLATFORM_ALIASES: Record<string, string> = {
  HT: "High Tech",
};

function resolveImageSource(image?: ConfiguratorImage): SanityImageSource | null {
  if (!image) return null;
  if (hasValidSanityImage(image as SanityImageSource | null | undefined)) {
    return image as SanityImageSource;
  }
  if (typeof image === "object" && "asset" in image) {
    const asset = image.asset as SanityImageSource | null | undefined;
    if (hasValidSanityImage(asset)) {
      return asset;
    }
  }
  return null;
}

function normalizeValue(field: string, value: string) {
  if (field === "PLATFORM") {
    const upper = value.trim().toUpperCase();
    if (PLATFORM_ALIASES[upper]) return PLATFORM_ALIASES[upper];
  }
  return value;
}

function plainTextFromBlock(block: PortableTextBlock | string): string {
  if (typeof block === "string") return block;
  if (Array.isArray(block.children)) {
    return block.children.map((child: PortableTextChild) => child?.text ?? "").join("");
  }
  if (block.text) return block.text;
  return "";
}

function plainTextFromArray(blocks: Array<PortableTextBlock | string>): string {
  return blocks.map(plainTextFromBlock).filter(Boolean).join("\n").trim();
}

function plainTextFromObject(value: PortableTextBlock): string {
  return value.text ? String(value.text) : "";
}

function toPlainText(value: PortableTextValue): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return plainTextFromArray(value);
  return plainTextFromObject(value);
}

function buildRowId(id: string | undefined, idx: number): string {
  return id ?? `row-${idx}`;
}

function coalesceString(value: string | null | undefined, fallback = ""): string {
  return value ?? fallback;
}

function coalesceNullableString(value: string | null | undefined): string | null {
  return value ?? null;
}

function coalesceStringArray(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function toStringArray(value: Array<string | null | undefined> | null | undefined): string[] {
  return (value ?? []).filter(Boolean).map(String);
}

function buildImageUrls(image: ConfiguratorImage): { imageUrl: string | null; fullImageUrl: string | null } {
  const imageSource = resolveImageSource(image);
  return {
    imageUrl: imageSource ? getSanityImageUrl(imageSource, { width: 400, quality: 80 }) : null,
    fullImageUrl: imageSource ? getSanityImageUrl(imageSource, { width: 1600, quality: 90 }) : null,
  };
}

function pickDescription(row: SearchRow): PortableTextValue {
  return row.description ?? row.overview ?? "";
}

function mapRowToItem(row: SearchRow, idx: number): BuildInfoItem {
  const { imageUrl, fullImageUrl } = buildImageUrls(row.image);
  return {
    id: buildRowId(row._id, idx),
    title: coalesceString(row.title),
    description: toPlainText(pickDescription(row)),
    platform: coalesceNullableString(row.platform),
    gauges: toStringArray(row.gauges),
    triggerTypes: toStringArray(row.triggerTypes),
    grade: coalesceNullableString(row.grade),
    recommendedPlatforms: coalesceStringArray(row.recommendedPlatforms),
    popularModels: coalesceStringArray(row.popularModels),
    imageUrl,
    fullImageUrl,
  };
}

function mapResult(rows: SearchRow[]): BuildInfoItem[] {
  return (rows ?? []).map(mapRowToItem);
}

function buildTerms(rawValue: string) {
  const trimmed = rawValue.trim();
  const lower = trimmed.toLowerCase();
  const altTerm = `${lower.replaceAll(/[^a-z0-9]+/g, " ").trim()}*`;
  const compactTerm = `${lower.replaceAll(/[^a-z0-9]+/g, "")}*`;
  const term = `${trimmed}*`;
  const looseTerm = `*${lower}*`;
  return { term, altTerm, compactTerm, looseTerm };
}

function isMatchingConfiguratorItem(item: ConfiguratorItem, normField: string, normValue: string) {
  const stepId = (item.stepId ?? normField).toUpperCase();
  const optionVal = (item.optionValue ?? "").toUpperCase();
  return stepId === normField && optionVal === normValue;
}

function toBuildInfoItem(item: ConfiguratorItem, field: string, value: string, idx: number): BuildInfoItem {
  const imageSource = resolveImageSource(item.image);
  return {
    id: item._id ?? `${field}-${value}-${idx}`,
    title: item.optionValue ?? item.title ?? value,
    description: toPlainText(item.description ?? ""),
    platform: item.platform ?? null,
    grade: item.grade ?? null,
    gauges: item.gauge ? [item.gauge] : [],
    triggerTypes: item.trigger ? [item.trigger] : [],
    recommendedPlatforms: item.discipline ? [item.discipline] : [],
    popularModels: [],
    imageUrl: imageSource ? getSanityImageUrl(imageSource, { width: 400, quality: 80 }) : null,
    fullImageUrl: imageSource ? getSanityImageUrl(imageSource, { width: 1600, quality: 90 }) : null,
  };
}

async function fetchConfiguratorDoc(client: SanityClient): Promise<BuildConfiguratorDoc | null> {
  return client.fetch<BuildConfiguratorDoc | null>(buildConfiguratorQuery);
}

function pickConfiguratorItems(doc: BuildConfiguratorDoc | null, field: string): ConfiguratorItem[] {
  if (!doc) return [];
  const items = doc[field];
  return Array.isArray(items) ? items : [];
}

async function fetchConfiguratorItems(client: SanityClient, field: string, value: string): Promise<BuildInfoItem[]> {
  const doc = await fetchConfiguratorDoc(client);
  const items = pickConfiguratorItems(doc, field);
  const normField = field.trim().toUpperCase();
  const normValue = value.trim().toUpperCase();
  const filtered = items.filter((item) => isMatchingConfiguratorItem(item, normField, normValue));
  return filtered.map((item, idx) => toBuildInfoItem(item, field, value, idx));
}

function parseSearchParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return normalizeInputs({
    field: searchParams.get("field") ?? "",
    value: searchParams.get("value") ?? "",
    model: searchParams.get("model") ?? "",
  });
}

function buildSearchContext(normalizedValue: string): SearchContext {
  const { term, altTerm, compactTerm, looseTerm } = buildTerms(normalizedValue);
  const lowerValue = normalizedValue.toLowerCase();
  return { term, altTerm, compactTerm, looseTerm, lowerValue };
}

function normalizeInputs(input: { field?: unknown; value?: unknown; model?: unknown }) {
  const field = typeof input.field === "string" ? input.field.trim().toUpperCase() : "";
  const rawValue = typeof input.value === "string" ? input.value.trim() : "";
  const rawModel = typeof input.model === "string" ? input.model.trim() : "";
  const normalizedValue = normalizeValue(field, rawValue);
  return { field, rawValue, rawModel, normalizedValue };
}

async function parseBody(request: NextRequest) {
  try {
    const body = (await request.json()) as { field?: unknown; value?: unknown; model?: unknown };
    return normalizeInputs(body);
  } catch {
    return normalizeInputs({});
  }
}

async function handleBuildInfoRequest(params: ReturnType<typeof normalizeInputs>) {
  // Use API (non-CDN) client to avoid DNS/cache issues when resolving fresh data.
  const client = baseClient.withConfig({ useCdn: false });
  const { field, rawValue, rawModel, normalizedValue } = params;

  if (!field || !normalizedValue) {
    return NextResponse.json({ error: "Missing field or value" }, { status: 400 });
  }

  const search = buildSearchContext(normalizedValue);

  try {
    const shortcutResponse = await tryConfiguratorShortcut(client, field, rawValue, normalizedValue);
    if (shortcutResponse) {
      return shortcutResponse;
    }

    const rows = await fetchRowsForField(client, field, search, rawModel);
    return NextResponse.json({ items: mapResult(rows) });
  } catch (error) {
    console.error("Failed to fetch build info", error);
    return NextResponse.json({ error: "Failed to fetch build info" }, { status: 500 });
  }
}

async function tryConfiguratorShortcut(
  client: SanityClient,
  field: string,
  rawValue: string,
  normalizedValue: string,
): Promise<NextResponse | null> {
  if (skipFields.has(field)) {
    return NextResponse.json({ items: [] });
  }

  if (field === "PLATFORM") {
    const configuratorItems = await fetchConfiguratorItems(client, field, rawValue);
    return NextResponse.json({ items: configuratorItems });
  }

  const configuratorItems = await fetchConfiguratorItems(client, field, normalizedValue);
  if (configuratorItems.length) {
    return NextResponse.json({ items: configuratorItems });
  }

  return null;
}

// Helper functions for each field-specific query branch
async function fetchPlatformRows(
  client: SanityClient,
  search: SearchContext,
): Promise<SearchRow[]> {
  const { term, altTerm, compactTerm, looseTerm } = search;
  let rows = await client.fetch<SearchRow[]>(platformQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch<SearchRow[]>(platformFallback);
  }
  return rows;
}

async function fetchModelRows(
  client: SanityClient,
  search: SearchContext,
): Promise<SearchRow[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch<SearchRow[]>(modelQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch<SearchRow[]>(modelFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchDisciplineRows(
  client: SanityClient,
  search: SearchContext,
): Promise<SearchRow[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch<SearchRow[]>(disciplineQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch<SearchRow[]>(disciplineFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchGaugeRows(
  client: SanityClient,
  search: SearchContext,
): Promise<SearchRow[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch<SearchRow[]>(gaugeQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch<SearchRow[]>(gaugeFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchGradeRows(
  client: SanityClient,
  search: SearchContext,
  rawModel: string,
): Promise<SearchRow[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows: SearchRow[] = [];

  if (rawModel) {
    const {
      term: modelTerm,
      altTerm: altModelTerm,
      compactTerm: compactModelTerm,
      looseTerm: looseModelTerm,
    } = buildTerms(rawModel);
    const modelGradeRows = await client.fetch<ModelGradeRow[]>(modelGradeQuery, {
      modelTerm,
      altModelTerm,
      compactModelTerm,
      looseModelTerm,
    });
    const modelGradeNames = new Set(
      (modelGradeRows ?? []).map((row) => String(row.grade ?? "").toLowerCase()).filter(Boolean),
    );
    if (modelGradeNames.size && modelGradeNames.has(lowerValue)) {
      rows = await client.fetch<SearchRow[]>(gradeQuery, { term, altTerm, compactTerm, looseTerm });
    }
  }

  if (!rows.length) {
    rows = await client.fetch<SearchRow[]>(gradeQuery, { term, altTerm, compactTerm, looseTerm });
  }

  if (!rows.length) {
    rows = await client.fetch<SearchRow[]>(gradeFallback, { lowerValue, looseTerm });
  }

  return rows;
}

async function fetchTriggerTypeRows(
  client: SanityClient,
  search: SearchContext,
): Promise<SearchRow[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch<SearchRow[]>(triggerTypeQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch<SearchRow[]>(modelFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchRowsForField(
  client: SanityClient,
  field: string,
  search: SearchContext,
  rawModel: string,
): Promise<SearchRow[]> {
  switch (field) {
    case "PLATFORM":
      return fetchPlatformRows(client, search);
    case "MODEL":
      return fetchModelRows(client, search);
    case "DISCIPLINE":
      return fetchDisciplineRows(client, search);
    case "GAUGE":
      return fetchGaugeRows(client, search);
    case "GRADE":
      return fetchGradeRows(client, search, rawModel);
    case "TRIGGER_TYPE":
      return fetchTriggerTypeRows(client, search);
    default:
      return [];
  }
}

export async function GET(request: NextRequest) {
  return handleBuildInfoRequest(parseSearchParams(request));
}

export async function POST(request: NextRequest) {
  const params = await parseBody(request);
  return handleBuildInfoRequest(params);
}
