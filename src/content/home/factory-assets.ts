import type { FactoryAsset } from "@/types/content";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "pwebsite";
const fetchBase = `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto`;

const fetchImage = (source: string) =>
  `${fetchBase}/${encodeURIComponent(source)}`;

export const factoryAssets: FactoryAsset[] = [
  {
    id: "asset-fitting",
    kind: "image",
    url: fetchImage(
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    ),
    alt: "Master fitter adjusting a shotgun during a measurement session",
    caption: "Measurement sets the tone for a balanced gun.",
    aspectRatio: 4 / 3,
  },
  {
    id: "asset-engraving",
    kind: "image",
    url: fetchImage(
      "https://images.unsplash.com/photo-1529927982845-6c4c1cfd5419",
    ),
    alt: "Engraver chiseling scrollwork into a receiver",
    caption: "Scrollwork is paced to the owner’s story.",
    aspectRatio: 4 / 3,
  },
  {
    id: "asset-tunnel",
    kind: "image",
    url: fetchImage(
      "https://images.unsplash.com/photo-1502877338535-766e1452684a",
    ),
    alt: "Shooter patterning a shotgun inside an underground tunnel range",
    caption: "Tunnel proofing aligns barrels and trigger timing.",
    aspectRatio: 4 / 3,
  },
  {
    id: "asset-champion",
    kind: "image",
    url: fetchImage(
      "https://images.unsplash.com/photo-1504593811423-6dd665756598",
    ),
    alt: "Champion raising a shotgun on the range",
    aspectRatio: 3 / 4,
  },
  {
    id: "asset-hero",
    kind: "image",
    url: fetchImage(
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443",
    ),
    alt: "Low light gleam off engraved Perazzi steel and walnut",
    caption: "Quiet light across engraved steel hints at the bespoke process.",
    aspectRatio: 16 / 9,
  },
];
