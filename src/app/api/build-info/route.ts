import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { sanityClient as baseClient } from "../../../../sanity/client";
import { getSanityImageUrl } from "@/lib/sanityImage";

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
  _type == "models" && (
    s_model_name match $term ||
    s_model_name match $altTerm ||
    s_model_name match $compactTerm ||
    s_model_name match $looseTerm ||
    s_version_id match $term ||
    s_version_id match $altTerm ||
    s_version_id match $compactTerm ||
    s_version_id match $looseTerm
  )
]{
  _id,
  "title": s_model_name,
  "platform": s_platform_id->name,
  "gauges": [
    s_gauge_id_1->name,
    s_gauge_id_2->name,
    s_gauge_id_3->name,
    s_gauge_id_4->name,
    s_gauge_id_5->name
  ],
  "triggerTypes": [
    s_trigger_type_id_1,
    s_trigger_type_id_2
  ],
  "grade": s_grade_id->name,
  "image": s_image_local_path.asset
}[0...5]`;

const disciplineQuery = groq`*[_type == "discipline" && (name match $term || slug.current match $term)]{
  _id,
  "title": name,
  overview,
  "recommendedPlatforms": recommendedPlatforms[]->name,
  "popularModels": popularModels[]->s_model_name
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

const platformFallback = groq`*[_type == "platform"] | order(name asc)[0...10]{
  _id,
  "title": name,
  "description": lineage,
  "image": hero.asset
}`;

const modelFallback = groq`*[
  _type == "models" && (
    lower(s_model_name) == $lowerValue ||
    s_model_name match $looseTerm ||
    lower(s_version_id) == $lowerValue ||
    s_version_id match $looseTerm
  )
][0...10]{
  _id,
  "title": s_model_name,
  "platform": s_platform_id->name,
  "gauges": [
    s_gauge_id_1->name,
    s_gauge_id_2->name,
    s_gauge_id_3->name,
    s_gauge_id_4->name,
    s_gauge_id_5->name
  ],
  "triggerTypes": [
    s_trigger_type_id_1,
    s_trigger_type_id_2
  ],
  "grade": s_grade_id->name,
  "image": s_image_local_path.asset
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
  "popularModels": popularModels[]->s_model_name
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
  _type == "models" && (
    s_trigger_type_id_1 match $term ||
    s_trigger_type_id_1 match $altTerm ||
    s_trigger_type_id_1 match $compactTerm ||
    s_trigger_type_id_1 match $looseTerm ||
    s_trigger_type_id_2 match $term ||
    s_trigger_type_id_2 match $altTerm ||
    s_trigger_type_id_2 match $compactTerm ||
    s_trigger_type_id_2 match $looseTerm
  )
]{
  _id,
  "title": s_model_name,
  "platform": s_platform_id->name,
  "triggerTypes": [
    s_trigger_type_id_1,
    s_trigger_type_id_2
  ],
  "image": s_image_local_path.asset
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

export async function GET(request: NextRequest) {
  // Use API (non-CDN) client to avoid DNS/cache issues when resolving fresh data.
  const client = baseClient.withConfig({ useCdn: false });
  const searchParams = request.nextUrl.searchParams;
  const field = (searchParams.get("field") ?? "").trim().toUpperCase();
  const rawValue = (searchParams.get("value") ?? "").trim();
  const value = normalizeValue(field, rawValue);
  if (!field || !value) {
    return NextResponse.json({ error: "Missing field or value" }, { status: 400 });
  }
  const { term, altTerm, compactTerm, looseTerm } = buildTerms(value);
  const lowerValue = value.toLowerCase();
  try {
    let rows: any[] = [];
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
        rows = await client.fetch(gradeQuery, { term, altTerm, compactTerm, looseTerm });
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
