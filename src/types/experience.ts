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
  heading?: string;
  subheading?: string;
  backgroundImage?: FactoryAsset;
  introHtml: string;
  location: LocationBlock;
  whatToExpectHtml?: string;
  cta: { label: string; href: string };
}

export interface FittingOption {
  id: string;
  title: string;
  durationMins?: number;
  durationLabel?: string;
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

export interface FAQSection {
  heading?: string;
  lead?: string;
  items: FAQItem[];
}

export interface ConciergeBlock {
  heading?: string;
  rightTitle?: string;
  intro?: string;
  bullets?: string[];
  closing?: string;
  chatLabel?: string;
  chatPrompt?: string;
  linkLabel?: string;
  linkHref?: string;
}

export interface PickerUi {
  heading?: string;
  subheading?: string;
  microLabel?: string;
  backgroundImage?: FactoryAsset;
  defaultCtaLabel?: string;
  defaultCtaHref?: string;
}

export interface BookingScheduler {
  title: string;
  helperText?: string;
  toggleOpenLabel: string;
  toggleCloseLabel: string;
  src: string;
  iframeTitle?: string;
  fallbackHref: string;
}

export interface BookingSection {
  heading: string;
  subheading: string;
  options: FittingOption[];
  optionCtaLabel: string;
  scheduler?: BookingScheduler;
}

export interface TravelNetworkUi {
  title?: string;
  lead?: string;
  supporting?: string;
  scheduleTabLabel?: string;
  dealersTabLabel?: string;
  emptyScheduleText?: string;
  emptyDealersText?: string;
  backgroundImage?: FactoryAsset;
}

export interface MosaicUi {
  eyebrow?: string;
  heading?: string;
}

export interface ExperiencePageData {
  hero: ExperienceHero;
  picker: PickerItem[];
  pickerUi: PickerUi;
  faqSection: FAQSection;
  visitPlanningBlock: ConciergeBlock;
  fittingGuidanceBlock: ConciergeBlock;
  travelGuideBlock: ConciergeBlock;
  visitFactorySection: VisitFactoryData;
  bookingSection: BookingSection;
  travelNetworkUi: TravelNetworkUi;
  mosaicUi: MosaicUi;
  mosaic: FactoryAsset[];
  finalCta: {
    text: string;
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}
