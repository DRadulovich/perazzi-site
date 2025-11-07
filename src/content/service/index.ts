import type { ServicePageData } from "@/types/service";
import { hero } from "./hero";
import { overview } from "./overview";
import { locations } from "./locations";
import { maintenanceGuides } from "./guides";
import { partsEditorial } from "./parts";
import { faq } from "./faq";
import { finalCta } from "./cta";

export const serviceData: ServicePageData = {
  hero,
  overview,
  locations,
  maintenanceGuides,
  partsEditorial,
  faq,
  finalCta,
};

export { hero } from "./hero";
export { overview } from "./overview";
export { locations } from "./locations";
export { maintenanceGuides } from "./guides";
export { partsEditorial } from "./parts";
export { faq } from "./faq";
export { finalCta } from "./cta";
