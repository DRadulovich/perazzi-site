import type { FactoryAsset } from "@/types/content";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const img = (
  id: string,
  source: string,
  alt: string,
  aspectRatio = 4 / 3,
) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const mosaic: FactoryAsset[] = [
  img(
    "mosaic-fitting",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    "Fitter guiding a client during mount practice",
  ),
  img(
    "mosaic-wood",
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
    "Walnut blanks laid out for selection",
  ),
  img(
    "mosaic-engraving",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    "Engraver working on receiver scrollwork",
    3 / 2,
  ),
  img(
    "mosaic-tunnel",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "Shooter patterning a gun inside the tunnel",
  ),
  img(
    "mosaic-demo",
    "https://images.unsplash.com/photo-1495567720989-cebdbdd97913",
    "Demo event shooters testing guns outdoors",
  ),
  img(
    "mosaic-lounge",
    "https://images.unsplash.com/photo-1493666438817-866a91353ca9",
    "Guests seated in the Perazzi lounge",
  ),
];
