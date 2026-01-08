import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityFetch } from "../lib/live";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type ConciergePageResponse = {
  hero?: {
    eyebrow?: string;
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
    bullets?: Array<{ title?: string; body?: string }>;
  };
  drawerUi?: {
    panelLabel?: string;
    panelTitle?: string;
    loadingMessage?: string;
    emptyMessage?: string;
    viewMoreLabel?: string;
    closeLabel?: string;
  };
};

export interface ConciergePagePayload {
  hero?: {
    eyebrow?: string;
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
    bullets?: Array<{ title?: string; body?: string }>;
  };
  drawerUi?: ConciergePageResponse["drawerUi"];
}

const conciergePageQuery = groq`
  *[_type == "conciergePage"][0]{
    hero{
      eyebrow,
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      },
      bullets[]{
        title,
        body
      }
    },
    drawerUi{
      panelLabel,
      panelTitle,
      loadingMessage,
      emptyMessage,
      viewMoreLabel,
      closeLabel
    }
  }
`;

export async function getConciergePage(): Promise<ConciergePagePayload | null> {
  const result = await sanityFetch({
    query: conciergePageQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ConciergePageResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          eyebrow: data.hero.eyebrow ?? undefined,
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
          bullets: data.hero.bullets
            ?.filter((bullet): bullet is NonNullable<typeof bullet> => Boolean(bullet?.title || bullet?.body))
            .map((bullet) => ({
              title: bullet.title ?? undefined,
              body: bullet.body ?? undefined,
            })),
        }
      : undefined,
    drawerUi: data.drawerUi ?? undefined,
  };
}
