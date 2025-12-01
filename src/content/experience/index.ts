import type { ExperiencePageData } from "@/types/experience";
import { hero } from "./hero";
import { picker } from "./picker";
import { visit } from "./visit";
import { fittingOptions } from "./fitting";
import { mosaic } from "./mosaic";
import { faq } from "./faq";
import { finalCta } from "./cta";
import { bookingScheduler } from "./scheduler";

const pickerUi = {
  heading: "Choose your path",
  subheading: "Visit, fit, or demo with Perazzi",
  microLabel: "Perazzi Experience",
  defaultCtaLabel: picker[0]?.ctaLabel,
  defaultCtaHref: picker[0]?.href,
};

const faqSection = {
  heading: "FAQ",
  lead: "Questions from future owners",
  items: faq,
};

const visitPlanningBlock = {
  heading: "Visit planning",
  intro:
    "Map out a Botticino factory visit or fitting day before you commit: what happens, who you'll meet, and how to arrive ready.",
  bullets: [
    "Itinerary & fittings - timing for measurements, patterning, gunroom walkthroughs, and engraving consults if needed.",
    "Travel & lodging - best airports, drivers or rentals, and partner hotels close to Botticino and Gardone.",
    "Range-day add-ons - clays venues and coaching near the factory to test setups or confirm gunfit.",
  ],
  closing:
    "Share your dates, disciplines, and goals; our team will send a draft itinerary and the right next pages to review before you book.",
  chatLabel: "Plan my visit",
  chatPrompt:
    "Draft a plan for a Perazzi fitting or Botticino visit: outline the schedule, who I'll meet, what to bring, and travel or lodging options nearby.",
  linkLabel: "See visit options",
  linkHref: "/experience/visit",
};

const fittingGuidanceBlock = {
  heading: "Fitting guidance",
  intro:
    "Not sure which fitting session to book? The concierge will match your goals to the right format and send a prep list before you reserve.",
  bullets: [
    "Session match - align travel, timelines, and goals to virtual consults, local range days, or Botticino fittings.",
    "Prep checklist - measurements, photos or video, gun history, and any disciplines to highlight before booking.",
    "Next steps - which scheduler link to use, lead times, and what happens after your slot is confirmed.",
  ],
  closing:
    "Share your dates, preferred format, and competition calendar; we will point you to the right session and finalize the booking flow for you.",
  chatLabel: "Help me book",
  chatPrompt:
    "Help me pick the right Perazzi fitting option (virtual consult, range session, or Botticino visit) and list what I should prepare before scheduling.",
  linkLabel: "View fitting sessions",
  linkHref: "/experience/fitting",
};

const travelGuideBlock = {
  heading: "Meet us on the road",
  intro:
    "Connect with Perazzi when we travel or through trusted dealers. The concierge can point you to the closest stop and what to bring.",
  bullets: [
    "Travel stops - confirm dates, cities, and which team members will be on-site for fittings or demos.",
    "Dealer introductions - match you with a trusted Perazzi dealer nearby and set expectations for inventory or services.",
    "What to bring - targets, disciplines, gun history, and measurements to make a road-stop session efficient.",
  ],
  closing:
    "Share your location and dates; we will route you to the right stop or dealer and prep a checklist for your visit.",
  chatLabel: "Plan my stop",
  chatPrompt:
    "Find the best way to meet Perazzi near me: upcoming travel stops, nearby authorized dealers, and what I should bring to test guns or discuss a build.",
  linkLabel: "View schedule and dealers",
  linkHref: "#travel-network-heading",
};

const visitFactorySection = {
  heading: "Visit Botticino",
  subheading: "See the factory in person",
  introHtml: visit.introHtml,
  location: visit.location,
  whatToExpectHtml: visit.whatToExpectHtml,
  cta: visit.cta,
};

const bookingSection = {
  heading: "Book a fitting",
  subheading: "Choose the session that fits your journey",
  options: fittingOptions,
  optionCtaLabel: "Reserve this session",
  scheduler: {
    title: "Schedule with concierge",
    helperText: "Selecting Begin Your Fitting loads an embedded booking form below.",
    toggleOpenLabel: "Begin Your Fitting",
    toggleCloseLabel: "Hide scheduler",
    src: bookingScheduler.src,
    iframeTitle: bookingScheduler.title,
    fallbackHref: bookingScheduler.fallbackHref,
  },
};

const travelNetworkUi = {
  title: "Travel network",
  lead: "Meet us on the road",
  supporting:
    "Track our travel schedule or connect with a trusted Perazzi dealer closest to you.",
  scheduleTabLabel: "Our Travel Schedule",
  dealersTabLabel: "Our Dealers",
  emptyScheduleText: "New travel stops are being confirmed. Check back shortly.",
  emptyDealersText: "Dealer roster is being configured in Sanity.",
};

const mosaicUi = {
  eyebrow: "Atelier mosaic",
  heading: "Moments from the journey",
};

export const experienceData: ExperiencePageData = {
  hero,
  picker,
  pickerUi,
  faqSection,
  visitPlanningBlock,
  fittingGuidanceBlock,
  travelGuideBlock,
  visitFactorySection,
  bookingSection,
  travelNetworkUi,
  mosaicUi,
  mosaic,
  finalCta,
};

export { hero } from "./hero";
export { picker } from "./picker";
export { visit } from "./visit";
export { fittingOptions } from "./fitting";
export { mosaic } from "./mosaic";
export { faq } from "./faq";
export { finalCta } from "./cta";
export { bookingScheduler } from "./scheduler";
