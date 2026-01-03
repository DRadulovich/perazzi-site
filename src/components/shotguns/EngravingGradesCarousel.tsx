"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react";

import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Container, Heading, Text } from "@/components/ui";

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
};

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
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
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
}: EngravingRevealSectionProps) => {
  const [carouselExpanded, setCarouselExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const carouselShellRef = useRef<HTMLDivElement | null>(null);

  const revealCarousel = !enableTitleReveal || carouselExpanded;
  const revealPhotoFocus = revealCarousel;
  const carouselMinHeight = enableTitleReveal ? "min-h-[calc(720px+18rem)]" : null;

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    setCarouselExpanded(true);
    setHeaderThemeReady(true);
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setCarouselExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealCarousel) return;
    const node = carouselShellRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enableTitleReveal, revealCarousel, openCategory, activeGradeId]);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={background.url}
            alt={background.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            revealCarousel ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 overlay-gradient-canvas-80",
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <Container size="xl" className="relative z-10">
        <div
          ref={carouselShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            carouselMinHeight,
          )}
        >
          {revealCarousel ? (
            <div className="relative z-10 space-y-4 md:flex md:items-start md:justify-between md:gap-8">
              <div className="space-y-3">
                <div className="relative">
                  <Heading
                    id="engraving-grades-heading"
                    level={2}
                    size="xl"
                    className={headerThemeReady ? "text-ink" : "text-white"}
                  >
                    {heading}
                  </Heading>
                </div>
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
              </div>
              {enableTitleReveal ? (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
                  onClick={handleCollapse}
                >
                  Collapse
                </button>
              ) : null}
            </div>
          ) : (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative inline-flex text-white">
                <Heading
                  id="engraving-grades-heading"
                  level={2}
                  size="xl"
                  className="type-section-collapsed"
                >
                  {heading}
                </Heading>
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer focus-ring"
                  onPointerEnter={handleExpand}
                  onFocus={handleExpand}
                  onClick={handleExpand}
                  aria-expanded={revealCarousel}
                  aria-controls="engraving-grades-body"
                  aria-labelledby="engraving-grades-heading"
                >
                  <span className="sr-only">Expand {heading}</span>
                </button>
              </div>
              <div className="relative text-white">
                <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                  {subheading}
                </Text>
              </div>
              <div className="mt-3">
                <Text
                  size="button"
                  className="text-white/80 cursor-pointer focus-ring"
                  asChild
                >
                  <button type="button" onClick={handleExpand}>
                    Read more
                  </button>
                </Text>
              </div>
            </div>
          )}

          {revealCarousel ? (
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

                <div className="min-h-[26rem]">
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
          ) : null}
        </div>
      </Container>
    </>
  );
};

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
        className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)] aspect-dynamic"
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
