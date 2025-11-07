import { groq } from "next-sanity";
import { sanityClient } from "./client";

const IMAGE_FIELDS = `
  "url": asset->url,
  alt,
  caption
`;

const PLATFORM_FIELDS = `
  _id,
  _type,
  name,
  "slug": slug.current,
  lineage,
  heroImage{
    ${IMAGE_FIELDS}
  },
  highlights[],
  disciplines[]->{
    _id,
    name,
    "slug": slug.current
  }
`;

const DISCIPLINE_FIELDS = `
  _id,
  _type,
  name,
  "slug": slug.current,
  overview,
  image{
    ${IMAGE_FIELDS}
  },
  recommendedPlatforms[]->{
    _id,
    name,
    "slug": slug.current
  }
`;

const CHAMPION_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  title,
  quote,
  image{
    ${IMAGE_FIELDS}
  },
  disciplines[]->{
    _id,
    name,
    "slug": slug.current
  },
  platforms[]->{
    _id,
    name,
    "slug": slug.current
  },
  articles[]->{
    _id,
    title,
    "slug": slug.current
  }
`;

const ARTICLE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  body,
  heroImage{
    ${IMAGE_FIELDS}
  },
  tags,
  relations{
    champions[]->{
      _id,
      name,
      "slug": slug.current
    },
    platforms[]->{
      _id,
      name,
      "slug": slug.current
    },
    disciplines[]->{
      _id,
      name,
      "slug": slug.current
    }
  }
`;

export async function listPlatforms() {
  return sanityClient.fetch(
    groq`*[_type == "platform"] | order(name asc) {
      ${PLATFORM_FIELDS}
    }`,
  );
}

export async function platformBySlug(slug: string) {
  return sanityClient.fetch(
    groq`*[_type == "platform" && slug.current == $slug][0]{
      ${PLATFORM_FIELDS},
      disciplines[]->{
        ${DISCIPLINE_FIELDS}
      }
    }`,
    { slug },
  );
}

export async function disciplineBySlug(slug: string) {
  return sanityClient.fetch(
    groq`*[_type == "discipline" && slug.current == $slug][0]{
      ${DISCIPLINE_FIELDS},
      recommendedPlatforms[]->{
        ${PLATFORM_FIELDS}
      }
    }`,
    { slug },
  );
}

export async function championSpotlight(limit = 3) {
  return sanityClient.fetch(
    groq`*[_type == "champion"] | order(name asc)[0...$limit]{
      ${CHAMPION_FIELDS}
    }`,
    { limit },
  );
}

export async function heritageTimeline() {
  return sanityClient.fetch(
    groq`*[_type == "heritageEvent"] | order(date asc) {
      _id,
      title,
      date,
      body,
      image{
        ${IMAGE_FIELDS}
      },
      champions[]->{
        _id,
        name,
        "slug": slug.current
      },
      platforms[]->{
        _id,
        name,
        "slug": slug.current
      }
    }`,
  );
}

export async function grades() {
  return sanityClient.fetch(
    groq`*[_type == "grade"] | order(name asc) {
      _id,
      name,
      description,
      gallery[]{
        ${IMAGE_FIELDS}
      }
    }`,
  );
}

export async function gauges() {
  return sanityClient.fetch(
    groq`*[_type == "gauge"] | order(name asc) {
      _id,
      name,
      handlingNotes
    }`,
  );
}

export async function articles(limit = 10) {
  return sanityClient.fetch(
    groq`*[_type == "article"] | order(_createdAt desc)[0...$limit] {
      ${ARTICLE_FIELDS}
    }`,
    { limit },
  );
}
