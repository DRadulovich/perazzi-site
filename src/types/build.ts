import type { FactoryAsset } from "../types/content";

export interface BuildHero {
  eyebrow: string;
  title: string;
  introHtml: string;
  media: FactoryAsset;
}

export interface StepsIntro {
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  background?: FactoryAsset;
}

export interface JourneyStepLink {
  id: string;
  label: string;
  href: string;
}

export interface JourneyOverviewData {
  introHtml: string;
  steps: JourneyStepLink[];
  disclaimerHtml: string;
}

export interface FittingStage {
  id: string;
  title: string;
  bodyHtml: string;
  media: FactoryAsset;
  captionHtml?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface Expert {
  id: string;
  name: string;
  role: string;
  bioShort: string;
  headshot: FactoryAsset;
  quote?: string;
  profileHref?: string;
}

export interface BookingOption {
  id: string;
  title: string;
  durationMins?: number;
  durationLabel?: string;
  descriptionHtml: string;
  href: string;
}

export interface WhatToExpectItem {
  id: string;
  title: string;
  bodyHtml: string;
}

export interface AssuranceContent {
  html?: string;
  heading?: string;
  label?: string;
  body?: string;
  quote?: { author?: string; text: string };
  media?: FactoryAsset;
}

export interface BuildPageData {
  hero: BuildHero;
  journey: JourneyOverviewData;
  stepsIntro?: StepsIntro;
  steps: FittingStage[];
  bespokeGuide?: {
    heading?: string;
    body?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    listItems?: string[];
  };
  cinematicStrips?: Array<{ image?: FactoryAsset; alt?: string }>;
  expertsIntro?: { eyebrow?: string; heading?: string };
  experts: Expert[];
  booking: {
    headline: string;
    options: BookingOption[];
    note?: string;
    whatToExpect: WhatToExpectItem[];
    whatToExpectHeading?: string;
  };
  bookingSection?: {
    heading?: string;
    options?: Array<{
      title?: string;
      duration?: string;
      description?: string;
      href?: string;
    }>;
    whatToExpectHeading?: string;
    whatToExpectItems?: string[];
    note?: string;
    background?: FactoryAsset;
  };
  assurance: AssuranceContent;
  footerCta: { text: string; ctaLabel: string; href: string };
}
