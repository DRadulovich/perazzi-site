import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityFetch } from "../lib/live";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type PageHeroResponse = {
  label?: string;
  title?: string;
  description?: string;
  image?: SanityImageResult;
};

type PageSeoResponse = {
  title?: string;
  description?: string;
};

type ModelSearchPageResponse = {
  hero?: PageHeroResponse;
  seo?: PageSeoResponse;
};

type EngravingSearchPageResponse = {
  hero?: PageHeroResponse;
  seo?: PageSeoResponse;
};

export interface PageHeroPayload {
  label?: string;
  title?: string;
  description?: string;
  image?: FactoryAsset;
}

export interface PageSeoPayload {
  title?: string;
  description?: string;
}

export interface ModelSearchPagePayload {
  hero?: PageHeroPayload;
  seo?: PageSeoPayload;
}

export interface EngravingSearchPagePayload {
  hero?: PageHeroPayload;
  seo?: PageSeoPayload;
}

const modelSearchPageQuery = groq`
  *[_type == "modelSearchPage"][0]{
    hero{
      label,
      title,
      description,
      image{
        ${imageWithMetaFields}
      }
    },
    seo{
      title,
      description
    }
  }
`;

const engravingSearchPageQuery = groq`
  *[_type == "engravingSearchPage"][0]{
    hero{
      label,
      title,
      description,
      image{
        ${imageWithMetaFields}
      }
    },
    seo{
      title,
      description
    }
  }
`;

const mapHero = (hero?: PageHeroResponse): PageHeroPayload | undefined => {
  if (!hero) return undefined;
  return {
    label: hero.label ?? undefined,
    title: hero.title ?? undefined,
    description: hero.description ?? undefined,
    image: mapImageResult(hero.image ?? null),
  };
};

const mapSeo = (seo?: PageSeoResponse): PageSeoPayload | undefined =>
  seo
    ? {
        title: seo.title ?? undefined,
        description: seo.description ?? undefined,
      }
    : undefined;

export async function getModelSearchPage(): Promise<ModelSearchPagePayload | null> {
  const result = await sanityFetch({
    query: modelSearchPageQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ModelSearchPageResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: mapHero(data.hero),
    seo: mapSeo(data.seo),
  };
}

export async function getEngravingSearchPage(): Promise<EngravingSearchPagePayload | null> {
  const result = await sanityFetch({
    query: engravingSearchPageQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as EngravingSearchPageResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: mapHero(data.hero),
    seo: mapSeo(data.seo),
  };
}
