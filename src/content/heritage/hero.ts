import type { HeritageHero } from "@/types/heritage";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

export const hero: HeritageHero = {
  title: "A Legacy Forged in Botticino",
  subheading:
    "Tracing the craft lineage from the first workshop sparks to today’s champions.",
  background: {
    id: "heritage-hero",
    kind: "image",
    url: `${fetchBase}/${encodeURIComponent(
      "https://images.unsplash.com/photo-1521579983015-d5296c2df4c1",
    )}`,
    alt: "Archival photo of Perazzi craftsmen shaping a shotgun stock in the Botticino workshop",
    aspectRatio: 16 / 9,
  },
};
