import { cache } from "react";

import { shotgunsData } from "@/content/shotguns";
import type { ShotgunsSectionData, Platform, GradeSeries } from "@/types/catalog";
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

  const platformMap = new Map(
    platforms
      .map((platform) => {
        const key = platform.slug ?? platform.id;
        return key ? [key, platform] : null;
      })
      .filter(Boolean) as Array<[string, ShotgunsPlatformPayload]>,
  );

  target.landing.platforms = target.landing.platforms.map((platform) =>
    mergePlatform(platform, platformMap.get(platform.slug) ?? platformMap.get(platform.id)),
  );
}

function mergePlatform(platform: Platform, cms?: ShotgunsPlatformPayload): Platform {
  if (!cms) return platform;
  const merged: Platform = { ...platform };

  if (cms.hero) {
    merged.hero = cms.hero;
  }

  if (cms.highlights?.length) {
    const fallbackHighlights = merged.highlights ?? [];
    merged.highlights = cms.highlights.map((highlight, index) => ({
      title: highlight.title ?? fallbackHighlights[index]?.title ?? `Highlight ${index + 1}`,
      body: highlight.body ?? fallbackHighlights[index]?.body ?? "",
      media: highlight.media ?? fallbackHighlights[index]?.media ?? merged.hero,
    }));
  }

  if (cms.champion?.image) {
    merged.champion = {
      ...merged.champion,
      name: cms.champion.name ?? merged.champion?.name ?? "Perazzi Champion",
      title: cms.champion.title ?? merged.champion?.title ?? "",
      quote: cms.champion.quote ?? merged.champion?.quote ?? "",
      image: cms.champion.image,
    };
  }

  return merged;
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

function portableTextToHtml(blocks?: PortableTextBlock[] | null): string | undefined {
  if (!blocks?.length) return undefined;

  const html = blocks
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const type = (block as { _type?: string })._type;
      if (type !== "block") return "";
      const style = (block as { style?: string }).style ?? "normal";
      const children = Array.isArray((block as { children?: unknown[] }).children)
        ? ((block as { children?: unknown[] }).children as Array<{ text?: string }>)
        : [];
      const text = children
        .map((child) => (typeof child?.text === "string" ? child.text : ""))
        .join("");
      if (!text) return "";
      const safeText = escapeHtml(text);
      switch (style) {
        case "h2":
          return `<h2>${safeText}</h2>`;
        case "h3":
          return `<h3>${safeText}</h3>`;
        default:
          return `<p>${safeText}</p>`;
      }
    })
    .filter(Boolean)
    .join("");

  return html || undefined;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
