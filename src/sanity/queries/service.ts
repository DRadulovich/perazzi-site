import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityClient } from "../../../sanity/client";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type ServiceHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
};

export interface ServiceHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
}

const serviceHomeQuery = groq`
  *[_type == "serviceHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    }
  }
`;

export async function getServiceHome(): Promise<ServiceHomePayload | null> {
  const data = await sanityClient.fetch<ServiceHomeResponse | null>(serviceHomeQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
  };
}
