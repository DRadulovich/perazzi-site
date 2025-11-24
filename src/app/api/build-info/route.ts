import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { sanityClient as baseClient } from "../../../../sanity/client";
import { getSanityImageUrl } from "@/lib/sanityImage";

const skipFields = new Set(["RIB_TAPER_20", "RIB_TAPER_28_410", "RIB_TAPER_SXS"]);

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

function normalizeValue(field: string, value: string) {
  if (field === "PLATFORM") {
    const upper = value.trim().toUpperCase();
    if (PLATFORM_ALIASES[upper]) return PLATFORM_ALIASES[upper];
  }
  return value;
}

function toPlainText(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  // Handle Sanity Portable Text blocks
  if (Array.isArray(value)) {
    return value
      .map((block) => {
        if (typeof block === "string") return block;
        if (block?.children && Array.isArray(block.children)) {
          return block.children.map((child: any) => child?.text ?? "").join("");
        }
        if (block?.text) return block.text;
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  if (typeof value === "object" && value.text) return String(value.text);
  return "";
}

function mapResult(rows: any[]) {
  return (rows ?? []).map((row) => ({
    id: row._id,
    title: row.title ?? "",
    description: toPlainText(row.description ?? row.overview ?? ""),
    platform: row.platform ?? null,
    gauges: (row.gauges ?? []).filter(Boolean),
    triggerTypes: (row.triggerTypes ?? []).filter(Boolean),
    grade: row.grade ?? null,
    recommendedPlatforms: row.recommendedPlatforms ?? [],
    popularModels: row.popularModels ?? [],
    imageUrl: row.image ? getSanityImageUrl(row.image, { width: 400, quality: 80 }) : null,
    fullImageUrl: row.image ? getSanityImageUrl(row.image, { width: 1600, quality: 90 }) : null,
  }));
}

function buildTerms(rawValue: string) {
  const trimmed = rawValue.trim();
  const lower = trimmed.toLowerCase();
  const altTerm = `${lower.replace(/[^a-z0-9]+/g, " ").trim()}*`;
  const compactTerm = `${lower.replace(/[^a-z0-9]+/g, "")}*`;
  const term = `${trimmed}*`;
  const looseTerm = `*${lower}*`;
  return { term, altTerm, compactTerm, looseTerm };
}

async function fetchConfiguratorItems(client: any, field: string, value: string) {
  const doc = await client.fetch(buildConfiguratorQuery);
  if (!doc) return [];
  const items = doc[field];
  if (!Array.isArray(items)) return [];
  const normField = field.trim().toUpperCase();
  const normValue = value.trim().toUpperCase();
  const filtered = items.filter((item: any) => {
    const stepId = (item?.stepId ?? normField).toUpperCase();
    const optionVal = (item?.optionValue ?? "").toUpperCase();
    return stepId === normField && optionVal === normValue;
  });
  return filtered.map((item: any, idx: number) => ({
    id: item._id ?? `${field}-${value}-${idx}`,
    title: item.optionValue ?? item.title ?? value,
    description: toPlainText(item.description ?? ""),
    platform: item.platform ?? null,
    grade: item.grade ?? null,
    gauges: item.gauge ? [item.gauge] : [],
    triggerTypes: item.trigger ? [item.trigger] : [],
    recommendedPlatforms: item.discipline ? [item.discipline] : [],
    popularModels: [],
    imageUrl: item.image ? getSanityImageUrl(item.image.asset ?? item.image, { width: 400, quality: 80 }) : null,
    fullImageUrl: item.image ? getSanityImageUrl(item.image.asset ?? item.image, { width: 1600, quality: 90 }) : null,
  }));
}

export async function GET(request: NextRequest) {
  // Use API (non-CDN) client to avoid DNS/cache issues when resolving fresh data.
  const client = baseClient.withConfig({ useCdn: false });
  const searchParams = request.nextUrl.searchParams;
  const field = (searchParams.get("field") ?? "").trim().toUpperCase();
  const rawValue = (searchParams.get("value") ?? "").trim();
  const rawModel = (searchParams.get("model") ?? "").trim();
  const normalizedValue = field === "PLATFORM" ? rawValue : normalizeValue(field, rawValue);
  if (!field || !normalizedValue) {
    return NextResponse.json({ error: "Missing field or value" }, { status: 400 });
  }
  const { term, altTerm, compactTerm, looseTerm } = buildTerms(normalizedValue);
  const lowerValue = normalizedValue.toLowerCase();
  try {
    let rows: any[] = [];
    // For most fields, try to serve from buildConfigurator first (except engraving and skipped taper fields).
    if (field === "ENGRAVING") {
      // handled later in switch
    } else if (skipFields.has(field)) {
      return NextResponse.json({ items: [] });
    } else if (field === "PLATFORM") {
      const configuratorItems = await fetchConfiguratorItems(client, field, rawValue);
      return NextResponse.json({ items: configuratorItems });
    } else {
      const configuratorItems = await fetchConfiguratorItems(client, field, normalizedValue);
      if (configuratorItems.length) {
        return NextResponse.json({ items: configuratorItems });
      }
    }
    switch (field) {
      case "PLATFORM":
        rows = await client.fetch(platformQuery, { term, altTerm, compactTerm, looseTerm });
        if (!rows.length) {
          rows = await client.fetch(platformFallback);
        }
        break;
      case "MODEL":
        rows = await client.fetch(modelQuery, { term, altTerm, compactTerm, looseTerm });
        if (!rows.length) {
          rows = await client.fetch(modelFallback, { lowerValue, looseTerm });
        }
        break;
      case "DISCIPLINE":
        rows = await client.fetch(disciplineQuery, { term, altTerm, compactTerm, looseTerm });
        if (!rows.length) {
          rows = await client.fetch(disciplineFallback, { lowerValue, looseTerm });
        }
        break;
      case "GAUGE":
        rows = await client.fetch(gaugeQuery, { term, altTerm, compactTerm, looseTerm });
        if (!rows.length) {
          rows = await client.fetch(gaugeFallback, { lowerValue, looseTerm });
        }
        break;
      case "GRADE":
        if (rawModel) {
          const { term: modelTerm, altTerm: altModelTerm, compactTerm: compactModelTerm, looseTerm: looseModelTerm } =
            buildTerms(rawModel);
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
        break;
      case "TRIGGER_TYPE":
        rows = await client.fetch(triggerTypeQuery, { term, altTerm, compactTerm, looseTerm });
        if (!rows.length) {
          rows = await client.fetch(modelFallback, { lowerValue, looseTerm });
        }
        break;
      default:
        rows = [];
    }
    return NextResponse.json({ items: mapResult(rows) });
  } catch (error) {
    console.error("Failed to fetch build info", error);
    return NextResponse.json({ error: "Failed to fetch build info" }, { status: 500 });
  }
}
