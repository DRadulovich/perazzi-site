import type { JourneyOverviewData } from "@/types/build";

export const journey: JourneyOverviewData = {
  introHtml:
    "<p>Every bespoke commission follows a shared rhythm. The steps below preview what we will create together—anchored by conversations, fittings, tunnel sessions, and finishing touches that honor your shooting story.</p>",
  steps: [
    { id: "discovery", label: "Discovery & Consultation", href: "#step-discovery" },
    { id: "fitting", label: "Precision Fitting (Try-Gun)", href: "#step-fitting" },
    { id: "regulation", label: "Barrel & Regulation", href: "#step-regulation" },
    { id: "balance", label: "Balance & Dynamics", href: "#step-balance" },
    { id: "engraving", label: "Engraving & Wood", href: "#step-engraving" },
    { id: "delivery", label: "Delivery & On-Range Validation", href: "#step-delivery" },
  ],
  disclaimerHtml:
    "<p class=\"text-xs\">Editorial guidance—your fitting personalizes every decision.</p>",
};
