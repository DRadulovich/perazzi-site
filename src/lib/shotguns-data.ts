import { cache } from "react";

import { shotgunsData } from "@/content/shotguns";
import { portableTextToHtml } from "@/lib/portable-text";
import type { ShotgunsSectionData, Platform, GradeSeries, ShotgunsSeriesEntry, DisciplineSummary } from "@/types/catalog";
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
import type { PortableTextBlock } from "@/sanity/queries/utils";

const FALLBACK = shotgunsData;

const warn = (message: string) => {
  console.warn(`[sanity][shotguns] ${message}`);
};

export const getShotgunsSectionData = cache(async (): Promise<ShotgunsSectionData> => {
  const cloned: ShotgunsSectionData = JSON.parse(JSON.stringify(FALLBACK));

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

  if (landing.hero?.background) {
    target.landing.hero = {
      title: landing.hero.title ?? target.landing.hero.title,
      subheading: landing.hero.subheading ?? target.landing.hero.subheading,
      background: landing.hero.background,
    };
  } else {
    warn("Shotguns landing hero background missing; using fixture image.");
  }

  if (landing.triggerExplainer?.diagram) {
    target.landing.triggerExplainer = {
      title: landing.triggerExplainer.title ?? target.landing.triggerExplainer.title,
      copyHtml:
        portableTextToHtml(landing.triggerExplainer.copyPortableText) ??
        target.landing.triggerExplainer.copyHtml,
      diagram: landing.triggerExplainer.diagram ?? target.landing.triggerExplainer.diagram,
      links:
        landing.triggerExplainer.links?.map((link) => ({
          label: link.label ?? "Explore",
          href: link.href ?? "#",
        })) ?? target.landing.triggerExplainer.links,
    };
  } else {
    warn("Shotguns trigger explainer missing diagram; using fixtures.");
  }

  if (landing.teasers?.engraving) {
    target.landing.gradesTeaser.engravingTile = landing.teasers.engraving;
  }
  if (landing.teasers?.wood) {
    target.landing.gradesTeaser.woodTile = landing.teasers.wood;
  }

  if (landing.disciplineHubs?.length) {
    const hubMap = new Map(
      landing.disciplineHubs
        .filter((hub) => hub?.key)
        .map((hub) => [hub?.key ?? "", hub])
        .filter(([key]) => Boolean(key)),
    );

    target.landing.disciplines = target.landing.disciplines.map((discipline) => {
      const hub = hubMap.get(discipline.id);
      if (hub?.championImage && discipline.champion) {
        discipline.champion.image = hub.championImage;
      }
      return discipline;
    });
  }
}

function applyPlatforms(target: ShotgunsSectionData, platforms?: ShotgunsPlatformPayload[]) {
  if (!platforms?.length) {
    warn("No platforms returned from Sanity; using fixture platforms.");
    return;
  }

  target.landing.platforms = platforms
    .map(mapPlatformFromCms)
    .filter((platform): platform is Platform => Boolean(platform));
}

const cleanSlug = (value?: string | null) => {
  if (!value) return undefined;
  return value
    .toLowerCase()
    .replace(/^platform-/, "")
    .replace(/-platform$/, "")
    .replace(/[^a-z0-9-]/g, "");
};

function mapPlatformFromCms(platform: ShotgunsPlatformPayload): Platform | undefined {
  const slug = cleanSlug(platform.slug) ?? cleanSlug(platform.name) ?? platform.id?.toLowerCase();
  if (!slug || !platform.hero) return undefined;

  const typicalDisciplines =
    platform.disciplines?.map((item) => item.name).filter(Boolean) ??
    platform.disciplines?.map((item) => item.id) ??
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
    hero: platform.hero,
    hallmark: platform.champion?.quote ?? platform.champion?.title ?? "",
    weightDistribution: undefined,
    typicalDisciplines,
    disciplineRefs,
    fixedCounterpart: fixedCounterpart?.slug || fixedCounterpart?.name ? fixedCounterpart : undefined,
    detachableCounterpart: detachableCounterpart?.slug || detachableCounterpart?.name ? detachableCounterpart : undefined,
    champion,
    highlights:
      platform.highlights
        ?.map((highlight, index) => ({
          title: highlight.title ?? `Highlight ${index + 1}`,
          body: highlight.body ?? "",
          media: highlight.media ?? platform.hero,
        }))
        .filter((highlight) => Boolean(highlight.media)) ?? [],
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
            ? discipline.overviewHtml.replace(/<[^>]+>/g, "").slice(0, 140).concat("…")
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

  for (const [slug, discipline] of Object.entries(target.disciplines)) {
    const cms = disciplineMap.get(slug);
    if (!cms) continue;

    if (cms.hero) {
      discipline.hero = cms.hero;
    }
    if (cms.championImage && discipline.champion) {
      discipline.champion.image = cms.championImage;
    }
    const overviewHtml = portableTextToHtml(cms.overviewPortableText);
    if (overviewHtml) {
      discipline.overviewHtml = overviewHtml;
    }
  }
}

function applyGrades(target: ShotgunsSectionData, grades?: ShotgunsGradePayload[]) {
  if (!grades?.length) {
    warn("No grades returned from Sanity; using fixture galleries.");
    return;
  }

  const gradeMap = new Map(
    grades
      .map((grade) => {
        const key = grade.id?.toLowerCase();
        return key ? [key, grade] : null;
      })
      .filter(Boolean) as Array<[string, ShotgunsGradePayload]>,
  );

  target.grades = target.grades.map((grade) => {
    const cms = gradeMap.get(grade.id.toLowerCase());
    if (!cms) return grade;
    const updated: GradeSeries = { ...grade };

    if (cms.engravingGallery?.length) {
      updated.gallery = cms.engravingGallery;
    }

    if (cms.hero) {
      updated.gallery = [cms.hero, ...(updated.gallery ?? [])];
    }

    return updated;
  });
}
