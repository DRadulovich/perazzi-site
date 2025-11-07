import type { GuideDownload } from "@/types/service";

export const maintenanceGuides: GuideDownload[] = [
  {
    id: "trigger-service-guide",
    title: "Trigger Service Checklist",
    summaryHtml:
      "<p>Step-by-step overview of trigger removal, cleaning, lubrication, and inspection before shipping to the factory.</p>",
    fileUrl: "https://res.cloudinary.com/pwebsite/raw/upload/v1720000000/service/trigger-checklist.pdf",
    fileSize: "1.2 MB PDF",
  },
  {
    id: "travel-packing",
    title: "Packing Instructions",
    summaryHtml:
      "<p>How to prepare your Perazzi for shipment to Botticino, including stock protection, documentation, and carrier recommendations.</p>",
    fileUrl: "https://res.cloudinary.com/pwebsite/raw/upload/v1720000000/service/packing-guide.pdf",
    fileSize: "800 KB PDF",
  },
  {
    id: "seasonal-checks",
    title: "Seasonal Maintenance Guide",
    summaryHtml:
      "<p>Factory-recommended schedule for lubrication, fasteners, and barrel care between major events.</p>",
    fileUrl: "https://res.cloudinary.com/pwebsite/raw/upload/v1720000000/service/seasonal-maintenance.pdf",
    fileSize: "950 KB PDF",
  },
];
