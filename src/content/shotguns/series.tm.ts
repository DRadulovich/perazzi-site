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
  "tm-series-hero",
  "https://images.unsplash.com/photo-1579554348901-e7a704ff4215",
  "Perazzi TM shotgun resting on a trap field fence post",
  16 / 9,
);

export const series: ShotgunsSeriesEntry = {
  hero: {
    title: "TM Platform",
    subheading:
      "American trap focus with fixed-trigger simplicity and adjustable sight picture.",
    media: heroMedia,
  },
  atAGlance: {
    triggerType: "Fixed trigger",
    weightDistribution: "Forward biased single barrel",
    typicalDisciplines: ["Trap"],
    links: [{ label: "Book a TM fitting", href: "/experience/fitting" }],
  },
  storyHtml:
    "<p>TM is Perazzi’s single-barrel response to American trap shooters who demanded the MX feel with a dedicated rib and barrel profile. Fixed triggers reduce moving parts while still receiving the same hand-honed sear geometry from the Botticino bench.</p><p>The adjustable rib supports handicap yardages, and the fixed trigger delivers unwavering break weight for shooters who crave consistency.</p>",
  highlights: [
    {
      title: "Adjustable trap ribs",
      body: "Dial point of impact from 60/40 to 90/10 via a precision-machined rib without altering cheek weld.",
      media: asset(
        "tm-highlight-rib",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
        "Gunsmith adjusting a TM rib with feeler gauge",
        4 / 3,
      ),
    },
    {
      title: "Fixed-trigger confidence",
      body: "The TM trigger is tuned to the same tolerances as MX units, yet fixed for those who prefer fewer moving parts.",
      media: asset(
        "tm-highlight-trigger",
        "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
        "Close-up of a TM fixed trigger shoe",
        4 / 3,
      ),
    },
    {
      title: "American trap stock geometry",
      body: "Stocks are carved for sustained handicap rounds, blending forward bias with pitch and cast dialed in the tunnel.",
      media: asset(
        "tm-highlight-stock",
        "https://images.unsplash.com/photo-1517354153771-d19fbb86ba97",
        "Craftsman refining a Perazzi stock blank for trap fit",
        4 / 3,
      ),
    },
  ],
  disciplineMap: [
    {
      disciplineId: "trap",
      label: "Trap",
      href: "/shotguns/disciplines/trap",
      rationale:
        "Forward balance and rib adjustability suit ATA handicap and doubles schedules.",
    },
  ],
  champion: {
    id: "champion-amelia",
    name: "Amelia James",
    title: "ATA Grand American Champion",
    quote:
      "My TM keeps pace across the handicap line—the rib lets me stay in the birds even as angles tighten.",
    image: asset(
      "tm-champion",
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980",
      "Amelia James on the trap line with her TM shotgun",
      3 / 4,
    ),
    href: "/heritage/champions",
  },
  relatedArticles: [
    {
      id: "article-tm-setup",
      title: "Setting TM ribs for ATA handicap",
      slug: "tm-rib-setup",
    },
  ],
};
