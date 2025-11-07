import type { FittingStage } from "@/types/build";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const image = (id: string, source: string, alt: string, aspectRatio: number, caption?: string) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  caption,
  aspectRatio,
});

export const steps: FittingStage[] = [
  {
    id: "discovery",
    title: "Discovery & consultation",
    bodyHtml:
      "<p>Our first conversation maps your history, disciplines, and the sensations you want from your Perazzi. Whether in Botticino or via remote consult, we define the vision together.</p>",
    media: image(
      "build-step-1",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
      "Shooter and fitter discussing goals over a walnut workbench",
      16 / 9,
      "Every build starts with intent—disciplines, rhythms, aspirations.",
    ),
  },
  {
    id: "fitting",
    title: "Precision fitting (try-gun)",
    bodyHtml:
      "<p>Using the Perazzi try-gun, we map length of pull, cast, drop, pitch, and grip geometry while you mount and move. You’ll feel the moment the rib stays calm and the gun aligns with your stance.</p>",
    media: image(
      "build-step-2",
      "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
      "Perazzi fitter adjusting a try-gun for shoulder fit",
      4 / 3,
      "Measurements are captured while you move—never from static numbers alone.",
    ),
    captionHtml:
      "<p>Controlled mount-and-move repetitions reveal how the gun settles through your swing.</p>",
  },
  {
    id: "regulation",
    title: "Barrel & regulation",
    bodyHtml:
      "<p>Inside the proof tunnel we pattern barrels, ribs, and chokes. Adjustments happen live until your point of impact sits exactly where your focus lives, with POI range bands documented for future reference.</p>",
    media: image(
      "build-step-3",
      "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
      "Shooter patterning a shotgun in the Perazzi tunnel range",
      16 / 9,
    ),
  },
  {
    id: "balance",
    title: "Balance & dynamics",
    bodyHtml:
      "<p>We dial moment of inertia with barrel sets and ballast, shaping how the gun starts and finishes your swing. Stocks are roughed in to match the rhythm you prefer—lively for skeet, anchored for bunker.</p>",
    media: image(
      "build-step-4",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
      "Technician adjusting balance weights on a Perazzi fore-end",
      4 / 3,
    ),
  },
  {
    id: "engraving",
    title: "Engraving & wood",
    bodyHtml:
      "<p>You choose walnut blanks from the atelier vault and define engraving direction—house scroll, modern geometry, or a master engraver commission. Every surface is finished by hand.</p>",
    media: image(
      "build-step-5",
      "https://images.unsplash.com/photo-1514996937319-344454492b37",
      "Stacks of figured walnut blanks in the Perazzi wood room",
      3 / 2,
      "Walnut blanks are paired to your chosen balance and aesthetic.",
    ),
    captionHtml:
      "<p>House patterns rooted in Italian tradition sit alongside bespoke collaborations with master engravers.</p>",
    ctaLabel: "Explore engraving grades",
    ctaHref: "/shotguns/grades",
  },
  {
    id: "delivery",
    title: "Delivery & on-range validation",
    bodyHtml:
      "<p>Your Perazzi returns to the tunnel and range for final validation. We confirm fit, run-in the trigger group, and schedule aftercare so the gun evolves with you through seasons to come.</p>",
    media: image(
      "build-step-6",
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980",
      "Fitter presenting completed shotgun to shooter in the atelier",
      4 / 3,
    ),
  },
];
