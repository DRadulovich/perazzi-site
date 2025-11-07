import type { DemoProgramData } from "@/types/experience";

export const demo: DemoProgramData = {
  introHtml:
    "<p>Our demo guns travel with factory fitters to major clubs across North America and Europe. Schedule a session to try recent builds, compare trigger groups, and reserve a bespoke slot.</p>",
  events: [
    {
      id: "demo-greenwood",
      date: "2024-06-15",
      clubName: "Greenwood Trap & Skeet",
      cityState: "Nashville, TN",
      href: "/experience/demo/greenwood",
    },
    {
      id: "demo-silverleaf",
      date: "2024-07-12",
      clubName: "Silverleaf Sporting",
      cityState: "Denver, CO",
    },
    {
      id: "demo-cotswolds",
      date: "2024-08-03",
      clubName: "Cotswolds Gun Club",
      cityState: "Cheltenham, UK",
      href: "/experience/demo/cotswolds",
    },
  ],
  requestCta: { label: "Request a demo stop", href: "/experience/demo" },
  whatToExpectHtml:
    "<p>Demo sessions include 30-minute trigger comparisons, stock try-ons, and fitting consults. Ammunition available on site.</p>",
};
