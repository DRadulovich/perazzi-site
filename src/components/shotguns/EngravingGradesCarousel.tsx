"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useRef, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { homeMotion } from "@/lib/motionConfig";
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
  readonly motionEnabled: boolean;
  readonly sectionRef: RefObject<HTMLElement | null>;
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
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const motionEnabled = !prefersReducedMotion;
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
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
        motionEnabled={motionEnabled}
        sectionRef={analyticsRef}
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
  motionEnabled,
  sectionRef,
}: EngravingRevealSectionProps) => {
  const [carouselExpanded, setCarouselExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const carouselShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

  const revealCarousel = !enableTitleReveal || carouselExpanded;
  const revealPhotoFocus = revealCarousel;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealCarousel;
  const focusSurfaceTransition = "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition = "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition = "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const carouselReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const carouselRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const carouselCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const carouselBodyReveal = carouselReveal;
  const readMoreReveal = motionEnabled
    ? { duration: 0.5, ease: homeMotion.cinematicEase, delay: carouselReveal.duration }
    : undefined;
  const carouselLayoutTransition = motionEnabled ? { layout: carouselReveal } : undefined;
  const carouselMinHeight = enableTitleReveal ? "min-h-[calc(720px+18rem)]" : null;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", parallaxEnabled ? parallaxStrength : "0%"],
  );
  const parallaxStyle = parallaxEnabled ? { y: parallaxY } : undefined;
  const backgroundScale = parallaxEnabled ? 1.32 : 1;
  const backgroundScaleTransition = revealCarousel ? carouselReveal : carouselCollapse;

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setCarouselExpanded(true);
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    setCarouselExpanded(false);
  };

  const headingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.16 : 0 } },
  } as const;

  const headingItem = {
    hidden: { y: 14, filter: "blur(10px)" },
    show: { y: 0, filter: "blur(0px)", transition: carouselReveal },
  } as const;

  useEffect(() => {
    if (!enableTitleReveal || !revealCarousel) return;
    const node = carouselShellRef.current;
    if (!node) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!node) return;
        const nextHeight = Math.ceil(node.getBoundingClientRect().height);
        setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return () => { cancelAnimationFrame(frame); };
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enableTitleReveal, revealCarousel, openCategory, activeGradeId]);

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={parallaxStyle}
          initial={false}
          animate={motionEnabled ? { scale: backgroundScale } : undefined}
          transition={motionEnabled ? backgroundScaleTransition : undefined}
        >
          <Image
            src={background.url}
            alt={background.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </motion.div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealCarousel ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 film-grain",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-20" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute inset-0 overlay-gradient-canvas-80",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <Container size="xl" className="relative z-10">
        <motion.div
          ref={carouselShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            carouselMinHeight,
          )}
        >
          <LayoutGroup id="shotguns-engraving-title">
            <AnimatePresence initial={false}>
              {revealCarousel ? (
                <motion.div
                  key="engraving-grades-header"
                  className="relative z-10 space-y-4 md:flex md:items-start md:justify-between md:gap-8"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1, transition: carouselReveal } : undefined}
                  exit={motionEnabled ? { opacity: 0, transition: carouselRevealFast } : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                  >
                    <motion.div
                      layoutId="engraving-grades-title"
                      layoutCrossfade={false}
                      transition={carouselLayoutTransition}
                      className="relative"
                    >
                      <Heading
                        id="engraving-grades-heading"
                        level={2}
                        size="xl"
                        className={cn(
                          titleColorTransition,
                          headerThemeReady ? "text-ink" : "text-white",
                        )}
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <motion.div
                      layoutId="engraving-grades-subtitle"
                      layoutCrossfade={false}
                      transition={carouselLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headingItem}>
                        <Text
                          className={cn(
                            "max-w-4xl type-section-subtitle",
                            titleColorTransition,
                            headerThemeReady ? "text-ink-muted" : "text-white",
                          )}
                          leading="normal"
                        >
                          {subheading}
                        </Text>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  {enableTitleReveal ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleCollapse}
                    >
                      Collapse
                    </button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="engraving-grades-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : false}
                  animate={motionEnabled ? { opacity: 1, filter: "blur(0px)" } : undefined}
                  exit={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : undefined}
                  transition={motionEnabled ? carouselRevealFast : undefined}
                >
                  <motion.div
                    layoutId="engraving-grades-title"
                    layoutCrossfade={false}
                    transition={carouselLayoutTransition}
                    className="relative inline-flex text-white"
                  >
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
                  </motion.div>
                  <motion.div
                    layoutId="engraving-grades-subtitle"
                    layoutCrossfade={false}
                    transition={carouselLayoutTransition}
                    className="relative text-white"
                  >
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {subheading}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: carouselRevealFast } : undefined}
                    className="mt-3"
                  >
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleExpand}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {revealCarousel ? (
              <motion.div
                key="engraving-grades-body"
                id="engraving-grades-body"
                className="space-y-6"
                initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(12px)" } : false}
                animate={
                  motionEnabled
                    ? { opacity: 1, y: 0, filter: "blur(0px)", transition: carouselBodyReveal }
                    : undefined
                }
                exit={
                  motionEnabled
                    ? { opacity: 0, y: -16, filter: "blur(10px)", transition: carouselCollapse }
                    : undefined
                }
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                  <div className="space-y-3 rounded-2xl bg-transparent p-4 sm:rounded-3xl sm:p-5">
                    <Text size="label-tight" className="type-label-tight text-ink-muted" leading="normal">
                      Grade categories
                    </Text>
                    <LayoutGroup id="shotguns-engraving-grade-tabs">
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
                                    "text-lg transition-transform",
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
                                          <motion.button
                                            type="button"
                                            onClick={() => { setActiveGradeId(grade.id); }}
                                            className={cn(
                                              "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-colors focus-ring",
                                              isActive
                                                ? "text-white"
                                                : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
                                            )}
                                            aria-pressed={isActive}
                                            initial={false}
                                            whileHover={motionEnabled ? { x: 2, transition: homeMotion.micro } : undefined}
                                            whileTap={motionEnabled ? { x: 0, transition: homeMotion.micro } : undefined}
                                          >
                                            {isActive ? (
                                              motionEnabled ? (
                                                <motion.span
                                                  layoutId="engraving-grade-active-highlight"
                                                  className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                                  transition={homeMotion.springHighlight}
                                                  aria-hidden="true"
                                                />
                                              ) : (
                                                <span
                                                  className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                                  aria-hidden="true"
                                                />
                                              )
                                            ) : null}
                                            <span
                                              className={cn(
                                                "relative z-10 block type-body-title text-base uppercase",
                                                isActive ? "text-white" : "text-ink-muted",
                                              )}
                                            >
                                              {grade.name}
                                            </span>
                                          </motion.button>
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
                    </LayoutGroup>
                  </div>

                  <div className="min-h-[26rem]">
                    <AnimatePresence initial={false} mode="popLayout">
                      {selectedGrade ? (
                        <motion.div
                          key={selectedGrade.id}
                          initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={motionEnabled ? { opacity: 0, y: -14, filter: "blur(10px)" } : undefined}
                          transition={motionEnabled ? homeMotion.revealFast : undefined}
                        >
                          <GradeCard grade={selectedGrade} ctaLabel={ctaLabel} />
                        </motion.div>
                      ) : (
                        <Text className="text-ink-muted" leading="normal">
                          Select a grade to view details.
                        </Text>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
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
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
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
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
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
