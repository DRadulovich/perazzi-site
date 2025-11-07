import type { FittingStage } from "@/types/content";
import { factoryAssets } from "./factory-assets";

export const stages: FittingStage[] = [
  {
    id: "stage-fitting",
    order: 1,
    title: "Shoulder fit and try-gun session",
    body: "Capture cast, drop, and pitch with a lightweight try-gun before recording posture inside the Brescia atelier.",
    media: {
      ...(factoryAssets.find((asset) => asset.id === "asset-fitting") ??
        factoryAssets[0]),
    },
  },
  {
    id: "stage-tunnel",
    order: 2,
    title: "Tunnel test & regulation",
    body: "Live-fire testing underground aligns barrels, ribs, and balance weights to the athlete’s point of impact.",
    media: {
      ...(factoryAssets.find((asset) => asset.id === "asset-tunnel") ??
        factoryAssets[0]),
    },
  },
  {
    id: "stage-finish",
    order: 3,
    title: "Engraving & finishing studio",
    body: "Hand engraving, oil finishing, and final inspections reveal the signature Perazzi character.",
    media: {
      ...(factoryAssets.find((asset) => asset.id === "asset-engraving") ??
        factoryAssets[0]),
    },
  },
];
