import { cache } from "react";

import { heritageData } from "@/content/heritage";
import { portableTextToHtml } from "@/lib/portable-text";
import type { HeritageEvent, HeritagePageData } from "@/types/heritage";
import { getHeritageChampions, getHeritageEvents, getHeritageHome } from "@/sanity/queries/heritage";

const warn = (message: string) => {
  console.warn(`[sanity][heritage] ${message}`);
};

function cloneHeritage(): HeritagePageData {
  return JSON.parse(JSON.stringify(heritageData));
}

function mapEvents(events: Awaited<ReturnType<typeof getHeritageEvents>>): HeritageEvent[] {
  if (!events.length) return [];
  return events.map((event) => ({
    id: event.id,
    date: event.date ?? "",
    title: event.title ?? "",
    summaryHtml: portableTextToHtml(event.bodyPortableText) ?? "",
    media: event.media ?? undefined,
    links:
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
        : undefined,
  }));
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
