import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import type { ConciergeBlock, ExperienceNetworkData } from "@/types/experience";
import { sanityFetch } from "../lib/live";
import { imageFields, imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type ConciergeBlockResponse = {
  heading?: string | null;
  intro?: string | null;
  bullets?: string[] | null;
  closing?: string | null;
  chatLabel?: string | null;
  chatPrompt?: string | null;
  linkLabel?: string | null;
  linkHref?: string | null;
};

type ExperienceHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  picker?: Array<{
    _key?: string;
    title?: string;
    summary?: string;
    href?: string;
    media?: SanityImageResult;
  }>;
  pickerUi?: {
    heading?: string;
    subheading?: string;
    microLabel?: string;
    backgroundImage?: SanityImageResult;
    defaultCtaLabel?: string;
    defaultCtaHref?: string;
  };
  faqSection?: {
    heading?: string;
    lead?: string;
    items?: Array<{ question?: string; answerHtml?: string }>;
  };
  visitPlanningBlock?: ConciergeBlockResponse | null;
  fittingGuidanceBlock?: ConciergeBlockResponse | null;
  travelGuideBlock?: ConciergeBlockResponse | null;
  visitFactorySection?: {
    heading?: string;
    subheading?: string;
    backgroundImage?: SanityImageResult;
    introHtml?: string;
    locationName?: string;
    address?: string;
    hours?: string;
    notes?: string;
    mapEmbedHtml?: string;
    whatToExpect?: string[];
    ctaLabel?: string;
    ctaHref?: string;
  } | null;
  bookingSection?: {
    heading?: string;
    subheading?: string;
    options?: Array<{
      _key?: string;
      title?: string;
      durationLabel?: string;
      descriptionHtml?: string;
      href?: string;
    }>;
    optionCtaLabel?: string;
    scheduler?: {
      title?: string;
      helperText?: string;
      toggleOpenLabel?: string;
      toggleCloseLabel?: string;
      iframeSrc?: string;
      iframeTitle?: string;
      fallbackHref?: string;
    } | null;
  } | null;
  travelNetworkUi?: {
    title?: string;
    lead?: string;
    supporting?: string;
    scheduleTabLabel?: string;
    dealersTabLabel?: string;
    emptyScheduleText?: string;
    emptyDealersText?: string;
    backgroundImage?: SanityImageResult;
  } | null;
  mosaicUi?: {
    eyebrow?: string;
    heading?: string;
  } | null;
  mosaic?: SanityImageResult[];
};

type ExperienceNetworkResponse = {
  scheduledEvents?: Array<{
    _id?: string;
    eventName?: string;
    eventLocation?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  }>;
  dealers?: Array<{
    _id?: string;
    dealerName?: string;
    state?: string;
    address?: string;
    city?: string;
  }>;
  serviceCenters?: Array<{
    _id?: string;
    centerName?: string;
    state?: string;
    address?: string;
    city?: string;
    phone?: string;
    contact?: string;
  }>;
};

export interface ExperienceHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  picker?: Array<{
    id: string;
    title?: string;
    summary?: string;
    href?: string;
    media?: FactoryAsset;
  }>;
  pickerUi?: {
    heading?: string;
    subheading?: string;
    microLabel?: string;
    backgroundImage?: FactoryAsset;
    defaultCtaLabel?: string;
    defaultCtaHref?: string;
  };
  faqSection?: {
    heading?: string;
    lead?: string;
    items?: Array<{ question?: string; answerHtml?: string }>;
  };
  visitPlanningBlock?: ConciergeBlock;
  fittingGuidanceBlock?: ConciergeBlock;
  travelGuideBlock?: ConciergeBlock;
  visitFactorySection?: {
    heading?: string;
    subheading?: string;
    backgroundImage?: FactoryAsset;
    introHtml?: string;
    locationName?: string;
    address?: string;
    hours?: string;
    notes?: string;
    mapEmbedHtml?: string;
    whatToExpect?: string[];
    ctaLabel?: string;
    ctaHref?: string;
  };
  bookingSection?: {
    heading?: string;
    subheading?: string;
    options?: Array<{
      id?: string;
      title?: string;
      durationLabel?: string;
      descriptionHtml?: string;
      href?: string;
    }>;
    optionCtaLabel?: string;
    scheduler?: {
      title?: string;
      helperText?: string;
      toggleOpenLabel?: string;
      toggleCloseLabel?: string;
      iframeSrc?: string;
      iframeTitle?: string;
      fallbackHref?: string;
    };
  };
  travelNetworkUi?: {
    title?: string;
    lead?: string;
    supporting?: string;
    scheduleTabLabel?: string;
    dealersTabLabel?: string;
    emptyScheduleText?: string;
    emptyDealersText?: string;
    backgroundImage?: FactoryAsset;
  };
  mosaicUi?: {
    eyebrow?: string;
    heading?: string;
  };
  mosaic?: FactoryAsset[];
}

const experienceHomeQuery = groq`
  *[_type == "experienceHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    picker[]{
      _key,
      title,
      summary,
      href,
      media{
        ${imageWithMetaFields}
      }
    },
    pickerUi{
      heading,
      subheading,
      microLabel,
      backgroundImage{
        ${imageFields}
      },
      defaultCtaLabel,
      defaultCtaHref
    },
    faqSection{
      heading,
      lead,
      items[]{
        question,
        answerHtml
      }
    },
    visitPlanningBlock{
      heading,
      intro,
      bullets[],
      closing,
      chatLabel,
      chatPrompt,
      linkLabel,
      linkHref
    },
    fittingGuidanceBlock{
      heading,
      intro,
      bullets[],
      closing,
      chatLabel,
      chatPrompt,
      linkLabel,
      linkHref
    },
    travelGuideBlock{
      heading,
      intro,
      bullets[],
      closing,
      chatLabel,
      chatPrompt,
      linkLabel,
      linkHref
    },
    visitFactorySection{
      heading,
      subheading,
      backgroundImage{
        ${imageFields}
      },
      introHtml,
      locationName,
      address,
      hours,
      notes,
      mapEmbedHtml,
      whatToExpect[],
      ctaLabel,
      ctaHref
    },
    bookingSection{
      heading,
      subheading,
      options[]{
        _key,
        title,
        durationLabel,
        descriptionHtml,
        href
      },
      optionCtaLabel,
      scheduler{
        title,
        helperText,
        toggleOpenLabel,
        toggleCloseLabel,
        iframeSrc,
        iframeTitle,
        fallbackHref
      }
    },
    travelNetworkUi{
      title,
      lead,
      supporting,
      scheduleTabLabel,
      dealersTabLabel,
      emptyScheduleText,
      emptyDealersText,
      backgroundImage{
        ${imageFields}
      }
    },
    mosaicUi{
      eyebrow,
      heading
    },
    mosaic[]{
      ${imageWithMetaFields}
    }
  }
`;

const experienceNetworkQuery = groq`
{
  "scheduledEvents": *[_type == "scheduledEvent"] | order(startDate asc, endDate asc) {
    _id,
    eventName,
    eventLocation,
    startDate,
    endDate,
    location
  },
  "dealers": *[_type == "authorizedDealer"] | order(state asc, dealerName asc) {
    _id,
    dealerName,
    state,
    address,
    city
  },
  "serviceCenters": *[_type == "recommendedServiceCenter"] | order(state asc, centerName asc) {
    _id,
    centerName,
    state,
    address,
    city,
    phone,
    contact
  }
}
`;

function mapConciergeBlock(block?: ConciergeBlockResponse | null): ConciergeBlock | undefined {
  if (!block) return undefined;

  return {
    heading: block.heading ?? undefined,
    intro: block.intro ?? undefined,
    bullets: block.bullets ?? undefined,
    closing: block.closing ?? undefined,
    chatLabel: block.chatLabel ?? undefined,
    chatPrompt: block.chatPrompt ?? undefined,
    linkLabel: block.linkLabel ?? undefined,
    linkHref: block.linkHref ?? undefined,
  };
}

export async function getExperienceHome(): Promise<ExperienceHomePayload | null> {
  const result = await sanityFetch({
    query: experienceHomeQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ExperienceHomeResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
    picker: data.picker
      ?.filter((item): item is typeof item & { _key: string } => Boolean(item._key))
      .map((item) => ({
        id: item._key,
        title: item.title ?? undefined,
        summary: item.summary ?? undefined,
        href: item.href ?? undefined,
        media: mapImageResult(item.media ?? null),
      })),
    pickerUi: data.pickerUi
      ? {
          heading: data.pickerUi.heading ?? undefined,
          subheading: data.pickerUi.subheading ?? undefined,
          microLabel: data.pickerUi.microLabel ?? undefined,
          backgroundImage: mapImageResult(data.pickerUi.backgroundImage ?? null),
          defaultCtaLabel: data.pickerUi.defaultCtaLabel ?? undefined,
          defaultCtaHref: data.pickerUi.defaultCtaHref ?? undefined,
        }
      : undefined,
    faqSection: data.faqSection
      ? {
          heading: data.faqSection.heading ?? undefined,
          lead: data.faqSection.lead ?? undefined,
          items: data.faqSection.items?.map((item) => ({
            question: item.question ?? undefined,
            answerHtml: item.answerHtml ?? undefined,
          })),
        }
      : undefined,
    visitPlanningBlock: mapConciergeBlock(data.visitPlanningBlock),
    fittingGuidanceBlock: mapConciergeBlock(data.fittingGuidanceBlock),
    travelGuideBlock: mapConciergeBlock(data.travelGuideBlock),
    visitFactorySection: data.visitFactorySection
      ? {
          heading: data.visitFactorySection.heading ?? undefined,
          subheading: data.visitFactorySection.subheading ?? undefined,
          backgroundImage: mapImageResult(data.visitFactorySection.backgroundImage ?? null),
          introHtml: data.visitFactorySection.introHtml ?? undefined,
          locationName: data.visitFactorySection.locationName ?? undefined,
          address: data.visitFactorySection.address ?? undefined,
          hours: data.visitFactorySection.hours ?? undefined,
          notes: data.visitFactorySection.notes ?? undefined,
          mapEmbedHtml: data.visitFactorySection.mapEmbedHtml ?? undefined,
          whatToExpect: data.visitFactorySection.whatToExpect ?? undefined,
          ctaLabel: data.visitFactorySection.ctaLabel ?? undefined,
          ctaHref: data.visitFactorySection.ctaHref ?? undefined,
        }
      : undefined,
    bookingSection: data.bookingSection
      ? {
          heading: data.bookingSection.heading ?? undefined,
          subheading: data.bookingSection.subheading ?? undefined,
          options: data.bookingSection.options?.map((option) => ({
            id: option._key ?? undefined,
            title: option.title ?? undefined,
            durationLabel: option.durationLabel ?? undefined,
            descriptionHtml: option.descriptionHtml ?? undefined,
            href: option.href ?? undefined,
          })),
          optionCtaLabel: data.bookingSection.optionCtaLabel ?? undefined,
          scheduler: data.bookingSection.scheduler
            ? {
                title: data.bookingSection.scheduler.title ?? undefined,
                helperText: data.bookingSection.scheduler.helperText ?? undefined,
                toggleOpenLabel: data.bookingSection.scheduler.toggleOpenLabel ?? undefined,
                toggleCloseLabel: data.bookingSection.scheduler.toggleCloseLabel ?? undefined,
                iframeSrc: data.bookingSection.scheduler.iframeSrc ?? undefined,
                iframeTitle: data.bookingSection.scheduler.iframeTitle ?? undefined,
                fallbackHref: data.bookingSection.scheduler.fallbackHref ?? undefined,
              }
            : undefined,
        }
      : undefined,
    travelNetworkUi: data.travelNetworkUi
      ? {
          title: data.travelNetworkUi.title ?? undefined,
          lead: data.travelNetworkUi.lead ?? undefined,
          supporting: data.travelNetworkUi.supporting ?? undefined,
          scheduleTabLabel: data.travelNetworkUi.scheduleTabLabel ?? undefined,
          dealersTabLabel: data.travelNetworkUi.dealersTabLabel ?? undefined,
          emptyScheduleText: data.travelNetworkUi.emptyScheduleText ?? undefined,
          emptyDealersText: data.travelNetworkUi.emptyDealersText ?? undefined,
          backgroundImage: mapImageResult(data.travelNetworkUi.backgroundImage ?? null),
        }
      : undefined,
    mosaicUi: data.mosaicUi
      ? {
          eyebrow: data.mosaicUi.eyebrow ?? undefined,
          heading: data.mosaicUi.heading ?? undefined,
        }
      : undefined,
    mosaic: data.mosaic
      ?.map((asset) => mapImageResult(asset ?? null))
      .filter(Boolean) as FactoryAsset[] | undefined,
  };
}

export async function getExperienceNetworkData(): Promise<ExperienceNetworkData> {
  const result = await sanityFetch({
    query: experienceNetworkQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ExperienceNetworkResponse | null) ?? null;

  const scheduledEvents = (data?.scheduledEvents ?? [])
    .map((item) => {
      if (!item._id || !item.eventName || !item.eventLocation) return null;
      return {
        _id: item._id,
        eventName: item.eventName,
        eventLocation: item.eventLocation,
        startDate: item.startDate ?? undefined,
        endDate: item.endDate ?? undefined,
        location: item.location ?? undefined,
      };
    })
    .filter(Boolean) as ExperienceNetworkData["scheduledEvents"];

  const dealers = (data?.dealers ?? [])
    .map((item) => {
      if (!item._id || !item.dealerName || !item.state) return null;
      return {
        _id: item._id,
        dealerName: item.dealerName,
        state: item.state,
        address: item.address ?? "",
        city: item.city ?? "",
      };
    })
    .filter(Boolean) as ExperienceNetworkData["dealers"];

  const serviceCenters = (data?.serviceCenters ?? [])
    .map((item) => {
      if (!item._id || !item.centerName || !item.state) return null;
      return {
        _id: item._id,
        centerName: item.centerName,
        state: item.state,
        address: item.address ?? "",
        city: item.city ?? "",
        phone: item.phone ?? "",
        contact: item.contact ?? "",
      };
    })
    .filter(Boolean) as ExperienceNetworkData["serviceCenters"];

  return {
    scheduledEvents,
    dealers,
    serviceCenters,
  };
}
