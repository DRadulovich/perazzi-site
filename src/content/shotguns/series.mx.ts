import type { ShotgunsSeriesEntry } from "@/types/catalog";
import type { FactoryAsset } from "@/types/content";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const asset = (
  id: string,
  sourceUrl: string,
  alt: string,
  aspectRatio = 16 / 9,
  caption?: string,
): FactoryAsset => ({
  id,
  kind: "image",
  url: `${fetchBase}/${encodeURIComponent(sourceUrl)}`,
  alt,
  caption,
  aspectRatio,
});

const heroMedia = asset(
  "mx-series-hero",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
  "MX shotguns lined along a velvet bench in Botticino",
  5 / 4,
);

const highlights = [
  {
    title: "Trigger units built to travel",
    body: "Each MX drop-out unit is tuned and serialized to the frame. Competitive shooters carry a second unit in case springs need refreshing mid-event.",
    media: asset(
      "mx-highlight-trigger-detail",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "Close view of engraved drop-out trigger housing",
      4 / 3,
    ),
  },
  {
    title: "Stock geometry shaped for vertical targets",
    body: "MX stocks are carved for a relaxed recoil line, helping bunker shooters stay poised through doubles.",
    media: asset(
      "mx-highlight-stock",
      "https://images.unsplash.com/photo-1517354153771-d19fbb86ba97",
      "MX stock profile showing cast and pitch adjustments",
      4 / 3,
    ),
  },
  {
    title: "Boss-style locking surfaces",
    body: "Dual locking lugs and hand-lapped shoulders keep the action closing with velvet smoothness long after the thousandth round.",
    media: asset(
      "mx-highlight-locking",
      "https://images.unsplash.com/photo-1520031441871-593c0bd66090",
      "Close view of Perazzi locking lugs being inspected under lamp light",
      4 / 3,
    ),
  },
];

export const series: ShotgunsSeriesEntry = {
  hero: {
    title: "MX Platform",
    subheading:
      "The original Perazzi drop-out trigger icon for Olympic trap and skeet.",
    media: heroMedia,
  },
  atAGlance: {
    triggerType: "Drop-out trigger",
    weightDistribution: "Neutral balance with responsive swing",
    typicalDisciplines: ["Trap", "Skeet"],
    links: [
      { label: "Explore MX Builds", href: "/shotguns/mx" },
      { label: "Fixed-trigger MX12", href: "/shotguns/mx#fixed" },
    ],
  },
  storyHtml:
    "<p>The MX story begins in 1968 when Ennio Mattarelli captured Olympic trap gold with a Perazzi drop-out trigger prototype. Every receiver and barrel set is still hand-mated in Botticino, allowing the trigger unit to release cleanly for maintenance without sacrificing lock-up precision.</p><p>Modern MX frames continue to balance speed and serviceability—favoring shooters who travel the ISSF or bunker circuits and need a calm, repeatable sight picture through 125 targets.</p>",
  highlights,
  disciplineMap: [
    {
      disciplineId: "trap",
      label: "Trap",
      href: "/shotguns/disciplines/trap",
      rationale:
        "Drop-out triggers and tuned POI ribs deliver 70/30 to 80/20 impact without disturbing balance.",
    },
    {
      disciplineId: "skeet",
      label: "Skeet",
      href: "/shotguns/disciplines/skeet",
      rationale:
        "Neutral swing weight helps maintain momentum on station four and jealously guards the sight picture.",
    },
  ],
  champion: {
    id: "champion-silvana",
    name: "Silvana Rossi",
    title: "Olympic Trap Champion",
    quote:
      "The MX lets me travel with confidence—service the trigger between rotations, then step back on the line with the same feel.",
    image: asset(
      "mx-champion",
      "https://images.unsplash.com/photo-1529688530647-93a450b72156",
      "Silvana Rossi resting her MX after a world cup final",
      3 / 4,
    ),
    href: "/heritage/champions",
  },
  relatedArticles: [
    {
      id: "article-mx-heritage",
      title: "Inside the MX trigger atelier",
      slug: "mx-trigger-atelier",
    },
    {
      id: "article-mx-travel",
      title: "Race kit packing for bunker shooters",
      slug: "bunker-race-kit",
    },
  ],
};
