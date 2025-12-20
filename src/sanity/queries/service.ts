import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import type {
  FAQItem,
  GuidesSection,
  MaintenanceSection,
  NetworkFinderUi,
  PartsEditorialSection,
  PartsRequestBlock,
  ServiceGuidanceBlock,
  ServiceOverviewSection,
  ServiceRequestBlock,
} from "@/types/service";
import { sanityFetch } from "../lib/live";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type ServiceHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  overviewSection?: {
    heading?: string;
    subheading?: string;
    introHtml?: string;
    checksHeading?: string;
    checks?: string[];
    checksHtml?: string;
  };
  serviceGuidanceBlock?: ServiceGuidanceBlock;
  shippingPrepBlock?: ServiceGuidanceBlock;
  networkFinderUi?: NetworkFinderUi;
  maintenanceSection?: MaintenanceSection;
  partsEditorialSection?: {
    heading?: string;
    intro?: string;
    parts?: Array<{
      name?: string;
      purpose?: string;
      fitment?: string;
      notesHtml?: string;
    }>;
  };
  integrityAdvisory?: {
    heading?: string;
    body?: string;
  };
  serviceRequestBlock?: ServiceRequestBlock;
  partsRequestBlock?: PartsRequestBlock;
  guidesSection?: {
    heading?: string;
    careGuidesLabel?: string;
    downloadsLabel?: string;
    downloadButtonLabel?: string;
    guides?: Array<{
      title?: string;
      summaryHtml?: string;
      fileUrl?: string;
      fileSize?: string;
    }>;
  };
  faqSection?: {
    heading?: string;
    intro?: string;
    items?: Array<{ question?: string; answerHtml?: string }>;
  };
};

type RecommendedServiceCenterResponse = {
  _id?: string;
  centerName?: string;
  state?: string;
  address?: string;
  city?: string;
  phone?: string;
  contact?: string;
};

export interface ServiceHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  overviewSection?: ServiceOverviewSection;
  serviceGuidanceBlock?: ServiceGuidanceBlock;
  shippingPrepBlock?: ServiceGuidanceBlock;
  networkFinderUi?: NetworkFinderUi;
  maintenanceSection?: MaintenanceSection;
  partsEditorialSection?: PartsEditorialSection;
  integrityAdvisory?: {
    heading?: string;
    body?: string;
  };
  serviceRequestBlock?: ServiceRequestBlock;
  partsRequestBlock?: PartsRequestBlock;
  guidesSection?: GuidesSection;
  faqSection?: {
    heading?: string;
    intro?: string;
    items?: FAQItem[];
  };
}

export interface RecommendedServiceCenterPayload {
  id: string;
  centerName: string;
  address: string;
  city: string;
  state?: string;
  phone?: string;
  contact?: string;
}

const serviceHomeQuery = groq`
  *[_type == "serviceHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    overviewSection{
      heading,
      subheading,
      introHtml,
      checksHeading,
      checks[]
    },
    serviceGuidanceBlock{
      eyebrow,
      body,
      chatLabel,
      chatPrompt
    },
    shippingPrepBlock{
      eyebrow,
      body,
      chatLabel,
      chatPrompt
    },
    networkFinderUi{
      heading,
      subheading,
      primaryButtonLabel,
      detailsButtonLabel,
      directionsButtonLabel
    },
    maintenanceSection{
      heading,
      subheading,
      overviewHtml,
      columnLabels[]
    },
    partsEditorialSection{
      heading,
      intro,
      parts[]{
        name,
        purpose,
        fitment,
        notesHtml
      }
    },
    integrityAdvisory{
      heading,
      body
    },
    serviceRequestBlock{
      title,
      description,
      buttonLabel,
      embedUrl,
      fallbackUrl
    },
    partsRequestBlock{
      title,
      description,
      primaryButtonLabel,
      secondaryButtonLabel,
      embedUrl,
      fallbackUrl
    },
    guidesSection{
      heading,
      careGuidesLabel,
      downloadsLabel,
      downloadButtonLabel,
      guides[]{
        title,
        summaryHtml,
        fileUrl,
        fileSize
      }
    },
    faqSection{
      heading,
      intro,
      items[]{
        question,
        answerHtml
      }
    }
  }
`;

const recommendedServiceCentersQuery = groq`
  *[_type == "recommendedServiceCenter"] | order(state asc, centerName asc){
    _id,
    centerName,
    state,
    address,
    city,
    phone,
    contact
  }
`;

export async function getServiceHome(): Promise<ServiceHomePayload | null> {
  const result = await sanityFetch({
    query: serviceHomeQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ServiceHomeResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
    overviewSection: data.overviewSection
      ? {
          heading: data.overviewSection.heading ?? undefined,
          subheading: data.overviewSection.subheading ?? undefined,
          introHtml: data.overviewSection.introHtml ?? "",
          checksHeading: data.overviewSection.checksHeading ?? undefined,
          checks: data.overviewSection.checks ?? undefined,
          checksHtml: data.overviewSection.checksHtml ?? undefined,
        }
      : undefined,
    serviceGuidanceBlock: data.serviceGuidanceBlock ?? undefined,
    shippingPrepBlock: data.shippingPrepBlock ?? undefined,
    networkFinderUi: data.networkFinderUi ?? undefined,
    maintenanceSection: data.maintenanceSection ?? undefined,
    partsEditorialSection: data.partsEditorialSection
      ? {
          heading: data.partsEditorialSection.heading ?? undefined,
          intro: data.partsEditorialSection.intro ?? undefined,
          parts:
            data.partsEditorialSection.parts?.map((part) => ({
              name: part.name ?? "",
              purpose: part.purpose ?? "",
              fitment: part.fitment ?? "",
              notesHtml: part.notesHtml ?? undefined,
            })) ?? [],
        }
      : undefined,
    integrityAdvisory: data.integrityAdvisory ?? undefined,
    serviceRequestBlock: data.serviceRequestBlock ?? undefined,
    partsRequestBlock: data.partsRequestBlock ?? undefined,
    guidesSection: data.guidesSection
      ? {
          heading: data.guidesSection.heading ?? undefined,
          careGuidesLabel: data.guidesSection.careGuidesLabel ?? undefined,
          downloadsLabel: data.guidesSection.downloadsLabel ?? undefined,
          downloadButtonLabel: data.guidesSection.downloadButtonLabel ?? undefined,
          guides:
            data.guidesSection.guides?.map((guide, index) => ({
              id: guide.title ? `${guide.title}-${index}` : `guide-${index}`,
              title: guide.title ?? "",
              summaryHtml: guide.summaryHtml ?? "",
              fileUrl: guide.fileUrl ?? "",
              fileSize: guide.fileSize ?? undefined,
            })) ?? [],
        }
      : undefined,
    faqSection: data.faqSection
      ? {
          heading: data.faqSection.heading ?? undefined,
          intro: data.faqSection.intro ?? undefined,
          items:
            data.faqSection.items
              ?.map((item) => {
                if (!item.question && !item?.answerHtml) return null;
                return { q: item.question ?? "", aHtml: item.answerHtml ?? "" };
              })
              .filter(Boolean) as FAQItem[] | undefined,
        }
      : undefined,
  };
}

export async function getRecommendedServiceCenters(): Promise<RecommendedServiceCenterPayload[]> {
  const result = await sanityFetch({
    query: recommendedServiceCentersQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as RecommendedServiceCenterResponse[] | null) ?? null;

  return (
    data
      ?.filter(
        (center): center is RecommendedServiceCenterResponse & { _id: string; centerName: string; address: string; city: string } =>
          Boolean(center._id && center?.centerName && center?.address && center?.city),
      )
      .map((center) => ({
        id: center._id as string,
        centerName: center.centerName as string,
        address: center.address as string,
        city: center.city as string,
        state: center.state ?? undefined,
        phone: center.phone ?? undefined,
        contact: center.contact ?? undefined,
      })) ?? []
  );
}
