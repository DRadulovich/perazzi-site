import type { FactoryAsset } from "../types/content";

export interface ExperienceHero {
  title: string;
  subheading?: string;
  background: FactoryAsset;
}

export interface PickerItem {
  id: string;
  title: string;
  summary: string;
  media: FactoryAsset;
  ctaLabel: string;
  href: string;
}

export interface LocationBlock {
  name: string;
  addressHtml: string;
  mapEmbedSrc?: string;
  staticMap: FactoryAsset;
  mapLinkHref?: string;
  hoursHtml?: string;
  notesHtml?: string;
}

export interface VisitFactoryData {
  introHtml: string;
  location: LocationBlock;
  whatToExpectHtml?: string;
  cta: { label: string; href: string };
}

export interface FittingOption {
  id: string;
  title: string;
  durationMins: number;
  descriptionHtml: string;
  href: string;
}

export interface ScheduledEventEntry {
  _id: string;
  eventName: string;
  eventLocation: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export interface AuthorizedDealerEntry {
  _id: string;
  dealerName: string;
  state: string;
  address: string;
  city: string;
}

export interface RecommendedServiceCenterEntry {
  _id: string;
  centerName: string;
  state: string;
  address: string;
  city: string;
  phone: string;
  contact: string;
}

export interface ExperienceNetworkData {
  scheduledEvents: ScheduledEventEntry[];
  dealers: AuthorizedDealerEntry[];
  serviceCenters: RecommendedServiceCenterEntry[];
}

export interface FAQItem {
  q: string;
  aHtml: string;
}

export interface ExperiencePageData {
  hero: ExperienceHero;
  picker: PickerItem[];
  visit: VisitFactoryData;
  fittingOptions: FittingOption[];
  mosaic: FactoryAsset[];
  faq: FAQItem[];
  finalCta: {
    text: string;
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
  bookingScheduler?: {
    title: string;
    src: string;
    fallbackHref: string;
  };
}
