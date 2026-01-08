import type { PortableTextBlock } from "@/sanity/queries/utils";
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
  overviewHtml?: string;
  overviewPortableText?: PortableTextBlock[];
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
  platformGridUi?: {
    heading?: string;
    subheading?: string;
    background?: FactoryAsset;
    chatLabelTemplate?: string;
    chatPayloadTemplate?: string;
    cardFooterTemplate?: string;
  };
  platforms: Platform[];
  triggerExplainer: {
    title: string;
    subheading?: string;
    copyPortableText?: PortableTextBlock[];
    copyHtml?: string;
    diagram: FactoryAsset;
    background?: FactoryAsset;
    links: Array<{ label: string; href: string }>;
  };
  disciplineFitAdvisory?: {
    eyebrow?: string;
    heading?: string;
    paragraphs?: string[];
    chatLabel?: string;
    chatPrompt?: string;
    rightTitle?: string;
    bullets?: Array<{ code?: string; label?: string; description?: string }>;
  };
  disciplines: Array<
    Pick<
      DisciplineSummary,
      "id"
      | "name"
      | "overviewHtml"
      | "overviewPortableText"
      | "recommendedPlatforms"
      | "popularModels"
      | "champion"
      | "hero"
    >
  >;
  disciplineRailUi?: {
    heading?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  gaugesTeaser: { href: string; copy: string; bullets: string[] };
  gaugeSelectionAdvisory?: {
    heading?: string;
    intro?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    rightTitle?: string;
    bullets?: string[];
    closing?: string;
  };
  triggerChoiceAdvisory?: {
    heading?: string;
    intro?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    rightTitle?: string;
    bullets?: string[];
    closing?: string;
  };
  gradesTeaser: {
    href: string;
    copy: string;
    engravingTile: FactoryAsset;
    woodTile: FactoryAsset;
  };
  engravingCarouselUi?: {
    heading?: string;
    subheading?: string;
    background?: FactoryAsset;
    ctaLabel?: string;
    categoryLabels?: string[];
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
