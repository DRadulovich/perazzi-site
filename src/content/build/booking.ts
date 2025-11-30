import type { BuildPageData } from "@/types/build";

export const booking: BuildPageData["booking"] = {
  headline: "Reserve Your Fitting",
  options: [
    {
      id: "onsite",
      title: "On-site factory fit",
      durationMins: 210,
      descriptionHtml:
        "<p>A dedicated atelier session in Botticino: precision try-gun fitting, tunnel regulation, and wood selection with the master stockmaker.</p>",
      href: "/book/onsite",
    },
    {
      id: "roadshow",
      title: "Traveling roadshow",
      durationMins: 120,
      descriptionHtml:
        "<p>Meet our fitting team when they travel to your region. We capture measurements, discuss platform pairings, and schedule your atelier visit.</p>",
      href: "/book/roadshow",
    },
    {
      id: "remote",
      title: "Remote consultation",
      durationMins: 60,
      descriptionHtml:
        "<p>A virtual session to review your shooting history, current gun fit, and goals before committing to an in-person fitting.</p>",
      href: "/book/remote",
    },
  ],
  whatToExpectHeading: "What to expect",
  whatToExpect: [
    {
      id: "bring",
      title: "What to bring",
      bodyHtml:
        "<p>Your current shotgun, shooting vest, eyewear, and notes on disciplines or upcoming events. Comfortable shoes help during try-gun work.</p>",
    },
    {
      id: "timeline",
      title: "Timeline",
      bodyHtml:
        "<p>Build timelines vary between 8–12 months depending on engraving and wood selection. We keep you updated at each milestone.</p>",
    },
    {
      id: "aftercare",
      title: "Aftercare",
      bodyHtml:
        "<p>All bespoke builds include follow-up tunnel sessions and lifelong fitting adjustments. The atelier remains your partner for refinements.</p>",
    },
  ],
  note: "Need assistance planning travel or combining sessions? Contact the concierge at fitting@perazzi.example.",
};
