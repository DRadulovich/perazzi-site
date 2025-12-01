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

const stripHtml = (value?: string) =>
  value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

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

async function main() {
  const experienceHome = await client.fetch<Record<string, any> | null>(`*[_type == "experienceHome"][0]`);

  if (!experienceHome?._id) {
    console.error("No experienceHome document found");
    process.exit(1);
  }

  const patch: Record<string, unknown> = {};
  const seeded: string[] = [];

  const applySection = (key: string, value: Record<string, unknown>) => {
    patch[key] = value;
    seeded.push(key);
  };

  const pickerUiPatch: Record<string, unknown> = {};
  if (!experienceHome.pickerUi?.heading) pickerUiPatch.heading = defaults.pickerUi.heading;
  if (!experienceHome.pickerUi?.subheading) pickerUiPatch.subheading = defaults.pickerUi.subheading;
  if (!experienceHome.pickerUi?.microLabel) pickerUiPatch.microLabel = defaults.pickerUi.microLabel;
  if (!experienceHome.pickerUi?.defaultCtaLabel) pickerUiPatch.defaultCtaLabel = defaults.pickerUi.defaultCtaLabel;
  if (!experienceHome.pickerUi?.defaultCtaHref) pickerUiPatch.defaultCtaHref = defaults.pickerUi.defaultCtaHref;
  if (Object.keys(pickerUiPatch).length) {
    applySection("pickerUi", { ...(experienceHome.pickerUi ?? {}), ...pickerUiPatch });
  }

  const faqPatch: Record<string, unknown> = {};
  if (!experienceHome.faqSection?.heading) faqPatch.heading = defaults.faqSection.heading;
  if (!experienceHome.faqSection?.lead) faqPatch.lead = defaults.faqSection.lead;
  if (!experienceHome.faqSection?.items?.length) faqPatch.items = defaults.faqSection.items;
  if (Object.keys(faqPatch).length) {
    applySection("faqSection", { ...(experienceHome.faqSection ?? {}), ...faqPatch });
  }

  const visitPlanningPatch: Record<string, unknown> = {};
  if (!experienceHome.visitPlanningBlock?.heading) visitPlanningPatch.heading = defaults.visitPlanningBlock.heading;
  if (!experienceHome.visitPlanningBlock?.intro) visitPlanningPatch.intro = defaults.visitPlanningBlock.intro;
  if (!experienceHome.visitPlanningBlock?.bullets?.length) visitPlanningPatch.bullets = defaults.visitPlanningBlock.bullets;
  if (!experienceHome.visitPlanningBlock?.closing) visitPlanningPatch.closing = defaults.visitPlanningBlock.closing;
  if (!experienceHome.visitPlanningBlock?.chatLabel) visitPlanningPatch.chatLabel = defaults.visitPlanningBlock.chatLabel;
  if (!experienceHome.visitPlanningBlock?.chatPrompt) visitPlanningPatch.chatPrompt = defaults.visitPlanningBlock.chatPrompt;
  if (!experienceHome.visitPlanningBlock?.linkLabel) visitPlanningPatch.linkLabel = defaults.visitPlanningBlock.linkLabel;
  if (!experienceHome.visitPlanningBlock?.linkHref) visitPlanningPatch.linkHref = defaults.visitPlanningBlock.linkHref;
  if (Object.keys(visitPlanningPatch).length) {
    applySection("visitPlanningBlock", { ...(experienceHome.visitPlanningBlock ?? {}), ...visitPlanningPatch });
  }

  const fittingGuidancePatch: Record<string, unknown> = {};
  if (!experienceHome.fittingGuidanceBlock?.heading) fittingGuidancePatch.heading = defaults.fittingGuidanceBlock.heading;
  if (!experienceHome.fittingGuidanceBlock?.intro) fittingGuidancePatch.intro = defaults.fittingGuidanceBlock.intro;
  if (!experienceHome.fittingGuidanceBlock?.bullets?.length) fittingGuidancePatch.bullets = defaults.fittingGuidanceBlock.bullets;
  if (!experienceHome.fittingGuidanceBlock?.closing) fittingGuidancePatch.closing = defaults.fittingGuidanceBlock.closing;
  if (!experienceHome.fittingGuidanceBlock?.chatLabel) fittingGuidancePatch.chatLabel = defaults.fittingGuidanceBlock.chatLabel;
  if (!experienceHome.fittingGuidanceBlock?.chatPrompt) fittingGuidancePatch.chatPrompt = defaults.fittingGuidanceBlock.chatPrompt;
  if (!experienceHome.fittingGuidanceBlock?.linkLabel) fittingGuidancePatch.linkLabel = defaults.fittingGuidanceBlock.linkLabel;
  if (!experienceHome.fittingGuidanceBlock?.linkHref) fittingGuidancePatch.linkHref = defaults.fittingGuidanceBlock.linkHref;
  if (Object.keys(fittingGuidancePatch).length) {
    applySection("fittingGuidanceBlock", { ...(experienceHome.fittingGuidanceBlock ?? {}), ...fittingGuidancePatch });
  }

  const travelGuidePatch: Record<string, unknown> = {};
  if (!experienceHome.travelGuideBlock?.heading) travelGuidePatch.heading = defaults.travelGuideBlock.heading;
  if (!experienceHome.travelGuideBlock?.intro) travelGuidePatch.intro = defaults.travelGuideBlock.intro;
  if (!experienceHome.travelGuideBlock?.bullets?.length) travelGuidePatch.bullets = defaults.travelGuideBlock.bullets;
  if (!experienceHome.travelGuideBlock?.closing) travelGuidePatch.closing = defaults.travelGuideBlock.closing;
  if (!experienceHome.travelGuideBlock?.chatLabel) travelGuidePatch.chatLabel = defaults.travelGuideBlock.chatLabel;
  if (!experienceHome.travelGuideBlock?.chatPrompt) travelGuidePatch.chatPrompt = defaults.travelGuideBlock.chatPrompt;
  if (!experienceHome.travelGuideBlock?.linkLabel) travelGuidePatch.linkLabel = defaults.travelGuideBlock.linkLabel;
  if (!experienceHome.travelGuideBlock?.linkHref) travelGuidePatch.linkHref = defaults.travelGuideBlock.linkHref;
  if (Object.keys(travelGuidePatch).length) {
    applySection("travelGuideBlock", { ...(experienceHome.travelGuideBlock ?? {}), ...travelGuidePatch });
  }

  const visitFactoryPatch: Record<string, unknown> = {};
  if (!experienceHome.visitFactorySection?.heading) visitFactoryPatch.heading = defaults.visitFactorySection.heading;
  if (!experienceHome.visitFactorySection?.subheading) visitFactoryPatch.subheading = defaults.visitFactorySection.subheading;
  if (!experienceHome.visitFactorySection?.introHtml) visitFactoryPatch.introHtml = defaults.visitFactorySection.introHtml;
  if (!experienceHome.visitFactorySection?.locationName) visitFactoryPatch.locationName = defaults.visitFactorySection.locationName;
  if (!experienceHome.visitFactorySection?.address) visitFactoryPatch.address = defaults.visitFactorySection.address;
  if (!experienceHome.visitFactorySection?.hours) visitFactoryPatch.hours = defaults.visitFactorySection.hours;
  if (!experienceHome.visitFactorySection?.notes) visitFactoryPatch.notes = defaults.visitFactorySection.notes;
  if (!experienceHome.visitFactorySection?.mapEmbedHtml) visitFactoryPatch.mapEmbedHtml = defaults.visitFactorySection.mapEmbedHtml;
  if (!experienceHome.visitFactorySection?.whatToExpect?.length) visitFactoryPatch.whatToExpect = defaults.visitFactorySection.whatToExpect;
  if (!experienceHome.visitFactorySection?.ctaLabel) visitFactoryPatch.ctaLabel = defaults.visitFactorySection.ctaLabel;
  if (!experienceHome.visitFactorySection?.ctaHref) visitFactoryPatch.ctaHref = defaults.visitFactorySection.ctaHref;
  if (Object.keys(visitFactoryPatch).length) {
    applySection("visitFactorySection", { ...(experienceHome.visitFactorySection ?? {}), ...visitFactoryPatch });
  }

  const bookingPatch: Record<string, unknown> = {};
  if (!experienceHome.bookingSection?.heading) bookingPatch.heading = defaults.bookingSection.heading;
  if (!experienceHome.bookingSection?.subheading) bookingPatch.subheading = defaults.bookingSection.subheading;
  if (!experienceHome.bookingSection?.options?.length) bookingPatch.options = defaults.bookingSection.options;
  if (!experienceHome.bookingSection?.optionCtaLabel) bookingPatch.optionCtaLabel = defaults.bookingSection.optionCtaLabel;
  const schedulerPatch: Record<string, unknown> = {};
  const currentScheduler = experienceHome.bookingSection?.scheduler;
  if (!currentScheduler?.title) schedulerPatch.title = defaults.bookingSection.scheduler.title;
  if (!currentScheduler?.helperText) schedulerPatch.helperText = defaults.bookingSection.scheduler.helperText;
  if (!currentScheduler?.toggleOpenLabel) schedulerPatch.toggleOpenLabel = defaults.bookingSection.scheduler.toggleOpenLabel;
  if (!currentScheduler?.toggleCloseLabel) schedulerPatch.toggleCloseLabel = defaults.bookingSection.scheduler.toggleCloseLabel;
  if (!currentScheduler?.iframeSrc) schedulerPatch.iframeSrc = defaults.bookingSection.scheduler.iframeSrc;
  if (!currentScheduler?.iframeTitle) schedulerPatch.iframeTitle = defaults.bookingSection.scheduler.iframeTitle;
  if (!currentScheduler?.fallbackHref) schedulerPatch.fallbackHref = defaults.bookingSection.scheduler.fallbackHref;
  if (Object.keys(schedulerPatch).length) {
    bookingPatch.scheduler = { ...(currentScheduler ?? {}), ...schedulerPatch };
  }
  if (Object.keys(bookingPatch).length) {
    applySection("bookingSection", { ...(experienceHome.bookingSection ?? {}), ...bookingPatch });
  }

  const travelUiPatch: Record<string, unknown> = {};
  if (!experienceHome.travelNetworkUi?.title) travelUiPatch.title = defaults.travelNetworkUi.title;
  if (!experienceHome.travelNetworkUi?.lead) travelUiPatch.lead = defaults.travelNetworkUi.lead;
  if (!experienceHome.travelNetworkUi?.supporting) travelUiPatch.supporting = defaults.travelNetworkUi.supporting;
  if (!experienceHome.travelNetworkUi?.scheduleTabLabel) travelUiPatch.scheduleTabLabel = defaults.travelNetworkUi.scheduleTabLabel;
  if (!experienceHome.travelNetworkUi?.dealersTabLabel) travelUiPatch.dealersTabLabel = defaults.travelNetworkUi.dealersTabLabel;
  if (!experienceHome.travelNetworkUi?.emptyScheduleText) travelUiPatch.emptyScheduleText = defaults.travelNetworkUi.emptyScheduleText;
  if (!experienceHome.travelNetworkUi?.emptyDealersText) travelUiPatch.emptyDealersText = defaults.travelNetworkUi.emptyDealersText;
  if (Object.keys(travelUiPatch).length) {
    applySection("travelNetworkUi", { ...(experienceHome.travelNetworkUi ?? {}), ...travelUiPatch });
  }

  const mosaicUiPatch: Record<string, unknown> = {};
  if (!experienceHome.mosaicUi?.eyebrow) mosaicUiPatch.eyebrow = defaults.mosaicUi.eyebrow;
  if (!experienceHome.mosaicUi?.heading) mosaicUiPatch.heading = defaults.mosaicUi.heading;
  if (Object.keys(mosaicUiPatch).length) {
    applySection("mosaicUi", { ...(experienceHome.mosaicUi ?? {}), ...mosaicUiPatch });
  }

  if (seeded.length === 0) {
    console.log("experienceHome already has picker UI, FAQ, concierge blocks, visit factory, booking, travel network, and mosaic UI populated. No changes written.");
    return;
  }

  const result = await client.patch(experienceHome._id).set(patch).commit();
  console.log(`Seeded sections: ${seeded.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
