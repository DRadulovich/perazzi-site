"use client";

import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";

import { EngravingGradesCarouselRevealSection } from "./EngravingGradesCarouselRevealSection";
import { useEngravingGradesCarouselState } from "./useEngravingGradesCarouselState";

type EngravingGradesCarouselProps = Readonly<{
  grades: readonly GradeSeries[];
  ui?: ShotgunsLandingData["engravingCarouselUi"];
}>;

export function EngravingGradesCarousel({ grades, ui }: EngravingGradesCarouselProps) {
  const analyticsRef = useAnalyticsObserver<HTMLElement>("EngravingGradesCarouselSeen");
  const {
    categories,
    selectedGrade,
    heading,
    subheading,
    background,
    ctaLabel,
    openCategory,
    setOpenCategory,
    resolvedOpenCategory,
    activeGradeId,
    setActiveGradeId,
    enableTitleReveal,
    carouselKey,
    isCollapsed,
    setIsCollapsed,
  } = useEngravingGradesCarouselState({ grades, ui });

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="EngravingGradesCarouselSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
      aria-labelledby="engraving-grades-heading"
    >
      <EngravingGradesCarouselRevealSection
        key={carouselKey}
        categories={categories}
        selectedGrade={selectedGrade}
        heading={heading}
        subheading={subheading}
        background={background}
        ctaLabel={ctaLabel}
        openCategory={openCategory}
        setOpenCategory={setOpenCategory}
        resolvedOpenCategory={resolvedOpenCategory}
        activeGradeId={activeGradeId}
        setActiveGradeId={setActiveGradeId}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}
