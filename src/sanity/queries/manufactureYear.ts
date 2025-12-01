import "server-only";

import { cache } from "react";
import { groq } from "next-sanity";

import { sanityFetch } from "../lib/live";

const manufactureYearQuery = groq`
  *[_type == "manufactureYear"] | order(year asc) {
    _id,
    year,
    proofCode,
    primaryRange{
      start,
      end
    },
    specialRanges[]{
      _key,
      model,
      rangeStart,
      rangeEnd
    }
  }
`;

type ManufactureYearDoc = {
  _id?: string;
  year?: number;
  proofCode?: string;
  primaryRange?: {
    start?: number;
    end?: number | null;
  } | null;
  specialRanges?: Array<{
    _key?: string;
    model?: string;
    rangeStart?: number;
    rangeEnd?: number | null;
  }> | null;
};

export type ManufactureYearMatch = {
  id: string;
  year: number;
  proofCode: string;
  matchType: "primary" | "model";
  model?: string;
  range: {
    start: number;
    end?: number;
  };
};

const fetchManufactureYears = cache(async () => {
  const { data } =
    (await sanityFetch<ManufactureYearDoc[] | null>({
      query: manufactureYearQuery,
      stega: true,
    }).catch(() => ({ data: null }))) ?? {};

  return (data ?? []).filter((doc): doc is Required<Pick<ManufactureYearDoc, "year" | "primaryRange">> & ManufactureYearDoc =>
    typeof doc?.year === "number" && typeof doc?.primaryRange?.start === "number",
  );
});

const normaliseModel = (model?: string) => model?.trim().toLowerCase() ?? null;

const isWithinRange = (serial: number, start?: number, end?: number | null) => {
  if (typeof start !== "number") return false;
  if (serial < start) return false;
  if (typeof end === "number" && serial > end) return false;
  return true;
};

export async function getManufactureYearBySerial(serial: number, model?: string): Promise<ManufactureYearMatch | null> {
  if (!Number.isFinite(serial)) return null;

  const serialNumber = Math.floor(Math.abs(serial));
  const modelFilter = normaliseModel(model);
  const docs = await fetchManufactureYears();

  for (const doc of docs) {
    const specialMatch = (doc.specialRanges ?? []).find((range) => {
      if (typeof range?.rangeStart !== "number") return false;
      if (modelFilter && range.model?.trim().toLowerCase() !== modelFilter) return false;
      return isWithinRange(serialNumber, range.rangeStart, range.rangeEnd ?? undefined);
    });

    if (specialMatch) {
      return {
        id: doc._id ?? `manufactureYear-${doc.year}`,
        year: doc.year,
        proofCode: doc.proofCode ?? "",
        matchType: "model",
        model: specialMatch.model,
        range: {
          start: specialMatch.rangeStart!,
          end: typeof specialMatch.rangeEnd === "number" ? specialMatch.rangeEnd : undefined,
        },
      };
    }

    const primaryStart = doc.primaryRange?.start;
    const primaryEnd = doc.primaryRange?.end;
    if (isWithinRange(serialNumber, primaryStart, primaryEnd ?? undefined)) {
      return {
        id: doc._id ?? `manufactureYear-${doc.year}`,
        year: doc.year,
        proofCode: doc.proofCode ?? "",
        matchType: "primary",
        range: {
          start: primaryStart as number,
          end: typeof primaryEnd === "number" ? primaryEnd : undefined,
        },
      };
    }
  }

  return null;
}
