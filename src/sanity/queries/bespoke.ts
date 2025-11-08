import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityClient } from "../../../sanity/client";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type BespokeHomeResponse = {
  hero?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    media?: SanityImageResult;
  };
  steps?: Array<{
    _key?: string;
    title?: string;
    bodyHtml?: string;
    media?: SanityImageResult;
  }>;
  experts?: Array<{
    _key?: string;
    name?: string;
    role?: string;
    bioShort?: string;
    quote?: string;
    headshot?: SanityImageResult;
  }>;
  assuranceImage?: SanityImageResult;
};

export interface BespokeHomePayload {
  hero?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    media?: FactoryAsset;
  };
  steps?: Array<{
    id: string;
    title?: string;
    bodyHtml?: string;
    media?: FactoryAsset;
  }>;
  experts?: Array<{
    id: string;
    name?: string;
    role?: string;
    bioShort?: string;
    quote?: string;
    headshot?: FactoryAsset;
  }>;
  assuranceImage?: FactoryAsset;
}

const bespokeHomeQuery = groq`
  *[_type == "bespokeHome"][0]{
    hero{
      eyebrow,
      title,
      intro,
      media{
        ${imageWithMetaFields}
      }
    },
    steps[]{
      _key,
      title,
      bodyHtml,
      media{
        ${imageWithMetaFields}
      }
    },
    experts[]{
      _key,
      name,
      role,
      bioShort,
      quote,
      headshot{
        ${imageWithMetaFields}
      }
    },
    assuranceImage{
      ${imageWithMetaFields}
    }
  }
`;

export async function getBespokeHome(): Promise<BespokeHomePayload | null> {
  const data = await sanityClient.fetch<BespokeHomeResponse | null>(bespokeHomeQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          eyebrow: data.hero.eyebrow ?? undefined,
          title: data.hero.title ?? undefined,
          intro: data.hero.intro ?? undefined,
          media: mapImageResult(data.hero.media ?? null),
        }
      : undefined,
    steps: data.steps
      ?.filter((step): step is typeof step & { _key: string } => Boolean(step?._key))
      .map((step) => ({
        id: step._key as string,
        title: step.title ?? undefined,
        bodyHtml: step.bodyHtml ?? undefined,
        media: mapImageResult(step.media ?? null),
      })),
    experts: data.experts
      ?.filter((expert): expert is typeof expert & { _key: string } => Boolean(expert?._key))
      .map((expert) => ({
        id: expert._key as string,
        name: expert.name ?? undefined,
        role: expert.role ?? undefined,
        bioShort: expert.bioShort ?? undefined,
        quote: expert.quote ?? undefined,
        headshot: mapImageResult(expert.headshot ?? null),
      })),
    assuranceImage: mapImageResult(data.assuranceImage ?? null),
  };
}
