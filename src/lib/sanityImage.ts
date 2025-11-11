import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { urlFor } from "@/sanity/lib/image";

export type ImageBuilderOptions = {
  width?: number;
  quality?: number;
};

export function hasValidSanityImage(source?: SanityImageSource | null): source is SanityImageSource {
  if (!source) return false;
  if (typeof source === "string") {
    return source.startsWith("image-");
  }
  if (typeof source === "object") {
    const assetRef = (source as { asset?: { _ref?: string } }).asset?._ref;
    if (assetRef && assetRef.trim()) {
      return true;
    }
    const ref = (source as { _ref?: string })._ref;
    if (ref && ref.trim()) {
      return true;
    }
  }
  return false;
}

export function getSanityImageUrl(
  source?: SanityImageSource | null,
  options: ImageBuilderOptions = {},
): string | null {
  if (!hasValidSanityImage(source)) return null;
  try {
    let builder = urlFor(source);
    if (options.width) {
      builder = builder.width(options.width);
    }
    if (options.quality) {
      builder = builder.quality(options.quality);
    }
    return builder.url();
  } catch {
    return null;
  }
}
