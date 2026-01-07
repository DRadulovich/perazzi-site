"use client";

import { useEffect, useMemo, useState } from "react";

import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { choreoDurations, prefersReducedMotion } from "@/lib/choreo";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui";

import {
  DISCIPLINE_TABS,
  type DisciplineCard,
  type DisciplineCategory,
  type DisciplineRailBackground,
} from "./DisciplineRailData";
import { DisciplineRailModelModal } from "./DisciplineRailModelModal";
import { DisciplineRailRevealSection } from "./DisciplineRailRevealSection";
import { useDisciplineImagePreload } from "./useDisciplineImagePreload";
import { useDisciplineModelDetails } from "./useDisciplineModelDetails";

type DisciplineRailProps = Readonly<{
  disciplines: readonly DisciplineCard[];
  platforms: readonly Platform[];
  ui?: ShotgunsLandingData["disciplineRailUi"];
}>;

export function DisciplineRail({
  disciplines,
  platforms,
  ui,
}: DisciplineRailProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHydrated = useHydrated();
  const enableTitleReveal = isHydrated && isDesktop;
  const railAnalyticsRef = useAnalyticsObserver<HTMLElement>("DisciplineRailSeen");
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const reduceMotion = prefersReducedMotion();

  const [openCategory, setOpenCategory] = useState<string | null>(DISCIPLINE_TABS[0]?.label ?? null);
  const [activeDisciplineId, setActiveDisciplineId] = useState<string | null>(null);
  const railKey = enableTitleReveal ? "title-reveal" : "always-reveal";
  const modalExitMs = reduceMotion ? 0 : choreoDurations.short;

  const {
    selectedModel,
    isModalVisible,
    modalPresence,
    modelLoadingId,
    modelError,
    modalRoot,
    handleModelSelect,
    requestModalClose,
  } = useDisciplineModelDetails({ modalExitMs });

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  useDisciplineImagePreload({ disciplines, isHydrated });

  const platformName = (platformId: string) =>
    platforms.find((platform) => platform.id === platformId)?.name ??
    platformId.replace("platform-", "").toUpperCase();

  const disciplineLookup = useMemo(() => {
    const map = new Map<string, DisciplineCard>();
    disciplines.forEach((discipline) => {
      map.set(discipline.id, discipline);
    });
    return map;
  }, [disciplines]);

  const categories = useMemo<DisciplineCategory[]>(() => {
    return DISCIPLINE_TABS.map((tab) => {
      const resolved = tab.items
        .map((aliases) => {
          for (const alias of aliases) {
            const match = disciplineLookup.get(alias);
            if (match) return match;
          }
          return undefined;
        })
        .filter((item): item is DisciplineCard => item !== undefined);
      return { label: tab.label, disciplines: resolved };
    }).filter((category) => category.disciplines.length);
  }, [disciplineLookup]);

  useEffect(() => {
    const firstCategory = categories[0];
    if (!activeDisciplineId && firstCategory.disciplines[0]) {
      setActiveDisciplineId(firstCategory.disciplines[0].id);
      setOpenCategory(firstCategory.label);
    }
  }, [categories, activeDisciplineId]);

  const selectedDiscipline =
    disciplines.find((discipline) => discipline.id === activeDisciplineId) ??
    categories[0]?.disciplines[0] ??
    disciplines[0] ??
    null;

  const heading = ui?.heading ?? "Disciplines at a Glance";
  const subheading =
    ui?.subheading ??
    "Every discipline demands something unique from your platform, whether it's precision, speed, or adaptability.";
  const background: DisciplineRailBackground = ui?.background ?? {
    id: "discipline-rail-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg",
    alt: "Perazzi discipline background",
  };

  return (
    <section
      ref={railAnalyticsRef}
      data-analytics-id="DisciplineRailSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
      aria-labelledby="discipline-rail-heading"
    >
      <DisciplineRailRevealSection
        key={railKey}
        categories={categories}
        selectedDiscipline={selectedDiscipline}
        heading={heading}
        subheading={subheading}
        background={background}
        openCategory={openCategory}
        setOpenCategory={setOpenCategory}
        activeDisciplineId={activeDisciplineId}
        setActiveDisciplineId={setActiveDisciplineId}
        platformName={platformName}
        handleModelSelect={handleModelSelect}
        modelLoadingId={modelLoadingId}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />

      <DisciplineRailModelModal
        model={selectedModel}
        isVisible={isModalVisible}
        modalPresence={modalPresence}
        modalRoot={modalRoot}
        onRequestClose={requestModalClose}
      />

      {modelError ? (
        <Text
          asChild
          className="block text-center text-red-500"
          leading="normal"
        >
          <output aria-live="polite">
            {modelError}
          </output>
        </Text>
      ) : null}
    </section>
  );
}
