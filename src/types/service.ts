import type { FactoryAsset } from "../types/content";

export interface ServiceHero {
  title: string;
  subheading?: string;
  background: FactoryAsset;
}

export interface ServiceOverview {
  introHtml: string;
  checksHtml: string;
}

export type ServiceLocationType = "Factory" | "Service Center" | "Specialist";

export interface ServiceLocation {
  id: string;
  name: string;
  type: ServiceLocationType;
  addressHtml: string;
  phone?: string;
  email?: string;
  website?: string;
  notesHtml?: string;
}

export interface GuideDownload {
  id: string;
  title: string;
  summaryHtml: string;
  fileUrl: string;
  fileSize?: string;
}

export interface PartEditorial {
  name: string;
  purpose: string;
  fitment: "factory" | "authorized" | "user";
  notesHtml?: string;
}

export interface FAQItem {
  q: string;
  aHtml: string;
}

export interface ServicePageData {
  hero: ServiceHero;
  overview: ServiceOverview;
  locations: ServiceLocation[];
  maintenanceGuides: GuideDownload[];
  partsEditorial: PartEditorial[];
  faq: FAQItem[];
  finalCta: {
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}
