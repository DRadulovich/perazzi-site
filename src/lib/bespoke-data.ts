import { cache } from "react";

import { buildData } from "@/content/build";
import type { BuildPageData, FittingStage } from "@/types/build";
import { getBespokeHome } from "@/sanity/queries/bespoke";

const warn = (message: string) => {
  console.warn(`[sanity][bespoke] ${message}`);
};

function cloneBespoke(): BuildPageData {
  return JSON.parse(JSON.stringify(buildData));
}

function mergeSteps(fallback: FittingStage[], incoming?: BuildPageData["steps"]): FittingStage[] {
  if (!incoming?.length) return fallback;
  const fallbackMap = new Map(fallback.map((step) => [step.id, step]));

  return incoming.map((step, index) => {
    const fallbackStep = fallbackMap.get(step.id) ?? fallback[index];
    return {
      id: step.id,
      title: step.title ?? fallbackStep?.title ?? `Step ${index + 1}`,
      bodyHtml: step.bodyHtml ?? fallbackStep?.bodyHtml ?? "",
      media: step.media ?? fallbackStep?.media ?? fallback[0].media,
      captionHtml: fallbackStep?.captionHtml,
      ctaHref: fallbackStep?.ctaHref,
      ctaLabel: fallbackStep?.ctaLabel,
    };
  });
}

export const getBespokePageData = cache(async (): Promise<BuildPageData> => {
  const data = cloneBespoke();

  try {
    const cms = await getBespokeHome();
    if (cms?.hero?.media) {
      data.hero = {
        eyebrow: cms.hero.eyebrow ?? data.hero.eyebrow,
        title: cms.hero.title ?? data.hero.title,
        introHtml: cms.hero.intro ?? data.hero.introHtml,
        media: cms.hero.media,
      };
    }
    if (cms?.steps?.length) {
      data.steps = mergeSteps(data.steps, cms.steps);
    }
    if (cms?.experts?.length) {
      data.experts = cms.experts.map((expert, index) => {
        const fallback = data.experts[index];
        return {
          id: expert.id,
          name: expert.name ?? fallback?.name ?? "Expert",
          role: expert.role ?? fallback?.role ?? "",
          bioShort: expert.bioShort ?? fallback?.bioShort ?? "",
          headshot: expert.headshot ?? fallback?.headshot ?? data.experts[0].headshot,
          quote: expert.quote ?? fallback?.quote,
          profileHref: fallback?.profileHref,
        };
      });
    }
    if (cms?.assuranceImage) {
      data.assurance.media = cms.assuranceImage;
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
