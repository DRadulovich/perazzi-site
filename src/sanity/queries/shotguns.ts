import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityFetch } from "../lib/live";
import {
  imageWithMetaFields,
  mapImageResult,
  type PortableTextBlock,
  type SanityImageResult,
} from "./utils";

const platformGridBackgroundPath = "/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg";
const disciplineRailBackgroundPath = "/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg";
const triggerExplainerBackgroundPath = "/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg";
const engravingCarouselBackgroundPath = "/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg";

type ShotgunsLandingResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  platformGridUi?: {
    heading?: string;
    subheading?: string;
    backgroundImage?: { path?: string | null; image?: SanityImageResult };
    chatLabelTemplate?: string;
    chatPayloadTemplate?: string;
    cardFooterTemplate?: string;
  };
  triggerExplainer?: {
    title?: string;
    subheading?: string;
    copy?: PortableTextBlock[];
    diagram?: SanityImageResult;
    links?: Array<{ label?: string; href?: string }>;
    backgroundImage?: { path?: string | null; image?: SanityImageResult };
  };
  teasers?: {
    engraving?: SanityImageResult;
    wood?: SanityImageResult;
  };
  disciplineFitAdvisory?: {
    eyebrow?: string;
    heading?: string;
    paragraphs?: string[];
    chatLabel?: string;
    chatPrompt?: string;
    rightTitle?: string;
    bullets?: Array<{ code?: string; label?: string; description?: string }>;
  };
  disciplineRailUi?: {
    heading?: string;
    subheading?: string;
    backgroundImage?: { path?: string | null; image?: SanityImageResult };
  };
  gaugeSelectionAdvisory?: {
    heading?: string;
    intro?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    rightTitle?: string;
    bullets?: string[];
    closing?: string;
  };
  triggerChoiceAdvisory?: {
    heading?: string;
    intro?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    rightTitle?: string;
    bullets?: string[];
    closing?: string;
  };
  engravingCarouselUi?: {
    heading?: string;
    subheading?: string;
    backgroundImage?: { path?: string | null; image?: SanityImageResult };
    ctaLabel?: string;
    categoryLabels?: string[];
  };
  disciplineHubs?: Array<{
    key?: string;
    title?: string;
    summary?: string;
    championImage?: SanityImageResult;
  }>;
};

type PlatformResponse = {
  _id?: string;
  name?: string;
  slug?: { current?: string };
  lineage?: string;
  hero?: SanityImageResult;
  highlights?: Array<{
    title?: string;
    body?: string;
    media?: SanityImageResult;
  }>;
  champion?: {
    name?: string;
    title?: string;
    quote?: string;
    image?: SanityImageResult;
    resume?: {
      winOne?: string;
      winTwo?: string;
      winThree?: string;
    };
  };
  snippet?: {
    text?: string;
  };
  disciplines?: Array<{ _id?: string; name?: string }>;
  fixedCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  detachableCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
};

type DisciplineResponse = {
  _id?: string;
  name?: string;
  slug?: { current?: string };
  overview?: PortableTextBlock[];
  hero?: SanityImageResult;
  championImage?: SanityImageResult;
  recommendedPlatforms?: Array<{ _ref?: string }>;
  popularModels?: Array<{
    _id?: string;
    name?: string;
    image?: SanityImageResult;
  }>;
};

type GradeResponse = {
  _id?: string;
  name?: string;
  description?: string;
  hero?: SanityImageResult;
  engravingGallery?: SanityImageResult[];
  engravingLibrary?: Array<{ engraving_photo?: SanityImageResult }>;
  woodImages?: SanityImageResult[];
};

type ShotgunsGaugesPageResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  editorialHtml?: string;
  sidebarTitle?: string;
  sidebarHtml?: string;
  faq?: Array<{ q?: string; a?: string }>;
  finalCta?: {
    text?: string;
    primary?: { label?: string; href?: string };
    secondary?: { label?: string; href?: string };
  };
};

type ShotgunsGradesPageResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  provenanceHtml?: string;
  processNote?: {
    title?: string;
    html?: string;
  };
  finalCta?: {
    text?: string;
    primary?: { label?: string; href?: string };
    secondary?: { label?: string; href?: string };
  };
};

export interface ShotgunsLandingPayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  platformGridUi?: {
    heading?: string;
    subheading?: string;
    background?: FactoryAsset;
    chatLabelTemplate?: string;
    chatPayloadTemplate?: string;
    cardFooterTemplate?: string;
  };
  triggerExplainer?: {
    title?: string;
    subheading?: string;
    copyPortableText?: PortableTextBlock[];
    diagram?: FactoryAsset;
    links?: Array<{ label?: string; href?: string }>;
    background?: FactoryAsset;
  };
  teasers?: {
    engraving?: FactoryAsset;
    wood?: FactoryAsset;
  };
  disciplineFitAdvisory?: {
    eyebrow?: string;
    heading?: string;
    paragraphs?: string[];
    chatLabel?: string;
    chatPrompt?: string;
    rightTitle?: string;
    bullets?: Array<{ code?: string; label?: string; description?: string }>;
  };
  disciplineRailUi?: {
    heading?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  gaugeSelectionAdvisory?: {
    heading?: string;
    intro?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    rightTitle?: string;
    bullets?: string[];
    closing?: string;
  };
  triggerChoiceAdvisory?: {
    heading?: string;
    intro?: string;
    chatLabel?: string;
    chatPrompt?: string;
    linkLabel?: string;
    linkHref?: string;
    rightTitle?: string;
    bullets?: string[];
    closing?: string;
  };
  engravingCarouselUi?: {
    heading?: string;
    subheading?: string;
    background?: FactoryAsset;
    ctaLabel?: string;
    categoryLabels?: string[];
  };
  disciplineHubs?: Array<{
    key?: string;
    title?: string;
    summary?: string;
    championImage?: FactoryAsset;
  }>;
}

export interface ShotgunsPlatformPayload {
  id: string;
  name?: string;
  slug?: string;
  lineage?: string;
  hero?: FactoryAsset;
  snippetText?: string;
  highlights?: Array<{
    title?: string;
    body?: string;
    media?: FactoryAsset;
  }>;
  champion?: {
    name?: string;
    title?: string;
    quote?: string;
    image?: FactoryAsset;
    resume?: {
      winOne?: string;
      winTwo?: string;
      winThree?: string;
    };
  };
  disciplines?: Array<{ id: string; name?: string }>;
  fixedCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  detachableCounterpart?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

export interface ShotgunsDisciplinePayload {
  id: string;
  name?: string;
  slug?: string;
  overviewPortableText?: PortableTextBlock[];
  hero?: FactoryAsset;
  championImage?: FactoryAsset;
  recommendedPlatformIds?: string[];
  popularModels?: Array<{ id: string; name?: string; hero?: FactoryAsset }>;
}

export interface ShotgunsGradePayload {
  id: string;
  name?: string;
  description?: string;
  hero?: FactoryAsset;
  engravingGallery?: FactoryAsset[];
  woodImages?: FactoryAsset[];
}

export interface ShotgunsGaugesPagePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  editorialHtml?: string;
  sidebarTitle?: string;
  sidebarHtml?: string;
  faq?: Array<{ q?: string; a?: string }>;
  finalCta?: {
    text?: string;
    primary?: { label?: string; href?: string };
    secondary?: { label?: string; href?: string };
  };
}

export interface ShotgunsGradesPagePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  provenanceHtml?: string;
  processNote?: {
    title?: string;
    html?: string;
  };
  finalCta?: {
    text?: string;
    primary?: { label?: string; href?: string };
    secondary?: { label?: string; href?: string };
  };
}

const shotgunsLandingQuery = groq`
  *[_type == "shotgunsLanding"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    platformGridUi{
      heading,
      subheading,
      backgroundImage{
        path,
        image{ ${imageWithMetaFields} }
      },
      chatLabelTemplate,
      chatPayloadTemplate,
      cardFooterTemplate
    },
    triggerExplainer{
      title,
      subheading,
      copy,
      diagram{
        ${imageWithMetaFields}
      },
      links[]{
        label,
        href
      },
      backgroundImage{
        path,
        image{ ${imageWithMetaFields} }
      }
    },
    teasers{
      engraving{ ${imageWithMetaFields} },
      wood{ ${imageWithMetaFields} }
    },
    disciplineFitAdvisory{
      eyebrow,
      heading,
      paragraphs,
      chatLabel,
      chatPrompt,
      rightTitle,
      bullets[]{
        code,
        label,
        description
      }
    },
    disciplineRailUi{
      heading,
      subheading,
      backgroundImage{
        path,
        image{ ${imageWithMetaFields} }
      }
    },
    gaugeSelectionAdvisory{
      heading,
      intro,
      chatLabel,
      chatPrompt,
      linkLabel,
      linkHref,
      rightTitle,
      bullets,
      closing
    },
    triggerChoiceAdvisory{
      heading,
      intro,
      chatLabel,
      chatPrompt,
      linkLabel,
      linkHref,
      rightTitle,
      bullets,
      closing
    },
    engravingCarouselUi{
      heading,
      subheading,
      backgroundImage{
        path,
        image{ ${imageWithMetaFields} }
      },
      ctaLabel,
      categoryLabels
    },
    disciplineHubs[]{
      key,
      title,
      summary,
      championImage{
        ${imageWithMetaFields}
      }
    }
  }
`;

const shotgunsGaugesPageQuery = groq`
  *[_type == "shotgunsGaugesPage"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    editorialHtml,
    sidebarTitle,
    sidebarHtml,
    faq[]{
      q,
      a
    },
    finalCta{
      text,
      primary{
        label,
        href
      },
      secondary{
        label,
        href
      }
    }
  }
`;

const shotgunsGradesPageQuery = groq`
  *[_type == "shotgunsGradesPage"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    provenanceHtml,
    processNote{
      title,
      html
    },
    finalCta{
      text,
      primary{
        label,
        href
      },
      secondary{
        label,
        href
      }
    }
  }
`;

const platformsQuery = groq`
  *[_type == "platform"]{
    _id,
    name,
    slug,
    lineage,
    hero{
      ${imageWithMetaFields}
    },
    highlights[]{
      title,
      body,
      media{
        ${imageWithMetaFields}
      }
    },
    champion{
      name,
      title,
      quote,
      image{
        ${imageWithMetaFields}
      },
      resume{
        winOne,
        winTwo,
        winThree
      }
    },
    snippet{
      text
    },
    disciplines[]->{
      _id,
      name
    },
    fixedCounterpart{
      id,
      name,
      slug
    },
    detachableCounterpart{
      id,
      name,
      slug
    }
  }
`;

const disciplinesQuery = groq`
  *[_type == "discipline"]{
    _id,
    name,
    slug,
    overview,
    hero{
      ${imageWithMetaFields}
    },
    championImage{
      ${imageWithMetaFields}
    },
    recommendedPlatforms,
    popularModels[]->{
      _id,
      name,
      image{
        ${imageWithMetaFields}
      }
    }
  }
`;

const gradesQuery = groq`
  *[_type == "grade"]{
    _id,
    name,
    description,
    hero{
      ${imageWithMetaFields}
    },
    engravingGallery[]{
      ${imageWithMetaFields}
    },
    "engravingLibrary": *[_type == "engravings" && references(^._id)] | order(engraving_grade->name asc, engraving_id asc, engraving_side asc)[0...12]{
      engraving_photo{
        ${imageWithMetaFields}
      }
    },
    woodImages[]{
      ${imageWithMetaFields}
    }
  }
`;

export async function getShotgunsLanding(): Promise<ShotgunsLandingPayload | null> {
  const result = await sanityFetch({
    query: shotgunsLandingQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ShotgunsLandingResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: data.hero?.background
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background),
        }
      : undefined,
    platformGridUi: data.platformGridUi
      ? {
          heading: data.platformGridUi.heading ?? undefined,
          subheading: data.platformGridUi.subheading ?? undefined,
          background: mapBackgroundImage(
            data.platformGridUi.backgroundImage?.image,
            data.platformGridUi.backgroundImage?.path,
            platformGridBackgroundPath,
            "Perazzi workshop background for platform section",
          ),
          chatLabelTemplate: data.platformGridUi.chatLabelTemplate ?? undefined,
          chatPayloadTemplate: data.platformGridUi.chatPayloadTemplate ?? undefined,
          cardFooterTemplate: data.platformGridUi.cardFooterTemplate ?? undefined,
        }
      : undefined,
    triggerExplainer: data.triggerExplainer
      ? {
          title: data.triggerExplainer.title ?? undefined,
          subheading: data.triggerExplainer.subheading ?? undefined,
          copyPortableText: data.triggerExplainer.copy,
          diagram: mapImageResult(data.triggerExplainer.diagram ?? null),
          links: data.triggerExplainer.links?.map((link) => ({
            label: link.label ?? undefined,
            href: link.href ?? undefined,
          })),
          background: mapBackgroundImage(
            data.triggerExplainer.backgroundImage?.image,
            data.triggerExplainer.backgroundImage?.path,
            triggerExplainerBackgroundPath,
            "Perazzi trigger workshop background",
          ),
        }
      : undefined,
    teasers: data.teasers
      ? {
          engraving: mapImageResult(data.teasers.engraving ?? null),
          wood: mapImageResult(data.teasers.wood ?? null),
        }
      : undefined,
    disciplineFitAdvisory: data.disciplineFitAdvisory
      ? {
          eyebrow: data.disciplineFitAdvisory.eyebrow ?? undefined,
          heading: data.disciplineFitAdvisory.heading ?? undefined,
          paragraphs: data.disciplineFitAdvisory.paragraphs ?? undefined,
          chatLabel: data.disciplineFitAdvisory.chatLabel ?? undefined,
          chatPrompt: data.disciplineFitAdvisory.chatPrompt ?? undefined,
          rightTitle: data.disciplineFitAdvisory.rightTitle ?? undefined,
          bullets: data.disciplineFitAdvisory.bullets ?? undefined,
        }
      : undefined,
    disciplineRailUi: data.disciplineRailUi
      ? {
          heading: data.disciplineRailUi.heading ?? undefined,
          subheading: data.disciplineRailUi.subheading ?? undefined,
          background: mapBackgroundImage(
            data.disciplineRailUi.backgroundImage?.image,
            data.disciplineRailUi.backgroundImage?.path,
            disciplineRailBackgroundPath,
            "Perazzi discipline background",
          ),
        }
      : undefined,
    gaugeSelectionAdvisory: data.gaugeSelectionAdvisory
      ? {
          heading: data.gaugeSelectionAdvisory.heading ?? undefined,
          intro: data.gaugeSelectionAdvisory.intro ?? undefined,
          chatLabel: data.gaugeSelectionAdvisory.chatLabel ?? undefined,
          chatPrompt: data.gaugeSelectionAdvisory.chatPrompt ?? undefined,
          linkLabel: data.gaugeSelectionAdvisory.linkLabel ?? undefined,
          linkHref: data.gaugeSelectionAdvisory.linkHref ?? undefined,
          rightTitle: data.gaugeSelectionAdvisory.rightTitle ?? undefined,
          bullets: data.gaugeSelectionAdvisory.bullets ?? undefined,
          closing: data.gaugeSelectionAdvisory.closing ?? undefined,
        }
      : undefined,
    triggerChoiceAdvisory: data.triggerChoiceAdvisory
      ? {
          heading: data.triggerChoiceAdvisory.heading ?? undefined,
          intro: data.triggerChoiceAdvisory.intro ?? undefined,
          chatLabel: data.triggerChoiceAdvisory.chatLabel ?? undefined,
          chatPrompt: data.triggerChoiceAdvisory.chatPrompt ?? undefined,
          linkLabel: data.triggerChoiceAdvisory.linkLabel ?? undefined,
          linkHref: data.triggerChoiceAdvisory.linkHref ?? undefined,
          rightTitle: data.triggerChoiceAdvisory.rightTitle ?? undefined,
          bullets: data.triggerChoiceAdvisory.bullets ?? undefined,
          closing: data.triggerChoiceAdvisory.closing ?? undefined,
        }
      : undefined,
    engravingCarouselUi: data.engravingCarouselUi
      ? {
          heading: data.engravingCarouselUi.heading ?? undefined,
          subheading: data.engravingCarouselUi.subheading ?? undefined,
          background: mapBackgroundImage(
            data.engravingCarouselUi.backgroundImage?.image,
            data.engravingCarouselUi.backgroundImage?.path,
            engravingCarouselBackgroundPath,
            "Perazzi engraving workshop background",
          ),
          ctaLabel: data.engravingCarouselUi.ctaLabel ?? undefined,
          categoryLabels: data.engravingCarouselUi.categoryLabels ?? undefined,
        }
      : undefined,
    disciplineHubs: data.disciplineHubs?.map((hub) => ({
      key: hub.key ?? undefined,
      title: hub.title ?? undefined,
      summary: hub.summary ?? undefined,
      championImage: mapImageResult(hub.championImage ?? null),
    })),
  };
}

export async function getShotgunsGaugesPage(): Promise<ShotgunsGaugesPagePayload | null> {
  const result = await sanityFetch({
    query: shotgunsGaugesPageQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ShotgunsGaugesPageResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: data.hero?.background
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background),
        }
      : undefined,
    editorialHtml: data.editorialHtml ?? undefined,
    sidebarTitle: data.sidebarTitle ?? undefined,
    sidebarHtml: data.sidebarHtml ?? undefined,
    faq: data.faq?.map((item) => ({
      q: item.q ?? "",
      a: item.a ?? "",
    })),
    finalCta: data.finalCta
      ? {
          text: data.finalCta.text ?? undefined,
          primary: data.finalCta.primary
            ? {
                label: data.finalCta.primary.label ?? undefined,
                href: data.finalCta.primary.href ?? undefined,
              }
            : undefined,
          secondary: data.finalCta.secondary
            ? {
                label: data.finalCta.secondary.label ?? undefined,
                href: data.finalCta.secondary.href ?? undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

export async function getShotgunsGradesPage(): Promise<ShotgunsGradesPagePayload | null> {
  const result = await sanityFetch({
    query: shotgunsGradesPageQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as ShotgunsGradesPageResponse | null) ?? null;
  if (!data) return null;

  return {
    hero: data.hero?.background
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background),
        }
      : undefined,
    provenanceHtml: data.provenanceHtml ?? undefined,
    processNote: data.processNote
      ? {
          title: data.processNote.title ?? undefined,
          html: data.processNote.html ?? undefined,
        }
      : undefined,
    finalCta: data.finalCta
      ? {
          text: data.finalCta.text ?? undefined,
          primary: data.finalCta.primary
            ? {
                label: data.finalCta.primary.label ?? undefined,
                href: data.finalCta.primary.href ?? undefined,
              }
            : undefined,
          secondary: data.finalCta.secondary
            ? {
                label: data.finalCta.secondary.label ?? undefined,
                href: data.finalCta.secondary.href ?? undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

export async function getPlatforms(): Promise<ShotgunsPlatformPayload[]> {
  const result = await sanityFetch({
    query: platformsQuery,
    stega: true,
  }).catch(() => ({ data: [] }));
  const data = (result?.data as PlatformResponse[] | null) ?? null;

  return (data ?? [])
    .filter((platform): platform is PlatformResponse & { _id: string } => Boolean(platform._id))
    .map((platform) => ({
      id: platform._id,
      name: platform.name ?? undefined,
      slug: platform.slug?.current ?? undefined,
      lineage: platform.lineage ?? undefined,
      hero: mapImageResult(platform.hero ?? null),
      snippetText: platform.snippet?.text ?? undefined,
      highlights: platform.highlights?.map((highlight) => ({
        title: highlight.title ?? undefined,
        body: highlight.body ?? undefined,
        media: mapImageResult(highlight.media ?? null),
      })),
      champion: platform.champion
        ? {
            name: platform.champion.name ?? undefined,
            title: platform.champion.title ?? undefined,
            quote: platform.champion.quote ?? undefined,
            image: mapImageResult(platform.champion.image ?? null),
            resume: {
              winOne: platform.champion.resume?.winOne ?? undefined,
              winTwo: platform.champion.resume?.winTwo ?? undefined,
              winThree: platform.champion.resume?.winThree ?? undefined,
            },
          }
        : undefined,
      disciplines: platform.disciplines?.flatMap((ref) =>
        ref._id
          ? [
              {
                id: ref._id,
                name: ref.name ?? undefined,
              },
            ]
          : [],
      ),
      fixedCounterpart: platform.fixedCounterpart
        ? {
            id: platform.fixedCounterpart.id ?? undefined,
            name: platform.fixedCounterpart.name ?? undefined,
            slug: platform.fixedCounterpart.slug ?? undefined,
          }
        : undefined,
      detachableCounterpart: platform.detachableCounterpart
        ? {
            id: platform.detachableCounterpart.id ?? undefined,
            name: platform.detachableCounterpart.name ?? undefined,
            slug: platform.detachableCounterpart.slug ?? undefined,
          }
        : undefined,
    }));
}

export async function getDisciplines(): Promise<ShotgunsDisciplinePayload[]> {
  const result = await sanityFetch({
    query: disciplinesQuery,
    stega: true,
  }).catch(() => ({ data: [] }));
  const data = (result?.data as DisciplineResponse[] | null) ?? null;

  return (data ?? [])
    .filter((discipline): discipline is DisciplineResponse & { _id: string } => Boolean(discipline._id))
    .map((discipline) => ({
      id: discipline._id,
      name: discipline.name ?? undefined,
      slug: discipline.slug?.current ?? undefined,
      overviewPortableText: discipline.overview,
      hero: mapImageResult(discipline.hero ?? null),
      championImage: mapImageResult(discipline.championImage ?? null),
      recommendedPlatformIds: discipline.recommendedPlatforms?.flatMap((ref) =>
        ref._ref ? [ref._ref] : [],
      ),
      popularModels: discipline.popularModels?.flatMap((model) =>
        model._id
          ? [
              {
                id: model._id,
                name: model.name ?? undefined,
                hero: mapImageResult(model.image ?? null),
              },
            ]
          : [],
      ),
    }));
}

export async function getGrades(): Promise<ShotgunsGradePayload[]> {
  const result = await sanityFetch({
    query: gradesQuery,
    stega: true,
  }).catch(() => ({ data: [] }));
  const data = (result?.data as GradeResponse[] | null) ?? null;

  const slugifyGradeId = (value: string | null | undefined, fallback: string): string => {
    const base = value?.trim().toLowerCase();
    if (base) {
      const slug = base.replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-)|(-$)/g, "");
      if (slug) return slug;
    }
    return fallback;
  };

  return (data ?? [])
    .filter((grade): grade is GradeResponse & { _id: string } => Boolean(grade._id))
    .map((grade) => ({
      id: slugifyGradeId(grade.name, grade._id),
      name: grade.name ?? undefined,
      description: grade.description ?? undefined,
      hero: mapImageResult(grade.hero ?? null),
      engravingGallery: (
        grade.engravingGallery?.length
          ? grade.engravingGallery
          : grade.engravingLibrary?.map((entry) => entry.engraving_photo) ?? []
      ).flatMap((asset) => {
        const mapped = mapImageResult(asset ?? null);
        return mapped ? [mapped] : [];
      }),
      woodImages: grade.woodImages?.flatMap((asset) => {
        const mapped = mapImageResult(asset ?? null);
        return mapped ? [mapped] : [];
      }),
    }));
}

function mapBackgroundImage(
  image: SanityImageResult | null | undefined,
  path: string | null | undefined,
  fallbackPath: string,
  fallbackAlt: string,
): FactoryAsset | undefined {
  const mapped = mapImageResult(image ?? null);
  if (mapped) return mapped;
  if (path) {
    return {
      id: path,
      kind: "image",
      url: path,
      alt: fallbackAlt,
    };
  }
  return {
    id: fallbackPath,
    kind: "image",
    url: fallbackPath,
    alt: fallbackAlt,
  };
}
