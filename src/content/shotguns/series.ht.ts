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
  "ht-series-hero",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
  "High Tech shotguns displayed with ballast kit on a slate wall",
  16 / 9,
);

const highlights = [
  {
    title: "Monocoque rigidity",
    body: "The High Tech action walls extend to the fore-end, widening the receiver and lowering felt recoil.",
    media: asset(
      "ht-highlight-action",
      "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
      "Cutaway view of the High Tech monocoque action walls",
      4 / 3,
    ),
  },
  {
    title: "Ballast kit for course tuning",
    body: "Interchangeable weights beneath the fore-end and in the stock help sporting shooters tailor swing momentum.",
    media: asset(
      "ht-highlight-ballast",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
      "Set of High Tech ballast weights on the gunsmith bench",
      4 / 3,
    ),
  },
  {
    title: "Adaptive rib geometry",
    body: "Modular ribs allow you to bias point of impact for rising trap targets or flatten the sight plane for sporting courses.",
    media: asset(
      "ht-highlight-rib",
      "https://images.unsplash.com/photo-1529927982845-6c4c1cfd5419",
      "Gunsmith adjusting a High Tech rib on the bench",
      4 / 3,
    ),
  },
];

export const series: ShotgunsSeriesEntry = {
  hero: {
    title: "High Tech Platform",
    subheading:
      "A wider, heavier frame that settles the sight plane for modern trap and sporting disciplines.",
    media: heroMedia,
  },
  atAGlance: {
    triggerType: "Drop-out trigger",
    weightDistribution: "Forward bias with modular ballast",
    typicalDisciplines: ["Trap", "Sporting"],
    links: [
      { label: "See ballast tuning guide", href: "/shotguns/ht#ballast" },
      { label: "Fixed-trigger HTS", href: "/shotguns/ht#fixed" },
    ],
  },
  storyHtml:
    "<p>High Tech was born from requests by Perazzi professionals who wanted the MX feel with more inertia. The monocoque action thickens the receiver walls and lengthens the hinge surfaces, creating a smoother recoil impulse while keeping triggers familiar.</p><p>Shooters can adjust the included ballast kit to bias the gun forward for bunker doubles or back toward the shoulder for wider sporting presentations.</p>",
  highlights,
  disciplineMap: [
    {
      disciplineId: "trap",
      label: "Trap",
      href: "/shotguns/disciplines/trap",
      rationale:
        "Added mass through the action keeps the rib calm during fast bunker doubles.",
    },
    {
      disciplineId: "sporting",
      label: "Sporting",
      href: "/shotguns/disciplines/sporting",
      rationale:
        "Ballast control and rib options support varied target sets without changing platforms.",
    },
  ],
  champion: {
    id: "champion-luca",
    name: "Luca Rossi",
    title: "ISSF Trap Finalist",
    quote:
      "High Tech gives me the MX trigger feel with a calmer sight picture—it soaks up recoil as the day heats up.",
    image: asset(
      "ht-champion",
      "https://images.unsplash.com/photo-1526976668912-1a811878dd37",
      "Luca Rossi adjusting ballast weights on his High Tech shotgun",
      3 / 4,
    ),
    href: "/heritage/champions",
  },
  relatedArticles: [
    {
      id: "article-ht-monocoque",
      title: "Why monocoque matters on the trap line",
      slug: "monocoque-matters",
    },
    {
      id: "article-ht-balance",
      title: "Setting ballast for sporting clays rhythms",
      slug: "sporting-ballast-guide",
    },
  ],
};
