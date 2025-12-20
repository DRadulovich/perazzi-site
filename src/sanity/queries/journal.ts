import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityFetch } from "../lib/live";
import {
  imageFields,
  imageWithMetaFields,
  mapImageResult,
  type PortableTextBlock,
  type SanityImageResult,
} from "./utils";

type JournalLandingResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  featuredArticle?: {
    _id?: string;
    title?: string;
    slug?: string;
    heroImage?: SanityImageResult;
  };
};

type JournalArticleResponse = {
  _id?: string;
  title?: string;
  slug?: { current?: string };
  excerpt?: string;
  body?: PortableTextBlock[];
  heroImage?: SanityImageResult;
  tags?: string[];
  relations?: {
    champions?: Array<{ _ref?: string }>;
    platforms?: Array<{ _ref?: string }>;
    disciplines?: Array<{ _ref?: string }>;
  };
};

type AuthorResponse = {
  _id?: string;
  name?: string;
  slug?: { current?: string };
  bioHtml?: string;
  headshot?: SanityImageResult;
};

export interface JournalLandingPayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  featuredArticle?: {
    id: string;
    title?: string;
    slug?: string;
    hero?: FactoryAsset;
  };
}

export interface JournalArticlePayload {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  bodyPortableText?: PortableTextBlock[];
  hero?: FactoryAsset;
  tags?: string[];
  relations?: {
    champions?: string[];
    platforms?: string[];
    disciplines?: string[];
  };
}

export interface JournalAuthorPayload {
  id: string;
  name?: string;
  slug?: string;
  bioHtml?: string;
  headshot?: FactoryAsset;
}

const journalLandingQuery = groq`
  *[_type == "journalLanding"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    featuredArticle->{
      _id,
      title,
      "slug": slug.current,
      heroImage{
        ${imageFields}
      }
    }
  }
`;

const articlesQuery = groq`
  *[_type == "article"]{
    _id,
    title,
    slug,
    excerpt,
    body,
    heroImage{
      ${imageFields}
    },
    tags,
    relations
  }
`;

const authorBySlugQuery = groq`
  *[_type == "author" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    bioHtml,
    headshot{
      ${imageWithMetaFields}
    }
  }
`;

export async function getJournalLanding(): Promise<JournalLandingPayload | null> {
  const result = await sanityFetch({
    query: journalLandingQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as JournalLandingResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
    featuredArticle:
      data.featuredArticle && data.featuredArticle._id
        ? {
            id: data.featuredArticle._id,
            title: data.featuredArticle.title ?? undefined,
            slug: data.featuredArticle.slug ?? undefined,
            hero: mapImageResult(data.featuredArticle.heroImage ?? null),
          }
        : undefined,
  };
}

export async function getArticles(): Promise<JournalArticlePayload[]> {
  const result = await sanityFetch({
    query: articlesQuery,
    stega: true,
  }).catch(() => ({ data: [] }));
  const data = (result?.data as JournalArticleResponse[] | null) ?? null;

  return (data ?? [])
    .filter((article): article is JournalArticleResponse & { _id: string } => Boolean(article._id))
    .map((article) => ({
      id: article._id as string,
      title: article.title ?? undefined,
      slug: article.slug?.current ?? undefined,
      excerpt: article.excerpt ?? undefined,
      bodyPortableText: article.body,
      hero: mapImageResult(article.heroImage ?? null),
      tags: article.tags ?? undefined,
      relations: article.relations
        ? {
            champions: article.relations.champions?.map((ref) => ref._ref).filter(Boolean) as string[] | undefined,
            platforms: article.relations.platforms?.map((ref) => ref._ref).filter(Boolean) as string[] | undefined,
            disciplines: article.relations.disciplines?.map((ref) => ref._ref).filter(Boolean) as string[] | undefined,
          }
        : undefined,
    }));
}

export async function getAuthor(slug: string): Promise<JournalAuthorPayload | null> {
  if (!slug) return null;
  const result = await sanityFetch({
    query: authorBySlugQuery,
    params: { slug },
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as AuthorResponse | null) ?? null;
  if (!data || !data._id) return null;

  return {
    id: data._id,
    name: data.name ?? undefined,
    slug: data.slug?.current ?? undefined,
    bioHtml: data.bioHtml ?? undefined,
    headshot: mapImageResult(data.headshot ?? null),
  };
}
