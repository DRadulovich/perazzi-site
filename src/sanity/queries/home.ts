import "server-only";

import { groq } from "next-sanity";
import { hero as fallbackHero, stages as fallbackStages, champion as fallbackChampion } from "@/content/home";
import type { Champion, FittingStage, HomeData } from "@/types/content";
import { sanityClient } from "../../../sanity/client";
import { imageFields, imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

const homeQuery = groq`
  *[_type == "homeSingleton"][0]{
    hero{
      tagline,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    timelineStages[]{
      _key,
      title,
      body,
      media{
        ${imageWithMetaFields}
      }
    },
    featuredChampion->{
      _id,
      name,
      title,
      quote,
      image{
        ${imageFields}
      },
      "article": articles[0]->{
        _id,
        title,
        "slug": slug.current
      }
    },
    marqueeInline{
      quote,
      credit,
      image{
        ${imageWithMetaFields}
      }
    }
  }
`;

type HomeSanityResponse = {
  hero?: {
    tagline?: string | null;
    subheading?: string | null;
    background?: SanityImageResult;
  } | null;
  timelineStages?: Array<{
    _key?: string;
    title?: string;
    body?: string;
    media?: SanityImageResult;
  }> | null;
  featuredChampion?: {
    _id?: string;
    name?: string;
    title?: string;
    quote?: string;
    image?: SanityImageResult;
    article?: {
      _id?: string;
      title?: string;
      slug?: string;
    } | null;
  } | null;
  marqueeInline?: {
    quote?: string;
    credit?: string;
    image?: SanityImageResult;
  } | null;
};

export async function getHome(): Promise<Pick<HomeData, "hero" | "stages" | "champion">> {
  const data = await sanityClient.fetch<HomeSanityResponse | null>(homeQuery).catch(() => null);

  const hero = mapHero(data?.hero) ?? fallbackHero;
  const stages = mapStages(data?.timelineStages) ?? fallbackStages;
  const champion = mapChampion(data?.featuredChampion, data?.marqueeInline) ?? fallbackChampion;

  return { hero, stages, champion };
}

function mapHero(input?: HomeSanityResponse["hero"] | null): HomeData["hero"] | undefined {
  if (!input) return undefined;
  const background = mapImageResult(input.background ?? null);
  if (!background) return undefined;
  return {
    tagline: input.tagline ?? fallbackHero.tagline,
    subheading: input.subheading ?? undefined,
    background,
  };
}

function mapStages(stages?: HomeSanityResponse["timelineStages"] | null): HomeData["stages"] | undefined {
  if (!stages || stages.length === 0) return undefined;
  const mapped: FittingStage[] = stages
    .map((stage, index) => {
      const media = mapImageResult(stage.media ?? null);
      if (!stage?.title || !media) return null;
      return {
        id: stage._key ?? `stage-${index}`,
        order: index + 1,
        title: stage.title,
        body: stage.body ?? "",
        media,
      };
    })
    .filter((stage): stage is FittingStage => Boolean(stage));

  return mapped.length ? mapped : undefined;
}

function mapChampion(
  champion?: HomeSanityResponse["featuredChampion"] | null,
  marqueeInline?: HomeSanityResponse["marqueeInline"] | null,
): Champion | undefined {
  if (champion) {
    const image = mapImageResult(champion.image ?? null);
    if (image) {
      return {
        id: champion._id ?? "featured-champion",
        name: champion.name ?? "Featured champion",
        title: champion.title ?? "",
        quote: champion.quote ?? "",
        image,
        article: champion.article?.slug
          ? {
              id: champion.article._id ?? champion._id ?? "featured-champion",
              title: champion.article.title ?? "Read more",
              slug: champion.article.slug,
            }
          : undefined,
      };
    }
  }

  if (marqueeInline) {
    const image = mapImageResult(marqueeInline.image ?? null);
    if (image) {
      return {
        id: "inline-marquee",
        name: marqueeInline.credit ?? "Featured story",
        title: marqueeInline.credit ?? "",
        quote: marqueeInline.quote ?? "",
        image,
      };
    }
  }

  return undefined;
}
