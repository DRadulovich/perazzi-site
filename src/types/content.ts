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

export interface HomeData {
  hero: {
    tagline: string;
    subheading?: string;
    background: FactoryAsset;
  };
  stages: FittingStage[];
  champion: Champion;
  finale: {
    text: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary?: { label: string; href: string };
  };
}
