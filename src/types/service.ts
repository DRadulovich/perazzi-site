import type { FactoryAsset } from "../types/content";

export interface ServiceHero {
  title: string;
  subheading?: string;
  background: FactoryAsset;
}

export interface ServiceOverviewSection {
  heading?: string;
  subheading?: string;
  introHtml: string;
  checksHeading?: string;
  checksHtml?: string;
  checks?: string[];
}

export type ServiceLocationType = "Factory" | "Service Center" | "Specialist";

export interface ServiceLocation {
  id: string;
  name: string;
  type: ServiceLocationType;
  addressHtml: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact?: string;
  notesHtml?: string;
  mapQuery?: string;
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
  fitment: string;
  notesHtml?: string;
}

export interface FAQItem {
  q: string;
  aHtml: string;
}

export interface FAQSection {
  heading?: string;
  intro?: string;
  items: FAQItem[];
}

export interface ServiceGuidanceBlock {
  eyebrow?: string;
  body?: string;
  chatLabel?: string;
  chatPrompt?: string;
}

export interface NetworkFinderUi {
  heading?: string;
  subheading?: string;
  primaryButtonLabel?: string;
  detailsButtonLabel?: string;
  directionsButtonLabel?: string;
}

export interface MaintenanceSection {
  heading?: string;
  subheading?: string;
  overviewHtml?: string;
  columnLabels?: string[];
}

export interface PartsEditorialSection {
  heading?: string;
  intro?: string;
  parts: PartEditorial[];
}

export interface IntegrityAdvisorySection {
  heading?: string;
  body?: string;
}

export interface ServiceRequestBlock {
  title: string;
  description?: string;
  buttonLabel: string;
  embedUrl: string;
  fallbackUrl: string;
}

export interface PartsRequestBlock {
  title: string;
  description?: string;
  primaryButtonLabel: string;
  secondaryButtonLabel?: string;
  embedUrl: string;
  fallbackUrl: string;
}

export interface GuidesSection {
  heading?: string;
  careGuidesLabel?: string;
  downloadsLabel?: string;
  downloadButtonLabel?: string;
  guides: GuideDownload[];
}

export interface ServicePageData {
  hero: ServiceHero;
  overviewSection: ServiceOverviewSection;
  serviceGuidanceBlock: ServiceGuidanceBlock;
  shippingPrepBlock: ServiceGuidanceBlock;
  networkFinderUi: NetworkFinderUi;
  maintenanceSection: MaintenanceSection;
  partsEditorialSection: PartsEditorialSection;
  integrityAdvisory: IntegrityAdvisorySection;
  serviceRequestBlock: ServiceRequestBlock;
  partsRequestBlock: PartsRequestBlock;
  guidesSection: GuidesSection;
  faqSection: FAQSection;
  locations: ServiceLocation[];
  finalCta: {
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}
