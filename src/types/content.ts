export interface FactoryAsset {
  id: string;
  kind: "image" | "video";
  url: string;
  alt: string;
  caption?: string;
  aspectRatio?: number;
}

export interface FittingStage {
  id: string;
  order: number;
  title: string;
  body: string;
  media: FactoryAsset;
}

export interface Champion {
  id: string;
  name: string;
  title: string;
  quote: string;
  image: FactoryAsset;
  article?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface HomeGuidePlatform {
  code: "ht" | "mx" | "tm";
  name: string;
  description: string;
}

export interface HomeData {
  hero: {
    tagline: string;
    subheading?: string;
    background: FactoryAsset;
  };
  heroCtas: {
    primaryLabel: string;
    primaryPrompt: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  timelineFraming: {
    title: string;
    eyebrow: string;
    instructions: string;
    alternateTitle: string;
    background: FactoryAsset;
  };
  guideSection: {
    title: string;
    intro: string;
    chatLabel: string;
    chatPrompt: string;
    linkLabel: string;
    linkHref: string;
    platforms: HomeGuidePlatform[];
    closing: string;
  };
  stages: FittingStage[];
  champion: Champion;
  marqueeUi: {
    eyebrow: string;
    background: FactoryAsset;
  };
  finale: {
    text: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary?: { label: string; href: string };
  };
}
