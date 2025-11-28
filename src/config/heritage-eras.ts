import type { HeritageEvent } from "@/types/heritage";

export type HeritageEraId =
  | "founding"
  | "olympic_awakening"
  | "age_of_champions"
  | "bespoke_pilgrimage"
  | "living_atelier";

export type HeritageOverlayMood =
  | "warm_ink_sepia"
  | "cool_steel_gold"
  | "balanced_ink"
  | "warm_luminous"
  | "deep_ink_red";

export type HeritageEra = {
  id: HeritageEraId;
  label: string;
  startYear: number;
  endYear: number | null;
  backgroundSrc: string;
  overlayMood: HeritageOverlayMood;
  overlayColor: string;
};

export const HERITAGE_ERAS: HeritageEra[] = [
  {
    id: "founding",
    label: "The Workshop in Brescia",
    startYear: 1957,
    endYear: 1963,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-1-founding.jpg",
    overlayMood: "warm_ink_sepia",
    overlayColor: "rgba(19, 10, 4, 0.7)",
  },
  {
    id: "olympic_awakening",
    label: "Olympic Awakening",
    startYear: 1964,
    endYear: 1979,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-2-olympic.jpg",
    overlayMood: "cool_steel_gold",
    overlayColor: "rgba(8, 16, 24, 0.7)",
  },
  {
    id: "age_of_champions",
    label: "The Age of Champions",
    startYear: 1980,
    endYear: 1999,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-3-champions.jpg",
    overlayMood: "balanced_ink",
    overlayColor: "rgba(9, 9, 11, 0.7)",
  },
  {
    id: "bespoke_pilgrimage",
    label: "The Bespoke Pilgrimage",
    startYear: 2000,
    endYear: 2012,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-4-bespoke.jpg",
    overlayMood: "warm_luminous",
    overlayColor: "rgba(24, 12, 8, 0.68)",
  },
  {
    id: "living_atelier",
    label: "The Living Atelier",
    startYear: 2013,
    endYear: null,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg",
    overlayMood: "deep_ink_red",
    overlayColor: "rgba(8, 6, 10, 0.78)",
  },
];

export function getEraForYear(year: number): HeritageEra | null {
  if (Number.isNaN(year)) return null;

  return (
    HERITAGE_ERAS.find((era) => {
      const afterStart = year >= era.startYear;
      const beforeEnd = era.endYear == null ? true : year <= era.endYear;
      return afterStart && beforeEnd;
    }) ?? null
  );
}

export function getEraIdForYear(year: number): HeritageEraId | null {
  const era = getEraForYear(year);
  return era ? era.id : null;
}

export function getEraForEvent(event: HeritageEvent): HeritageEra | null {
  const year = parseInt(event.date, 10);
  return getEraForYear(year);
}

export function getEraIdForEvent(event: HeritageEvent): HeritageEraId | null {
  const era = getEraForEvent(event);
  return era ? era.id : null;
}
