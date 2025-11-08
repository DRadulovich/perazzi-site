import { cache } from "react";

import { serviceData } from "@/content/service";
import type { ServicePageData } from "@/types/service";
import { getServiceHome } from "@/sanity/queries/service";

const warn = (message: string) => {
  console.warn(`[sanity][service] ${message}`);
};

function cloneService(): ServicePageData {
  return JSON.parse(JSON.stringify(serviceData));
}

export const getServicePageData = cache(async (): Promise<ServicePageData> => {
  const data = cloneService();

  try {
    const cms = await getServiceHome();
    if (cms?.hero?.background) {
      data.hero = {
        title: cms.hero.title ?? data.hero.title,
        subheading: cms.hero.subheading ?? data.hero.subheading,
        background: cms.hero.background,
      };
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
