import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityClient } from "../../../sanity/client";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type ExperienceHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  picker?: Array<{
    _key?: string;
    title?: string;
    summary?: string;
    href?: string;
    media?: SanityImageResult;
  }>;
  mosaic?: SanityImageResult[];
};

export interface ExperienceHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  picker?: Array<{
    id: string;
    title?: string;
    summary?: string;
    href?: string;
    media?: FactoryAsset;
  }>;
  mosaic?: FactoryAsset[];
}

const experienceHomeQuery = groq`
  *[_type == "experienceHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    picker[]{
      _key,
      title,
      summary,
      href,
      media{
        ${imageWithMetaFields}
      }
    },
    mosaic[]{
      ${imageWithMetaFields}
    }
  }
`;

export async function getExperienceHome(): Promise<ExperienceHomePayload | null> {
  const data = await sanityClient.fetch<ExperienceHomeResponse | null>(experienceHomeQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
    picker: data.picker
      ?.filter((item): item is typeof item & { _key: string } => Boolean(item?._key))
      .map((item) => ({
        id: item._key as string,
        title: item.title ?? undefined,
        summary: item.summary ?? undefined,
        href: item.href ?? undefined,
        media: mapImageResult(item.media ?? null),
      })),
    mosaic: data.mosaic
      ?.map((asset) => mapImageResult(asset ?? null))
      .filter(Boolean) as FactoryAsset[] | undefined,
  };
}
