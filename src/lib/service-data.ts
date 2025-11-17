import { cache } from "react";

import { serviceData } from "@/content/service";
import type { ServicePageData } from "@/types/service";
import { getRecommendedServiceCenters, getServiceHome } from "@/sanity/queries/service";

const warn = (message: string) => {
  console.warn(`[sanity][service] ${message}`);
};

function cloneService(): ServicePageData {
  return JSON.parse(JSON.stringify(serviceData));
}

export const getServicePageData = cache(async (): Promise<ServicePageData> => {
  const data = cloneService();

  try {
    const [cms, serviceCenters] = await Promise.all([getServiceHome(), getRecommendedServiceCenters()]);
    if (cms?.hero?.background) {
      data.hero = {
        title: cms.hero.title ?? data.hero.title,
        subheading: cms.hero.subheading ?? data.hero.subheading,
        background: cms.hero.background,
      };
    }
    if (serviceCenters.length) {
      data.locations = serviceCenters.map((center) => ({
        id: center.id,
        name: center.centerName,
        type: "Service Center",
        addressHtml: `<p>${center.address}<br/>${center.city}</p>`,
        city: center.city,
        state: center.state,
        phone: center.phone,
        contact: center.contact,
        mapQuery: `${center.address} ${center.city}`,
      }));
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
