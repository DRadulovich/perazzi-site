import type { FactoryEssayItem } from "@/types/heritage";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const image = (
  id: string,
  source: string,
  alt: string,
  aspectRatio = 3 / 2,
  caption?: string,
) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
  caption,
});

export const factoryEssay: FactoryEssayItem[] = [
  {
    id: "essay-stockcarving",
    image: image(
      "factory-stock",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
      "Craftsman carving a shotgun stock by hand",
      3 / 2,
      "Stockmakers carve by eye, translating measurements into instinct.",
    ),
  },
  {
    id: "essay-engraving",
    image: image(
      "factory-engraving",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3",
      "Close view of an engraver chiseling fine details into metal",
      3 / 2,
      "Master engravers cut jewelry-grade scrolls into hardened steel.",
    ),
  },
  {
    id: "essay-triggerbench",
    image: image(
      "factory-trigger",
      "https://images.unsplash.com/photo-1580894906472-5f6eb6b2f814",
      "Organized workbench with shotgun trigger components",
      4 / 3,
      "Removable trigger groups are tuned on benches lined with spare sears.",
    ),
  },
  {
    id: "essay-tunnel",
    image: image(
      "factory-tunnel",
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6",
      "Perazzi proof tunnel with patterning screens",
      16 / 9,
      "The Botticino tunnel logs every pellet to dial regulation before delivery.",
    ),
  },
  {
    id: "essay-woodselection",
    image: image(
      "factory-wood",
      "https://images.unsplash.com/photo-1517582084769-8bdb50a3ded9",
      "Stacks of figured walnut blanks in storage racks",
      3 / 2,
      "Walnut vaults store decades of air-dried blanks, each tagged for density.",
    ),
  },
  {
    id: "essay-polishing",
    image: image(
      "factory-polish",
      "https://images.unsplash.com/photo-1527430253228-e93688616381",
      "Artisan polishing a shotgun barrel to a mirror finish",
      16 / 9,
      "Barrels are hand-lapped and polished before bluing.",
    ),
  },
  {
    id: "essay-fitting",
    image: image(
      "factory-fitting",
      "https://images.unsplash.com/photo-1510151890877-3a08fbf5b3fb",
      "Fitter guiding a shooter through a gun mount in the atelier",
      3 / 2,
      "Clients rehearse mount-and-move sequences during fittings.",
    ),
  },
  {
    id: "essay-proof",
    image: image(
      "factory-proof",
      "https://images.unsplash.com/photo-1519996529931-28324d5d51f4",
      "Spent shells on a bench after proof testing",
      4 / 3,
      "Proofed receivers and spent shells wait for final inspection.",
    ),
  },
];
