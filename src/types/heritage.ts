import type { PortableTextBlock } from "@/sanity/queries/utils";
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
  summaryPortableText?: PortableTextBlock[];
  summaryHtml?: string;
  media?: HeritageEventMedia;
  links?: HeritageEventLink[];
  referenceLinks?: HeritageEventReferenceLinks;
};

export type HeritageEra = {
  id: HeritageEraId | string;
  label: string;
  yearRangeLabel?: string;
  startYear: number;
  endYear: number;
  backgroundSrc: string;
  overlayColor: string;
  overlayFrom?: string;
  overlayTo?: string;
  isOngoing?: boolean;
};

export type HeritageEraWithEvents = HeritageEra & {
  events: HeritageEvent[];
};

export type PerazziHeritageErasProps = {
  eras: HeritageEraWithEvents[];
  className?: string;
  sectionId?: string;
};

export interface HeritageHero {
  title: string;
  subheading?: string;
  background: FactoryAsset;
}

export interface HeritageIntro {
  eyebrow?: string;
  heading?: string;
  paragraphs?: string[];
  backgroundImage?: FactoryAsset;
}

export interface HeritageEraConfig {
  id: string;
  label: string;
  yearRangeLabel?: string;
  startYear: number;
  endYear: number;
  backgroundImage?: FactoryAsset;
  overlayFrom?: string;
  overlayTo?: string;
}

export interface WorkshopCta {
  heading?: string;
  intro?: string;
  bullets?: string[];
  closing?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export interface SerialLookupUi {
  heading?: string;
  subheading?: string;
  instructions?: string;
  primaryButtonLabel?: string;
  emptyStateText?: string;
  backgroundImage?: FactoryAsset;
}

export interface ChampionsIntro {
  heading?: string;
  intro?: string;
  bullets?: string[];
  closing?: string;
  chatLabel?: string;
  chatPrompt?: string;
}

export interface ChampionsGalleryUi {
  heading?: string;
  subheading?: string;
  backgroundImage?: FactoryAsset;
  championsLabel?: string;
  cardCtaLabel?: string;
}

export interface FactoryIntroBlock {
  heading?: string;
  intro?: string;
  bullets?: string[];
  closing?: string;
  chatLabel?: string;
  chatPrompt?: string;
}

export interface FactoryEssayUi {
  eyebrow?: string;
  heading?: string;
}

export interface OralHistoriesUi {
  eyebrow?: string;
  heading?: string;
  readLabel?: string;
  hideLabel?: string;
}

export interface RelatedSection {
  heading?: string;
  items: ArticleRef[];
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
  heritageIntro: HeritageIntro;
  erasConfig: HeritageEra[];
  workshopCta: WorkshopCta;
  serialLookupUi: SerialLookupUi;
  championsIntro: ChampionsIntro;
  championsGalleryUi: ChampionsGalleryUi;
  factoryIntroBlock: FactoryIntroBlock;
  factoryEssayUi: FactoryEssayUi;
  factoryIntroBody?: string;
  timeline: HeritageEvent[];
  champions: ChampionEvergreen[];
  factoryEssay: FactoryEssayItem[];
  oralHistories?: OralHistory[];
  oralHistoriesUi: OralHistoriesUi;
  relatedSection: RelatedSection;
  finalCta: {
    text: string;
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}
