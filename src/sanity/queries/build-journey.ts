import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityFetch } from "../lib/live";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type BuildJourneyLandingResponse = {
  heroImage?: SanityImageResult;
  intro?: {
    label?: string;
    title?: string;
    body?: string;
  };
};

export interface BuildJourneyLandingPayload {
  heroImage?: FactoryAsset;
  intro?: {
    label?: string;
    title?: string;
    body?: string;
  };
}

const buildJourneyLandingQuery = groq`
  *[_type == "buildJourneyLanding"][0]{
    heroImage{
      ${imageWithMetaFields}
    },
    intro{
      label,
      title,
      body
    }
  }
`;

export async function getBuildJourneyLanding(): Promise<BuildJourneyLandingPayload | null> {
  const result = await sanityFetch({
    query: buildJourneyLandingQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as BuildJourneyLandingResponse | null) ?? null;
  if (!data) return null;

  return {
    heroImage: mapImageResult(data.heroImage ?? null),
    intro: data.intro
      ? {
          label: data.intro.label ?? undefined,
          title: data.intro.title ?? undefined,
          body: data.intro.body ?? undefined,
        }
      : undefined,
  };
}
