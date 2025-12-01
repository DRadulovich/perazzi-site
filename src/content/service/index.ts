import type { ServicePageData } from "@/types/service";
import { hero } from "./hero";
import { overview } from "./overview";
import { locations } from "./locations";
import { maintenanceGuides } from "./guides";
import { partsEditorial } from "./parts";
import { faq } from "./faq";
import { finalCta } from "./cta";

const checksList = [
  "Trigger group teardown and timing test",
  "Barrel regulation/POI verification",
  "Action, ejector, and locking surfaces inspection",
  "Stock integrity, finish refresh, and hardware torque checks",
];

export const serviceData: ServicePageData = {
  hero,
  overviewSection: {
    heading: "Overview",
    subheading: "Factory-level care, wherever you are",
    introHtml: overview.introHtml,
    checksHeading: "Standard checks",
    checksHtml: overview.checksHtml,
    checks: checksList,
  },
  serviceGuidanceBlock: {
    eyebrow: "Service guidance",
    body:
      "Need help mapping out service and care cadence? Ask Perazzi for the recommended intervals and how to coordinate with the atelier.",
    chatLabel: "Ask about service & care",
    chatPrompt:
      "Walk me through Perazzi's recommended care cadence, how the authorized centers coordinate with Botticino, and what an owner should prepare before scheduling service.",
  },
  shippingPrepBlock: {
    eyebrow: "Shipping prep",
    body:
      "Wondering what to include when shipping your gun or scheduling an inspection? Ask before you book.",
    chatLabel: "Ask before I ship",
    chatPrompt:
      "What information, paperwork, and packing steps should I complete before shipping a Perazzi in for service, and how does the concierge coordinate follow-ups?",
  },
  networkFinderUi: {
    heading: "Authorized US Service Locations",
    subheading: "Find factory and authorized Perazzi service partners near you.",
    primaryButtonLabel: "Request service",
    detailsButtonLabel: "View details",
    directionsButtonLabel: "Open in Maps",
  },
  maintenanceSection: {
    heading: "Maintenance & repairs",
    subheading: "How we service your Perazzi",
    overviewHtml: overview.checksHtml,
    columnLabels: [],
  },
  partsEditorialSection: {
    heading: "Parts guidance",
    intro: "Genuine components, fitted correctly",
    parts: partsEditorial,
  },
  integrityAdvisory: {
    heading: "Protect your investment",
    body:
      "Perazzi parts are serialised and fit by hand. Grey-market spares often compromise safety, timing, or regulation. Work only with the factory or authorised service centres; every shipment includes documentation so you can verify provenance.\n\nIf you are unsure, contact the concierge—send photos or serial numbers and we will confirm authenticity before you install any component.",
  },
  serviceRequestBlock: {
    title: "Request factory service",
    description: "Schedule inspections, rebuilds, and engraving refresh with the Botticino team.",
    buttonLabel: "Open service request",
    embedUrl: "https://calendly.com/perazzi-service/request",
    fallbackUrl: "/service/request",
  },
  partsRequestBlock: {
    title: "Request parts advice",
    description: "Let us confirm availability, fitment, and installation guidance for factory parts.",
    primaryButtonLabel: "Open parts request",
    secondaryButtonLabel: undefined,
    embedUrl: "https://calendly.com/perazzi-service/parts",
    fallbackUrl: "/service/parts-request",
  },
  guidesSection: {
    heading: "Downloads & checklists",
    careGuidesLabel: "Care guides",
    downloadsLabel: "Downloads",
    downloadButtonLabel: "Download",
    guides: maintenanceGuides,
  },
  faqSection: {
    heading: "Service questions",
    intro: undefined,
    items: faq,
  },
  locations,
  finalCta,
};

export { hero } from "./hero";
export { overview } from "./overview";
export { locations } from "./locations";
export { maintenanceGuides } from "./guides";
export { partsEditorial } from "./parts";
export { faq } from "./faq";
export { finalCta } from "./cta";
