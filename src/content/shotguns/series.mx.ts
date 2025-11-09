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
  "https://cdn.sanity.io/images/m42h56wl/production/baf4ec8a3538ef874c09b2583fb26a5600874dcc-1200x790.jpg",
  "MX shotguns lined along a velvet bench in Botticino",
  5 / 4,
);

const highlights = [
  {
    title: "Trigger units built to travel",
    body: "Each MX drop-out unit is tuned and serialized to the frame. Competitive shooters carry a second unit in case springs need refreshing mid-event.",
    media: asset(
      "mx-highlight-trigger-detail",
      "https://cdn.sanity.io/images/m42h56wl/production/baf4ec8a3538ef874c09b2583fb26a5600874dcc-1200x790.jpg",
      "Close view of engraved drop-out trigger housing",
      4 / 3,
    ),
  },
  {
    title: "Stock geometry shaped for vertical targets",
    body: "MX stocks are carved for a relaxed recoil line, helping bunker shooters stay poised through doubles.",
    media: asset(
      "mx-highlight-stock",
      "https://cdn.sanity.io/images/m42h56wl/production/baf4ec8a3538ef874c09b2583fb26a5600874dcc-1200x790.jpg",
      "MX stock profile showing cast and pitch adjustments",
      4 / 3,
    ),
  },
  {
    title: "Boss-style locking surfaces",
    body: "Dual locking lugs and hand-lapped shoulders keep the action closing with velvet smoothness long after the thousandth round.",
    media: asset(
      "mx-highlight-locking",
      "https://cdn.sanity.io/images/m42h56wl/production/baf4ec8a3538ef874c09b2583fb26a5600874dcc-1200x790.jpg",
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
    "<p>The MX Lineage — from prototype to platform<p><p>There are inventions. And then there are continuities: a single idea so well conceived that it becomes, over time, grammar. The MX series is Perazzi’s grammar — a language of locking shoulders and perfect closure, of a trigger that can be removed and a balance that reads like a posture. It begins in the heat of the 1960s and, through incremental devotion, becomes the scaffolding for everything Perazzi builds.<p><p>The seed: Mattarelli, Mexico, and the MX8<p>The Perazzi story begins with Daniele Perazzi’s early experiments in Brescia and a defining early victory: Ennio Mattarelli’s Olympic gold in 1964, which proved that Daniele’s prototypes belonged on the world stage. From those lessons came the MX8 — the archetypal Perazzi over/under, born for the Mexico City cycle and thereafter the canonical competition action. The MX8’s low-profile, Boss-derived locking geometry and removable trigger rewrote expectations for serviceability, modularity, and feel. That single action would become, quietly and inexorably, the company’s standard reference.<p><p>Maturation through collaboration: the 1970s–1990s<p>Once the MX8 existed, Perazzi did what artisans do best: refine with partners. Through the 1970s and 1980s Perazzi worked with champions and importers, adapting the basic MX action into variants for skeet, trap, and American markets. The MX family expanded numerically — MX3, MX5, MX10 and on — not as a reinvention each time but as disciplined permutations: different ribs, rib heights, barrel profiles, and trigger configurations for distinct disciplines. For the U.S. trap market, single-barrel “TM” variants and specially tuned top-singles emerged alongside O/Us so Perazzi could speak the language of each shooting culture while keeping the underlying grammar constant.<p><p>The MX12, MX2000 and the language of options<p>The 1990s and early 2000s sharpened the MX vocabulary. Some shooters wanted the simplicity of a fixed-trigger platform; Perazzi obliged with MX12-style variants and fixed-trigger siblings like the MX2000S — mechanically close kin to the MX8 but simplified in the trigger group. At the same time Perazzi introduced the MX2000 family, which felt like the MX8’s modern cousin: the same action logic, updated ergonomics, and added adjustability (multi-notch ribs, stock options, and barrel choices) designed for the busy, tournament-heavy shooter. These evolutions made the MX family both broad and familiar: a Perazzi in the 1990s still felt like a Perazzi — only more tuned to its task.<p><p>Continuity as innovation: small changes, big results<p>What defines the MX story is not radical turnover but quiet improvement. Perazzi’s approach has been iterative: adjustable combs, alternate rib geometry, coil-spring versus leaf-spring options, and nuanced barrel profiling. Each change respects the MX8’s heart — the drop-out trigger option, the Boss-like locking surfaces, the exacting hand-fit — while tuning weight, sight picture, and recoil impulse to contemporary demands. That modularity meant shooters could move across disciplines with familiar ergonomics, and it allowed Perazzi to offer a “bespoke-by-default” experience without needless reinvention.<p><p>Champions, proof, and cultural cement<p>A tool becomes legendary when it is carried into the world by people who themselves belong to legend. Across decades the MX line — in its MX8, MX2000, MX12, HT and related forms — became the companion of dozens of champions. From Olympic golds to world titles and a run of medal-haul summers, Perazzi shotguns proved their method under the most exacting lights. That competitive pedigree is part of the MX platform’s DNA: it isn’t merely engineered for precision; it has been proven by it.<p><p>Why the MX endures<p>There are three practical reasons the MX platform persists: (1) mechanical excellence — a robust action geometry that can be hand-fit to the tightest tolerances; (2) modularity — removable triggers, scalable frames for smaller gauges, and interchangeable barrels and ribs; and (3) cultural continuity — shooters learn on one Perazzi and carry that intuition forward, generation to generation. Business-wise it’s also efficient: evolve the platform, don’t invent a new one every decade. The result is a family of guns that can be scaled, personalized, and trusted to age gracefully.<p><p>The present: MX spirit in a modern world<p>Today, whether a shooter mounts an MX8 tuned for Olympic trap, a compact MX sporting build, or a High Tech that cushions recoil for long tournament sessions, the experience traces back to the same original idea: an over/under where geometry, feel, and human intent meet. The MX series is not a single story but a lineage: an unbroken habit of craftsmanship that prefers evolution to spectacle. It is proof that the right architecture—built with restraint and cared for with devotion—becomes timeless.</p>",
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
      "https://cdn.sanity.io/images/m42h56wl/production/baf4ec8a3538ef874c09b2583fb26a5600874dcc-1200x790.jpg",
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
