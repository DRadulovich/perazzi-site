import { cache } from "react";

import { serviceData } from "@/content/service";
import { overview as overviewFixture } from "@/content/service/overview";
import { maintenanceGuides as guidesFixture } from "@/content/service/guides";
import { partsEditorial as partsFixture } from "@/content/service/parts";
import { faq as faqFixture } from "@/content/service/faq";
import type {
  FAQItem,
  GuideDownload,
  PartEditorial,
  ServiceGuidanceBlock,
  ServiceOverviewSection,
  ServicePageData,
} from "@/types/service";
import { getRecommendedServiceCenters, getServiceHome } from "@/sanity/queries/service";

const warn = (message: string) => {
  console.warn(`[sanity][service] ${message}`);
};

function cloneService(): ServicePageData {
  return JSON.parse(JSON.stringify(serviceData));
}

const listToHtml = (items: string[]) =>
  `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

function mergeOverview(
  fallback: ServiceOverviewSection,
  cms?: ServiceOverviewSection,
): ServiceOverviewSection {
  const checks = cms?.checks?.length ? cms.checks : fallback.checks;
  const checksHtml =
    cms?.checks?.length ? listToHtml(cms.checks) : cms?.checksHtml ?? fallback.checksHtml ?? (checks ? listToHtml(checks) : "");

  return {
    heading: cms?.heading ?? fallback.heading ?? "Overview",
    subheading: cms?.subheading ?? fallback.subheading ?? "Factory-level care, wherever you are",
    introHtml: cms?.introHtml ?? fallback.introHtml ?? overviewFixture.introHtml,
    checksHeading: cms?.checksHeading ?? fallback.checksHeading ?? "Standard checks",
    checks,
    checksHtml,
  };
}

function mergeGuidance(fallback: ServiceGuidanceBlock, cms?: ServiceGuidanceBlock): ServiceGuidanceBlock {
  return {
    eyebrow: cms?.eyebrow ?? fallback.eyebrow,
    body: cms?.body ?? fallback.body,
    chatLabel: cms?.chatLabel ?? fallback.chatLabel,
    chatPrompt: cms?.chatPrompt ?? fallback.chatPrompt,
  };
}

function mergeGuides(
  fallback: GuideDownload[],
  cms?: GuideDownload[],
): GuideDownload[] {
  const base = fallback.length ? fallback : guidesFixture;
  if (cms?.length) {
    return cms.map((guide, index) => ({
      id: guide.id ?? guide.title ?? `guide-${index}`,
      title: guide.title,
      summaryHtml: guide.summaryHtml,
      fileUrl: guide.fileUrl,
      fileSize: guide.fileSize,
    }));
  }
  return base;
}

function mergeParts(
  fallback: PartEditorial[],
  cms?: PartEditorial[],
): PartEditorial[] {
  const base = fallback.length ? fallback : partsFixture;
  if (cms?.length) {
    return cms.map((part, index) => ({
      name: part.name ?? `Part ${index + 1}`,
      purpose: part.purpose ?? "",
      fitment: part.fitment ?? "",
      notesHtml: part.notesHtml,
    }));
  }
  return base;
}

function mergeFaq(
  fallback: FAQItem[],
  cmsItems?: FAQItem[],
): FAQItem[] {
  const base = fallback.length ? fallback : faqFixture;
  if (cmsItems?.length) {
    return cmsItems.map((item) => ({
      q: item.q,
      aHtml: item.aHtml,
    }));
  }
  return base;
}

export const getServicePageData = cache(async (): Promise<ServicePageData> => {
  const data = cloneService();

  try {
    const [cms, serviceCenters] = await Promise.all([getServiceHome(), getRecommendedServiceCenters()]);
    if (cms?.hero?.background) {
      data.hero = {
        title: cms.hero.title ?? data.hero.title,
        subheading: cms.hero.subheading ?? data.hero.subheading,
        background: cms.hero.background,
      };
    }

    data.overviewSection = mergeOverview(data.overviewSection, cms?.overviewSection);
    data.serviceGuidanceBlock = mergeGuidance(data.serviceGuidanceBlock, cms?.serviceGuidanceBlock);
    data.shippingPrepBlock = mergeGuidance(data.shippingPrepBlock, cms?.shippingPrepBlock);

    data.networkFinderUi = {
      heading: cms?.networkFinderUi?.heading ?? data.networkFinderUi.heading,
      subheading: cms?.networkFinderUi?.subheading ?? data.networkFinderUi.subheading,
      primaryButtonLabel: cms?.networkFinderUi?.primaryButtonLabel ?? data.networkFinderUi.primaryButtonLabel,
      detailsButtonLabel: cms?.networkFinderUi?.detailsButtonLabel ?? data.networkFinderUi.detailsButtonLabel,
      directionsButtonLabel: cms?.networkFinderUi?.directionsButtonLabel ?? data.networkFinderUi.directionsButtonLabel,
    };

    data.maintenanceSection = {
      heading: cms?.maintenanceSection?.heading ?? data.maintenanceSection.heading,
      subheading: cms?.maintenanceSection?.subheading ?? data.maintenanceSection.subheading,
      overviewHtml: cms?.maintenanceSection?.overviewHtml ?? data.maintenanceSection.overviewHtml ?? overviewFixture.checksHtml,
      columnLabels: cms?.maintenanceSection?.columnLabels?.length
        ? cms.maintenanceSection.columnLabels
        : data.maintenanceSection.columnLabels,
    };

    data.partsEditorialSection = {
      heading: cms?.partsEditorialSection?.heading ?? data.partsEditorialSection.heading,
      intro: cms?.partsEditorialSection?.intro ?? data.partsEditorialSection.intro,
      parts: mergeParts(data.partsEditorialSection.parts, cms?.partsEditorialSection?.parts),
    };

    data.integrityAdvisory = {
      heading: cms?.integrityAdvisory?.heading ?? data.integrityAdvisory.heading,
      body: cms?.integrityAdvisory?.body ?? data.integrityAdvisory.body,
    };

    data.serviceRequestBlock = {
      title: cms?.serviceRequestBlock?.title ?? data.serviceRequestBlock.title,
      description: cms?.serviceRequestBlock?.description ?? data.serviceRequestBlock.description,
      buttonLabel: cms?.serviceRequestBlock?.buttonLabel ?? data.serviceRequestBlock.buttonLabel,
      embedUrl: cms?.serviceRequestBlock?.embedUrl ?? data.serviceRequestBlock.embedUrl,
      fallbackUrl: cms?.serviceRequestBlock?.fallbackUrl ?? data.serviceRequestBlock.fallbackUrl,
    };

    data.partsRequestBlock = {
      title: cms?.partsRequestBlock?.title ?? data.partsRequestBlock.title,
      description: cms?.partsRequestBlock?.description ?? data.partsRequestBlock.description,
      primaryButtonLabel: cms?.partsRequestBlock?.primaryButtonLabel ?? data.partsRequestBlock.primaryButtonLabel,
      secondaryButtonLabel: cms?.partsRequestBlock?.secondaryButtonLabel ?? data.partsRequestBlock.secondaryButtonLabel,
      embedUrl: cms?.partsRequestBlock?.embedUrl ?? data.partsRequestBlock.embedUrl,
      fallbackUrl: cms?.partsRequestBlock?.fallbackUrl ?? data.partsRequestBlock.fallbackUrl,
    };

    data.guidesSection = {
      heading: cms?.guidesSection?.heading ?? data.guidesSection.heading,
      careGuidesLabel: cms?.guidesSection?.careGuidesLabel ?? data.guidesSection.careGuidesLabel,
      downloadsLabel: cms?.guidesSection?.downloadsLabel ?? data.guidesSection.downloadsLabel,
      downloadButtonLabel: cms?.guidesSection?.downloadButtonLabel ?? data.guidesSection.downloadButtonLabel,
      guides: mergeGuides(data.guidesSection.guides, cms?.guidesSection?.guides),
    };

    data.faqSection = {
      heading: cms?.faqSection?.heading ?? data.faqSection.heading,
      intro: cms?.faqSection?.intro ?? data.faqSection.intro,
      items: mergeFaq(data.faqSection.items, cms?.faqSection?.items),
    };

    if (serviceCenters.length) {
      data.locations = serviceCenters.map((center) => ({
        id: center.id,
        name: center.centerName,
        type: "Service Center",
        addressHtml: `<p>${center.address}<br/>${center.city}</p>`,
        city: center.city,
        state: center.state,
        phone: center.phone,
        contact: center.contact,
        mapQuery: `${center.address} ${center.city}`,
      }));
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
