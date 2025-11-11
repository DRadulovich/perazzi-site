import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityClient } from "../../../sanity/client";
import {
  imageWithMetaFields,
  mapImageResult,
  type PortableTextBlock,
  type SanityImageResult,
} from "./utils";

type ShotgunsLandingResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  triggerExplainer?: {
    title?: string;
    copy?: PortableTextBlock[];
    diagram?: SanityImageResult;
    links?: Array<{ label?: string; href?: string }>;
  };
  teasers?: {
    engraving?: SanityImageResult;
    wood?: SanityImageResult;
  };
  disciplineHubs?: Array<{
    key?: string;
    title?: string;
    summary?: string;
    championImage?: SanityImageResult;
  }>;
};

type PlatformResponse = {
  _id?: string;
  name?: string;
  slug?: { current?: string };
  lineage?: string;
  hero?: SanityImageResult;
  highlights?: Array<{
    title?: string;
    body?: string;
    media?: SanityImageResult;
  }>;
  champion?: {
    name?: string;
    title?: string;
    quote?: string;
    image?: SanityImageResult;
  };
  snippet?: {
    text?: string;
  };
  disciplines?: Array<{ _id?: string; name?: string }>;
  fixedCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  detachableCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
};

type DisciplineResponse = {
  _id?: string;
  name?: string;
  slug?: { current?: string };
  overview?: PortableTextBlock[];
  hero?: SanityImageResult;
  championImage?: SanityImageResult;
  recommendedPlatforms?: Array<{ _ref?: string }>;
};

type GradeResponse = {
  _id?: string;
  name?: string;
  description?: string;
  hero?: SanityImageResult;
  engravingGallery?: SanityImageResult[];
  woodImages?: SanityImageResult[];
};

export interface ShotgunsLandingPayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  triggerExplainer?: {
    title?: string;
    copyPortableText?: PortableTextBlock[];
    diagram?: FactoryAsset;
    links?: Array<{ label?: string; href?: string }>;
  };
  teasers?: {
    engraving?: FactoryAsset;
    wood?: FactoryAsset;
  };
  disciplineHubs?: Array<{
    key?: string;
    title?: string;
    summary?: string;
    championImage?: FactoryAsset;
  }>;
}

export interface ShotgunsPlatformPayload {
  id: string;
  name?: string;
  slug?: string;
  lineage?: string;
  hero?: FactoryAsset;
  snippetText?: string;
  highlights?: Array<{
    title?: string;
    body?: string;
    media?: FactoryAsset;
  }>;
  champion?: {
    name?: string;
    title?: string;
    quote?: string;
    image?: FactoryAsset;
  };
  disciplines?: Array<{ id: string; name?: string }>;
  fixedCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  detachableCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

export interface ShotgunsDisciplinePayload {
  id: string;
  name?: string;
  slug?: string;
  overviewPortableText?: PortableTextBlock[];
  hero?: FactoryAsset;
  championImage?: FactoryAsset;
  recommendedPlatformIds?: string[];
  popularModels?: Array<{ id: string; name?: string; hero?: FactoryAsset }>;
}

export interface ShotgunsGradePayload {
  id: string;
  name?: string;
  description?: string;
  hero?: FactoryAsset;
  engravingGallery?: FactoryAsset[];
  woodImages?: FactoryAsset[];
}

const shotgunsLandingQuery = groq`
  *[_type == "shotgunsLanding"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    triggerExplainer{
      title,
      copy,
      diagram{
        ${imageWithMetaFields}
      },
      links[]{
        label,
        href
      }
    },
    teasers{
      engraving{ ${imageWithMetaFields} },
      wood{ ${imageWithMetaFields} }
    },
    disciplineHubs[]{
      key,
      title,
      summary,
      championImage{
        ${imageWithMetaFields}
      }
    }
  }
`;

const platformsQuery = groq`
  *[_type == "platform"]{
    _id,
    name,
    slug,
    lineage,
    hero{
      ${imageWithMetaFields}
    },
    highlights[]{
      title,
      body,
      media{
        ${imageWithMetaFields}
      }
    },
    champion{
      name,
      title,
      quote,
      image{
        ${imageWithMetaFields}
      },
      resume{
        winOne,
        winTwo,
        winThree
      }
    },
    snippet{
      text
    },
    disciplines[]->{
      _id,
      name
    },
    fixedCounterpart{
      id,
      name,
      slug
    },
    detachableCounterpart{
      id,
      name,
      slug
    }
  }
`;

const disciplinesQuery = groq`
  *[_type == "discipline"]{
    _id,
    name,
    slug,
    overview,
    hero{
      ${imageWithMetaFields}
    },
    championImage{
      ${imageWithMetaFields}
    },
    recommendedPlatforms,
    popularModels[]->{
      _id,
      s_model_name,
      s_image_local_path{
        ${imageWithMetaFields}
      }
    }
  }
`;

const gradesQuery = groq`
  *[_type == "grade"]{
    _id,
    name,
    description,
    hero{
      ${imageWithMetaFields}
    },
    engravingGallery[]{
      ${imageWithMetaFields}
    },
    woodImages[]{
      ${imageWithMetaFields}
    }
  }
`;

export async function getShotgunsLanding(): Promise<ShotgunsLandingPayload | null> {
  const data = await sanityClient.fetch<ShotgunsLandingResponse | null>(shotgunsLandingQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero?.background
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background),
        }
      : undefined,
    triggerExplainer: data.triggerExplainer
      ? {
          title: data.triggerExplainer.title ?? undefined,
          copyPortableText: data.triggerExplainer.copy,
          diagram: mapImageResult(data.triggerExplainer.diagram ?? null),
          links: data.triggerExplainer.links?.map((link) => ({
            label: link.label ?? undefined,
            href: link.href ?? undefined,
          })),
        }
      : undefined,
    teasers: data.teasers
      ? {
          engraving: mapImageResult(data.teasers.engraving ?? null),
          wood: mapImageResult(data.teasers.wood ?? null),
        }
      : undefined,
    disciplineHubs: data.disciplineHubs?.map((hub) => ({
      key: hub.key ?? undefined,
      title: hub.title ?? undefined,
      summary: hub.summary ?? undefined,
      championImage: mapImageResult(hub.championImage ?? null),
    })),
  };
}

export async function getPlatforms(): Promise<ShotgunsPlatformPayload[]> {
  const data = await sanityClient.fetch<PlatformResponse[]>(platformsQuery).catch(() => []);

  return data
    .filter((platform): platform is PlatformResponse & { _id: string } => Boolean(platform?._id))
    .map((platform) => ({
      id: platform._id as string,
      name: platform.name ?? undefined,
      slug: platform.slug?.current ?? undefined,
      lineage: platform.lineage ?? undefined,
      hero: mapImageResult(platform.hero ?? null),
      snippetText: platform.snippet?.text ?? undefined,
      highlights: platform.highlights?.map((highlight) => ({
        title: highlight.title ?? undefined,
        body: highlight.body ?? undefined,
        media: mapImageResult(highlight.media ?? null),
      })),
      champion: platform.champion
        ? {
            name: platform.champion.name ?? undefined,
            title: platform.champion.title ?? undefined,
            quote: platform.champion.quote ?? undefined,
            image: mapImageResult(platform.champion.image ?? null),
            resume: {
              winOne: platform.champion.resume?.winOne ?? undefined,
              winTwo: platform.champion.resume?.winTwo ?? undefined,
              winThree: platform.champion.resume?.winThree ?? undefined,
            },
          }
        : undefined,
      disciplines: platform.disciplines
        ?.map((ref) =>
          ref?._id
            ? {
                id: ref._id as string,
                name: ref.name ?? undefined,
              }
            : null,
        )
        .filter(Boolean) as Array<{ id: string; name?: string }> | undefined,
      fixedCounterpart: platform.fixedCounterpart
        ? {
            id: platform.fixedCounterpart.id ?? undefined,
            name: platform.fixedCounterpart.name ?? undefined,
            slug: platform.fixedCounterpart.slug ?? undefined,
          }
        : undefined,
      detachableCounterpart: platform.detachableCounterpart
        ? {
            id: platform.detachableCounterpart.id ?? undefined,
            name: platform.detachableCounterpart.name ?? undefined,
            slug: platform.detachableCounterpart.slug ?? undefined,
          }
        : undefined,
    }));
}

export async function getDisciplines(): Promise<ShotgunsDisciplinePayload[]> {
  const data = await sanityClient.fetch<DisciplineResponse[]>(disciplinesQuery).catch(() => []);

  return data
    .filter((discipline): discipline is DisciplineResponse & { _id: string } => Boolean(discipline?._id))
    .map((discipline) => ({
      id: discipline._id as string,
      name: discipline.name ?? undefined,
      slug: discipline.slug?.current ?? undefined,
      overviewPortableText: discipline.overview,
      hero: mapImageResult(discipline.hero ?? null),
      championImage: mapImageResult(discipline.championImage ?? null),
      recommendedPlatformIds: discipline.recommendedPlatforms
        ?.map((ref) => ref._ref)
        .filter(Boolean) as string[] | undefined,
      popularModels: discipline.popularModels
        ?.map((model) =>
          model?._id
            ? {
                id: model._id as string,
                name: model.s_model_name ?? undefined,
                hero: mapImageResult(model.s_image_local_path ?? null),
              }
            : null,
        )
        .filter(Boolean) as Array<{ id: string; name?: string; hero?: FactoryAsset }> | undefined,
    }));
}

export async function getGrades(): Promise<ShotgunsGradePayload[]> {
  const data = await sanityClient.fetch<GradeResponse[]>(gradesQuery).catch(() => []);

  return data
    .filter((grade): grade is GradeResponse & { _id: string } => Boolean(grade?._id))
    .map((grade) => ({
      id: grade._id as string,
      name: grade.name ?? undefined,
      description: grade.description ?? undefined,
      hero: mapImageResult(grade.hero ?? null),
      engravingGallery: grade.engravingGallery
        ?.map((asset) => mapImageResult(asset ?? null))
        .filter(Boolean) as FactoryAsset[] | undefined,
      woodImages: grade.woodImages
        ?.map((asset) => mapImageResult(asset ?? null))
        .filter(Boolean) as FactoryAsset[] | undefined,
    }));
}
