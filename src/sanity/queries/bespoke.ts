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
  stepsIntro?: {
    heading?: string;
    subheading?: string;
    ctaLabel?: string;
    backgroundImage?: SanityImageResult;
  };
  steps?: Array<{
    _key?: string;
    title?: string;
    bodyHtml?: string;
    media?: SanityImageResult;
  }>;
  bespokeGuide?: {
    heading?: string;
    body?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    listItems?: string[];
  };
  cinematicStrips?: Array<{
    image?: SanityImageResult;
    alt?: string;
  }>;
  expertsIntro?: {
    eyebrow?: string;
    heading?: string;
  };
  experts?: Array<{
    _key?: string;
    name?: string;
    role?: string;
    bioShort?: string;
    quote?: string;
    headshot?: SanityImageResult;
  }>;
  bookingSection?: {
    heading?: string;
    options?: Array<{
      title?: string;
      duration?: string;
      description?: string;
      href?: string;
    }>;
    whatToExpectHeading?: string;
    whatToExpectItems?: string[];
    note?: string;
    backgroundImage?: SanityImageResult;
  };
  assuranceImage?: SanityImageResult;
  assuranceContent?: {
    heading?: string;
    label?: string;
    body?: string;
    quote?: string;
  };
};

export interface BespokeHomePayload {
  hero?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    media?: FactoryAsset;
  };
  stepsIntro?: {
    heading?: string;
    subheading?: string;
    ctaLabel?: string;
    background?: FactoryAsset;
  };
  steps?: Array<{
    id: string;
    title?: string;
    bodyHtml?: string;
    media?: FactoryAsset;
  }>;
  bespokeGuide?: BespokeHomeResponse["bespokeGuide"];
  cinematicStrips?: Array<{ image?: FactoryAsset; alt?: string }>;
  expertsIntro?: BespokeHomeResponse["expertsIntro"];
  experts?: Array<{
    id: string;
    name?: string;
    role?: string;
    bioShort?: string;
    quote?: string;
    headshot?: FactoryAsset;
  }>;
  bookingSection?: {
    heading?: string;
    options?: Array<{
      title?: string;
      duration?: string;
      description?: string;
      href?: string;
    }>;
    whatToExpectHeading?: string;
    whatToExpectItems?: string[];
    note?: string;
    background?: FactoryAsset;
  };
  assuranceImage?: FactoryAsset;
  assuranceContent?: {
    heading?: string;
    label?: string;
    body?: string;
    quote?: string;
  };
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
    stepsIntro{
      heading,
      subheading,
      ctaLabel,
      backgroundImage{
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
    bespokeGuide{
      heading,
      body,
      chatLabel,
      chatPrompt,
      linkLabel,
      linkHref,
      listItems
    },
    cinematicStrips[]{
      image{
        ${imageWithMetaFields}
      },
      alt
    },
    expertsIntro{
      eyebrow,
      heading
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
    bookingSection{
      heading,
      options[]{
        title,
        duration,
        description,
        href
      },
      whatToExpectHeading,
      whatToExpectItems,
      note,
      backgroundImage{
        ${imageWithMetaFields}
      }
    },
    assuranceImage{
      ${imageWithMetaFields}
    },
    assuranceContent{
      heading,
      label,
      body,
      quote
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
    stepsIntro: data.stepsIntro
      ? {
          heading: data.stepsIntro.heading ?? undefined,
          subheading: data.stepsIntro.subheading ?? undefined,
          ctaLabel: data.stepsIntro.ctaLabel ?? undefined,
          background: mapImageResult(data.stepsIntro.backgroundImage ?? null),
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
    bespokeGuide: data.bespokeGuide,
    cinematicStrips: data.cinematicStrips?.map((strip) => ({
      image: mapImageResult(strip.image ?? null),
      alt: strip.alt ?? undefined,
    })),
    expertsIntro: data.expertsIntro,
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
    bookingSection: data.bookingSection
      ? {
          heading: data.bookingSection.heading ?? undefined,
          options: data.bookingSection.options?.map((option) => ({
            title: option.title ?? undefined,
            duration: option.duration ?? undefined,
            description: option.description ?? undefined,
            href: option.href ?? undefined,
          })),
          whatToExpectHeading: data.bookingSection.whatToExpectHeading ?? undefined,
          whatToExpectItems: data.bookingSection.whatToExpectItems ?? undefined,
          note: data.bookingSection.note ?? undefined,
          background: mapImageResult(data.bookingSection.backgroundImage ?? null),
        }
      : undefined,
    assuranceImage: mapImageResult(data.assuranceImage ?? null),
    assuranceContent: data.assuranceContent
      ? {
          heading: data.assuranceContent.heading ?? undefined,
          label: data.assuranceContent.label ?? undefined,
          body: data.assuranceContent.body ?? undefined,
          quote: data.assuranceContent.quote ?? undefined,
        }
      : undefined,
  };
}
