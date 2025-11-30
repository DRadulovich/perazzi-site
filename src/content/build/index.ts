import type { BuildPageData } from "@/types/build";
import { hero } from "./hero";
import { journey } from "./journey";
import { steps } from "./steps";
import { experts } from "./experts";
import { booking } from "./booking";
import { assurance } from "./assurance";
import { footerCta } from "./footerCta";

const fallbackStepsBackground = {
  id: "bespoke-steps-bg",
  kind: "image" as const,
  url: "/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg",
  alt: "Perazzi bespoke build steps background",
};

const cinematicStrips = [
  {
    image: {
      id: "cinematic-1",
      kind: "image" as const,
      url: "/cinematic_background_photos/p-web-25.jpg",
      alt: "Perazzi bespoke craftsmanship in cinematic lighting",
    },
    alt: "Perazzi bespoke craftsmanship in cinematic lighting",
  },
  {
    image: {
      id: "cinematic-2",
      kind: "image" as const,
      url: "/cinematic_background_photos/p-web-16.jpg",
      alt: "Perazzi atelier ambience in cinematic lighting",
    },
    alt: "Perazzi atelier ambience in cinematic lighting",
  },
];

const bespokeGuide = {
  heading: "Need a bespoke guide?",
  body:
    "Ask how fittings, platform choices, engraving, and finishing should flow for you—so your visit to the atelier is focused, confident, and personal.",
  chatLabel: "Plan my bespoke visit",
  chatPrompt:
    "Map my bespoke Perazzi journey: what to expect at the fitting, how to choose platform and barrels, how engraving is staged, and what decisions I should prep before visiting the atelier.",
  linkLabel: "Request a visit",
  linkHref: "/experience/visit",
  listItems: [
    "Fit & Dynamics — try-gun measurements, balance targets, and barrel regulation priorities.",
    "Platform & Wood — HT or MX lineage, fore-end/stock profiles, and wood blank options.",
    "Engraving & Finish — story direction, coverage, timelines, and hand-finish details.",
  ],
};

const bookingSection = {
  heading: "Ways to begin your bespoke build",
  options: booking.options.map((option) => ({
    title: option.title,
    duration: `${option.durationMins} minutes`,
    description: option.descriptionHtml,
    href: option.href,
  })),
  whatToExpectHeading: booking.whatToExpectHeading,
  whatToExpectItems: booking.whatToExpect.map((item) => item.bodyHtml),
  note: booking.note,
  background: undefined,
};

const expertsIntro = {
  eyebrow: "Atelier team",
  heading: "Meet the craftsmen guiding your build",
};

const stepsIntro = {
  heading: "The journey",
  subheading: "Six moments that shape a bespoke Perazzi",
  ctaLabel: "Begin the ritual",
  background: fallbackStepsBackground,
};

export const buildData: BuildPageData = {
  hero,
  journey,
  stepsIntro,
  steps,
  bespokeGuide,
  cinematicStrips,
  expertsIntro,
  experts,
  booking,
  bookingSection,
  assurance,
  footerCta,
};

export { hero } from "./hero";
export { journey } from "./journey";
export { steps } from "./steps";
export { experts } from "./experts";
export { booking } from "./booking";
export { assurance } from "./assurance";
export { footerCta } from "./footerCta";
