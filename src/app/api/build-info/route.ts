import type { SanityClient } from "@sanity/client";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { sanityClient as baseClient } from "../../../../sanity/client";
import { getSanityImageUrl, hasValidSanityImage } from "@/lib/sanityImage";

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

const buildConfiguratorQuery = groq`*[_type == "buildConfigurator"][0]{
  FRAME_SIZE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  PLATFORM[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  DISCIPLINE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  MODEL[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_TYPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  GRADE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  ENGRAVING[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  ACTION_FINISH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  GAUGE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  LENGTH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  WEIGHT[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  CHOKE_TYPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  B1_CHOKE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  B2_CHOKE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  CHAMBER_LENGTH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BORE_DIAMETER[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  MONOBLOC[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  SIDERIBS_LENGTH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  SIDERIBS_VENTILATION[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_FRONT[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_FRONT_COLOR[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_FRONT_STYLE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_MID[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TYPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_HEIGHT[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_STYLE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TRAMLINE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TRAMLINE_SIZE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TAPER_12[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_GROUP_SPRINGS[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_GROUP_SELECTIVE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_GROUP_SAFETY[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  WOOD_UPGRADE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  FOREND_SHAPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  FOREND_CHECKER[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  STOCK_PROFILE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
}`;

const platformQuery = groq`*[
  _type == "platform" && (
    name match $term ||
    name match $altTerm ||
    name match $compactTerm ||
    name match $looseTerm ||
    slug.current match $term ||
    slug.current match $altTerm ||
    slug.current match $compactTerm ||
    slug.current match $looseTerm
  )
]{
  _id,
  "title": name,
  "description": lineage,
  "image": hero.asset
}[0...5]`;

const modelQuery = groq`*[
  _type == "allModels" && (
    name match $term ||
    name match $altTerm ||
    name match $compactTerm ||
    name match $looseTerm ||
    slug.current match $term ||
    slug.current match $altTerm ||
    slug.current match $compactTerm ||
    slug.current match $looseTerm ||
    baseModel match $term ||
    baseModel match $altTerm ||
    baseModel match $compactTerm ||
    baseModel match $looseTerm
  )
]{
  _id,
  "title": name,
  "platform": platform->name,
  "gauges": gauges,
  "triggerTypes": trigger.type ? [trigger.type] : [],
  "grade": grade->name,
  "image": coalesce(image.asset, null)
}[0...5]`;

const disciplineQuery = groq`*[_type == "discipline" && (name match $term || slug.current match $term)]{
  _id,
  "title": name,
  overview,
  "recommendedPlatforms": recommendedPlatforms[]->name,
  "popularModels": []
}[0...5]`;

const gaugeQuery = groq`*[_type == "gauge" && (name match $term || name match $altTerm || name match $compactTerm || name match $looseTerm)]{
  _id,
  "title": name,
  "description": handlingNotes
}[0...5]`;

const gradeQuery = groq`*[
  _type == "grade" && (
    name match $term ||
    name match $altTerm ||
    name match $compactTerm ||
    name match $looseTerm
  )
]{
  _id,
  "title": name,
  "description": description,
  "image": hero.asset
}[0...5]`;

const modelGradeQuery = groq`*[
  _type == "allModels" && (
    name match $modelTerm ||
    name match $altModelTerm ||
    name match $compactModelTerm ||
    name match $looseModelTerm ||
    slug.current match $modelTerm ||
    slug.current match $altModelTerm ||
    slug.current match $compactModelTerm ||
    slug.current match $looseModelTerm
  )
][0...3]{
  "grade": grade->name
}`;

const platformFallback = groq`*[_type == "platform"] | order(name asc)[0...10]{
  _id,
  "title": name,
  "description": lineage,
  "image": hero.asset
}`;

const modelFallback = groq`*[
  _type == "allModels" && (
    lower(name) == $lowerValue ||
    name match $looseTerm ||
    slug.current match $looseTerm ||
    lower(baseModel) == $lowerValue
  )
][0...10]{
  _id,
  "title": name,
  "platform": platform->name,
  "gauges": gauges,
  "triggerTypes": trigger.type ? [trigger.type] : [],
  "grade": grade->name,
  "image": coalesce(image.asset, null)
}`;

const disciplineFallback = groq`*[
  _type == "discipline" && (
    lower(name) == $lowerValue ||
    name match $looseTerm ||
    slug.current match $looseTerm
  )
][0...10]{
  _id,
  "title": name,
  overview,
  "recommendedPlatforms": recommendedPlatforms[]->name,
  "popularModels": []
}`;

const gaugeFallback = groq`*[
  _type == "gauge" && (
    lower(name) == $lowerValue ||
    name match $looseTerm
  )
][0...10]{
  _id,
  "title": name,
  "description": handlingNotes
}`;

const gradeFallback = groq`*[
  _type == "grade" && (
    lower(name) == $lowerValue ||
    name match $looseTerm
  )
][0...10]{
  _id,
  "title": name,
  "description": description,
  "image": hero.asset
}`;

const triggerTypeQuery = groq`*[
  _type == "allModels" && (
    trigger.type match $term ||
    trigger.type match $altTerm ||
    trigger.type match $compactTerm ||
    trigger.type match $looseTerm
  )
]{
  _id,
  "title": name,
  "platform": platform->name,
  "triggerTypes": trigger.type ? [trigger.type] : [],
  "image": coalesce(image.asset, null)
}[0...5]`;

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
      return asset as SanityImageSource;
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

function toPlainText(value: PortableTextValue): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  // Handle Sanity Portable Text blocks
  if (Array.isArray(value)) {
    return value
      .map((block) => {
        if (typeof block === "string") return block;
        if (Array.isArray(block.children)) {
          return block.children.map((child: PortableTextChild) => child?.text ?? "").join("");
        }
        if (block.text) return block.text;
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  if (value && typeof value === "object" && "text" in value && value.text) {
    return String(value.text);
  }
  return "";
}

function mapResult(rows: SearchRow[]): BuildInfoItem[] {
  return (rows ?? []).map((row, idx) => {
    const imageSource = resolveImageSource(row.image);
    return {
      id: row._id ?? `row-${idx}`,
      title: row.title ?? "",
      description: toPlainText(row.description ?? row.overview ?? ""),
      platform: row.platform ?? null,
      gauges: (row.gauges ?? []).filter(Boolean).map(String),
      triggerTypes: (row.triggerTypes ?? []).filter(Boolean).map(String),
      grade: row.grade ?? null,
      recommendedPlatforms: row.recommendedPlatforms ?? [],
      popularModels: row.popularModels ?? [],
      imageUrl: imageSource ? getSanityImageUrl(imageSource, { width: 400, quality: 80 }) : null,
      fullImageUrl: imageSource ? getSanityImageUrl(imageSource, { width: 1600, quality: 90 }) : null,
    };
  });
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
  const field = (searchParams.get("field") ?? "").trim().toUpperCase();
  const rawValue = (searchParams.get("value") ?? "").trim();
  const rawModel = (searchParams.get("model") ?? "").trim();
  const normalizedValue = field === "PLATFORM" ? rawValue : normalizeValue(field, rawValue);
  return { field, rawValue, rawModel, normalizedValue };
}

function buildSearchContext(normalizedValue: string) {
  const { term, altTerm, compactTerm, looseTerm } = buildTerms(normalizedValue);
  const lowerValue = normalizedValue.toLowerCase();
  return { term, altTerm, compactTerm, looseTerm, lowerValue };
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
  client: any,
  search: {
    term: string;
    altTerm: string;
    compactTerm: string;
    looseTerm: string;
  },
): Promise<any[]> {
  const { term, altTerm, compactTerm, looseTerm } = search;
  let rows = await client.fetch(platformQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch(platformFallback);
  }
  return rows;
}

async function fetchModelRows(
  client: any,
  search: {
    term: string;
    altTerm: string;
    compactTerm: string;
    looseTerm: string;
    lowerValue: string;
  },
): Promise<any[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch(modelQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch(modelFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchDisciplineRows(
  client: any,
  search: {
    term: string;
    altTerm: string;
    compactTerm: string;
    looseTerm: string;
    lowerValue: string;
  },
): Promise<any[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch(disciplineQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch(disciplineFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchGaugeRows(
  client: any,
  search: {
    term: string;
    altTerm: string;
    compactTerm: string;
    looseTerm: string;
    lowerValue: string;
  },
): Promise<any[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch(gaugeQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch(gaugeFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchGradeRows(
  client: any,
  search: {
    term: string;
    altTerm: string;
    compactTerm: string;
    looseTerm: string;
    lowerValue: string;
  },
  rawModel: string,
): Promise<any[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows: any[] = [];

  if (rawModel) {
    const {
      term: modelTerm,
      altTerm: altModelTerm,
      compactTerm: compactModelTerm,
      looseTerm: looseModelTerm,
    } = buildTerms(rawModel);
    const modelGradeRows = await client.fetch(modelGradeQuery, {
      modelTerm,
      altModelTerm,
      compactModelTerm,
      looseModelTerm,
    });
    const modelGradeNames = new Set(
      (modelGradeRows ?? [])
        .map((row: any) => String(row.grade ?? "").toLowerCase())
        .filter(Boolean),
    );
    if (modelGradeNames.size && modelGradeNames.has(lowerValue)) {
      rows = await client.fetch(gradeQuery, { term, altTerm, compactTerm, looseTerm });
    }
  }

  if (!rows.length) {
    rows = await client.fetch(gradeQuery, { term, altTerm, compactTerm, looseTerm });
  }

  if (!rows.length) {
    rows = await client.fetch(gradeFallback, { lowerValue, looseTerm });
  }

  return rows;
}

async function fetchTriggerTypeRows(
  client: any,
  search: {
    term: string;
    altTerm: string;
    compactTerm: string;
    looseTerm: string;
    lowerValue: string;
  },
): Promise<any[]> {
  const { term, altTerm, compactTerm, looseTerm, lowerValue } = search;
  let rows = await client.fetch(triggerTypeQuery, { term, altTerm, compactTerm, looseTerm });
  if (!rows.length) {
    rows = await client.fetch(modelFallback, { lowerValue, looseTerm });
  }
  return rows;
}

async function fetchRowsForField(
  client: any,
  field: string,
  search: {
    term: string;
    altTerm: string;
    compactTerm: string;
    looseTerm: string;
    lowerValue: string;
  },
  rawModel: string,
): Promise<any[]> {
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
  // Use API (non-CDN) client to avoid DNS/cache issues when resolving fresh data.
  const client = baseClient.withConfig({ useCdn: false });
  const { field, rawValue, rawModel, normalizedValue } = parseSearchParams(request);

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
