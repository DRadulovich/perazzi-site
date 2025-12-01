import { cache } from "react";

import { experienceData } from "@/content/experience";
import { picker as pickerFixture } from "@/content/experience/picker";
import { faq as faqFixture } from "@/content/experience/faq";
import { visit as visitFixture } from "@/content/experience/visit";
import { fittingOptions as fittingFixture } from "@/content/experience/fitting";
import { bookingScheduler as schedulerFixture } from "@/content/experience/scheduler";
import type {
  BookingSection,
  BookingScheduler,
  ConciergeBlock,
  ExperiencePageData,
  FAQItem,
  PickerItem,
  VisitFactoryData,
} from "@/types/experience";
import { getExperienceHome, type ExperienceHomePayload } from "@/sanity/queries/experience";

const warn = (message: string) => {
  console.warn(`[sanity][experience] ${message}`);
};

function cloneExperience(): ExperiencePageData {
  return JSON.parse(JSON.stringify(experienceData));
}

type PickerInput = Partial<Omit<PickerItem, "id">> & { id?: string };

function mergePickerItems(
  fallbackItems: PickerItem[],
  incoming?: PickerInput[],
  defaults?: { label?: string; href?: string },
): PickerItem[] {
  if (!incoming?.length) return fallbackItems;
  const fallbackMap = new Map(fallbackItems.map((item) => [item.id, item]));

  return incoming.map((item, index) => {
    const fallback = item.id ? fallbackMap.get(item.id) : fallbackItems[index];
    return {
      id: item.id ?? fallback?.id ?? `picker-${index}`,
      title: item.title ?? fallback?.title ?? "Experience",
      summary: item.summary ?? fallback?.summary ?? "",
      media: item.media ?? fallback?.media ?? fallbackItems[0].media,
      ctaLabel:
        item.ctaLabel ??
        defaults?.label ??
        fallback?.ctaLabel ??
        pickerFixture[index]?.ctaLabel ??
        "Learn more",
      href:
        item.href ??
        defaults?.href ??
        fallback?.href ??
        pickerFixture[index]?.href ??
        "#",
    };
  });
}

function mergeFaqSection(
  fallbackSection: ExperiencePageData["faqSection"],
  cmsSection?: ExperienceHomePayload["faqSection"],
): ExperiencePageData["faqSection"] {
  const items: FAQItem[] = cmsSection?.items?.length
    ? cmsSection.items
        .map((item) => {
          if (!item?.question && !item?.answerHtml) return null;
          return {
            q: item.question ?? "",
            aHtml: item.answerHtml ?? "",
          };
        })
        .filter(Boolean) as FAQItem[]
    : fallbackSection.items?.length
      ? fallbackSection.items
      : faqFixture;

  return {
    heading: cmsSection?.heading ?? fallbackSection.heading ?? "FAQ",
    lead: cmsSection?.lead ?? fallbackSection.lead ?? "Questions from future owners",
    items,
  };
}

function mergeConciergeBlock(
  fallbackBlock: ConciergeBlock,
  cmsBlock?: ConciergeBlock,
): ConciergeBlock {
  return {
    heading: cmsBlock?.heading ?? fallbackBlock.heading,
    intro: cmsBlock?.intro ?? fallbackBlock.intro,
    bullets: cmsBlock?.bullets?.length ? cmsBlock.bullets : fallbackBlock.bullets,
    closing: cmsBlock?.closing ?? fallbackBlock.closing,
    chatLabel: cmsBlock?.chatLabel ?? fallbackBlock.chatLabel,
    chatPrompt: cmsBlock?.chatPrompt ?? fallbackBlock.chatPrompt,
    linkLabel: cmsBlock?.linkLabel ?? fallbackBlock.linkLabel,
    linkHref: cmsBlock?.linkHref ?? fallbackBlock.linkHref,
  };
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const textToHtml = (value?: string) => {
  if (!value) return undefined;
  const escaped = escapeHtml(value.trim());
  if (!escaped) return undefined;
  return `<p>${escaped.replace(/\n+/g, "<br/>")}</p>`;
};

const listToHtml = (items: string[]) =>
  `<ul>${items.map((item) => `<li>${escapeHtml(item.trim())}</li>`).join("")}</ul>`;

const extractIframeSrc = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  return undefined;
};

function mergeVisitFactorySection(
  fallbackSection: VisitFactoryData,
  cmsSection?: ExperienceHomePayload["visitFactorySection"],
): VisitFactoryData {
  const locationName = cmsSection?.locationName ?? fallbackSection.location.name;
  const addressHtml = cmsSection?.address
    ? textToHtml(cmsSection.address) ?? fallbackSection.location.addressHtml
    : fallbackSection.location.addressHtml;
  const hoursHtml = cmsSection?.hours
    ? textToHtml(cmsSection.hours) ?? fallbackSection.location.hoursHtml
    : fallbackSection.location.hoursHtml;
  const notesHtml = cmsSection?.notes
    ? textToHtml(cmsSection.notes) ?? fallbackSection.location.notesHtml
    : fallbackSection.location.notesHtml;
  const mapEmbedSrc = cmsSection?.mapEmbedHtml
    ? extractIframeSrc(cmsSection.mapEmbedHtml) ?? fallbackSection.location.mapEmbedSrc
    : fallbackSection.location.mapEmbedSrc;
  const whatToExpectHtml = cmsSection?.whatToExpect?.length
    ? listToHtml(cmsSection.whatToExpect)
    : fallbackSection.whatToExpectHtml;

  return {
    heading: cmsSection?.heading ?? fallbackSection.heading ?? "Visit Botticino",
    subheading: cmsSection?.subheading ?? fallbackSection.subheading ?? "See the factory in person",
    backgroundImage: cmsSection?.backgroundImage ?? fallbackSection.backgroundImage,
    introHtml: cmsSection?.introHtml ?? fallbackSection.introHtml ?? visitFixture.introHtml,
    location: {
      ...fallbackSection.location,
      name: locationName ?? fallbackSection.location.name,
      addressHtml,
      hoursHtml,
      notesHtml,
      mapEmbedSrc,
    },
    whatToExpectHtml,
    cta: {
      label: cmsSection?.ctaLabel ?? fallbackSection.cta.label ?? visitFixture.cta.label,
      href: cmsSection?.ctaHref ?? fallbackSection.cta.href ?? visitFixture.cta.href,
    },
  };
}

type BookingOptionInput = NonNullable<
  NonNullable<ExperienceHomePayload["bookingSection"]>["options"]
>[number];

type CmsScheduler = NonNullable<ExperienceHomePayload["bookingSection"]>["scheduler"];

const normalizeDuration = <T extends { durationLabel?: string; durationMins?: number }>(
  option: T,
): T => ({
  ...option,
  durationLabel: option.durationLabel ?? (option.durationMins ? `${option.durationMins} minutes` : option.durationLabel),
});

function mergeBookingOptions(
  fallbackOptions: BookingSection["options"],
  incoming?: BookingOptionInput[],
): BookingSection["options"] {
  const preparedFallback = fallbackOptions.map(normalizeDuration);
  if (!incoming?.length) return preparedFallback;

  const fallbackMap = new Map(preparedFallback.map((option) => [option.id, option]));

  return incoming.map((option, index) => {
    const fallback = option?.id ? fallbackMap.get(option.id) : preparedFallback[index];
    const merged = {
      id: option?.id ?? fallback?.id ?? `booking-option-${index}`,
      title: option?.title ?? fallback?.title ?? "Fitting option",
      durationLabel:
        option?.durationLabel ??
        fallback?.durationLabel ??
        (fallback?.durationMins ? `${fallback.durationMins} minutes` : undefined),
      durationMins: fallback?.durationMins,
      descriptionHtml: option?.descriptionHtml ?? fallback?.descriptionHtml ?? "",
      href: option?.href ?? fallback?.href ?? "#",
    };

    return merged;
  });
}

function mergeScheduler(
  fallback: BookingScheduler | undefined,
  cms?: CmsScheduler,
): BookingScheduler | undefined {
  const base: BookingScheduler = fallback ?? {
    title: schedulerFixture.title,
    helperText: "Selecting Begin Your Fitting loads an embedded booking form below.",
    toggleOpenLabel: "Begin Your Fitting",
    toggleCloseLabel: "Hide scheduler",
    src: schedulerFixture.src,
    iframeTitle: schedulerFixture.title,
    fallbackHref: schedulerFixture.fallbackHref,
  };

  return {
    title: cms?.title ?? base.title,
    helperText: cms?.helperText ?? base.helperText,
    toggleOpenLabel: cms?.toggleOpenLabel ?? base.toggleOpenLabel,
    toggleCloseLabel: cms?.toggleCloseLabel ?? base.toggleCloseLabel,
    src: cms?.iframeSrc ?? base.src,
    iframeTitle: cms?.iframeTitle ?? base.iframeTitle ?? base.title,
    fallbackHref: cms?.fallbackHref ?? base.fallbackHref,
  };
}

function mergeBookingSection(
  fallbackSection: BookingSection,
  cmsSection?: ExperienceHomePayload["bookingSection"],
): BookingSection {
  const baseOptions = fallbackSection.options?.length ? fallbackSection.options : fittingFixture;
  const options = cmsSection?.options?.length
    ? mergeBookingOptions(baseOptions, cmsSection.options)
    : mergeBookingOptions(baseOptions);

  return {
    heading: cmsSection?.heading ?? fallbackSection.heading ?? "Book a fitting",
    subheading: cmsSection?.subheading ?? fallbackSection.subheading ?? "Choose the session that fits your journey",
    options,
    optionCtaLabel: cmsSection?.optionCtaLabel ?? fallbackSection.optionCtaLabel ?? "Reserve this session",
    scheduler: mergeScheduler(fallbackSection.scheduler, cmsSection?.scheduler),
  };
}

function mergeTravelNetworkUi(
  fallbackUi: ExperiencePageData["travelNetworkUi"],
  cmsUi?: ExperienceHomePayload["travelNetworkUi"],
): ExperiencePageData["travelNetworkUi"] {
  return {
    title: cmsUi?.title ?? fallbackUi.title,
    lead: cmsUi?.lead ?? fallbackUi.lead,
    supporting: cmsUi?.supporting ?? fallbackUi.supporting,
    scheduleTabLabel: cmsUi?.scheduleTabLabel ?? fallbackUi.scheduleTabLabel,
    dealersTabLabel: cmsUi?.dealersTabLabel ?? fallbackUi.dealersTabLabel,
    emptyScheduleText: cmsUi?.emptyScheduleText ?? fallbackUi.emptyScheduleText,
    emptyDealersText: cmsUi?.emptyDealersText ?? fallbackUi.emptyDealersText,
    backgroundImage: cmsUi?.backgroundImage ?? fallbackUi.backgroundImage,
  };
}

function mergeMosaicUi(
  fallbackUi: ExperiencePageData["mosaicUi"],
  cmsUi?: ExperienceHomePayload["mosaicUi"],
): ExperiencePageData["mosaicUi"] {
  return {
    eyebrow: cmsUi?.eyebrow ?? fallbackUi.eyebrow,
    heading: cmsUi?.heading ?? fallbackUi.heading,
  };
}

export const getExperiencePageData = cache(async (): Promise<ExperiencePageData> => {
  const data = cloneExperience();

  try {
    const cms = await getExperienceHome();

    if (cms?.hero) {
      data.hero = {
        title: cms.hero.title ?? data.hero.title,
        subheading: cms.hero.subheading ?? data.hero.subheading,
        background: cms.hero.background ?? data.hero.background,
      };
    }

    data.pickerUi = {
      heading: data.pickerUi.heading,
      subheading: data.pickerUi.subheading,
      microLabel: data.pickerUi.microLabel,
      backgroundImage: data.pickerUi.backgroundImage,
      defaultCtaLabel: data.pickerUi.defaultCtaLabel ?? pickerFixture[0]?.ctaLabel,
      defaultCtaHref: data.pickerUi.defaultCtaHref ?? pickerFixture[0]?.href,
    };

    if (cms?.pickerUi) {
      data.pickerUi = {
        ...data.pickerUi,
        heading: cms.pickerUi.heading ?? data.pickerUi.heading,
        subheading: cms.pickerUi.subheading ?? data.pickerUi.subheading,
        microLabel: cms.pickerUi.microLabel ?? data.pickerUi.microLabel,
        backgroundImage: cms.pickerUi.backgroundImage ?? data.pickerUi.backgroundImage,
        defaultCtaLabel: cms.pickerUi.defaultCtaLabel ?? data.pickerUi.defaultCtaLabel,
        defaultCtaHref: cms.pickerUi.defaultCtaHref ?? data.pickerUi.defaultCtaHref,
      };
    }

    if (cms?.picker?.length) {
      data.picker = mergePickerItems(data.picker, cms.picker, {
        label: data.pickerUi.defaultCtaLabel,
        href: data.pickerUi.defaultCtaHref,
      });
    }

    data.faqSection = mergeFaqSection(data.faqSection, cms?.faqSection);
    data.visitPlanningBlock = mergeConciergeBlock(data.visitPlanningBlock, cms?.visitPlanningBlock);
    data.fittingGuidanceBlock = mergeConciergeBlock(data.fittingGuidanceBlock, cms?.fittingGuidanceBlock);
    data.travelGuideBlock = mergeConciergeBlock(data.travelGuideBlock, cms?.travelGuideBlock);

    data.visitFactorySection = mergeVisitFactorySection(
      data.visitFactorySection ?? {
        heading: "Visit Botticino",
        subheading: "See the factory in person",
        introHtml: visitFixture.introHtml,
        location: visitFixture.location,
        whatToExpectHtml: visitFixture.whatToExpectHtml,
        cta: visitFixture.cta,
      },
      cms?.visitFactorySection,
    );

    data.bookingSection = mergeBookingSection(data.bookingSection, cms?.bookingSection);
    data.travelNetworkUi = mergeTravelNetworkUi(data.travelNetworkUi, cms?.travelNetworkUi);
    data.mosaicUi = mergeMosaicUi(data.mosaicUi, cms?.mosaicUi);

    if (cms?.mosaic?.length) {
      data.mosaic = cms.mosaic.filter(Boolean) as ExperiencePageData["mosaic"];
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
