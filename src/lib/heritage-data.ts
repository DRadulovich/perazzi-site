import { cache } from "react";

import { heritageData } from "@/content/heritage";
import { factoryIntroHtml as factoryIntroFixture } from "@/content/heritage/factoryIntro";
import { related as relatedFixture } from "@/content/heritage/related";
import { HERITAGE_ERAS } from "@/config/heritage-eras";
import { portableTextToHtml } from "@/lib/portable-text";
import type {
  HeritageEra,
  HeritageEvent,
  HeritagePageData,
  SerialLookupUi,
  WorkshopCta,
} from "@/types/heritage";
import { getHeritageChampions, getHeritageEvents, getHeritageHome } from "@/sanity/queries/heritage";

const warn = (message: string) => {
  console.warn(`[sanity][heritage] ${message}`);
};

function cloneHeritage(): HeritagePageData {
  return structuredClone(heritageData);
}

const extractYear = (value?: string | null) => {
  if (!value) return null;
  const match = /\d{4}/.exec(value);
  if (match) {
    const year = Number(match[0]);
    return Number.isFinite(year) ? year : null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const textToHtml = (value?: string) => {
  if (!value) return undefined;
  if (value.includes("<")) return value;
  const escaped = escapeHtml(value.trim());
  if (!escaped) return undefined;
  return `<p>${escaped.replaceAll(/\n+/g, "<br/>")}</p>`;
};

const compareEventsByYear = (a: HeritageEvent, b: HeritageEvent) => {
  const yearA = extractYear(a.date);
  const yearB = extractYear(b.date);
  if (yearA === null && yearB === null) return 0;
  if (yearA === null) return 1;
  if (yearB === null) return -1;
  return yearA - yearB;
};

function mapEvents(events: Awaited<ReturnType<typeof getHeritageEvents>>): HeritageEvent[] {
  if (!events.length) return [];
  return events
    .map((event) => {
      const referenceLinks =
        event.champions || event.platforms
          ? {
              champions: event.champions?.map((champion) => ({
                id: champion.id,
                name: champion.name ?? "Champion",
              })),
              platforms: event.platforms?.map((platform) => ({
                id: platform.id,
                title: platform.name ?? "Platform",
                slug: platform.slug ?? "",
              })),
            }
          : undefined;

      return {
        id: event.id,
        date: event.date ?? "",
        title: event.title ?? "",
        summaryHtml: portableTextToHtml(event.bodyPortableText) ?? "",
        media: event.media ?? undefined,
        referenceLinks,
      };
    })
    .sort(compareEventsByYear);
}

export const getHeritagePageData = cache(async (): Promise<HeritagePageData> => {
  const data = cloneHeritage();

  try {
    const [home, events, champions] = await Promise.all([
      getHeritageHome(),
      getHeritageEvents(),
      getHeritageChampions(),
    ]);

    if (home?.hero?.background) {
      data.hero = {
        title: home.hero.title ?? data.hero.title,
        subheading: home.hero.subheading ?? data.hero.subheading,
        background: home.hero.background,
      };
    }

    data.heritageIntro = {
      ...data.heritageIntro,
      eyebrow: home?.heritageIntro?.eyebrow ?? data.heritageIntro.eyebrow,
      heading: home?.heritageIntro?.heading ?? data.heritageIntro.heading,
      paragraphs:
        home?.heritageIntro?.paragraphs?.length
          ? home.heritageIntro.paragraphs
          : data.heritageIntro.paragraphs,
      backgroundImage: home?.heritageIntro?.backgroundImage ?? data.heritageIntro.backgroundImage,
    };

    const fallbackErasMap = new Map<string, HeritageEra>();
    (data.erasConfig ?? HERITAGE_ERAS).forEach((era) => fallbackErasMap.set(era.id, era));

    if (home?.erasConfig?.length) {
      data.erasConfig = home.erasConfig.map((era) => {
        const fallback = era.id ? fallbackErasMap.get(era.id) : undefined;
        return {
          id: era.id,
          label: era.label ?? fallback?.label ?? "",
          yearRangeLabel: era.yearRangeLabel ?? fallback?.yearRangeLabel,
          startYear: era.startYear ?? fallback?.startYear ?? 0,
          endYear: era.endYear ?? fallback?.endYear ?? 0,
          backgroundSrc: era.backgroundSrc || fallback?.backgroundSrc || "",
          overlayColor: era.overlayColor ?? fallback?.overlayColor ?? "rgba(9, 9, 11, 0.7)",
          overlayFrom: era.overlayFrom ?? fallback?.overlayFrom,
          overlayTo: era.overlayTo ?? fallback?.overlayTo,
          isOngoing: fallback?.isOngoing,
        };
      });
    }

    const mergeWorkshopCta = (base: WorkshopCta, incoming?: WorkshopCta): WorkshopCta => ({
      heading: incoming?.heading ?? base.heading,
      intro: incoming?.intro ?? base.intro,
      bullets: incoming?.bullets?.length ? incoming.bullets : base.bullets,
      closing: incoming?.closing ?? base.closing,
      primaryLabel: incoming?.primaryLabel ?? base.primaryLabel,
      primaryHref: incoming?.primaryHref ?? base.primaryHref,
      secondaryLabel: incoming?.secondaryLabel ?? base.secondaryLabel,
      secondaryHref: incoming?.secondaryHref ?? base.secondaryHref,
    });

    data.workshopCta = mergeWorkshopCta(data.workshopCta, home?.workshopCta);

    const mergeSerialLookup = (base: SerialLookupUi, incoming?: SerialLookupUi): SerialLookupUi => ({
      heading: incoming?.heading ?? base.heading,
      subheading: incoming?.subheading ?? base.subheading,
      instructions: incoming?.instructions ?? base.instructions,
      primaryButtonLabel: incoming?.primaryButtonLabel ?? base.primaryButtonLabel,
      emptyStateText: incoming?.emptyStateText ?? base.emptyStateText,
      backgroundImage: incoming?.backgroundImage ?? base.backgroundImage,
    });

    data.serialLookupUi = mergeSerialLookup(data.serialLookupUi, home?.serialLookupUi);

    data.championsIntro = {
      ...data.championsIntro,
      heading: home?.championsIntro?.heading ?? data.championsIntro.heading,
      intro: home?.championsIntro?.intro ?? data.championsIntro.intro,
      bullets: home?.championsIntro?.bullets?.length ? home.championsIntro.bullets : data.championsIntro.bullets,
      closing: home?.championsIntro?.closing ?? data.championsIntro.closing,
      chatLabel: home?.championsIntro?.chatLabel ?? data.championsIntro.chatLabel,
      chatPrompt: home?.championsIntro?.chatPrompt ?? data.championsIntro.chatPrompt,
    };

    data.championsGalleryUi = {
      ...data.championsGalleryUi,
      heading: home?.championsGalleryUi?.heading ?? data.championsGalleryUi.heading,
      subheading: home?.championsGalleryUi?.subheading ?? data.championsGalleryUi.subheading,
      backgroundImage: home?.championsGalleryUi?.backgroundImage ?? data.championsGalleryUi.backgroundImage,
      championsLabel: home?.championsGalleryUi?.championsLabel ?? data.championsGalleryUi.championsLabel,
      cardCtaLabel: home?.championsGalleryUi?.cardCtaLabel ?? data.championsGalleryUi.cardCtaLabel,
    };

    data.factoryIntroBlock = {
      ...data.factoryIntroBlock,
      heading: home?.factoryIntroBlock?.heading ?? data.factoryIntroBlock.heading,
      intro: home?.factoryIntroBlock?.intro ?? data.factoryIntroBlock.intro,
      bullets: home?.factoryIntroBlock?.bullets?.length
        ? home.factoryIntroBlock.bullets
        : data.factoryIntroBlock.bullets,
      closing: home?.factoryIntroBlock?.closing ?? data.factoryIntroBlock.closing,
      chatLabel: home?.factoryIntroBlock?.chatLabel ?? data.factoryIntroBlock.chatLabel,
      chatPrompt: home?.factoryIntroBlock?.chatPrompt ?? data.factoryIntroBlock.chatPrompt,
    };

    data.factoryEssayUi = {
      ...data.factoryEssayUi,
      eyebrow: home?.factoryEssayUi?.eyebrow ?? data.factoryEssayUi.eyebrow,
      heading: home?.factoryEssayUi?.heading ?? data.factoryEssayUi.heading,
    };

    data.factoryIntroBody = textToHtml(home?.factoryIntroBody) ?? data.factoryIntroBody ?? factoryIntroFixture;

    if (home?.photoEssay?.length) {
      data.factoryEssay = home.photoEssay
        .map((item) => (item.image ? { id: item.id, image: item.image } : null))
        .filter(Boolean) as HeritagePageData["factoryEssay"];
    }

    if (home?.oralHistories?.length) {
      data.oralHistories = home.oralHistories.map((entry) => ({
        id: entry.id,
        title: entry.title ?? "",
        quote: entry.quote ?? "",
        attribution: entry.attribution ?? "",
        image: entry.image,
      }));
    }

    data.oralHistoriesUi = {
      ...data.oralHistoriesUi,
      eyebrow: home?.oralHistoriesUi?.eyebrow ?? data.oralHistoriesUi.eyebrow,
      heading: home?.oralHistoriesUi?.heading ?? data.oralHistoriesUi.heading,
      readLabel: home?.oralHistoriesUi?.readLabel ?? data.oralHistoriesUi.readLabel,
      hideLabel: home?.oralHistoriesUi?.hideLabel ?? data.oralHistoriesUi.hideLabel,
    };

    data.relatedSection = {
      heading: home?.relatedSection?.heading ?? data.relatedSection.heading,
      items:
        home?.relatedSection?.items?.length && home.relatedSection.items.some((item) => item?.slug)
          ? (home.relatedSection.items
              .map((item, index) => {
                if (!item?.slug || !item.title) return null;
                return {
                  id: item.slug ?? `related-${index}`,
                  title: item.title,
                  slug: item.slug,
                };
              })
              .filter(Boolean) as NonNullable<HeritagePageData["relatedSection"]>["items"])
          : relatedFixture,
    };

    if (events.length) {
      const mapped = mapEvents(events);
      if (mapped.length) {
        data.timeline = mapped;
      }
    }

    if (champions.length) {
      const mappedChampions = champions
        .map((champion) => {
          if (!champion.image) return null;
          return {
            id: champion.id,
            name: champion.name ?? "Perazzi Champion",
            title: champion.title ?? "",
            quote: champion.quote ?? "",
            image: champion.image,
            bio: champion.bio,
            resume: champion.resume,
            platforms: champion.platforms,
            disciplines: champion.disciplines,
            article: champion.article
              ? {
                  id: champion.article.id,
                  title: champion.article.title ?? "Champion profile",
                  slug: champion.article.slug ?? "",
                }
              : undefined,
          };
        })
        .filter(Boolean) as HeritagePageData["champions"];

      data.champions = mappedChampions;
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});
