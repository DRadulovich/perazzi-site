import type { FactoryAsset } from "@/types/content";

export type SanityImageResult = {
  alt?: string | null;
  caption?: string | null;
  decorative?: boolean | null;
  asset?: {
    _id?: string;
    url?: string;
    metadata?: {
      dimensions?: {
        aspectRatio?: number;
      };
    };
  } | null;
} | null;

export const imageWithMetaFields = `
  alt,
  caption,
  decorative,
  "asset": asset.asset->{
    _id,
    url,
    metadata{dimensions{aspectRatio}}
  }
`;

export const imageFields = `
  alt,
  caption,
  "asset": asset->{
    _id,
    url,
    metadata{dimensions{aspectRatio}}
  }
`;

export function mapImageResult(image: SanityImageResult): FactoryAsset | undefined {
  const asset = image?.asset;
  if (!asset?.url) return undefined;

  const altText = image?.decorative ? "" : image?.alt ?? "";

  return {
    id: asset._id ?? asset.url,
    kind: "image",
    url: asset.url,
    alt: altText,
    caption: image?.caption ?? undefined,
    aspectRatio: asset.metadata?.dimensions?.aspectRatio,
  };
}

export type PortableTextBlock = Record<string, unknown>;
