import "server-only";

import { groq } from "next-sanity";

import { sanityFetch } from "../lib/live";

type BespokeBuildLandingResponse = {
  kicker?: string;
  title?: string;
  description?: string;
  body?: string;
};

type BespokeBuildStageResponse = {
  title?: string;
  description?: string;
  body?: string;
  slug?: { current?: string };
};

export interface BespokeBuildLandingPayload {
  kicker?: string;
  title?: string;
  description?: string;
  body?: string;
}

export interface BespokeBuildStagePayload {
  title?: string;
  description?: string;
  body?: string;
  slug?: string;
}

function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

const bespokeBuildLandingQuery = groq`
  *[_type == "bespokeBuildLanding"][0]{
    kicker,
    title,
    description,
    body
  }
`;

const bespokeBuildStageQuery = groq`
  *[_type == "bespokeBuildStage" && slug.current == $slug][0]{
    title,
    description,
    body,
    slug
  }
`;

const bespokeBuildStageSlugsQuery = groq`
  *[_type == "bespokeBuildStage" && defined(slug.current)]{
    "slug": slug.current
  }
`;

export async function getBespokeBuildLanding(): Promise<BespokeBuildLandingPayload | null> {
  const result = await sanityFetch({
    query: bespokeBuildLandingQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as BespokeBuildLandingResponse | null) ?? null;
  if (!data) return null;

  return {
    kicker: data.kicker ?? undefined,
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    body: data.body ?? undefined,
  };
}

export async function getBespokeBuildStage(slug: string): Promise<BespokeBuildStagePayload | null> {
  if (!slug) return null;
  const result = await sanityFetch({
    query: bespokeBuildStageQuery,
    params: { slug },
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as BespokeBuildStageResponse | null) ?? null;
  if (!data) return null;

  return {
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    body: data.body ?? undefined,
    slug: data.slug?.current ?? undefined,
  };
}

export async function getBespokeBuildStageSlugs(): Promise<string[]> {
  const result = await sanityFetch({
    query: bespokeBuildStageSlugsQuery,
    stega: true,
  }).catch(() => ({ data: [] }));
  const data = (result?.data as Array<{ slug?: string }> | null) ?? null;
  return (data ?? [])
    .map((entry) => entry.slug)
    .filter(isDefined);
}
