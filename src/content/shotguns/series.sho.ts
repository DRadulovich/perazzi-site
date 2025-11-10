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
  "sho-series-hero",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
  "SHO sidelock engraving reflecting studio light",
  5 / 4,
);

const highlights = [
  {
    title: "Hand-cut sidelock engraving",
    body: "SHO receivers are prepared for the atelier’s senior engravers—deep relief and shaded English scroll that reads like jewelry in soft light.",
    media: asset(
      "sho-highlight-engraving",
      "https://images.unsplash.com/photo-1529927982845-6c4c1cfd5419",
      "Engraver tooling a SHO sidelock",
      4 / 3,
    ),
  },
  {
    title: "Balanced for elegance and poise",
    body: "The sidelock action and sculpted fences carry weight lower in the hands, giving the SHO a uniquely fluid mount for live-pigeon and exhibition shooting.",
    media: asset(
      "sho-highlight-balance",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598",
      "SHO platform in the fitting room with select walnut blanks",
      4 / 3,
    ),
  },
  {
    title: "Bespoke provenance",
    body: "Every SHO commission includes provenance notes from Daniele Perazzi’s archives—wood selection, engraving brief, and hand-written build sheets.",
    media: asset(
      "sho-highlight-provenance",
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443",
      "Perazzi atelier desk with provenance documents",
      4 / 3,
    ),
  },
];

export const series: ShotgunsSeriesEntry = {
  hero: {
    title: "SHO Platform",
    subheading:
      "A sidelock homage to Daniele Perazzi’s pursuit of perfection—engraving, provenance, and balance in equal parts.",
    media: heroMedia,
  },
  atAGlance: {
    triggerType: "Sidelock fixed trigger",
    weightDistribution: "Forward-moderate with sculpted fences",
    typicalDisciplines: ["Sporting", "Game"],
    links: [
      { label: "Commission a SHO", href: "/shotguns/sho" },
      { label: "Visit the atelier", href: "/experience#visit" },
    ],
  },
  storyHtml:
    "<p>The SHO platform was Daniele Perazzi’s proof that elegance and performance need not be opposites. Built in limited numbers, each SHO is a sidelock canvas: deep relief engraving, gold highlights, and select walnut that reads like sculpture. Beneath the art lies the same obsessive fit and finish that defines every competition frame.</p><p>Clients commission SHO builds to celebrate milestones, to honor family histories, or simply to own the most complete expression of Perazzi craft. Every detail is recorded, from the engraver’s sketchbook to the specific blank of walnut pulled from the vault. The result is a shotgun meant to be carried, admired, and eventually handed down with its provenance intact.</p>",
  highlights,
  disciplineMap: [
    {
      disciplineId: "sporting",
      label: "Sporting",
      href: "/shotguns/disciplines/sporting",
      rationale: "Balanced for long presentations with effortless follow-through.",
    },
    {
      disciplineId: "trap",
      label: "Trap heritage",
      href: "/shotguns/disciplines/trap",
      rationale: "The SHO’s poise carries the same calm rib trusted on the line.",
    },
  ],
  champion: {
    id: "champion-sho",
    name: "Giulia Ferri",
    title: "Heritage Ambassador",
    quote:
      "The SHO reminds you that performance and poetry can share the same receiver.",
    image: asset(
      "sho-champion",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a",
      "Giulia Ferri presenting a SHO build at the atelier",
      3 / 4,
    ),
    href: "/heritage",
  },
  relatedArticles: [
    {
      id: "article-sho-engraving",
      title: "Inside the SHO engraving benches",
      slug: "sho-engraving-benches",
    },
    {
      id: "article-sho-provenance",
      title: "How Perazzi tracks SHO provenance",
      slug: "sho-provenance-ledger",
    },
  ],
};
