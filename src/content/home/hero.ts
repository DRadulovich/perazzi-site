import type { HomeData } from "@/types/content";
import { factoryAssets } from "./factory-assets";

const heroAsset =
  factoryAssets.find((asset) => asset.id === "asset-hero") ??
  factoryAssets[0];

export const hero: HomeData["hero"] = {
  tagline: "Bespoke builds from Brescia",
  subheading:
    "Perazzi craftsmen guide every athlete through measurement, tunnel testing, and engraving to produce a singular shotgun.",
  background: {
    id: "hero-brescia-workshop",
    kind: "image",
    url: heroAsset.url,
    alt: heroAsset.alt,
    caption: heroAsset.caption,
    aspectRatio: heroAsset.aspectRatio ?? 16 / 9,
  },
};
