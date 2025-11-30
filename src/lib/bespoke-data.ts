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

type PartialStage = Partial<FittingStage> & { id: string };

function mergeSteps(fallback: FittingStage[], incoming?: PartialStage[]): FittingStage[] {
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
    if (cms?.stepsIntro) {
      data.stepsIntro = {
        heading: cms.stepsIntro.heading ?? data.stepsIntro?.heading,
        subheading: cms.stepsIntro.subheading ?? data.stepsIntro?.subheading,
        ctaLabel: cms.stepsIntro.ctaLabel ?? data.stepsIntro?.ctaLabel,
        background: cms.stepsIntro.background ?? data.stepsIntro?.background,
      };
    }
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
      data.journey.steps = data.steps.map((step) => ({
        id: `journey-${step.id}`,
        label: step.title,
        href: `#step-${step.id}`,
      }));
    }
    if (cms?.bespokeGuide) {
      data.bespokeGuide = {
        heading: cms.bespokeGuide.heading ?? data.bespokeGuide?.heading,
        body: cms.bespokeGuide.body ?? data.bespokeGuide?.body,
        chatLabel: cms.bespokeGuide.chatLabel ?? data.bespokeGuide?.chatLabel,
        chatPrompt: cms.bespokeGuide.chatPrompt ?? data.bespokeGuide?.chatPrompt,
        linkLabel: cms.bespokeGuide.linkLabel ?? data.bespokeGuide?.linkLabel,
        linkHref: cms.bespokeGuide.linkHref ?? data.bespokeGuide?.linkHref,
        listItems:
          cms.bespokeGuide.listItems?.length
            ? cms.bespokeGuide.listItems
            : data.bespokeGuide?.listItems,
      };
    }
    if (cms?.cinematicStrips?.length) {
      data.cinematicStrips = cms.cinematicStrips.map((strip, index) => ({
        image: strip.image ?? data.cinematicStrips?.[index]?.image ?? data.cinematicStrips?.[0]?.image,
        alt: strip.alt ?? data.cinematicStrips?.[index]?.alt,
      }));
    }
    if (cms?.expertsIntro) {
      data.expertsIntro = {
        eyebrow: cms.expertsIntro.eyebrow ?? data.expertsIntro?.eyebrow,
        heading: cms.expertsIntro.heading ?? data.expertsIntro?.heading,
      };
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
    if (cms?.bookingSection) {
      const fallback = data.bookingSection ?? {};
      const options = cms.bookingSection.options?.map((option, index) => {
        const fallbackOption = fallback.options?.[index];
        return {
          title: option.title ?? fallbackOption?.title,
          duration: option.duration ?? fallbackOption?.duration,
          description: option.description ?? fallbackOption?.description,
          href: option.href ?? fallbackOption?.href,
        };
      }) ?? fallback.options;

      data.bookingSection = {
        heading: cms.bookingSection.heading ?? fallback.heading,
        options,
        whatToExpectHeading:
          cms.bookingSection.whatToExpectHeading ?? fallback.whatToExpectHeading,
        whatToExpectItems:
          cms.bookingSection.whatToExpectItems?.length
            ? cms.bookingSection.whatToExpectItems
            : fallback.whatToExpectItems,
        note: cms.bookingSection.note ?? fallback.note,
        background: cms.bookingSection.background ?? fallback.background,
      };

      if (data.bookingSection) {
        data.booking.headline = data.bookingSection.heading ?? data.booking.headline;
        if (data.bookingSection.options?.length) {
          data.booking.options = data.bookingSection.options.map((option, index) => {
            const fallbackOption = data.booking.options[index];
            return {
              id: fallbackOption?.id ?? `booking-${index}`,
              title: option.title ?? fallbackOption?.title ?? "Booking option",
              durationLabel: option.duration ?? fallbackOption?.durationLabel ??
                (fallbackOption?.durationMins ? `${fallbackOption.durationMins} minutes` : undefined),
              durationMins: fallbackOption?.durationMins,
              descriptionHtml:
                option.description
                  ? `<p>${option.description}</p>`
                  : fallbackOption?.descriptionHtml ?? "",
              href: option.href ?? fallbackOption?.href ?? "#",
            };
          });
        }
        data.booking.whatToExpectHeading = data.bookingSection.whatToExpectHeading ?? data.booking.whatToExpectHeading;
        if (data.bookingSection.whatToExpectItems?.length) {
          data.booking.whatToExpect = data.bookingSection.whatToExpectItems.map((item, index) => {
            const fallbackItem = data.booking.whatToExpect[index];
            return {
              id: fallbackItem?.id ?? `expect-${index}`,
              title: fallbackItem?.title ?? `What to expect ${index + 1}`,
              bodyHtml: item ?? fallbackItem?.bodyHtml ?? "",
            };
          });
        }
        data.booking.note = data.bookingSection.note ?? data.booking.note;
      }
    }
    if (cms?.assuranceImage) {
      data.assurance.media = cms.assuranceImage;
    }
    if (cms?.assuranceContent) {
      data.assurance.heading = cms.assuranceContent.heading ?? data.assurance.heading;
      data.assurance.label = cms.assuranceContent.label ?? data.assurance.label;
      data.assurance.body = cms.assuranceContent.body ?? data.assurance.body;
      if (cms.assuranceContent.quote) {
        data.assurance.quote = data.assurance.quote ?? {};
        data.assurance.quote.text = cms.assuranceContent.quote ?? data.assurance.quote?.text;
      }
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
