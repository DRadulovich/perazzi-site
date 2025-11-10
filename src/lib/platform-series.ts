import type { DisciplineSummary, Platform, ShotgunsSeriesEntry } from "@/types/catalog";

const asHtml = (content?: string, fallback?: string) => {
  if (!content) return fallback ?? "";
  const trimmed = content.trim();
  if (!trimmed) return fallback ?? "";
  if (trimmed.startsWith("<")) return trimmed;
  return trimmed
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
};

const buildDisciplineMap = (
  platform: Platform,
  disciplines: Record<string, DisciplineSummary>,
): ShotgunsSeriesEntry["disciplineMap"] => {
  if (!platform.disciplineRefs?.length) return [];
  return platform.disciplineRefs
    .map((ref) => {
      const key = ref.id ?? ref.name?.toLowerCase();
      const discipline = key
        ? disciplines[key] || Object.values(disciplines).find((d) => d.id === key || d.name === ref.name)
        : undefined;
      if (!discipline && !ref.id && !ref.name) return null;
      const label = discipline?.name ?? ref.name ?? "Discipline";
      const id = discipline?.id ?? ref.id ?? label.toLowerCase();
      return {
        disciplineId: id,
        label,
        href: discipline ? `/shotguns/disciplines/${discipline.id}` : `/shotguns/disciplines`,
        rationale: discipline?.overviewHtml
          ? discipline.overviewHtml.replace(/<[^>]+>/g, "").slice(0, 160).concat("…")
          : `Optimized for ${label}.`,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
};

export const platformToSeriesEntry = (
  platform: Platform,
  fallback: ShotgunsSeriesEntry,
  disciplines: Record<string, DisciplineSummary>,
): ShotgunsSeriesEntry => {
  const triggerParts = [] as string[];
  if (platform.detachableCounterpart?.name) {
    triggerParts.push(`Detachable: ${platform.detachableCounterpart.name}`);
  }
  if (platform.fixedCounterpart?.name) {
    triggerParts.push(`Fixed: ${platform.fixedCounterpart.name}`);
  }

  return {
    hero: {
      title: `${platform.name} Platform`,
      subheading: platform.tagline ?? fallback.hero.subheading,
      media: platform.hero,
    },
    atAGlance: {
      triggerType: triggerParts.length ? triggerParts.join(" · ") : fallback.atAGlance.triggerType,
      weightDistribution: platform.weightDistribution ?? fallback.atAGlance.weightDistribution,
      typicalDisciplines: platform.typicalDisciplines?.length
        ? platform.typicalDisciplines
        : fallback.atAGlance.typicalDisciplines,
      links: [{ label: `Explore ${platform.name}`, href: `/shotguns/${platform.slug}` }],
    },
    storyHtml: asHtml(platform.lineageHtml, fallback.storyHtml),
    highlights: platform.highlights?.length ? platform.highlights : fallback.highlights,
    disciplineMap: buildDisciplineMap(platform, disciplines).length
      ? buildDisciplineMap(platform, disciplines)
      : fallback.disciplineMap,
    champion: platform.champion
      ? {
          id: platform.champion.name ?? platform.slug,
          name: platform.champion.name ?? fallback.champion?.name ?? "",
          title: platform.champion.title ?? fallback.champion?.title ?? "",
          quote: platform.champion.quote ?? fallback.champion?.quote ?? "",
          image: platform.champion.image ?? fallback.champion?.image ?? platform.hero,
          href: fallback.champion?.href,
        }
      : fallback.champion,
    relatedArticles: fallback.relatedArticles,
  };
};
