import type { GradeSeries } from "@/types/catalog";
import type { FactoryAsset } from "@/types/content";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const asset = (
  id: string,
  sourceUrl: string,
  alt: string,
  aspectRatio = 3 / 2,
  caption?: string,
): FactoryAsset => ({
  id,
  kind: "image",
  url: `${fetchBase}/${encodeURIComponent(sourceUrl)}`,
  alt,
  caption,
  aspectRatio,
});

export const grades: GradeSeries[] = [
  {
    id: "SC2",
    name: "SC2",
    description:
      "Classic perimeter scroll engraved by the atelier’s masters—subtle enough for the field, refined for the stand.",
    gallery: [
      asset(
        "sc2-gallery-1",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
        "SC2 lockplate engraving featuring fine scrollwork and bouquet elements",
      ),
      asset(
        "sc2-gallery-2",
        "https://images.unsplash.com/photo-1504593811423-6dd665756598",
        "Oil-finished SC2 stock with straight grain walnut",
      ),
    ],
    provenanceHtml:
      "<p>SC2 engraving follows the classic Brescia school with light scroll borders. Wood blanks are hand-selected for straight grain stability, ideal for hard-use competition guns.</p>",
    options: [
      {
        id: "sc2-upgrade-wood",
        title: "Enhanced walnut set",
        description:
          "Upgrade to exhibition walnut with hand-rubbed oil finish.",
      },
    ],
  },
  {
    id: "SC3",
    name: "SC3",
    description:
      "Deeper scroll coverage with gold accents—celebrating the balance between sport and artistry.",
    gallery: [
      asset(
        "sc3-gallery-1",
        "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
        "SC3 receiver with deep relief scroll and gold inlays",
      ),
      asset(
        "sc3-gallery-2",
        "https://images.unsplash.com/photo-1525182008055-f88b95ff7980",
        "Highly figured SC3 stock shimmering under atelier lights",
      ),
    ],
    provenanceHtml:
      "<p>SC3 commissions include dedicated engraver sign-off and matched walnut blanks sourced from the atelier’s aged vault. Expect delivery timelines aligned with the artisan calendar.</p>",
    options: [
      {
        id: "sc3-initials",
        title: "Monogram inlays",
        description:
          "Hand-cut gold or silver monograms inset into the trigger guard.",
      },
      {
        id: "sc3-case",
        title: "Presentation case",
        description:
          "Leather case with embossed crest, crafted in Val Trompia.",
      },
    ],
  },
  {
    id: "SCO",
    name: "SCO",
    description:
      "The atelier’s masterpiece tier—full coverage bulino or bespoke scenes depicting your legacy.",
    gallery: [
      asset(
        "sco-gallery-1",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a",
        "SCO side plate with bulino scene of a clay shooter mid-swing",
      ),
      asset(
        "sco-gallery-2",
        "https://images.unsplash.com/photo-1579554348901-e7a704ff4215",
        "SCO presentation set with bespoke accessories",
      ),
    ],
    provenanceHtml:
      "<p>SCO commissions begin with a conversation between patron and engraver. Scenes are drafted, wood blanks seasoned, and metal sculpted entirely by hand. Delivery is paced to ensure every detail reflects the owner’s story.</p>",
    options: [
      {
        id: "sco-bulino",
        title: "Custom bulino scene",
        description:
          "Collaborate directly with the engraver to design bespoke narrative panels.",
      },
      {
        id: "sco-crest",
        title: "Family crest inlay",
        description:
          "Precious metal inlays set into the top lever and trigger guard.",
      },
    ],
  },
];
