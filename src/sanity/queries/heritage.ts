import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityClient } from "../../../sanity/client";
import {
  imageWithMetaFields,
  imageFields,
  mapImageResult,
  type PortableTextBlock,
  type SanityImageResult,
} from "./utils";

type HeritageHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  photoEssay?: Array<SanityImageResult & { _key?: string }>;
  oralHistories?: Array<{
    _key?: string;
    title?: string;
    quote?: string;
    attribution?: string;
    image?: SanityImageResult;
  }>;
};

type HeritageEventResponse = {
  _id?: string;
  title?: string;
  date?: string;
  body?: PortableTextBlock[];
  media?: SanityImageResult;
  champions?: Array<{
    _id?: string;
    name?: string;
  }>;
  platforms?: Array<{
    _id?: string;
    name?: string;
    slug?: { current?: string };
  }>;
};

type ChampionResponse = {
  _id?: string;
  name?: string;
  title?: string;
  quote?: string;
  image?: SanityImageResult;
  disciplines?: Array<{ name?: string }>;
  platforms?: Array<{
    _id?: string;
    name?: string;
  }>;
  articles?: Array<{
    _id?: string;
    title?: string;
    slug?: { current?: string };
  }>;
  bio?: { text?: string };
  resume?: {
    winOne?: string;
    winTwo?: string;
    winThree?: string;
  };
};

export interface HeritageHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  photoEssay?: Array<{
    id: string;
    image?: FactoryAsset;
  }>;
  oralHistories?: Array<{
    id: string;
    title?: string;
    quote?: string;
    attribution?: string;
    image?: FactoryAsset;
  }>;
}

export interface HeritageEventPayload {
  id: string;
  title?: string;
  date?: string;
  bodyPortableText?: PortableTextBlock[];
  media?: FactoryAsset;
  champions?: Array<{ id: string; name?: string }>;
  platforms?: Array<{ id: string; name?: string; slug?: string }>;
}

export interface ChampionPayload {
  id: string;
  name?: string;
  title?: string;
  quote?: string;
  image?: FactoryAsset;
  disciplines?: string[];
  article?: { id: string; title?: string; slug?: string };
  platforms?: string[];
  bio?: string;
  resume?: {
    winOne?: string;
    winTwo?: string;
    winThree?: string;
  };
}

const heritageHomeQuery = groq`
  *[_type == "heritageHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    photoEssay[]{
      _key,
      ${imageWithMetaFields}
    },
    oralHistories[]{
      _key,
      title,
      quote,
      attribution,
      image{
        ${imageWithMetaFields}
      }
    }
  }
`;

const heritageEventsQuery = groq`
  *[_type == "heritageEvent"] | order(date asc){
    _id,
    title,
    date,
    body,
    media{
      ${imageWithMetaFields}
    },
    champions[]->{
      _id,
      name
    },
    platforms[]->{
      _id,
      name,
      slug
    }
  }
`;

const championsQuery = groq`
  *[_type == "champion"]{
    _id,
    name,
    title,
    quote,
    image{
      ${imageFields}
    },
    disciplines[]->{
      name
    },
    platforms[]->{
      _id,
      name
    },
    articles[]->{
      _id,
      title,
      slug
    },
    bio{
      text
    },
    resume{
      winOne,
      winTwo,
      winThree
    }
  }
`;

export async function getHeritageHome(): Promise<HeritageHomePayload | null> {
  const data = await sanityClient.fetch<HeritageHomeResponse | null>(heritageHomeQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
    photoEssay: data.photoEssay
      ?.filter((item): item is typeof item & { _key: string } => Boolean(item?._key))
      .map((item) => ({
        id: item._key as string,
        image: mapImageResult(item ?? null),
      })),
    oralHistories: data.oralHistories
      ?.filter((entry): entry is typeof entry & { _key: string } => Boolean(entry?._key))
      .map((entry) => ({
        id: entry._key as string,
        title: entry.title ?? undefined,
        quote: entry.quote ?? undefined,
        attribution: entry.attribution ?? undefined,
        image: mapImageResult(entry.image ?? null),
      })),
  };
}

export async function getHeritageEvents(): Promise<HeritageEventPayload[]> {
  const data = await sanityClient.fetch<HeritageEventResponse[]>(heritageEventsQuery).catch(() => []);

  return data
    .filter((event): event is HeritageEventResponse & { _id: string } => Boolean(event?._id))
    .map((event) => ({
      id: event._id as string,
      title: event.title ?? undefined,
      date: event.date ?? undefined,
      bodyPortableText: event.body,
      media: mapImageResult(event.media ?? null),
      champions: event.champions
        ?.filter((champion): champion is { _id: string; name?: string } => Boolean(champion?._id))
        .map((champion) => ({
          id: champion._id as string,
          name: champion.name ?? undefined,
        })),
      platforms: event.platforms
        ?.filter((platform): platform is { _id: string; name?: string; slug?: { current?: string } } => Boolean(platform?._id))
        .map((platform) => ({
          id: platform._id as string,
          name: platform.name ?? undefined,
          slug: platform.slug?.current ?? undefined,
        })),
    }));
}

export async function getHeritageChampions(): Promise<ChampionPayload[]> {
  const data = await sanityClient.fetch<ChampionResponse[]>(championsQuery).catch(() => []);

  return data
    .filter((champion): champion is ChampionResponse & { _id: string } => Boolean(champion?._id))
    .map((champion) => {
      const article = champion.articles?.find((item) => item?._id);
      return {
        id: champion._id as string,
        name: champion.name ?? undefined,
        title: champion.title ?? undefined,
        quote: champion.quote ?? undefined,
        image: mapImageResult(champion.image ?? null),
        disciplines: champion.disciplines?.map((discipline) => discipline?.name).filter(Boolean) as string[] | undefined,
        platforms: champion.platforms?.map((platform) => platform?.name).filter(Boolean) as string[] | undefined,
        bio: champion.bio?.text ?? undefined,
        resume: champion.resume,
        article: article
          ? {
              id: article._id as string,
              title: article.title ?? undefined,
              slug: article.slug?.current ?? undefined,
            }
          : undefined,
      };
    });
}
