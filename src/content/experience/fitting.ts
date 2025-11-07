import type { FittingOption } from "@/types/experience";

export const fittingOptions: FittingOption[] = [
  {
    id: "atelier-fit",
    title: "Atelier Comprehensive Fit",
    durationMins: 210,
    descriptionHtml:
      "<p>Full try-gun session, tunnel patterning, and wood selection with our Botticino team.</p>",
    href: "/experience/fitting",
  },
  {
    id: "road-fit",
    title: "Roadshow Fitting",
    durationMins: 120,
    descriptionHtml:
      "<p>Meet our traveling fitters in select cities. Capture measurements before your atelier visit.</p>",
    href: "/experience/fitting#roadshow",
  },
  {
    id: "virtual",
    title: "Virtual Planning Consult",
    durationMins: 60,
    descriptionHtml:
      "<p>Share your shooting history and current setup, then plan your bespoke session.</p>",
    href: "/experience/fitting#virtual",
  },
];
