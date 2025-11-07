import type { PartEditorial } from "@/types/service";

export const partsEditorial: PartEditorial[] = [
  {
    name: "Trigger Groups",
    purpose: "Maintain timing, break weight, and safety tolerances as designed.",
    fitment: "factory",
    notesHtml:
      "<p>Only the factory or authorized centers should rebuild trigger groups; hand-fit sears and springs require factory gauges.</p>",
  },
  {
    name: "Stock Hardware",
    purpose: "Keep the action tight and recoil tame with proper torque and fresh bushings.",
    fitment: "authorized",
    notesHtml:
      "<p>Authorized centers can replace recoil pads, comb hardware, and grip caps with OEM parts. Avoid aftermarket screws that may strip the action body.</p>",
  },
  {
    name: "Sight Ribs",
    purpose: "Ensure POI consistency and match rib profiles to your disciplines.",
    fitment: "factory",
    notesHtml:
      "<p>Rib replacements are brazed and machined in Botticino to prevent warping. Contact the concierge to schedule regulation time.</p>",
  },
  {
    name: "User Essentials",
    purpose: "Field-ready spares such as firing pins, springs, and lubricants.",
    fitment: "user",
    notesHtml:
      "<p>Carry a Perazzi kit with factory pins, springs, and approved lubricants. Follow the included instructions or visit a service event for installation.</p>",
  },
];
