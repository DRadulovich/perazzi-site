import type { Champion } from "@/types/content";
import { factoryAssets } from "./factory-assets";

export const champion: Champion = {
  id: "champion-sofia",
  name: "Sofia Conti",
  title: "2024 World Trap Champion",
  quote:
    "Perazzi captured my stance in the tunnel, so the MX High Tech feels calm even when the targets speed up.",
  image: {
    ...(factoryAssets.find((asset) => asset.id === "asset-champion") ??
      factoryAssets[0]),
  },
  article: {
    id: "article-sofia",
    title: "Tunnel testing with Sofia Conti",
    slug: "tunnel-testing-with-sofia",
  },
};
