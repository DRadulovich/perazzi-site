"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";

import {
  GRADE_TABS,
  type EngravingCategory,
  type EngravingCarouselBackground,
} from "./EngravingGradesCarouselData";

type EngravingGradesCarouselStateArgs = Readonly<{
  grades: readonly GradeSeries[];
  ui?: ShotgunsLandingData["engravingCarouselUi"];
}>;

type EngravingGradesCarouselState = {
  categories: EngravingCategory[];
  selectedGrade: GradeSeries | null;
  heading: string;
  subheading: string;
  background: EngravingCarouselBackground;
  ctaLabel: string;
  openCategory: string | null;
  setOpenCategory: Dispatch<SetStateAction<string | null>>;
  resolvedOpenCategory: string | null;
  activeGradeId: string | null;
  setActiveGradeId: Dispatch<SetStateAction<string | null>>;
  enableTitleReveal: boolean;
  carouselKey: string;
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
};

type EngravingTab = {
  label: string;
  order: readonly string[];
};

const DEFAULT_BACKGROUND: EngravingCarouselBackground = {
  id: "engraving-carousel-bg",
  kind: "image",
  url: "/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg",
  alt: "Perazzi engraving workshop background",
};

const normalize = (value?: string | null) =>
  value
    ?.trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "") ?? "";

const resolveTabLabels = (ui?: ShotgunsLandingData["engravingCarouselUi"]) =>
  ui?.categoryLabels?.length === GRADE_TABS.length
    ? ui.categoryLabels
    : GRADE_TABS.map((tab) => tab.label);

const buildTabs = (ui?: ShotgunsLandingData["engravingCarouselUi"]): EngravingTab[] => {
  const resolvedTabLabels = resolveTabLabels(ui);
  return GRADE_TABS.map((tab, index) => ({
    ...tab,
    label: resolvedTabLabels[index] ?? tab.label,
  }));
};

const buildGradeLookup = (grades: readonly GradeSeries[]) => {
  const map = new Map<string, GradeSeries>();
  grades.forEach((grade) => {
    map.set(normalize(grade.name), grade);
    map.set(normalize(grade.id), grade);
  });
  return map;
};

const buildGroupedGrades = (tabs: EngravingTab[], gradeLookup: Map<string, GradeSeries>) =>
  tabs.map((tab) =>
    tab
      .order
      .map((name) => gradeLookup.get(normalize(name)))
      .filter(Boolean) as GradeSeries[],
  );

const buildCategories = (tabs: EngravingTab[], groupedGrades: GradeSeries[][]): EngravingCategory[] =>
  tabs
    .map((tab, index) => {
      const resolved = groupedGrades[index] ?? [];
      return { label: tab.label, grades: resolved };
    })
    .filter((category) => category.grades.length);

const resolveOpenCategory = (openCategory: string | null, categories: EngravingCategory[]) => {
  if (!openCategory) return null;
  if (categories.some((category) => category.label === openCategory)) {
    return openCategory;
  }
  return categories[0]?.label ?? null;
};

const resolveActiveGradeId = (activeGradeId: string | null, categories: EngravingCategory[]) => {
  if (activeGradeId) {
    const inCategories = categories.some((category) =>
      category.grades.some((grade) => grade.id === activeGradeId),
    );
    if (inCategories) return activeGradeId;
  }
  return categories[0]?.grades[0]?.id ?? null;
};

const resolveSelectedGrade = (
  grades: readonly GradeSeries[],
  categories: EngravingCategory[],
  activeGradeId: string | null,
) =>
  grades.find((grade) => grade.id === activeGradeId) ??
  categories[0]?.grades[0] ??
  grades[0] ??
  null;

export function useEngravingGradesCarouselState({
  grades,
  ui,
}: EngravingGradesCarouselStateArgs): EngravingGradesCarouselState {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHydrated = useHydrated();
  const enableTitleReveal = isHydrated && isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const carouselKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const tabs = useMemo(() => buildTabs(ui), [ui]);
  const [openCategory, setOpenCategory] = useState<string | null>(tabs[0]?.label ?? null);
  const [activeGradeId, setActiveGradeId] = useState<string | null>(null);

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  const gradeLookup = useMemo(() => buildGradeLookup(grades), [grades]);
  const groupedGrades = useMemo(() => buildGroupedGrades(tabs, gradeLookup), [gradeLookup, tabs]);
  const categories = useMemo(() => buildCategories(tabs, groupedGrades), [groupedGrades, tabs]);

  const resolvedOpenCategory = useMemo(
    () => resolveOpenCategory(openCategory, categories),
    [categories, openCategory],
  );
  const resolvedActiveGradeId = useMemo(
    () => resolveActiveGradeId(activeGradeId, categories),
    [activeGradeId, categories],
  );
  const selectedGrade = useMemo(
    () => resolveSelectedGrade(grades, categories, resolvedActiveGradeId),
    [categories, grades, resolvedActiveGradeId],
  );

  const heading = ui?.heading ?? "Engraving Grades";
  const subheading = ui?.subheading ?? "Commission tiers & engraving houses";
  const background = ui?.background ?? DEFAULT_BACKGROUND;
  const ctaLabel = ui?.ctaLabel ?? "View engraving";

  return {
    categories,
    selectedGrade,
    heading,
    subheading,
    background,
    ctaLabel,
    openCategory,
    setOpenCategory,
    resolvedOpenCategory,
    activeGradeId: resolvedActiveGradeId,
    setActiveGradeId,
    enableTitleReveal,
    carouselKey,
    isCollapsed,
    setIsCollapsed,
  };
}
