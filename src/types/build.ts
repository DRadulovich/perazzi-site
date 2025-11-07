import type { FactoryAsset } from "../types/content";

export interface BuildHero {
  eyebrow: string;
  title: string;
  introHtml: string;
  media: FactoryAsset;
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
  durationMins: number;
  descriptionHtml: string;
  href: string;
}

export interface WhatToExpectItem {
  id: string;
  title: string;
  bodyHtml: string;
}

export interface AssuranceContent {
  html: string;
  quote?: { author?: string; text: string };
  media?: FactoryAsset;
}

export interface BuildPageData {
  hero: BuildHero;
  journey: JourneyOverviewData;
  steps: FittingStage[];
  experts: Expert[];
  booking: {
    headline: string;
    options: BookingOption[];
    note?: string;
    whatToExpect: WhatToExpectItem[];
  };
  assurance: AssuranceContent;
  footerCta: { text: string; ctaLabel: string; href: string };
}
