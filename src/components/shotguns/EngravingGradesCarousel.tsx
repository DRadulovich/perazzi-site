"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, type Dispatch, type SetStateAction } from "react";

import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Container,
  Heading,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

type EngravingGradesCarouselProps = Readonly<{
  grades: readonly GradeSeries[];
  ui?: ShotgunsLandingData["engravingCarouselUi"];
}>;

type EngravingCategory = {
  label: string;
  grades: GradeSeries[];
};

type EngravingCarouselBackground = NonNullable<
  NonNullable<ShotgunsLandingData["engravingCarouselUi"]>["background"]
>;

type EngravingRevealSectionProps = {
  readonly categories: EngravingCategory[];
  readonly selectedGrade: GradeSeries | null;
  readonly heading: string;
  readonly subheading: string;
  readonly background: EngravingCarouselBackground;
  readonly ctaLabel: string;
  readonly openCategory: string | null;
  readonly setOpenCategory: Dispatch<SetStateAction<string | null>>;
  readonly resolvedOpenCategory: string | null;
  readonly activeGradeId: string | null;
  readonly setActiveGradeId: Dispatch<SetStateAction<string | null>>;
  readonly enableTitleReveal: boolean;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

type EngravingGradesBodyProps = Readonly<{
  categories: EngravingCategory[];
  resolvedOpenCategory: string | null;
  activeGradeId: string | null;
  setOpenCategory: Dispatch<SetStateAction<string | null>>;
  setActiveGradeId: Dispatch<SetStateAction<string | null>>;
  selectedGrade: GradeSeries | null;
  ctaLabel: string;
}>;

const GRADE_TABS = [
  {
    label: "The Benchmark",
    order: ["Standard", "Lusso", "SC2"],
  },
  {
    label: "SC3",
    order: ["SC3", "SC3 Sideplates"],
  },
  {
    label: "SCO",
    order: ["SCO", "SCO Gold", "SCO Sideplates", "SCO Gold Sideplates"],
  },
  {
    label: "Extra",
    order: ["Extra", "Extra Gold", "Extra Super"],
  },
] as const;

const normalize = (value?: string | null) =>
  value
    ?.trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "") ?? "";

export function EngravingGradesCarousel({ grades, ui }: EngravingGradesCarouselProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const carouselKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const resolvedTabLabels =
    ui?.categoryLabels?.length === GRADE_TABS.length
      ? ui.categoryLabels
      : GRADE_TABS.map((tab) => tab.label);
  const tabs = GRADE_TABS.map((tab, index) => ({
    ...tab,
    label: resolvedTabLabels[index] ?? tab.label,
  }));

  const [openCategory, setOpenCategory] = useState<string | null>(tabs[0]?.label ?? null);
  const [activeGradeId, setActiveGradeId] = useState<string | null>(null);

  const analyticsRef = useAnalyticsObserver<HTMLElement>("EngravingGradesCarouselSeen");

  const heading = ui?.heading ?? "Engraving Grades";
  const subheading = ui?.subheading ?? "Commission tiers & engraving houses";
  const background = ui?.background ?? {
    id: "engraving-carousel-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg",
    alt: "Perazzi engraving workshop background",
  };
  const ctaLabel = ui?.ctaLabel ?? "View engraving";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  const gradeLookup = useMemo(() => {
    const map = new Map<string, GradeSeries>();
    grades.forEach((grade) => {
      map.set(normalize(grade.name), grade);
      map.set(normalize(grade.id), grade);
    });
    return map;
  }, [grades]);

  const groupedGrades = useMemo<GradeSeries[][]>(() => {
    return tabs.map((tab) =>
      tab
        .order
        .map((name) => gradeLookup.get(normalize(name)))
        .filter(Boolean) as GradeSeries[],
    );
  }, [gradeLookup, tabs]);

  const categories = useMemo<EngravingCategory[]>(() => {
    return tabs.map((tab, index) => {
      const resolved = groupedGrades[index] ?? [];
      return { label: tab.label, grades: resolved };
    }).filter((category) => category.grades.length);
  }, [groupedGrades, tabs]);

  const resolvedOpenCategory = useMemo(() => {
    if (!openCategory) return null;
    if (categories.some((category) => category.label === openCategory)) {
      return openCategory;
    }
    return categories[0]?.label ?? null;
  }, [categories, openCategory]);

  const resolvedActiveGradeId = useMemo(() => {
    if (activeGradeId) {
      const inCategories = categories.some((category) =>
        category.grades.some((grade) => grade.id === activeGradeId),
      );
      if (inCategories) return activeGradeId;
    }
    return categories[0]?.grades[0]?.id ?? null;
  }, [activeGradeId, categories]);

  const selectedGrade =
    grades.find((grade) => grade.id === resolvedActiveGradeId) ??
    categories[0]?.grades[0] ??
    grades[0] ??
    null;

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
      <EngravingGradesRevealSection
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
        activeGradeId={resolvedActiveGradeId}
        setActiveGradeId={setActiveGradeId}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}

const EngravingGradesRevealSection = ({
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
  onCollapsedChange,
}: EngravingRevealSectionProps) => {
  const [carouselExpanded, setCarouselExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);

  const revealCarousel = !enableTitleReveal || carouselExpanded;
  const revealPhotoFocus = revealCarousel;
  const carouselMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const {
    ref: carouselShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealCarousel,
    deps: [openCategory, activeGradeId],
  });

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setCarouselExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setCarouselExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <>
      <RevealExpandedHeader
        headingId="engraving-grades-heading"
        heading={heading}
        headerThemeReady={headerThemeReady}
        enableTitleReveal={enableTitleReveal}
        onCollapse={handleCollapse}
      >
        <div className="relative">
          <Text
            className={cn(
              "max-w-4xl type-section-subtitle",
              headerThemeReady ? "text-ink-muted" : "text-white",
            )}
            leading="normal"
          >
            {subheading}
          </Text>
        </div>
      </RevealExpandedHeader>
      <EngravingGradesBody
        categories={categories}
        resolvedOpenCategory={resolvedOpenCategory}
        activeGradeId={activeGradeId}
        setOpenCategory={setOpenCategory}
        setActiveGradeId={setActiveGradeId}
        selectedGrade={selectedGrade}
        ctaLabel={ctaLabel}
      />
    </>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealCarousel}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealCarousel}
        overlay="canvas-80"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={carouselShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={carouselMinHeight ?? undefined}
        >
          {revealCarousel ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="engraving-grades-heading"
                heading={heading}
                subheading={subheading}
                controlsId="engraving-grades-body"
                expanded={revealCarousel}
                onExpand={handleExpand}
              />
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
      </Container>
    </>
  );
};

const EngravingGradesBody = ({
  categories,
  resolvedOpenCategory,
  activeGradeId,
  setOpenCategory,
  setActiveGradeId,
  selectedGrade,
  ctaLabel,
}: EngravingGradesBodyProps) => (
  <div id="engraving-grades-body" className="space-y-6">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
      <div className="space-y-3 rounded-2xl bg-transparent p-4 sm:rounded-3xl sm:p-5">
        <Text size="label-tight" className="type-label-tight text-ink-muted" leading="normal">
          Grade categories
        </Text>
        <div className="space-y-3">
          {categories.map((category) => {
            const isOpen = resolvedOpenCategory === category.label;
            return (
              <div
                key={category.label}
                className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm sm:bg-card/75"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left type-label-tight text-ink focus-ring"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenCategory((prev) =>
                      prev === category.label ? null : category.label,
                    )
                  }
                >
                  {category.label}
                  <span
                    className={cn(
                      "text-lg",
                      isOpen ? "rotate-45" : "rotate-0",
                    )}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                {isOpen ? (
                  <div className="border-t border-border/70">
                    <ul className="space-y-1 p-3">
                      {category.grades.map((grade) => {
                        const isActive = grade.id === activeGradeId;
                        return (
                          <li key={grade.id}>
                            <button
                              type="button"
                              onClick={() => { setActiveGradeId(grade.id); }}
                              className={cn(
                                "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left focus-ring",
                                isActive
                                  ? "text-white"
                                  : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
                              )}
                              aria-pressed={isActive}
                            >
                              {isActive ? (
                                <span
                                  className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                  aria-hidden="true"
                                />
                              ) : null}
                              <span
                                className={cn(
                                  "relative z-10 block type-body-title text-base uppercase",
                                  isActive ? "text-white" : "text-ink-muted",
                                )}
                              >
                                {grade.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-104">
        {selectedGrade ? (
          <div key={selectedGrade.id}>
            <GradeCard grade={selectedGrade} ctaLabel={ctaLabel} />
          </div>
        ) : (
          <Text className="text-ink-muted" leading="normal">
            Select a grade to view details.
          </Text>
        )}
      </div>
    </div>
  </div>
);

type GradeCardProps = Readonly<{
  grade: GradeSeries;
  ctaLabel: string;
}>;

function GradeCard({ grade, ctaLabel }: GradeCardProps) {
  const heroAsset = grade.gallery?.[0];
  const ratio = heroAsset?.aspectRatio ?? 3 / 2;
  const gradeAnchor = getGradeAnchorId(grade);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-5 sm:shadow-elevated lg:p-6">
      <div
        className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
        style={{ "--aspect-ratio": ratio }}
      >
        {heroAsset ? (
          <Image
            src={heroAsset.url}
            alt={heroAsset.alt}
            fill
            sizes="(min-width: 1024px) 380px, 100vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <Text
            asChild
            className="flex h-full items-center justify-center text-ink-muted"
            leading="normal"
          >
            <div>Imagery coming soon</div>
          </Text>
        )}
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <Text size="label-tight" className="type-card-title text-perazzi-red" leading="normal">
          Engraving Grade
        </Text>
        <Heading
          level={3}
          size="md"
          className="type-body-title text-ink text-xl sm:text-2xl lg:text-3xl uppercase not-italic"
        >
          {grade.name}
        </Heading>
        <Text className="type-body text-ink-muted" leading="normal">
          {grade.description}
        </Text>
        <div className="mt-auto pt-2">
          <Link
            href={`/engravings?grade=${gradeAnchor}`}
            className="type-button inline-flex items-center justify-center gap-2 rounded-sm border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
          >
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
