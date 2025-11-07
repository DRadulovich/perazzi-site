import type { Expert } from "@/types/build";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const headshot = (id: string, source: string, alt: string, aspectRatio = 1) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const experts: Expert[] = [
  {
    id: "giulia-fitter",
    name: "Giulia Ferraro",
    role: "Lead Fitter & Tunnel Specialist",
    bioShort:
      "Giulia has spent two decades fitting Olympic medalists and ATA champions, combining try-gun intuition with tunnel data.",
    headshot: headshot(
      "expert-giulia",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "Portrait of Giulia Ferraro in the Perazzi tunnel range",
    ),
    quote:
      "Every measurement is a conversation with the shooter—listen to the way they settle into the gun.",
    profileHref: "/heritage/champions",
  },
  {
    id: "marco-stock",
    name: "Marco Venturi",
    role: "Master Stock Maker",
    bioShort:
      "Marco shapes each stock from hand-selected walnut, carving by feel before inletting it to the action.",
    headshot: headshot(
      "expert-marco",
      "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
      "Portrait of Marco Venturi carving a walnut stock",
    ),
    quote:
      "Wood remembers the shooter who carries it—balance is our shared signature.",
  },
  {
    id: "sofia-engraver",
    name: "Sofia Bianchi",
    role: "Engraving Atelier Lead",
    bioShort:
      "Sofia coordinates house patterns and bespoke commissions, matching engravers to each patron’s vision.",
    headshot: headshot(
      "expert-sofia",
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980",
      "Portrait of engraver Sofia Bianchi in the studio",
    ),
  },
];
