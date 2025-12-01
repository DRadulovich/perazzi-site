import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import type {
  ChampionsGalleryUi,
  ChampionsIntro,
  FactoryEssayUi,
  FactoryIntroBlock,
  HeritageEra,
  HeritageIntro,
  OralHistoriesUi,
  SerialLookupUi,
  WorkshopCta,
} from "@/types/heritage";
import { sanityClient } from "../../../sanity/client";
import {
  imageWithMetaFields,
  imageFields,
  mapImageResult,
  type PortableTextBlock,
  type SanityImageResult,
} from "./utils";

type HeritageHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  photoEssay?: Array<SanityImageResult & { _key?: string }>;
  oralHistories?: Array<{
    _key?: string;
    title?: string;
    quote?: string;
    attribution?: string;
    image?: SanityImageResult;
  }>;
  heritageIntro?: {
    eyebrow?: string;
    heading?: string;
    paragraphs?: string[];
    backgroundImage?: SanityImageResult;
  };
  erasConfig?: Array<{
    _key?: string;
    id?: string;
    label?: string;
    yearRangeLabel?: string;
    startYear?: number;
    endYear?: number;
    backgroundImage?: SanityImageResult;
    overlayFrom?: string;
    overlayTo?: string;
  }>;
  workshopCta?: {
    heading?: string;
    intro?: string;
    bullets?: string[];
    closing?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  };
  serialLookupUi?: {
    heading?: string;
    subheading?: string;
    instructions?: string;
    primaryButtonLabel?: string;
    emptyStateText?: string;
    backgroundImage?: SanityImageResult;
  };
  championsIntro?: ChampionsIntro;
  championsGalleryUi?: {
    heading?: string;
    subheading?: string;
    backgroundImage?: SanityImageResult;
    championsLabel?: string;
    cardCtaLabel?: string;
  };
  factoryIntroBlock?: FactoryIntroBlock;
  factoryEssayUi?: FactoryEssayUi;
  factoryIntroBody?: string;
  oralHistoriesUi?: OralHistoriesUi;
  relatedSection?: {
    heading?: string;
    items?: Array<{ title?: string; slug?: string }>;
  };
};

type HeritageEventResponse = {
  _id?: string;
  title?: string;
  date?: string;
  body?: PortableTextBlock[];
  media?: SanityImageResult;
  champions?: Array<{
    _id?: string;
    name?: string;
  }>;
  platforms?: Array<{
    _id?: string;
    name?: string;
    slug?: { current?: string };
  }>;
};

type ChampionResponse = {
  _id?: string;
  name?: string;
  title?: string;
  quote?: string;
  image?: SanityImageResult;
  disciplines?: Array<{ name?: string }>;
  platforms?: Array<{
    _id?: string;
    name?: string;
  }>;
  articles?: Array<{
    _id?: string;
    title?: string;
    slug?: { current?: string };
  }>;
  bio?: { text?: string };
  resume?: {
    winOne?: string;
    winTwo?: string;
    winThree?: string;
  };
};

export interface HeritageHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  heritageIntro?: HeritageIntro;
  erasConfig?: HeritageEra[];
  workshopCta?: WorkshopCta;
  serialLookupUi?: SerialLookupUi;
  championsIntro?: ChampionsIntro;
  championsGalleryUi?: ChampionsGalleryUi;
  factoryIntroBlock?: FactoryIntroBlock;
  factoryEssayUi?: FactoryEssayUi;
  factoryIntroBody?: string;
  oralHistoriesUi?: OralHistoriesUi;
  relatedSection?: {
    heading?: string;
    items?: Array<{ title?: string; slug?: string }>;
  };
  photoEssay?: Array<{
    id: string;
    image?: FactoryAsset;
  }>;
  oralHistories?: Array<{
    id: string;
    title?: string;
    quote?: string;
    attribution?: string;
    image?: FactoryAsset;
  }>;
}

export interface HeritageEventPayload {
  id: string;
  title?: string;
  date?: string;
  bodyPortableText?: PortableTextBlock[];
  media?: FactoryAsset;
  champions?: Array<{ id: string; name?: string }>;
  platforms?: Array<{ id: string; name?: string; slug?: string }>;
}

export interface ChampionPayload {
  id: string;
  name?: string;
  title?: string;
  quote?: string;
  image?: FactoryAsset;
  disciplines?: string[];
  article?: { id: string; title?: string; slug?: string };
  platforms?: string[];
  bio?: string;
  resume?: {
    winOne?: string;
    winTwo?: string;
    winThree?: string;
  };
}

const heritageHomeQuery = groq`
  *[_type == "heritageHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    photoEssay[]{
      _key,
      ${imageWithMetaFields}
    },
    heritageIntro{
      eyebrow,
      heading,
      paragraphs[],
      backgroundImage{
        ${imageFields}
      }
    },
    erasConfig[]{
      _key,
      id,
      label,
      yearRangeLabel,
      startYear,
      endYear,
      backgroundImage{
        ${imageFields}
      },
      overlayFrom,
      overlayTo
    },
    workshopCta{
      heading,
      intro,
      bullets[],
      closing,
      primaryLabel,
      primaryHref,
      secondaryLabel,
      secondaryHref
    },
    serialLookupUi{
      heading,
      subheading,
      instructions,
      primaryButtonLabel,
      emptyStateText,
      backgroundImage{
        ${imageFields}
      }
    },
    championsIntro{
      heading,
      intro,
      bullets[],
      closing,
      chatLabel,
      chatPrompt
    },
    championsGalleryUi{
      heading,
      subheading,
      backgroundImage{
        ${imageFields}
      },
      championsLabel,
      cardCtaLabel
    },
    factoryIntroBlock{
      heading,
      intro,
      bullets[],
      closing,
      chatLabel,
      chatPrompt
    },
    factoryEssayUi{
      eyebrow,
      heading
    },
    factoryIntroBody,
    oralHistoriesUi{
      eyebrow,
      heading,
      readLabel,
      hideLabel
    },
    relatedSection{
      heading,
      items[]{
        title,
        slug
      }
    },
    oralHistories[]{
      _key,
      title,
      quote,
      attribution,
      image{
        ${imageWithMetaFields}
      }
    }
  }
`;

const heritageEventsQuery = groq`
  *[_type == "heritageEvent"] | order(date asc){
    _id,
    title,
    date,
    body,
    media{
      ${imageWithMetaFields}
    },
    champions[]->{
      _id,
      name
    },
    platforms[]->{
      _id,
      name,
      slug
    }
  }
`;

const championsQuery = groq`
  *[_type == "champion"]{
    _id,
    name,
    title,
    quote,
    image{
      ${imageFields}
    },
    disciplines[]->{
      name
    },
    platforms[]->{
      _id,
      name
    },
    articles[]->{
      _id,
      title,
      slug
    },
    bio{
      text
    },
    resume{
      winOne,
      winTwo,
      winThree
    }
  }
`;

export async function getHeritageHome(): Promise<HeritageHomePayload | null> {
  const data = await sanityClient.fetch<HeritageHomeResponse | null>(heritageHomeQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
    photoEssay: data.photoEssay
      ?.filter((item): item is typeof item & { _key: string } => Boolean(item?._key))
      .map((item) => ({
        id: item._key as string,
        image: mapImageResult(item ?? null),
      })),
    heritageIntro: data.heritageIntro
      ? {
          eyebrow: data.heritageIntro.eyebrow ?? undefined,
          heading: data.heritageIntro.heading ?? undefined,
          paragraphs: data.heritageIntro.paragraphs ?? undefined,
          backgroundImage: mapImageResult(data.heritageIntro.backgroundImage ?? null),
        }
      : undefined,
    erasConfig: data.erasConfig
      ?.filter((era): era is NonNullable<typeof era> & { id: string } => Boolean(era?.id))
      .map(
        (era): HeritageEra => ({
          id: era.id,
          label: era.label ?? "",
          yearRangeLabel: era.yearRangeLabel ?? undefined,
          startYear: era.startYear ?? 0,
          endYear: era.endYear ?? 0,
          backgroundSrc: mapImageResult(era.backgroundImage ?? null)?.url ?? "",
          overlayColor: era.overlayFrom ?? era.overlayTo ?? "rgba(9, 9, 11, 0.7)",
          overlayFrom: era.overlayFrom ?? undefined,
          overlayTo: era.overlayTo ?? undefined,
        }),
      ),
    workshopCta: data.workshopCta
      ? {
          heading: data.workshopCta.heading ?? undefined,
          intro: data.workshopCta.intro ?? undefined,
          bullets: data.workshopCta.bullets ?? undefined,
          closing: data.workshopCta.closing ?? undefined,
          primaryLabel: data.workshopCta.primaryLabel ?? undefined,
          primaryHref: data.workshopCta.primaryHref ?? undefined,
          secondaryLabel: data.workshopCta.secondaryLabel ?? undefined,
          secondaryHref: data.workshopCta.secondaryHref ?? undefined,
        }
      : undefined,
    serialLookupUi: data.serialLookupUi
      ? {
          heading: data.serialLookupUi.heading ?? undefined,
          subheading: data.serialLookupUi.subheading ?? undefined,
          instructions: data.serialLookupUi.instructions ?? undefined,
          primaryButtonLabel: data.serialLookupUi.primaryButtonLabel ?? undefined,
          emptyStateText: data.serialLookupUi.emptyStateText ?? undefined,
          backgroundImage: mapImageResult(data.serialLookupUi.backgroundImage ?? null),
        }
      : undefined,
    championsIntro: data.championsIntro ?? undefined,
    championsGalleryUi: data.championsGalleryUi
      ? {
          ...data.championsGalleryUi,
          backgroundImage: mapImageResult(data.championsGalleryUi.backgroundImage ?? null),
        }
      : undefined,
    factoryIntroBlock: data.factoryIntroBlock ?? undefined,
    factoryEssayUi: data.factoryEssayUi ?? undefined,
    factoryIntroBody: data.factoryIntroBody ?? undefined,
    oralHistoriesUi: data.oralHistoriesUi ?? undefined,
    relatedSection: data.relatedSection
      ? {
          heading: data.relatedSection.heading ?? undefined,
          items: data.relatedSection.items?.map((item) => ({
            title: item?.title ?? "",
            slug: item?.slug ?? "",
          })),
        }
      : undefined,
    oralHistories: data.oralHistories
      ?.filter((entry): entry is typeof entry & { _key: string } => Boolean(entry?._key))
      .map((entry) => ({
        id: entry._key as string,
        title: entry.title ?? undefined,
        quote: entry.quote ?? undefined,
        attribution: entry.attribution ?? undefined,
        image: mapImageResult(entry.image ?? null),
      })),
  };
}

export async function getHeritageEvents(): Promise<HeritageEventPayload[]> {
  const data = await sanityClient.fetch<HeritageEventResponse[]>(heritageEventsQuery).catch(() => []);

  return data
    .filter((event): event is HeritageEventResponse & { _id: string } => Boolean(event?._id))
    .map((event) => ({
      id: event._id as string,
      title: event.title ?? undefined,
      date: event.date ?? undefined,
      bodyPortableText: event.body,
      media: mapImageResult(event.media ?? null),
      champions: event.champions
        ?.filter((champion): champion is { _id: string; name?: string } => Boolean(champion?._id))
        .map((champion) => ({
          id: champion._id as string,
          name: champion.name ?? undefined,
        })),
      platforms: event.platforms
        ?.filter((platform): platform is { _id: string; name?: string; slug?: { current?: string } } => Boolean(platform?._id))
        .map((platform) => ({
          id: platform._id as string,
          name: platform.name ?? undefined,
          slug: platform.slug?.current ?? undefined,
        })),
    }));
}

export async function getHeritageChampions(): Promise<ChampionPayload[]> {
  const data = await sanityClient.fetch<ChampionResponse[]>(championsQuery).catch(() => []);

  return data
    .filter((champion): champion is ChampionResponse & { _id: string } => Boolean(champion?._id))
    .map((champion) => {
      const article = champion.articles?.find((item) => item?._id);
      return {
        id: champion._id as string,
        name: champion.name ?? undefined,
        title: champion.title ?? undefined,
        quote: champion.quote ?? undefined,
        image: mapImageResult(champion.image ?? null),
        disciplines: champion.disciplines?.map((discipline) => discipline?.name).filter(Boolean) as string[] | undefined,
        platforms: champion.platforms?.map((platform) => platform?.name).filter(Boolean) as string[] | undefined,
        bio: champion.bio?.text ?? undefined,
        resume: champion.resume,
        article: article
          ? {
              id: article._id as string,
              title: article.title ?? undefined,
              slug: article.slug?.current ?? undefined,
            }
          : undefined,
      };
    });
}
