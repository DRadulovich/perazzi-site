import "server-only";

import { groq } from "next-sanity";

import { sanityFetch } from "../lib/live";

type HeritageSectionResponse = {
  title?: string;
  description?: string;
  body?: string;
  slug?: { current?: string };
};

export interface HeritageSectionPayload {
  title?: string;
  description?: string;
  body?: string;
  slug?: string;
}

function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

const heritageSectionQuery = groq`
  *[_type == "heritageSection" && slug.current == $slug][0]{
    title,
    description,
    body,
    slug
  }
`;

const heritageSectionSlugsQuery = groq`
  *[_type == "heritageSection" && defined(slug.current)]{
    "slug": slug.current
  }
`;

export async function getHeritageSection(slug: string): Promise<HeritageSectionPayload | null> {
  if (!slug) return null;
  const result = await sanityFetch({
    query: heritageSectionQuery,
    params: { slug },
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as HeritageSectionResponse | null) ?? null;
  if (!data) return null;

  return {
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    body: data.body ?? undefined,
    slug: data.slug?.current ?? undefined,
  };
}

export async function getHeritageSectionSlugs(): Promise<string[]> {
  const result = await sanityFetch({
    query: heritageSectionSlugsQuery,
    stega: true,
  }).catch(() => ({ data: [] }));
  const data = (result?.data as Array<{ slug?: string }> | null) ?? null;
  return (data ?? [])
    .map((entry) => entry.slug)
    .filter(isDefined);
}
