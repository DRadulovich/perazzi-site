import type { ImageLoaderProps } from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { urlFor } from "@/sanity/lib/image";

export type ImageBuilderOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

const SANITY_CDN_HOST = "cdn.sanity.io";

const getSanityAssetIdFromUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    if (url.hostname !== SANITY_CDN_HOST) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 4 || segments[0] !== "images") return null;
    const filename = segments[3];
    const lastDot = filename.lastIndexOf(".");
    if (lastDot <= 0) return null;
    const base = filename.slice(0, lastDot);
    const ext = filename.slice(lastDot + 1);
    if (!base || !ext) return null;
    return `image-${base}-${ext}`;
  } catch {
    return null;
  }
};

export const isSanityImageUrl = (value: string): boolean =>
  Boolean(getSanityAssetIdFromUrl(value));

const normalizeSanityImageSource = (
  source?: SanityImageSource | null,
): SanityImageSource | null => {
  if (!source) return null;
  if (typeof source === "string") {
    if (source.startsWith("image-")) return source;
    return getSanityAssetIdFromUrl(source);
  }
  const assetRef = (source as { asset?: { _ref?: string } }).asset?._ref;
  if (assetRef?.trim()) return source;
  const ref = (source as { _ref?: string })._ref;
  if (ref?.trim()) return source;
  return null;
};

export function hasValidSanityImage(source?: SanityImageSource | null): source is SanityImageSource {
  return Boolean(normalizeSanityImageSource(source));
}

export function getSanityImageUrl(
  source?: SanityImageSource | null,
  options: ImageBuilderOptions = {},
): string | null {
  const normalized = normalizeSanityImageSource(source);
  if (!normalized) return null;
  try {
    let builder = urlFor(normalized).auto("format");
    if (options.width) {
      builder = builder.width(options.width);
    }
    if (options.height) {
      builder = builder.height(options.height);
    }
    if (options.quality) {
      builder = builder.quality(options.quality);
    }
    return builder.url();
  } catch {
    return null;
  }
}

export function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  return getSanityImageUrl(src, { width, quality }) ?? src;
}
