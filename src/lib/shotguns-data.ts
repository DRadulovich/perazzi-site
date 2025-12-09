import { cache } from "react";

import { shotgunsData } from "@/content/shotguns";
import { portableTextToHtml } from "@/lib/portable-text";
import type {
  ShotgunsSectionData,
  Platform,
  GradeSeries,
  ShotgunsSeriesEntry,
  DisciplineSummary,
  ShotgunsLandingData,
} from "@/types/catalog";
import {
  getDisciplines,
  getGrades,
  getPlatforms,
  getShotgunsLanding,
  type ShotgunsDisciplinePayload,
  type ShotgunsGradePayload,
  type ShotgunsLandingPayload,
  type ShotgunsPlatformPayload,
} from "@/sanity/queries/shotguns";

const FALLBACK = shotgunsData;

const warn = (message: string) => {
  console.warn(`[sanity][shotguns] ${message}`);
};

const isNonEmptyString = (value?: string | null): value is string =>
  typeof value === "string" && value.length > 0;

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

export const getShotgunsSectionData = cache(async (): Promise<ShotgunsSectionData> => {
  const cloned: ShotgunsSectionData = structuredClone(FALLBACK);

  try {
    const [landing, platforms, disciplines, grades] = await Promise.all([
      getShotgunsLanding(),
      getPlatforms(),
      getDisciplines(),
      getGrades(),
    ]);

    applyLanding(cloned, landing);
    applyPlatforms(cloned, platforms);
    syncSeriesWithPlatforms(cloned);
    applyDisciplines(cloned, disciplines);
    applyGrades(cloned, grades);
  } catch (error) {
    warn(`Failed to fetch shotguns content from Sanity. Using fixtures. ${(error as Error).message}`);
  }

  return cloned;
});

function applyLanding(target: ShotgunsSectionData, landing?: ShotgunsLandingPayload | null) {
  if (!landing) {
    warn("Shotguns landing document missing.");
    return;
  }

  applyLandingHero(target, landing);
  applyPlatformGridUi(target, landing);
  applyTriggerExplainer(target, landing);
  applyLandingTeasers(target, landing);
  applyDisciplineFitAdvisory(target, landing);
  applyDisciplineRailUi(target, landing);
  applyGaugeSelectionAdvisory(target, landing);
  applyTriggerChoiceAdvisory(target, landing);
  applyEngravingCarouselUi(target, landing);
  applyDisciplineHubs(target, landing);
}

function applyLandingHero(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (landing.hero?.background) {
    target.landing.hero = {
      title: landing.hero.title ?? target.landing.hero.title,
      subheading: landing.hero.subheading ?? target.landing.hero.subheading,
      background: landing.hero.background,
    };
    return;
  }

  warn("Shotguns landing hero background missing; using fixture image.");
}

function applyPlatformGridUi(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (!landing.platformGridUi) return;

  target.landing.platformGridUi = {
    heading: landing.platformGridUi.heading ?? target.landing.platformGridUi?.heading,
    subheading: landing.platformGridUi.subheading ?? target.landing.platformGridUi?.subheading,
    background: landing.platformGridUi.background ?? target.landing.platformGridUi?.background,
    chatLabelTemplate:
      landing.platformGridUi.chatLabelTemplate ?? target.landing.platformGridUi?.chatLabelTemplate,
    chatPayloadTemplate:
      landing.platformGridUi.chatPayloadTemplate ?? target.landing.platformGridUi?.chatPayloadTemplate,
    cardFooterTemplate:
      landing.platformGridUi.cardFooterTemplate ?? target.landing.platformGridUi?.cardFooterTemplate,
  };
}

function applyTriggerExplainer(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (landing.triggerExplainer?.diagram) {
    target.landing.triggerExplainer = {
      title: landing.triggerExplainer.title ?? target.landing.triggerExplainer.title,
      subheading: landing.triggerExplainer.subheading ?? target.landing.triggerExplainer.subheading,
      copyHtml:
        portableTextToHtml(landing.triggerExplainer.copyPortableText) ??
        target.landing.triggerExplainer.copyHtml,
      diagram: landing.triggerExplainer.diagram ?? target.landing.triggerExplainer.diagram,
      background: landing.triggerExplainer.background ?? target.landing.triggerExplainer.background,
      links:
        landing.triggerExplainer.links?.map((link) => ({
          label: link.label ?? "Explore",
          href: link.href ?? "#",
        })) ?? target.landing.triggerExplainer.links,
    };
    return;
  }

  warn("Shotguns trigger explainer missing diagram; using fixtures.");
}

function applyLandingTeasers(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (landing.teasers?.engraving) {
    target.landing.gradesTeaser.engravingTile = landing.teasers.engraving;
  }
  if (landing.teasers?.wood) {
    target.landing.gradesTeaser.woodTile = landing.teasers.wood;
  }
}

function applyDisciplineFitAdvisory(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (!landing.disciplineFitAdvisory) return;

  target.landing.disciplineFitAdvisory = {
    eyebrow: landing.disciplineFitAdvisory.eyebrow ?? target.landing.disciplineFitAdvisory?.eyebrow,
    heading: landing.disciplineFitAdvisory.heading ?? target.landing.disciplineFitAdvisory?.heading,
    paragraphs:
      landing.disciplineFitAdvisory.paragraphs?.length
        ? landing.disciplineFitAdvisory.paragraphs
        : target.landing.disciplineFitAdvisory?.paragraphs,
    chatPrompt:
      landing.disciplineFitAdvisory.chatPrompt ?? target.landing.disciplineFitAdvisory?.chatPrompt,
    bullets:
      landing.disciplineFitAdvisory.bullets?.length
        ? landing.disciplineFitAdvisory.bullets
        : target.landing.disciplineFitAdvisory?.bullets,
  };
}

function applyDisciplineRailUi(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (!landing.disciplineRailUi) return;

  target.landing.disciplineRailUi = {
    heading: landing.disciplineRailUi.heading ?? target.landing.disciplineRailUi?.heading,
    subheading: landing.disciplineRailUi.subheading ?? target.landing.disciplineRailUi?.subheading,
    background: landing.disciplineRailUi.background ?? target.landing.disciplineRailUi?.background,
  };
}

function applyGaugeSelectionAdvisory(
  target: ShotgunsSectionData,
  landing: ShotgunsLandingPayload,
) {
  if (!landing.gaugeSelectionAdvisory) return;

  const fallbackBullets =
    target.landing.gaugeSelectionAdvisory?.bullets ?? target.landing.gaugesTeaser.bullets;

  target.landing.gaugeSelectionAdvisory = {
    heading: landing.gaugeSelectionAdvisory.heading ?? target.landing.gaugeSelectionAdvisory?.heading,
    intro: landing.gaugeSelectionAdvisory.intro ?? target.landing.gaugeSelectionAdvisory?.intro,
    chatLabel: landing.gaugeSelectionAdvisory.chatLabel ?? target.landing.gaugeSelectionAdvisory?.chatLabel,
    chatPrompt: landing.gaugeSelectionAdvisory.chatPrompt ?? target.landing.gaugeSelectionAdvisory?.chatPrompt,
    linkLabel: landing.gaugeSelectionAdvisory.linkLabel ?? target.landing.gaugeSelectionAdvisory?.linkLabel,
    linkHref: landing.gaugeSelectionAdvisory.linkHref ?? target.landing.gaugeSelectionAdvisory?.linkHref,
    bullets: landing.gaugeSelectionAdvisory.bullets?.length
      ? landing.gaugeSelectionAdvisory.bullets
      : fallbackBullets,
    closing: landing.gaugeSelectionAdvisory.closing ?? target.landing.gaugeSelectionAdvisory?.closing,
  };
}

function applyTriggerChoiceAdvisory(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (!landing.triggerChoiceAdvisory) return;

  target.landing.triggerChoiceAdvisory = {
    heading: landing.triggerChoiceAdvisory.heading ?? target.landing.triggerChoiceAdvisory?.heading,
    intro: landing.triggerChoiceAdvisory.intro ?? target.landing.triggerChoiceAdvisory?.intro,
    chatLabel: landing.triggerChoiceAdvisory.chatLabel ?? target.landing.triggerChoiceAdvisory?.chatLabel,
    chatPrompt: landing.triggerChoiceAdvisory.chatPrompt ?? target.landing.triggerChoiceAdvisory?.chatPrompt,
    linkLabel: landing.triggerChoiceAdvisory.linkLabel ?? target.landing.triggerChoiceAdvisory?.linkLabel,
    linkHref: landing.triggerChoiceAdvisory.linkHref ?? target.landing.triggerChoiceAdvisory?.linkHref,
    bullets:
      landing.triggerChoiceAdvisory.bullets?.length
        ? landing.triggerChoiceAdvisory.bullets
        : target.landing.triggerChoiceAdvisory?.bullets,
    closing: landing.triggerChoiceAdvisory.closing ?? target.landing.triggerChoiceAdvisory?.closing,
  };
}

function applyEngravingCarouselUi(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (!landing.engravingCarouselUi) return;

  target.landing.engravingCarouselUi = {
    heading: landing.engravingCarouselUi.heading ?? target.landing.engravingCarouselUi?.heading,
    subheading: landing.engravingCarouselUi.subheading ?? target.landing.engravingCarouselUi?.subheading,
    background: landing.engravingCarouselUi.background ?? target.landing.engravingCarouselUi?.background,
    ctaLabel: landing.engravingCarouselUi.ctaLabel ?? target.landing.engravingCarouselUi?.ctaLabel,
    categoryLabels:
      landing.engravingCarouselUi.categoryLabels?.length
        ? landing.engravingCarouselUi.categoryLabels
        : target.landing.engravingCarouselUi?.categoryLabels,
  };
}

function applyDisciplineHubs(target: ShotgunsSectionData, landing: ShotgunsLandingPayload) {
  if (!landing.disciplineHubs?.length) return;

  const hubEntries = landing.disciplineHubs
    .filter(
      (hub): hub is NonNullable<(typeof landing.disciplineHubs)[number]> & { key: string } =>
        Boolean(hub?.key),
    )
    .map((hub) => [hub.key, hub] as const);

  const hubMap = new Map(hubEntries);

  target.landing.disciplines = target.landing.disciplines.map((discipline) => {
    const hub = hubMap.get(discipline.id);
    if (hub?.championImage && discipline.champion) {
      discipline.champion.image = hub.championImage;
    }
    return discipline;
  });
}

function applyPlatforms(target: ShotgunsSectionData, platforms?: ShotgunsPlatformPayload[]) {
  if (!platforms?.length) {
    warn("No platforms returned from Sanity; using fixture platforms.");
    return;
  }

  target.landing.platforms = platforms
    .map(mapPlatformFromCms)
    .filter(isDefined);
}

const cleanSlug = (value?: string | null) => {
  if (!value) return undefined;
  return value
    .toLowerCase()
    .replaceAll(/^platform-/g, "")
    .replaceAll(/-platform$/g, "")
    .replaceAll(/[^a-z0-9-]/g, "");
};

function mapPlatformFromCms(platform: ShotgunsPlatformPayload): Platform | undefined {
  const slug = cleanSlug(platform.slug) ?? cleanSlug(platform.name) ?? platform.id?.toLowerCase();
  const hero = platform.hero;
  if (!slug || !hero) return undefined;

  const typicalDisciplines =
    platform.disciplines?.map((item) => item.name).filter(isNonEmptyString) ??
    platform.disciplines?.map((item) => item.id).filter(isNonEmptyString) ??
    [];
  const disciplineRefs = platform.disciplines?.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const fixedCounterpart = platform.fixedCounterpart?.name
    ? {
        id: platform.fixedCounterpart.id ?? cleanSlug(platform.fixedCounterpart.slug) ?? platform.fixedCounterpart.name ?? "",
        slug: cleanSlug(platform.fixedCounterpart.slug) ?? platform.fixedCounterpart.slug ?? "",
        name: platform.fixedCounterpart.name ?? "",
      }
    : undefined;

  const detachableCounterpart = platform.detachableCounterpart?.name
    ? {
        id: platform.detachableCounterpart.id ?? cleanSlug(platform.detachableCounterpart.slug) ?? platform.detachableCounterpart.name ?? "",
        slug: cleanSlug(platform.detachableCounterpart.slug) ?? platform.detachableCounterpart.slug ?? "",
        name: platform.detachableCounterpart.name ?? "",
      }
    : undefined;

  const champion = platform.champion
    ? {
        name: platform.champion.name ?? undefined,
        title: platform.champion.title ?? undefined,
        quote: platform.champion.quote ?? undefined,
        image: platform.champion.image ?? undefined,
        resume: platform.champion.resume,
      }
    : undefined;

  return {
    id: platform.id,
    slug,
    name: platform.name ?? slug.toUpperCase(),
    kind: slug.toUpperCase() as Platform["kind"],
    tagline: platform.snippetText ?? platform.lineage ?? "",
    lineageHtml: platform.lineage,
    hero,
    hallmark: platform.champion?.quote ?? platform.champion?.title ?? "",
    weightDistribution: undefined,
    typicalDisciplines,
    disciplineRefs,
    fixedCounterpart: fixedCounterpart?.slug || fixedCounterpart?.name ? fixedCounterpart : undefined,
    detachableCounterpart: detachableCounterpart?.slug || detachableCounterpart?.name ? detachableCounterpart : undefined,
    champion,
    highlights:
      platform.highlights
        ?.map((highlight, index) => {
          const media = highlight.media ?? hero;
          return {
            title: highlight.title ?? `Highlight ${index + 1}`,
            body: highlight.body ?? "",
            media,
          };
        }) ?? [],
  };
}

function syncSeriesWithPlatforms(target: ShotgunsSectionData) {
  const disciplineLookup = new Map<string, DisciplineSummary>();
  Object.values(target.disciplines).forEach((disc) => {
    disciplineLookup.set(disc.id, disc);
    disciplineLookup.set(disc.name.toLowerCase(), disc);
  });

  target.landing.platforms.forEach((platform) => {
    const slug = platform.slug;
    if (!slug) return;

    if (!target.series[slug]) {
      target.series[slug] = createSeriesFromPlatform(platform);
    }

    const entry = target.series[slug];
    entry.hero = {
      title: `${platform.name} Platform`,
      subheading: platform.tagline ?? entry.hero.subheading,
      media: platform.hero,
    };

    const triggerSummary = [
      platform.detachableCounterpart?.name ? `Detachable: ${platform.detachableCounterpart.name}` : null,
      platform.fixedCounterpart?.name ? `Fixed: ${platform.fixedCounterpart.name}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    entry.atAGlance = {
      ...entry.atAGlance,
      triggerType: triggerSummary || entry.atAGlance.triggerType || "Perazzi trigger",
      typicalDisciplines: platform.typicalDisciplines?.length
        ? platform.typicalDisciplines
        : entry.atAGlance.typicalDisciplines,
      weightDistribution: platform.weightDistribution ?? entry.atAGlance.weightDistribution,
      links: [{ label: `Explore ${platform.name}`, href: `/shotguns/${platform.slug}` }],
    };

    if (platform.lineageHtml) {
      const trimmed = platform.lineageHtml.trim();
      entry.storyHtml = trimmed.startsWith("<")
        ? trimmed
        : trimmed
            .split(/\n+/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => `<p>${paragraph}</p>`)
            .join("");
    }

    if (platform.highlights?.length) {
      entry.highlights = platform.highlights;
    }

    if (platform.champion) {
      entry.champion = {
        ...entry.champion,
        id: entry.champion?.id ?? platform.champion.name ?? slug,
        name: platform.champion.name ?? entry.champion?.name ?? "",
        title: platform.champion.title ?? entry.champion?.title ?? "",
        quote: platform.champion.quote ?? entry.champion?.quote ?? "",
        image: platform.champion.image ?? entry.champion?.image ?? platform.hero,
        href: entry.champion?.href,
        fallbackText: entry.champion?.fallbackText,
      };
    }

    const disciplineMap =
      platform.disciplineRefs?.map((ref) => {
        const lookupKey = ref.id ?? ref.name?.toLowerCase() ?? "";
        const discipline = lookupKey ? disciplineLookup.get(lookupKey) : undefined;
        const label = discipline?.name ?? ref.name ?? "Discipline";
        const disciplineId = discipline?.id ?? ref.id ?? label.toLowerCase();
        return {
          disciplineId,
          label,
          href: discipline ? `/shotguns/disciplines/${discipline.id}` : "/shotguns/disciplines",
          rationale: discipline?.overviewHtml
            ? discipline.overviewHtml.replaceAll(/<[^>]+>/g, "").slice(0, 140).concat("…")
            : `Optimized for ${label}.`,
        };
      }) ?? [];

    if (disciplineMap.length) {
      entry.disciplineMap = disciplineMap;
    }
  });
}

function createSeriesFromPlatform(platform: Platform): ShotgunsSeriesEntry {
  return {
    hero: {
      title: platform.name,
      subheading: platform.tagline,
      media: platform.hero,
    },
    atAGlance: {
      triggerType: "Custom trigger",
      weightDistribution: platform.weightDistribution ?? "",
      typicalDisciplines: platform.typicalDisciplines,
      links: [{ label: `Explore ${platform.name}`, href: `/shotguns/${platform.slug}` }],
    },
    storyHtml: `<p>${platform.tagline ?? platform.name}.</p>`,
    highlights: platform.highlights,
    disciplineMap: [],
    champion: platform.champion
      ? {
          id: platform.champion.name ?? platform.slug,
          name: platform.champion.name ?? "",
          title: platform.champion.title ?? "",
          quote: platform.champion.quote ?? "",
          image: platform.champion.image ?? platform.hero,
        }
      : undefined,
    relatedArticles: [],
  };
}

function applyDisciplines(
  target: ShotgunsSectionData,
  disciplines?: ShotgunsDisciplinePayload[],
) {
  if (!disciplines?.length) {
    warn("No disciplines returned from Sanity; using fixture disciplines.");
    return;
  }

  const disciplineMap = new Map(
    disciplines
      .map((discipline) => {
        const key = discipline.slug ?? discipline.id;
        return key ? [key, discipline] : null;
      })
      .filter(Boolean) as Array<[string, ShotgunsDisciplinePayload]>,
  );

  const landingFallbackMap = new Map(
    target.landing.disciplines.map((discipline) => [discipline.id, discipline]),
  );
  const updatedLanding: ShotgunsLandingData["disciplines"] = [];

  target.landing.disciplines.forEach((entry) => {
    const cms = disciplineMap.get(entry.id);
    const summary = target.disciplines[entry.id];
    if (!cms) {
      return;
    }

    if (cms.hero) {
      summary.hero = cms.hero;
    }
    if (cms.championImage) {
      if (summary.champion) {
        summary.champion.image = cms.championImage;
      } else {
        summary.champion = {
          id: entry.id,
          name: entry.name,
          title: entry.id,
          quote: "",
          image: cms.championImage,
        };
      }
    }
    const overviewHtml = portableTextToHtml(cms.overviewPortableText);
    if (overviewHtml) {
      summary.overviewHtml = overviewHtml;
    }
    if (cms.recommendedPlatformIds?.length) {
      summary.recommendedPlatforms = cms.recommendedPlatformIds;
    }
    if (cms.popularModels?.length) {
      summary.popularModels = cms.popularModels;
    }

    updatedLanding.push({
      id: entry.id,
      name: cms.name ?? entry.name,
      overviewHtml: summary.overviewHtml ?? entry.overviewHtml,
      recommendedPlatforms:
        summary.recommendedPlatforms?.length
          ? summary.recommendedPlatforms
          : entry.recommendedPlatforms,
      popularModels: summary.popularModels,
      champion: summary.champion ?? entry.champion,
      hero: summary.hero ?? entry.hero,
    });
  });

  for (const [slug, cms] of disciplineMap.entries()) {
    if (landingFallbackMap.has(slug)) continue;
    const summary: DisciplineSummary = {
      id: slug,
      name: cms.name ?? slug,
      overviewHtml: portableTextToHtml(cms.overviewPortableText) ?? "",
      recommendedPlatforms: cms.recommendedPlatformIds ?? [],
      recipe: {
        poiRange: "",
        barrelLengths: "",
        ribNotes: "",
      },
    };
    if (cms.hero) summary.hero = cms.hero;
    if (cms.championImage) {
      summary.champion = {
        id: slug,
        name: cms.name ?? slug,
        title: "",
        quote: "",
        image: cms.championImage,
      };
    }
    if (cms.popularModels?.length) {
      summary.popularModels = cms.popularModels;
    }
    target.disciplines[slug] = summary;
    updatedLanding.push({
      id: slug,
      name: summary.name,
      overviewHtml: summary.overviewHtml,
      recommendedPlatforms: summary.recommendedPlatforms,
      popularModels: summary.popularModels,
      champion: summary.champion,
      hero: summary.hero,
    });
  }

  if (updatedLanding.length) {
    target.landing.disciplines = updatedLanding;
  }
}

function applyGrades(target: ShotgunsSectionData, grades?: ShotgunsGradePayload[]) {
  if (!grades?.length) {
    warn("No grades returned from Sanity; using fixture galleries.");
    return;
  }

  const cmsMap = new Map(
    grades
      .map((grade) => {
        const key = grade.id?.toLowerCase() ?? grade.name?.toLowerCase();
        return key ? [key, grade] : null;
      })
      .filter(Boolean) as Array<[string, ShotgunsGradePayload]>,
  );

  const merged: GradeSeries[] = target.grades.map((grade) => {
    const key = grade.id.toLowerCase();
    const cms = cmsMap.get(key);
    if (!cms) return grade;

    const galleryFromCms = [
      ...(cms.hero ? [cms.hero] : []),
      ...(cms.engravingGallery ?? []),
      ...(cms.woodImages ?? []),
    ];

    const updated: GradeSeries = {
      ...grade,
      name: cms.name ?? grade.name,
      description: cms.description ?? grade.description,
      gallery: galleryFromCms.length ? galleryFromCms : grade.gallery,
    };

    cmsMap.delete(key);
    return updated;
  });

  cmsMap.forEach((cms, key) => {
    const gallery = [
      ...(cms.hero ? [cms.hero] : []),
      ...(cms.engravingGallery ?? []),
      ...(cms.woodImages ?? []),
    ];
    merged.push({
      id: cms.id ?? key,
      name: cms.name ?? cms.id ?? key.toUpperCase(),
      description: cms.description ?? "",
      gallery,
    });
  });

  target.grades = merged;
}
