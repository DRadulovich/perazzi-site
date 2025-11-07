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

export interface DemoEvent {
  id: string;
  date: string;
  clubName: string;
  cityState: string;
  href?: string;
}

export interface DemoProgramData {
  introHtml: string;
  events?: DemoEvent[];
  requestCta: { label: string; href: string };
  whatToExpectHtml?: string;
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
  demo: DemoProgramData;
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
