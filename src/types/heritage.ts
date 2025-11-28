import type { FactoryAsset } from "./content";

export interface ArticleRef {
  id: string;
  title: string;
  slug: string;
}

export interface PlatformRef {
  id: string;
  slug: string;
  title: string;
}

export interface ChampionRef {
  id: string;
  name: string;
}

export type HeritageEraId =
  | "founding"
  | "olympic_awakening"
  | "age_of_champions"
  | "bespoke_pilgrimage"
  | "living_atelier";

export type HeritageEventLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type HeritageEventMedia = {
  url: string;
  alt?: string | null;
  aspectRatio?: number;
  caption?: string | null;
  id?: string;
  kind?: string;
};

type HeritageEventReferenceLinks = {
  articles?: ArticleRef[];
  platforms?: PlatformRef[];
  champions?: ChampionRef[];
};

export type HeritageEvent = {
  id: string;
  date: string;
  title: string;
  summaryHtml: string;
  media?: HeritageEventMedia;
  links?: HeritageEventLink[];
  referenceLinks?: HeritageEventReferenceLinks;
};

export type HeritageEra = {
  id: HeritageEraId;
  label: string;
  startYear: number;
  endYear: number;
  backgroundSrc: string;
  overlayColor: string;
};

export type HeritageEraWithEvents = HeritageEra & {
  events: HeritageEvent[];
};

export type PerazziHeritageErasProps = {
  eras: HeritageEraWithEvents[];
  className?: string;
};

export interface HeritageHero {
  title: string;
  subheading?: string;
  background: FactoryAsset;
}

export interface FactoryEssayItem {
  id: string;
  image: FactoryAsset;
}

export interface OralHistory {
  id: string;
  title: string;
  quote: string;
  attribution: string;
  audioSrc?: string;
  transcriptHtml?: string;
  image?: FactoryAsset;
}

export interface ChampionEvergreen {
  id: string;
  name: string;
  title: string;
  quote: string;
  image: FactoryAsset;
  article?: ArticleRef;
  disciplines?: string[];
  platforms?: string[];
  bio?: string;
  resume?: {
    winOne?: string;
    winTwo?: string;
    winThree?: string;
  };
}

export interface HeritagePageData {
  hero: HeritageHero;
  timeline: HeritageEvent[];
  champions: ChampionEvergreen[];
  factoryIntroHtml?: string;
  factoryEssay: FactoryEssayItem[];
  oralHistories?: OralHistory[];
  related?: ArticleRef[];
  finalCta: {
    text: string;
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}
