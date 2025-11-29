import type { FactoryAsset } from "./content";

export type PlatformKind = "MX" | "MX12" | "HT" | "HTS" | "TM";

export interface PlatformHighlight {
  title: string;
  body: string;
  media: FactoryAsset;
}

export interface Platform {
  id: string;
  slug: string;
  name: string;
  kind: PlatformKind;
  tagline: string;
  lineageHtml?: string;
  hero: FactoryAsset;
  hallmark: string;
  weightDistribution?: string;
  typicalDisciplines: string[];
  disciplineRefs?: Array<{ id: string; name?: string }>;
  fixedCounterpart?: {
    id: string;
    slug: string;
    name: string;
  };
  detachableCounterpart?: {
    id: string;
    slug: string;
    name: string;
  };
  champion?: {
    name?: string;
    title?: string;
    quote?: string;
    image?: FactoryAsset;
    resume?: {
      winOne?: string;
      winTwo?: string;
      winThree?: string;
    };
  };
  highlights: PlatformHighlight[];
}

export interface DisciplineSummary {
  id: string;
  name: string;
  overviewHtml: string;
  recommendedPlatforms: string[];
  popularModels?: Array<{ id: string; idLegacy?: string; name?: string; hero?: FactoryAsset }>;
  recipe: {
    poiRange: string;
    barrelLengths: string;
    ribNotes: string;
  };
  hero?: FactoryAsset;
  champion?: {
    id: string;
    name: string;
    title: string;
    quote: string;
    image: FactoryAsset;
  };
  articles?: Array<{ id: string; title: string; slug: string }>;
}

export interface GaugeFAQItem {
  q: string;
  a: string;
}

export interface GaugeInfo {
  id: string;
  label: string;
  description: string;
  handlingNotes: string;
  commonBarrels: string[];
  typicalDisciplines: string[];
  faq?: GaugeFAQItem[];
}

export interface GradeOption {
  id: string;
  title: string;
  description: string;
}

export interface GradeSeries {
  id: string;
  name: string;
  description: string;
  gallery: FactoryAsset[];
  provenanceHtml?: string;
  options?: GradeOption[];
}

export interface ShotgunsLandingData {
  hero: {
    title: string;
    subheading?: string;
    background: FactoryAsset;
  };
  platforms: Platform[];
  triggerExplainer: {
    title: string;
    copyHtml: string;
    diagram: FactoryAsset;
    links: Array<{ label: string; href: string }>;
  };
  disciplines: Array<
    Pick<
      DisciplineSummary,
      "id" | "name" | "overviewHtml" | "recommendedPlatforms" | "popularModels" | "champion" | "hero"
    >
  >;
  gaugesTeaser: { href: string; copy: string; bullets: string[] };
  gradesTeaser: {
    href: string;
    copy: string;
    engravingTile: FactoryAsset;
    woodTile: FactoryAsset;
  };
}

export interface ShotgunsSeriesEntry {
  hero: { title: string; subheading?: string; media: FactoryAsset };
  atAGlance: {
    triggerType: string;
    weightDistribution: string;
    typicalDisciplines: string[];
    links?: Array<{ label: string; href: string }>;
  };
  storyHtml: string;
  highlights: PlatformHighlight[];
  disciplineMap: Array<{
    disciplineId: string;
    label: string;
    rationale: string;
    href: string;
  }>;
  champion?: {
    id: string;
    name?: string;
    title?: string;
    quote: string;
    image: FactoryAsset;
    href?: string;
    fallbackText?: string;
  };
  relatedArticles?: Array<{ id: string; title: string; slug: string }>;
}

export interface ShotgunsSectionData {
  landing: ShotgunsLandingData;
  series: Record<string, ShotgunsSeriesEntry>;
  disciplines: Record<string, DisciplineSummary>;
  gauges: GaugeInfo[];
  grades: GradeSeries[];
}
