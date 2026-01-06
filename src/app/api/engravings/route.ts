import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { sanityClient as baseClient } from "../../../../sanity/client";

type EngravingRow = {
  _id: string;
  engravingId?: string | null;
  engravingSide?: string | null;
  gradeName?: string | null;
  image?: unknown;
  imageAlt?: string | null;
};

const engravingByIdQuery = groq`*[_type == "engravings" && engraving_id match $pattern]{
  _id,
  "engravingId": engraving_id,
  "engravingSide": engraving_side,
  "gradeName": engraving_grade->name,
  "image": engraving_photo.asset,
  "imageAlt": coalesce(engraving_photo.alt, "Engraving " + engraving_id + " " + engraving_side),
} | order(engraving_grade->name asc, engraving_id asc, engraving_side asc)[0...50]`;

const engravingByGradeQuery = groq`*[
  _type == "engravings" &&
  defined(engraving_grade->name) &&
  (engraving_grade->name match $gradePattern || lower(engraving_grade->name) == $gradeLower)
]{
  _id,
  "engravingId": engraving_id,
  "engravingSide": engraving_side,
  "gradeName": engraving_grade->name,
  "image": engraving_photo.asset,
  "imageAlt": coalesce(engraving_photo.alt, "Engraving " + engraving_id + " " + engraving_side),
} | order(engraving_grade->name asc, engraving_id asc, engraving_side asc)[0...50]`;

type EngravingRequestInputs = {
  id: string;
  grade: string;
};

const normalizeInputs = (input: { id?: unknown; grade?: unknown }): EngravingRequestInputs => ({
  id: typeof input.id === "string" ? input.id.trim() : "",
  grade: typeof input.grade === "string" ? input.grade.trim() : "",
});

const parseSearchParams = (request: NextRequest): EngravingRequestInputs => {
  const searchParams = request.nextUrl.searchParams;
  return normalizeInputs({
    id: searchParams.get("id") ?? "",
    grade: searchParams.get("grade") ?? "",
  });
};

const parseBody = async (request: NextRequest): Promise<EngravingRequestInputs> => {
  try {
    const body = (await request.json()) as { id?: unknown; grade?: unknown };
    return normalizeInputs(body);
  } catch {
    return { id: "", grade: "" };
  }
};

const handleEngravingRequest = async ({ id, grade }: EngravingRequestInputs) => {
  // Use API client to avoid CDN issues and ensure access to latest published content.
  const client = baseClient.withConfig({ useCdn: false });
  if (!id && !grade) {
    return NextResponse.json({ error: "Missing id or grade query param" }, { status: 400 });
  }
  try {
    const rows = await (() => {
      if (grade) {
        const gradePattern = `${grade}*`;
        const gradeLower = grade.toLowerCase();
        return client.fetch<EngravingRow[]>(engravingByGradeQuery, { gradePattern, gradeLower });
      }
      const pattern = `${id}*`;
      return client.fetch<EngravingRow[]>(engravingByIdQuery, { pattern });
    })();

    const engravings = (rows ?? []).map((row: EngravingRow) => ({
      _id: row._id,
      engravingId: row.engravingId ?? "",
      engravingSide: row.engravingSide ?? "",
      gradeName: row.gradeName ?? "",
      image: row.image ?? null,
      imageAlt: row.imageAlt ?? `Engraving ${row.engravingId ?? ""}`,
    }));
    return NextResponse.json({ engravings });
  } catch (error) {
    console.error("Failed to fetch engravings", error);
    return NextResponse.json({ error: "Failed to fetch engravings" }, { status: 500 });
  }
};

export async function GET(request: NextRequest) {
  return handleEngravingRequest(parseSearchParams(request));
}

export async function POST(request: NextRequest) {
  const inputs = await parseBody(request);
  return handleEngravingRequest(inputs);
}
