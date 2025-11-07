import type { FactoryAsset } from "../types/content";

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

export interface HeritageEvent {
  id: string;
  date: string;
  title: string;
  summaryHtml: string;
  media?: FactoryAsset;
  links?: {
    articles?: ArticleRef[];
    platforms?: PlatformRef[];
    champions?: ChampionRef[];
  };
}

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
