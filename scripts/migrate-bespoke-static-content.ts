#!/usr/bin/env tsx
import {randomUUID} from "node:crypto";
import {createClient} from "@sanity/client";
import { booking as bookingFixture } from "../src/content/build/booking";
import { assurance as assuranceFixture } from "../src/content/build/assurance";

type BespokeHomeDoc = {
  _id: string;
  stepsIntro?: {
    heading?: string | null;
    subheading?: string | null;
    ctaLabel?: string | null;
    backgroundImage?: unknown;
  } | null;
  bespokeGuide?: {
    heading?: string | null;
    body?: string | null;
    chatLabel?: string | null;
    chatPrompt?: string | null;
    linkLabel?: string | null;
    linkHref?: string | null;
    listItems?: string[] | null;
  } | null;
  cinematicStrips?: Array<{ _key?: string; image?: unknown; alt?: string | null }> | null;
  expertsIntro?: { eyebrow?: string | null; heading?: string | null } | null;
  bookingSection?: {
    heading?: string | null;
    options?: Array<{ title?: string | null; duration?: string | null; description?: string | null; href?: string | null }>;
    whatToExpectHeading?: string | null;
    whatToExpectItems?: string[] | null;
    note?: string | null;
  } | null;
  assuranceContent?: {
    heading?: string | null;
    label?: string | null;
    body?: string | null;
    quote?: string | null;
  } | null;
};

const defaults = {
  stepsIntro: {
    heading: "The journey",
    subheading: "Six moments that shape a bespoke Perazzi",
    ctaLabel: "Begin the ritual",
  },
  bespokeGuide: {
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
  },
  cinematicStrips: [
    {
      _key: "cinematic-1",
      alt: "Perazzi bespoke craftsmanship in cinematic lighting",
    },
    {
      _key: "cinematic-2",
      alt: "Perazzi atelier ambience in cinematic lighting",
    },
  ],
  expertsIntro: {
    eyebrow: "Atelier team",
    heading: "Meet the craftsmen guiding your build",
  },
  bookingSection: {
    heading: "Ways to begin your bespoke build",
    options: bookingFixture.options.map((option) => ({
      title: option.title,
      duration: `${option.durationMins} minutes`,
      description: option.descriptionHtml.replace(/<[^>]+>/g, "").trim(),
      href: option.href,
    })),
    whatToExpectHeading: bookingFixture.whatToExpectHeading ?? "What to expect",
    whatToExpectItems: bookingFixture.whatToExpect.map((item) => item.bodyHtml.replace(/<[^>]+>/g, "").trim()),
    note: bookingFixture.note,
  },
  assuranceContent: {
    heading: assuranceFixture.heading ?? "Lifelong assurance",
    label: assuranceFixture.label ?? "Atelier guarantee",
    body:
      assuranceFixture.body ??
      assuranceFixture.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ??
      "Every bespoke Perazzi is delivered with lifelong fitting assurance.",
    quote: assuranceFixture.quote?.text ?? "A bespoke gun is never finished—only in harmony with the shooter today.",
  },
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET,
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_TOKEN,
});

async function main() {
  const bespoke = await client.fetch<BespokeHomeDoc | null>(`*[_type == "bespokeHome"][0]`);
  if (!bespoke?._id) {
    console.error("No bespokeHome document found to migrate.");
    return;
  }

  const patch: Record<string, unknown> = {};
  const changes: string[] = [];

  if (!bespoke.stepsIntro) {
    patch.stepsIntro = defaults.stepsIntro;
    changes.push("stepsIntro");
  }

  if (!bespoke.bespokeGuide) {
    patch.bespokeGuide = defaults.bespokeGuide;
    changes.push("bespokeGuide");
  }

  if (!bespoke.cinematicStrips || bespoke.cinematicStrips.length === 0) {
    patch.cinematicStrips = defaults.cinematicStrips.map((strip) => ({
      ...strip,
      _key: strip._key ?? randomUUID(),
    }));
    changes.push("cinematicStrips");
  }

  if (!bespoke.expertsIntro) {
    patch.expertsIntro = defaults.expertsIntro;
    changes.push("expertsIntro");
  }

  if (!bespoke.bookingSection) {
    patch.bookingSection = defaults.bookingSection;
    changes.push("bookingSection");
  }

  if (!bespoke.assuranceContent) {
    patch.assuranceContent = defaults.assuranceContent;
    changes.push("assuranceContent");
  }

  if (changes.length === 0) {
    console.log("bespokeHome already has steps intro, guide, cinematic strips, experts intro, booking, and assurance content populated. No changes written.");
    return;
  }

  const result = await client.patch(bespoke._id).set(patch).commit();
  console.log(`Updated bespokeHome (${bespoke._id}): ${changes.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
