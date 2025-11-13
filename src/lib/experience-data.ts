import { cache } from "react";

import { experienceData } from "@/content/experience";
import type { ExperiencePageData, PickerItem } from "@/types/experience";
import { getExperienceHome } from "@/sanity/queries/experience";

const warn = (message: string) => {
  console.warn(`[sanity][experience] ${message}`);
};

function cloneExperience(): ExperiencePageData {
  return JSON.parse(JSON.stringify(experienceData));
}

type PickerInput = Partial<Omit<PickerItem, "id">> & { id?: string };

function mergePickerItems(
  fallbackItems: PickerItem[],
  incoming?: PickerInput[],
): PickerItem[] {
  if (!incoming?.length) return fallbackItems;
  const fallbackMap = new Map(fallbackItems.map((item) => [item.id, item]));

  return incoming.map((item, index) => {
    const fallback = item.id ? fallbackMap.get(item.id) : fallbackItems[index];
    return {
      id: item.id ?? fallback?.id ?? `picker-${index}`,
      title: item.title ?? fallback?.title ?? "Experience",
      summary: item.summary ?? fallback?.summary ?? "",
      media: item.media ?? fallback?.media ?? fallbackItems[0].media,
      ctaLabel: fallback?.ctaLabel ?? "Learn more",
      href: item.href ?? fallback?.href ?? "#",
    };
  });
}

export const getExperiencePageData = cache(async (): Promise<ExperiencePageData> => {
  const data = cloneExperience();

  try {
    const cms = await getExperienceHome();
    if (cms?.hero?.background) {
      data.hero = {
        title: cms.hero.title ?? data.hero.title,
        subheading: cms.hero.subheading ?? data.hero.subheading,
        background: cms.hero.background,
      };
    }
    if (cms?.picker?.length) {
      data.picker = mergePickerItems(data.picker, cms.picker);
    }
    if (cms?.mosaic?.length) {
      data.mosaic = cms.mosaic.filter(Boolean) as ExperiencePageData["mosaic"];
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
