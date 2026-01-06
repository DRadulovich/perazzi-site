import "server-only";

import { groq } from "next-sanity";
import {
  hero as fallbackHero,
  stages as fallbackStages,
  champion as fallbackChampion,
  finale as fallbackFinale,
} from "@/content/home";
import type {
  Champion,
  FactoryAsset,
  FittingStage,
  HomeData,
  HomeGuidePlatform,
} from "@/types/content";
import { sanityFetch } from "../lib/live";
import { imageFields, imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

const timelineBackgroundPath = "/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg";
const marqueeBackgroundPath = "/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg";

const fallbackHeroCtas: HomeData["heroCtas"] = {
  primaryLabel: "Ask the concierge",
  primaryPrompt:
    "Introduce me to Perazzi's bespoke philosophy and help me choose where to begin if I'm exploring my first build.",
  secondaryLabel: "Explore shotguns",
  secondaryHref: "/shotguns",
};

const fallbackTimelineBackground: FactoryAsset = {
  id: "timeline-background",
  kind: "image",
  url: timelineBackgroundPath,
  alt: "Perazzi workshop background",
};

const fallbackTimelineFraming: HomeData["timelineFraming"] = {
  title: "Craftsmanship Journey",
  eyebrow: "Three rituals that define a bespoke Perazzi build",
  instructions:
    "Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.",
  alternateTitle: "Fitting Timeline",
  background: fallbackTimelineBackground,
};

const fallbackGuidePlatforms: HomeGuidePlatform[] = [
  {
    code: "ht",
    name: "HT",
    description: "modern competition geometry for demanding sporting layouts.",
  },
  {
    code: "mx",
    name: "MX",
    description: "the classic lineage: balanced, adaptable, and endlessly configurable.",
  },
  {
    code: "tm",
    name: "TM",
    description: "purpose-built for American trap with a dedicated silhouette.",
  },
];

const fallbackGuideSection: HomeData["guideSection"] = {
  title: "Need a guide?",
  intro:
    "Ask how Perazzi links heritage, champions, and today’s platforms, then step into the catalog with a clearer sense of where you belong – whether that’s HT, MX, TM or beyond.",
  chatLabel: "Ask about platforms",
  chatPrompt:
    "Connect Perazzi's heritage stories and champions to current platforms like High Tech and MX, and suggest the next pages I should explore on the site.",
  linkLabel: "Explore shotguns",
  linkHref: "/shotguns",
  platforms: fallbackGuidePlatforms,
  closing:
    "The concierge can map your disciplines, preferences, and ambitions to a starting platform and the right next pages to visit.",
};

const fallbackMarqueeBackground: FactoryAsset = {
  id: "marquee-background",
  kind: "image",
  url: marqueeBackgroundPath,
  alt: "Perazzi workshop background",
};

const fallbackMarqueeUi: HomeData["marqueeUi"] = {
  eyebrow: "Champion spotlight",
  background: fallbackMarqueeBackground,
};

const homeQuery = groq`
  *[_type == "homeSingleton"][0]{
    hero{
      tagline,
      subheading,
      background{
        ${imageWithMetaFields}
      },
      backgroundTablet{
        ${imageWithMetaFields}
      },
      backgroundMobile{
        ${imageWithMetaFields}
      }
    },
    heroCtas{
      primaryLabel,
      primaryPrompt,
      secondaryLabel,
      secondaryHref
    },
    timelineFraming{
      title,
      eyebrow,
      instructions,
      alternateTitle,
      backgroundImage{
        path,
        image{
          ${imageWithMetaFields}
        }
      }
    },
    timelineStages[]{
      _key,
      title,
      body,
      media{
        ${imageWithMetaFields}
      }
    },
    guideSection{
      title,
      intro,
      chatLabel,
      chatPrompt,
      linkLabel,
      linkHref,
      closing,
      platforms[]{
        _key,
        code,
        name,
        description
      }
    },
    featuredChampion->{
      _id,
      name,
      title,
      quote,
      image{
        ${imageFields}
      },
      "article": articles[0]->{
        _id,
        title,
        "slug": slug.current
      }
    },
    marqueeInline{
      quote,
      credit,
      image{
        ${imageWithMetaFields}
      }
    },
    marqueeUi{
      eyebrow,
      backgroundImage{
        path,
        image{
          ${imageWithMetaFields}
        }
      }
    },
    finale{
      text,
      ctaPrimary{
        label,
        href
      },
      ctaSecondary{
        label,
        href
      }
    }
  }
`;

type HomeSanityResponse = {
  hero?: {
    tagline?: string | null;
    subheading?: string | null;
    background?: SanityImageResult;
    backgroundTablet?: SanityImageResult;
    backgroundMobile?: SanityImageResult;
  } | null;
  heroCtas?: {
    primaryLabel?: string | null;
    primaryPrompt?: string | null;
    secondaryLabel?: string | null;
    secondaryHref?: string | null;
  } | null;
  timelineFraming?: {
    title?: string | null;
    eyebrow?: string | null;
    instructions?: string | null;
    alternateTitle?: string | null;
    backgroundImage?: {
      path?: string | null;
      image?: SanityImageResult;
    } | null;
  } | null;
  timelineStages?: Array<{
    _key?: string;
    title?: string;
    body?: string;
    media?: SanityImageResult;
  }> | null;
  guideSection?: {
    title?: string | null;
    intro?: string | null;
    chatLabel?: string | null;
    chatPrompt?: string | null;
    linkLabel?: string | null;
    linkHref?: string | null;
    closing?: string | null;
    platforms?: Array<{
      _key?: string;
      code?: string | null;
      name?: string | null;
      description?: string | null;
    } | null> | null;
  } | null;
  featuredChampion?: {
    _id?: string;
    name?: string;
    title?: string;
    quote?: string;
    image?: SanityImageResult;
    article?: {
      _id?: string;
      title?: string;
      slug?: string;
    } | null;
  } | null;
  marqueeInline?: {
    quote?: string;
    credit?: string;
    image?: SanityImageResult;
  } | null;
  marqueeUi?: {
    eyebrow?: string | null;
    backgroundImage?: {
      path?: string | null;
      image?: SanityImageResult;
    } | null;
  } | null;
  finale?: {
    text?: string;
    ctaPrimary?: { label?: string; href?: string };
    ctaSecondary?: { label?: string; href?: string };
  } | null;
};

type GuidePlatformInput = NonNullable<NonNullable<HomeSanityResponse["guideSection"]>["platforms"]>[number];

export async function getHome(): Promise<HomeData> {
  const result = await sanityFetch({
    query: homeQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as HomeSanityResponse | null) ?? null;

  const hero = mapHero(data?.hero) ?? fallbackHero;
  const heroCtas = mapHeroCtas(data?.heroCtas);
  const stages = mapStages(data?.timelineStages) ?? fallbackStages;
  const timelineFraming = mapTimelineFraming(data?.timelineFraming);
  const guideSection = mapGuideSection(data?.guideSection);
  const champion = mapChampion(data?.featuredChampion, data?.marqueeInline) ?? fallbackChampion;
  const marqueeUi = mapMarqueeUi(data?.marqueeUi);
  const finale = mapFinale(data?.finale) ?? fallbackFinale;

  return { hero, heroCtas, stages, timelineFraming, guideSection, champion, marqueeUi, finale };
}

function mapHero(input?: HomeSanityResponse["hero"] | null): HomeData["hero"] | undefined {
  if (!input) return undefined;
  const background = mapImageResult(input.background ?? null);
  const backgroundTablet = mapImageResult(input.backgroundTablet ?? null);
  const backgroundMobile = mapImageResult(input.backgroundMobile ?? null);
  if (!background) return undefined;
  return {
    tagline: input.tagline ?? fallbackHero.tagline,
    subheading: input.subheading ?? undefined,
    background,
    backgroundTablet: backgroundTablet ?? undefined,
    backgroundMobile: backgroundMobile ?? undefined,
  };
}

function mapHeroCtas(input?: HomeSanityResponse["heroCtas"] | null): HomeData["heroCtas"] {
  return {
    primaryLabel: input?.primaryLabel ?? fallbackHeroCtas.primaryLabel,
    primaryPrompt: input?.primaryPrompt ?? fallbackHeroCtas.primaryPrompt,
    secondaryLabel: input?.secondaryLabel ?? fallbackHeroCtas.secondaryLabel,
    secondaryHref: input?.secondaryHref ?? fallbackHeroCtas.secondaryHref,
  };
}

function mapTimelineFraming(
  input?: HomeSanityResponse["timelineFraming"] | null,
): HomeData["timelineFraming"] {
  const background = mapBackgroundImage(
    input?.backgroundImage?.image ?? null,
    input?.backgroundImage?.path ?? null,
    fallbackTimelineBackground,
  );

  return {
    title: input?.title ?? fallbackTimelineFraming.title,
    eyebrow: input?.eyebrow ?? fallbackTimelineFraming.eyebrow,
    instructions: input?.instructions ?? fallbackTimelineFraming.instructions,
    alternateTitle: input?.alternateTitle ?? fallbackTimelineFraming.alternateTitle,
    background,
  };
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}

function mapStages(stages?: HomeSanityResponse["timelineStages"] | null): HomeData["stages"] | undefined {
  if (!stages || stages.length === 0) return undefined;
  const mapped: FittingStage[] = stages
    .map((stage, index) => {
      const media = mapImageResult(stage.media ?? null);
      if (!stage.title || !media) return null;
      return {
        id: stage._key ?? `stage-${index}`,
        order: index + 1,
        title: stage.title,
        body: stage.body ?? "",
        media,
      };
    })
    .filter(isNonNullable);

  return mapped.length ? mapped : undefined;
}

function mapGuideSection(input?: HomeSanityResponse["guideSection"] | null): HomeData["guideSection"] {
  return {
    title: input?.title ?? fallbackGuideSection.title,
    intro: input?.intro ?? fallbackGuideSection.intro,
    chatLabel: input?.chatLabel ?? fallbackGuideSection.chatLabel,
    chatPrompt: input?.chatPrompt ?? fallbackGuideSection.chatPrompt,
    linkLabel: input?.linkLabel ?? fallbackGuideSection.linkLabel,
    linkHref: input?.linkHref ?? fallbackGuideSection.linkHref,
    platforms: mapGuidePlatforms(input?.platforms),
    closing: input?.closing ?? fallbackGuideSection.closing,
  };
}

function mapFinale(input?: HomeSanityResponse["finale"] | null): HomeData["finale"] | undefined {
  if (!input?.text || !input.ctaPrimary?.href || !input.ctaPrimary.label) return undefined;
  return {
    text: input.text,
    ctaPrimary: {
      label: input.ctaPrimary.label,
      href: input.ctaPrimary.href,
    },
    ctaSecondary: input.ctaSecondary?.href && input.ctaSecondary.label
      ? {
          label: input.ctaSecondary.label,
          href: input.ctaSecondary.href,
        }
      : undefined,
  };
}

function mapChampion(
  champion?: HomeSanityResponse["featuredChampion"] | null,
  marqueeInline?: HomeSanityResponse["marqueeInline"] | null,
): Champion | undefined {
  if (champion) {
    const image = mapImageResult(champion.image ?? null);
    if (image) {
      return {
        id: champion._id ?? "featured-champion",
        name: champion.name ?? "Featured champion",
        title: champion.title ?? "",
        quote: champion.quote ?? "",
        image,
        article: champion.article?.slug
          ? {
              id: champion.article._id ?? champion._id ?? "featured-champion",
              title: champion.article.title ?? "Read more",
              slug: champion.article.slug,
            }
          : undefined,
      };
    }
  }

  if (marqueeInline) {
    const image = mapImageResult(marqueeInline.image ?? null);
    if (image) {
      return {
        id: "inline-marquee",
        name: marqueeInline.credit ?? "Featured story",
        title: marqueeInline.credit ?? "",
        quote: marqueeInline.quote ?? "",
        image,
      };
    }
  }

  return undefined;
}

function mapMarqueeUi(input?: HomeSanityResponse["marqueeUi"] | null): HomeData["marqueeUi"] {
  const background = mapBackgroundImage(
    input?.backgroundImage?.image ?? null,
    input?.backgroundImage?.path ?? null,
    fallbackMarqueeBackground,
  );

  return {
    eyebrow: input?.eyebrow ?? fallbackMarqueeUi.eyebrow,
    background,
  };
}

function hasGuidePlatformCode(
  item: GuidePlatformInput | null | undefined,
): item is GuidePlatformInput & { code: string } {
  return typeof item?.code === "string" && item.code.length > 0;
}

function mapGuidePlatforms(
  platforms?: NonNullable<HomeSanityResponse["guideSection"]>["platforms"],
): HomeGuidePlatform[] {
  const provided = Array.isArray(platforms) ? platforms : [];
  if (provided.length === 0) return fallbackGuideSection.platforms;

  const merged = fallbackGuideSection.platforms.map((platform) => {
    const override = provided.find((item) => item?.code && item.code === platform.code);
    return {
      code: platform.code,
      name: override?.name ?? platform.name,
      description: override?.description ?? platform.description,
    } satisfies HomeGuidePlatform;
  });

  const extras = provided
    .filter(hasGuidePlatformCode)
    .filter((item) => isGuidePlatformCode(item.code))
    .filter((item) => !merged.some((platform) => platform.code === item.code))
    .map((item) => ({
      code: item.code as HomeGuidePlatform["code"],
      name: item.name ?? item.code ?? "Platform",
      description: item.description ?? "",
    } satisfies HomeGuidePlatform));

  return extras.length ? [...merged, ...extras] : merged;
}

function mapBackgroundImage(
  image: SanityImageResult | null | undefined,
  path: string | null | undefined,
  fallback: FactoryAsset,
): FactoryAsset {
  const mapped = mapImageResult(image ?? null);
  if (mapped) return mapped;
  if (path) return {...fallback, id: path, url: path};
  return fallback;
}

function isGuidePlatformCode(code?: string | null): code is HomeGuidePlatform["code"] {
  return code === "ht" || code === "mx" || code === "tm";
}
