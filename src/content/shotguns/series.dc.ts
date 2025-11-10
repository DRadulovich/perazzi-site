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
  "dc-series-hero",
  "https://images.unsplash.com/photo-1517354153771-d19fbb86ba97",
  "DC platform resting on a walnut bench",
  5 / 4,
);

const highlights = [
  {
    title: "Removable trigger confidence",
    body: "The DC platform keeps the drop-out trigger ritual alive—carry a spare unit, service the one in hand, and never break rhythm.",
    media: asset(
      "dc-highlight-trigger",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "Drop-out trigger being inspected under soft light",
      4 / 3,
    ),
  },
  {
    title: "Ballast tailored per discipline",
    body: "Adjustable ballast and rib packages let you bias swing weight for bunker doubles or looping sporting chandelles.",
    media: asset(
      "dc-highlight-ballast",
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f",
      "Ballast kit and rib hardware staged beside a DC receiver",
      4 / 3,
    ),
  },
  {
    title: "Stock geometry with headroom",
    body: "DC stocks borrow from MX carving but allow deeper asymmetry for shooters who demand pronounced cast and drop.",
    media: asset(
      "dc-highlight-stock",
      "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
      "Close view of DC stock work on a fitting bench",
      4 / 3,
    ),
  },
];

export const series: ShotgunsSeriesEntry = {
  hero: {
    title: "DC Platform",
    subheading:
      "Detachable confidence for shooters who want serviceability without leaving the squad.",
    media: heroMedia,
  },
  atAGlance: {
    triggerType: "Drop-out trigger",
    weightDistribution: "Adjustable ballast toward the hinge pin",
    typicalDisciplines: ["Trap", "Sporting"],
    links: [
      { label: "Explore DC Builds", href: "/shotguns/dc" },
      { label: "Book a DC fitting", href: "/experience#fitting" },
    ],
  },
  storyHtml:
    "<p>The DC platform evolved alongside the MX family to give competitive shooters a second language for the same calm intent. Where MX established the archetype, DC distilled it—less ornament, more focus, and ballast schemes built for shooters who split time between bunker, sporting, and make-or-break finales.</p><p>It retains the drop-out trigger soul, but the rest is bare honesty: machined shoulders, deliberate mass in the center, and ribs that can shift point of impact without re-learning the gun. In short: the MX grammar with fewer adjectives and more verbs.</p>",
  highlights,
  disciplineMap: [
    {
      disciplineId: "trap",
      label: "Trap",
      href: "/shotguns/disciplines/trap",
      rationale:
        "Maintains bunker calm with removable triggers and POI adjustability.",
    },
    {
      disciplineId: "sporting",
      label: "Sporting",
      href: "/shotguns/disciplines/sporting",
      rationale:
        "Ballast kits and rib options keep the DC fluent across looping battues and long chandelles.",
    },
  ],
  champion: {
    id: "champion-dc",
    name: "Tom Seay",
    title: "Sporting & FITASC Champion",
    quote:
      "My DC gives me travel-time serviceability with the ballast I need for FITASC tempo.",
    image: asset(
      "dc-champion",
      "https://images.unsplash.com/photo-1529688607701-58db80dc1d3d",
      "Tom Seay reviewing course notes with his DC platform",
      3 / 4,
    ),
    href: "/tomseay",
  },
  relatedArticles: [
    {
      id: "article-dc-fitting",
      title: "Inside a DC ballast session",
      slug: "dc-ballast-session",
    },
    {
      id: "article-dc-trigger",
      title: "Keeping your spare trigger tournament-ready",
      slug: "dc-spare-trigger",
    },
  ],
};
