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

type JournalListArticleResponse = {
  _id?: string;
  title?: string;
  slug?: { current?: string };
  excerpt?: string;
  dekHtml?: string;
  heroImage?: SanityImageResult;
  author?: { _id?: string; name?: string };
  publishedAt?: string;
  readingTimeMins?: number;
  tags?: string[];
  category?: { _id?: string; key?: string; title?: string };
};

type JournalSectionResponse = {
  key?: string;
  title?: string;
  subtitleHtml?: string;
  viewAllHref?: string;
  items?: JournalListArticleResponse[];
};

type JournalLandingResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  featuredArticle?: {
    _id?: string;
    title?: string;
    slug?: { current?: string };
    heroImage?: SanityImageResult;
  };
  sections?: JournalSectionResponse[];
};

type JournalArticleResponse = {
  _id?: string;
  title?: string;
  slug?: { current?: string };
  dekHtml?: string;
  excerpt?: string;
  body?: PortableTextBlock[];
  heroImage?: SanityImageResult;
  tags?: string[];
  publishedAt?: string;
  readingTimeMins?: number;
  author?: AuthorResponse;
  category?: { _id?: string; key?: string; title?: string };
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

type JournalCategoryResponse = {
  key?: string;
  title?: string;
  subtitleHtml?: string;
  featuredArticle?: {
    _id?: string;
    title?: string;
    slug?: { current?: string };
  };
  items?: JournalListArticleResponse[];
};

export interface JournalListArticlePayload {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  dekHtml?: string;
  hero?: FactoryAsset;
  author?: { id?: string; name?: string };
  publishedAt?: string;
  readingTimeMins?: number;
  tags?: string[];
  categoryKey?: string;
}

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
  sections?: Array<{
    key?: string;
    title?: string;
    subtitleHtml?: string;
    viewAllHref?: string;
    items?: JournalListArticlePayload[];
  }>;
}

export interface JournalArticlePayload {
  id: string;
  title?: string;
  slug?: string;
  dekHtml?: string;
  excerpt?: string;
  bodyPortableText?: PortableTextBlock[];
  hero?: FactoryAsset;
  tags?: string[];
  author?: JournalAuthorPayload;
  publishedAt?: string;
  readingTimeMins?: number;
  categoryKey?: string;
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

export interface JournalCategoryPayload {
  key?: string;
  title?: string;
  subtitleHtml?: string;
  featuredArticle?: {
    id: string;
    title?: string;
    slug?: string;
  };
  items?: JournalListArticlePayload[];
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
      slug,
      heroImage{
        ${imageFields}
      }
    },
    sections[]{
      key,
      title,
      subtitleHtml,
      viewAllHref,
      items[]->{
        _id,
        title,
        slug,
        dekHtml,
        excerpt,
        heroImage{
          ${imageFields}
        },
        "author": author->{ _id, name },
        publishedAt,
        readingTimeMins,
        tags,
        "category": category->{ _id, key, title }
      }
    }
  }
`;

const articlesQuery = groq`
  *[_type == "article"]{
    _id,
    title,
    slug,
    dekHtml,
    excerpt,
    body,
    heroImage{
      ${imageFields}
    },
    tags,
    publishedAt,
    readingTimeMins,
    author->{
      _id,
      name,
      slug,
      bioHtml,
      headshot{
        ${imageWithMetaFields}
      }
    },
    category->{ _id, key, title },
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

const categoriesQuery = groq`
  *[_type == "journalCategory"]{
    key,
    title,
    subtitleHtml,
    featuredArticle->{
      _id,
      title,
      slug
    },
    items[]->{
      _id,
      title,
      slug,
      dekHtml,
      excerpt,
      heroImage{
        ${imageFields}
      },
      "author": author->{ _id, name },
      publishedAt,
      readingTimeMins,
      tags,
      "category": category->{ _id, key, title }
    }
  }
`;

const mapAuthorResponse = (author?: AuthorResponse | null): JournalAuthorPayload | undefined => {
  if (!author?._id) return undefined;
  return {
    id: author._id,
    name: author.name ?? undefined,
    slug: author.slug?.current ?? undefined,
    bioHtml: author.bioHtml ?? undefined,
    headshot: mapImageResult(author.headshot ?? null),
  };
};

const mapListArticle = (article?: JournalListArticleResponse | null): JournalListArticlePayload | undefined => {
  if (!article?._id) return undefined;
  return {
    id: article._id,
    title: article.title ?? undefined,
    slug: article.slug?.current ?? undefined,
    excerpt: article.excerpt ?? undefined,
    dekHtml: article.dekHtml ?? undefined,
    hero: mapImageResult(article.heroImage ?? null),
    author: article.author?._id
      ? {
          id: article.author._id,
          name: article.author.name ?? undefined,
        }
      : undefined,
    publishedAt: article.publishedAt ?? undefined,
    readingTimeMins: article.readingTimeMins ?? undefined,
    tags: article.tags ?? undefined,
    categoryKey: article.category?.key ?? undefined,
  };
};

function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

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
    featuredArticle: data.featuredArticle?._id
      ? {
          id: data.featuredArticle._id,
          title: data.featuredArticle.title ?? undefined,
          slug: data.featuredArticle.slug?.current ?? undefined,
          hero: mapImageResult(data.featuredArticle.heroImage ?? null),
        }
      : undefined,
    sections: data.sections?.map((section) => ({
      key: section.key ?? undefined,
      title: section.title ?? undefined,
      subtitleHtml: section.subtitleHtml ?? undefined,
      viewAllHref: section.viewAllHref ?? undefined,
      items: (section.items ?? [])
        .map(mapListArticle)
        .filter(isDefined),
    })),
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
      id: article._id,
      title: article.title ?? undefined,
      slug: article.slug?.current ?? undefined,
      dekHtml: article.dekHtml ?? undefined,
      excerpt: article.excerpt ?? undefined,
      bodyPortableText: article.body,
      hero: mapImageResult(article.heroImage ?? null),
      tags: article.tags ?? undefined,
      author: mapAuthorResponse(article.author ?? null),
      publishedAt: article.publishedAt ?? undefined,
      readingTimeMins: article.readingTimeMins ?? undefined,
      categoryKey: article.category?.key ?? undefined,
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
  if (!data?._id) return null;

  return mapAuthorResponse(data) ?? null;
}

export async function getJournalCategories(): Promise<JournalCategoryPayload[]> {
  const result = await sanityFetch({
    query: categoriesQuery,
    stega: true,
  }).catch(() => ({ data: [] }));
  const data = (result?.data as JournalCategoryResponse[] | null) ?? null;

  return (data ?? [])
    .filter((category): category is JournalCategoryResponse & { key: string } => Boolean(category.key))
    .map((category) => ({
      key: category.key ?? undefined,
      title: category.title ?? undefined,
      subtitleHtml: category.subtitleHtml ?? undefined,
      featuredArticle: category.featuredArticle?._id
        ? {
            id: category.featuredArticle._id,
            title: category.featuredArticle.title ?? undefined,
            slug: category.featuredArticle.slug?.current ?? undefined,
          }
        : undefined,
      items: (category.items ?? [])
        .map(mapListArticle)
        .filter(isDefined),
    }));
}
