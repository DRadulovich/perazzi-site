#!/usr/bin/env tsx
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { picker as pickerFixture } from "../src/content/experience/picker";
import { faq as faqFixture } from "../src/content/experience/faq";
import { visit as visitFixture } from "../src/content/experience/visit";
import { fittingOptions as fittingFixture } from "../src/content/experience/fitting";
import { bookingScheduler as schedulerFixture } from "../src/content/experience/scheduler";
import { experienceData } from "../src/content/experience";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET,
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_TOKEN,
});

type AnyRecord = Record<string, unknown>;

const stripHtml = (value?: string) =>
  value?.replaceAll(/<[^>]+>/g, " ").replaceAll(/\s+/g, " ").trim();

const extractListItems = (html?: string) => {
  if (!html) return [];
  const matches = Array.from(html.matchAll(/<li>(.*?)<\/li>/gi));
  if (matches.length) return matches.map((match) => stripHtml(match[1]) ?? "").filter(Boolean);
  const cleaned = stripHtml(html);
  return cleaned ? [cleaned] : [];
};

const defaults = {
  pickerUi: {
    heading: experienceData.pickerUi.heading ?? "Choose your path",
    subheading: experienceData.pickerUi.subheading ?? "Visit, fit, or demo with Perazzi",
    microLabel: experienceData.pickerUi.microLabel ?? "Perazzi Experience",
    defaultCtaLabel: pickerFixture[0]?.ctaLabel,
    defaultCtaHref: pickerFixture[0]?.href,
  },
  faqSection: {
    heading: experienceData.faqSection.heading ?? "FAQ",
    lead: experienceData.faqSection.lead ?? "Questions from future owners",
    items: faqFixture.map((item) => ({
      _key: randomUUID(),
      question: item.q,
      answerHtml: item.aHtml,
    })),
  },
  visitPlanningBlock: experienceData.visitPlanningBlock,
  fittingGuidanceBlock: experienceData.fittingGuidanceBlock,
  travelGuideBlock: experienceData.travelGuideBlock,
  visitFactorySection: {
    heading: experienceData.visitFactorySection.heading ?? "Visit Botticino",
    subheading: experienceData.visitFactorySection.subheading ?? "See the factory in person",
    introHtml: visitFixture.introHtml,
    locationName: visitFixture.location.name,
    address: visitFixture.location.addressHtml,
    hours: visitFixture.location.hoursHtml,
    notes: visitFixture.location.notesHtml,
    mapEmbedHtml: visitFixture.location.mapEmbedSrc,
    whatToExpect: extractListItems(visitFixture.whatToExpectHtml),
    ctaLabel: visitFixture.cta.label,
    ctaHref: visitFixture.cta.href,
  },
  bookingSection: {
    heading: "Book a fitting",
    subheading: "Choose the session that fits your journey",
    options: fittingFixture.map((option) => ({
      _key: randomUUID(),
      title: option.title,
      durationLabel: option.durationMins ? `${option.durationMins} minutes` : undefined,
      descriptionHtml: option.descriptionHtml,
      href: option.href,
    })),
    optionCtaLabel: "Reserve this session",
    scheduler: {
      title: schedulerFixture.title,
      helperText: "Selecting Begin Your Fitting loads an embedded booking form below.",
      toggleOpenLabel: "Begin Your Fitting",
      toggleCloseLabel: "Hide scheduler",
      iframeSrc: schedulerFixture.src,
      iframeTitle: schedulerFixture.title,
      fallbackHref: schedulerFixture.fallbackHref,
    },
  },
  travelNetworkUi: {
    title: experienceData.travelNetworkUi.title ?? "Travel network",
    lead: experienceData.travelNetworkUi.lead ?? "Meet us on the road",
    supporting:
      experienceData.travelNetworkUi.supporting ??
      "Track our travel schedule or connect with a trusted Perazzi dealer closest to you.",
    scheduleTabLabel: experienceData.travelNetworkUi.scheduleTabLabel ?? "Our Travel Schedule",
    dealersTabLabel: experienceData.travelNetworkUi.dealersTabLabel ?? "Our Dealers",
    emptyScheduleText:
      experienceData.travelNetworkUi.emptyScheduleText ??
      "New travel stops are being confirmed. Check back shortly.",
    emptyDealersText:
      experienceData.travelNetworkUi.emptyDealersText ??
      "Dealer roster is being configured in Sanity.",
  },
  mosaicUi: {
    eyebrow: experienceData.mosaicUi.eyebrow ?? "Atelier mosaic",
    heading: experienceData.mosaicUi.heading ?? "Moments from the journey",
  },
};

const isMissingValue = (value: unknown) => {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || value === "";
};

const mergeWithExisting = (existing: AnyRecord | undefined, patch: AnyRecord) =>
  existing ? { ...existing, ...patch } : { ...patch };

const createPatch = (current: AnyRecord | undefined, defaultsMap: AnyRecord) =>
  Object.entries(defaultsMap).reduce<AnyRecord>((acc, [field, defaultValue]) => {
    const currentValue = current?.[field];
    if (isMissingValue(currentValue)) acc[field] = defaultValue;
    return acc;
  }, {});

const applySectionDefaults = (
  sectionKey: string,
  current: AnyRecord | undefined,
  defaultsMap: AnyRecord,
  apply: (key: string, value: AnyRecord) => void,
) => {
  const sectionPatch = createPatch(current, defaultsMap);
  if (Object.keys(sectionPatch).length) {
    apply(sectionKey, mergeWithExisting(current, sectionPatch));
  }
};

async function main() {
  const experienceHome = await client.fetch<Record<string, any> | null>(`*[_type == "experienceHome"][0]`);

  if (!experienceHome?._id) {
    console.error("No experienceHome document found");
    process.exit(1);
  }

  const patch: AnyRecord = {};
  const seeded: string[] = [];

  const applySection = (key: string, value: AnyRecord) => {
    patch[key] = value;
    seeded.push(key);
  };

  const applyDefaults = (sectionKey: string, current: AnyRecord | undefined, defaultsMap: AnyRecord) =>
    applySectionDefaults(sectionKey, current, defaultsMap, applySection);

  applyDefaults("pickerUi", experienceHome.pickerUi, {
    heading: defaults.pickerUi.heading,
    subheading: defaults.pickerUi.subheading,
    microLabel: defaults.pickerUi.microLabel,
    defaultCtaLabel: defaults.pickerUi.defaultCtaLabel,
    defaultCtaHref: defaults.pickerUi.defaultCtaHref,
  });

  applyDefaults("faqSection", experienceHome.faqSection, {
    heading: defaults.faqSection.heading,
    lead: defaults.faqSection.lead,
    items: defaults.faqSection.items,
  });

  applyDefaults("visitPlanningBlock", experienceHome.visitPlanningBlock, {
    heading: defaults.visitPlanningBlock.heading,
    intro: defaults.visitPlanningBlock.intro,
    bullets: defaults.visitPlanningBlock.bullets,
    closing: defaults.visitPlanningBlock.closing,
    chatLabel: defaults.visitPlanningBlock.chatLabel,
    chatPrompt: defaults.visitPlanningBlock.chatPrompt,
    linkLabel: defaults.visitPlanningBlock.linkLabel,
    linkHref: defaults.visitPlanningBlock.linkHref,
  });

  applyDefaults("fittingGuidanceBlock", experienceHome.fittingGuidanceBlock, {
    heading: defaults.fittingGuidanceBlock.heading,
    intro: defaults.fittingGuidanceBlock.intro,
    bullets: defaults.fittingGuidanceBlock.bullets,
    closing: defaults.fittingGuidanceBlock.closing,
    chatLabel: defaults.fittingGuidanceBlock.chatLabel,
    chatPrompt: defaults.fittingGuidanceBlock.chatPrompt,
    linkLabel: defaults.fittingGuidanceBlock.linkLabel,
    linkHref: defaults.fittingGuidanceBlock.linkHref,
  });

  applyDefaults("travelGuideBlock", experienceHome.travelGuideBlock, {
    heading: defaults.travelGuideBlock.heading,
    intro: defaults.travelGuideBlock.intro,
    bullets: defaults.travelGuideBlock.bullets,
    closing: defaults.travelGuideBlock.closing,
    chatLabel: defaults.travelGuideBlock.chatLabel,
    chatPrompt: defaults.travelGuideBlock.chatPrompt,
    linkLabel: defaults.travelGuideBlock.linkLabel,
    linkHref: defaults.travelGuideBlock.linkHref,
  });

  applyDefaults("visitFactorySection", experienceHome.visitFactorySection, {
    heading: defaults.visitFactorySection.heading,
    subheading: defaults.visitFactorySection.subheading,
    introHtml: defaults.visitFactorySection.introHtml,
    locationName: defaults.visitFactorySection.locationName,
    address: defaults.visitFactorySection.address,
    hours: defaults.visitFactorySection.hours,
    notes: defaults.visitFactorySection.notes,
    mapEmbedHtml: defaults.visitFactorySection.mapEmbedHtml,
    whatToExpect: defaults.visitFactorySection.whatToExpect,
    ctaLabel: defaults.visitFactorySection.ctaLabel,
    ctaHref: defaults.visitFactorySection.ctaHref,
  });

  const bookingPatch = createPatch(experienceHome.bookingSection, {
    heading: defaults.bookingSection.heading,
    subheading: defaults.bookingSection.subheading,
    options: defaults.bookingSection.options,
    optionCtaLabel: defaults.bookingSection.optionCtaLabel,
  });
  const schedulerPatch = createPatch(experienceHome.bookingSection?.scheduler, {
    title: defaults.bookingSection.scheduler.title,
    helperText: defaults.bookingSection.scheduler.helperText,
    toggleOpenLabel: defaults.bookingSection.scheduler.toggleOpenLabel,
    toggleCloseLabel: defaults.bookingSection.scheduler.toggleCloseLabel,
    iframeSrc: defaults.bookingSection.scheduler.iframeSrc,
    iframeTitle: defaults.bookingSection.scheduler.iframeTitle,
    fallbackHref: defaults.bookingSection.scheduler.fallbackHref,
  });
  if (Object.keys(schedulerPatch).length) {
    bookingPatch.scheduler = mergeWithExisting(experienceHome.bookingSection?.scheduler, schedulerPatch);
  }
  if (Object.keys(bookingPatch).length) {
    applySection("bookingSection", mergeWithExisting(experienceHome.bookingSection, bookingPatch));
  }

  applyDefaults("travelNetworkUi", experienceHome.travelNetworkUi, {
    title: defaults.travelNetworkUi.title,
    lead: defaults.travelNetworkUi.lead,
    supporting: defaults.travelNetworkUi.supporting,
    scheduleTabLabel: defaults.travelNetworkUi.scheduleTabLabel,
    dealersTabLabel: defaults.travelNetworkUi.dealersTabLabel,
    emptyScheduleText: defaults.travelNetworkUi.emptyScheduleText,
    emptyDealersText: defaults.travelNetworkUi.emptyDealersText,
  });

  applyDefaults("mosaicUi", experienceHome.mosaicUi, {
    eyebrow: defaults.mosaicUi.eyebrow,
    heading: defaults.mosaicUi.heading,
  });

  if (seeded.length === 0) {
    console.log("experienceHome already has picker UI, FAQ, concierge blocks, visit factory, booking, travel network, and mosaic UI populated. No changes written.");
    return;
  }

  const result = await client.patch(experienceHome._id).set(patch).commit();
  console.log(`Seeded sections: ${seeded.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
