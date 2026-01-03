"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useRef, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { homeMotion } from "@/lib/motionConfig";
import {
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  EASE_CINEMATIC,
  EXPANDED_HEADER_REVEAL_MS,
  EXPAND_TIME_SCALE,
  GLASS_REVEAL_MS,
  LIST_REVEAL_MS,
  STAGGER_BODY_ITEMS_MS,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";
import { createExpandableSectionVariants } from "@/motion/createExpandableSectionVariants";
import { useExpandableSectionTimeline } from "@/motion/useExpandableSectionTimeline";
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
  setOpenCategory,
  resolvedOpenCategory,
  activeGradeId,
  setActiveGradeId,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: EngravingRevealSectionProps) => {
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const headerThemeFrame = useRef<number | null>(null);
  const {
    expanded,
    phase,
    open,
    close,
    onTriggerKeyDown,
    onEscapeKeyDown,
    showExpanded,
    showCollapsed,
  } = useExpandableSectionTimeline({ defaultExpanded: false });

  const revealCarousel = phase === "expanded" || phase === "closingHold";
  const isCollapsedPhase = phase === "collapsed" || phase === "prezoom";
  const revealPhotoFocus = revealCarousel;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealCarousel && motionEnabled;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter]";
  const titleColorTransition = "transition-colors";
  const cinematicBezier = `cubic-bezier(${EASE_CINEMATIC.join(",")})`;
  const transitionStyle = (durationMs: number) => ({
    transitionDuration: `${motionEnabled ? Math.round(durationMs * EXPAND_TIME_SCALE) : 0}ms`,
    transitionTimingFunction: motionEnabled ? cinematicBezier : "linear",
  });
  const focusSurfaceStyle = transitionStyle(GLASS_REVEAL_MS);
  const titleColorStyle = transitionStyle(EXPANDED_HEADER_REVEAL_MS);
  const carouselLayoutTransition = motionEnabled
    ? {
        layout: {
          duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
          ease: EASE_CINEMATIC,
        },
      }
    : undefined;
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
  const toSeconds = (ms: number) => ms / 1000;
  const staggerTransition = (staggerMs: number, direction?: 1 | -1) => ({
    transition: {
      staggerChildren: motionEnabled ? toSeconds(staggerMs) : 0,
      staggerDirection: direction,
    },
  });
  const headerGroup = {
    collapsed: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    expanded: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
  } as const;
  const bodyGroup = {
    collapsed: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_BODY_ITEMS_MS),
    expanded: staggerTransition(STAGGER_BODY_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
  } as const;
  const itemsGroup = {
    collapsed: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_LIST_ITEMS_MS),
    expanded: staggerTransition(STAGGER_LIST_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
  } as const;
  const slotVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    backgroundScale: { collapsed: 1.32, prezoom: 1.12, expanded: 1 },
    itemOffsetY: 12,
    blurPx: 8,
    glassScale: 0.985,
  });
  const surfaceVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    itemOffsetY: 12,
    blurPx: 0,
    glassScale: 0.985,
  });
  const scrimInverted = {
    collapsed: slotVariants.scrimTop.expanded,
    prezoom: slotVariants.scrimTop.expanded,
    expanded: slotVariants.scrimTop.collapsed,
    closingHold: slotVariants.scrimTop.collapsed,
  } as const;
  const slotContext = {
    collapsed: {},
    prezoom: {},
    expanded: {},
    closingHold: {},
  } as const;
  const headerItem = slotVariants.expandedHeader;
  const collapsedHeaderItem = slotVariants.collapsedHeader;
  const bodyItem = slotVariants.content;
  const surfaceItem = surfaceVariants.content;
  const containerLayoutTransition = {
    layout: {
      duration: motionEnabled
        ? (CONTAINER_EXPAND_MS / 1000) * (isCollapsedPhase ? COLLAPSE_TIME_SCALE : EXPAND_TIME_SCALE)
        : 0,
      ease: EASE_CINEMATIC,
    },
  };
  const glassStyle = {
    ...focusSurfaceStyle,
    height: isCollapsedPhase ? "40vh" : "auto",
    overflow: isCollapsedPhase ? "hidden" : "visible",
  };

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    open();
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
    close();
  };

  const listStagger = motionEnabled ? 0.25 : 0;
  const nestedStagger = motionEnabled ? 0.08 : 0;
  const listExitDuration = (LIST_REVEAL_MS / 1000) * COLLAPSE_TIME_SCALE;
  const exitTransition = {
    duration: motionEnabled ? listExitDuration : 0,
    ease: EASE_CINEMATIC,
  };

  const listContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: listStagger,
        delayChildren: motionEnabled ? 0.06 : 0,
      },
    },
  } as const;

  const listItem = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
  } as const;

  const nestedList = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: nestedStagger,
        delayChildren: motionEnabled ? 0.04 : 0,
      },
    },
    exit: {
      transition: {
        staggerChildren: motionEnabled ? toSeconds(STAGGER_LIST_ITEMS_MS) * COLLAPSE_TIME_SCALE : 0,
        staggerDirection: -1,
      },
    },
  } as const;

  const nestedItem = motionEnabled
    ? {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
        exit: { opacity: 0, y: -6, transition: exitTransition },
      }
    : {
        hidden: { opacity: 0 },
        show: { opacity: 1 },
        exit: { opacity: 0, transition: exitTransition },
      };

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <motion.div
      variants={slotContext}
      initial={motionEnabled ? "collapsed" : false}
      animate={phase}
    >
      <motion.div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute inset-0" variants={slotVariants.background}>
          <motion.div className="absolute inset-0 will-change-transform" style={parallaxStyle}>
            <Image
              src={background.url}
              alt={background.alt}
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" variants={scrimInverted}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0 pointer-events-none" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        </motion.div>
        <motion.div className="absolute inset-0 pointer-events-none" variants={slotVariants.scrimBottom}>
          <div className="absolute inset-0 overlay-gradient-canvas-80" aria-hidden />
        </motion.div>
      </motion.div>

      <Container size="xl" className="relative z-10">
        <motion.div
          style={glassStyle}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
          )}
          variants={slotVariants.glass}
          onKeyDown={onEscapeKeyDown}
          layout
          transition={containerLayoutTransition}
        >
          <LayoutGroup id="shotguns-engraving-title">
            {showExpanded ? (
              <motion.div
                key="engraving-grades-header"
                className="relative z-10 space-y-4 md:flex md:items-start md:justify-between md:gap-8"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-3" variants={headerGroup}>
                  <motion.div
                    layoutId="engraving-grades-title"
                    layoutCrossfade={false}
                    transition={carouselLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={headerItem}>
                      <Heading
                        id="engraving-grades-heading"
                        level={2}
                        size="xl"
                        className={cn(
                          titleColorTransition,
                          headerThemeReady ? "text-ink" : "text-white",
                        )}
                        style={titleColorStyle}
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    layoutId="engraving-grades-subtitle"
                    layoutCrossfade={false}
                    transition={carouselLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={headerItem}>
                      <Text
                        className={cn(
                          "max-w-4xl type-section-subtitle",
                          titleColorTransition,
                          headerThemeReady ? "text-ink-muted" : "text-white",
                        )}
                        style={titleColorStyle}
                        leading="normal"
                      >
                        {subheading}
                      </Text>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div variants={surfaceItem}>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                    onClick={handleCollapse}
                  >
                    Collapse
                  </button>
                </motion.div>
              </motion.div>
            ) : null}
            {showCollapsed ? (
              <motion.div
                key="engraving-grades-collapsed"
                className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                  <motion.div
                    layoutId="engraving-grades-title"
                    layoutCrossfade={false}
                    transition={carouselLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Heading
                        id="engraving-grades-heading"
                        level={2}
                        size="xl"
                        className="type-section-collapsed"
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onFocus={handleExpand}
                      onClick={handleExpand}
                      onKeyDown={onTriggerKeyDown}
                      aria-expanded={expanded}
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
                    <motion.div variants={collapsedHeaderItem}>
                      <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                        {subheading}
                      </Text>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div variants={itemsGroup} className="mt-3">
                  <motion.div variants={collapsedHeaderItem}>
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleExpand} onKeyDown={onTriggerKeyDown}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </LayoutGroup>

          <motion.div
            variants={slotContext}
            initial={motionEnabled ? "collapsed" : false}
            animate={phase}
          >
            {showExpanded ? (
              <motion.div
                key="engraving-grades-body"
                id="engraving-grades-body"
                className="space-y-6"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div
                  className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start"
                  variants={bodyGroup}
                >
                  <motion.div
                    className="space-y-3 rounded-2xl bg-transparent p-4 sm:rounded-3xl sm:p-5"
                    variants={bodyItem}
                  >
                    <Text size="label-tight" className="type-label-tight text-ink-muted" leading="normal">
                      Grade categories
                    </Text>
                    <LayoutGroup id="shotguns-engraving-grade-tabs">
                      <motion.div className="space-y-3" variants={listContainer}>
                        {categories.map((category) => {
                          const isOpen = resolvedOpenCategory === category.label;
                          return (
                            <motion.div
                              key={category.label}
                              className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm sm:bg-card/75"
                              variants={listItem}
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
                              <AnimatePresence initial={false}>
                                {isOpen ? (
                                  <motion.ul
                                    className="space-y-1 border-t border-border/70 p-3"
                                    variants={nestedList}
                                    initial={motionEnabled ? "hidden" : false}
                                    animate={motionEnabled ? "show" : undefined}
                                    exit="exit"
                                  >
                                    {category.grades.map((grade) => {
                                      const isActive = grade.id === activeGradeId;
                                      return (
                                        <motion.li key={grade.id} variants={nestedItem}>
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
                                        </motion.li>
                                      );
                                    })}
                                  </motion.ul>
                                ) : null}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </LayoutGroup>
                  </motion.div>

                  <motion.div className="min-h-104" variants={bodyItem}>
                    <AnimatePresence initial={false} mode="popLayout">
                      {selectedGrade ? (
                        <motion.div
                          key={selectedGrade.id}
                          initial={motionEnabled ? { opacity: 0, y: 14 } : false}
                          animate={motionEnabled ? { opacity: 1, y: 0 } : undefined}
                          exit={motionEnabled ? { opacity: 0, y: -14 } : undefined}
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
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      </Container>
    </motion.div>
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
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  const cardContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.12 : 0,
      },
    },
  } as const;

  const cardMedia = {
    hidden: { opacity: 0, scale: 1.02 },
    show: { opacity: 1, scale: 1, transition: homeMotion.revealFast },
  } as const;

  const cardContent = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.1 : 0,
        delayChildren: motionEnabled ? 0.08 : 0,
      },
    },
  } as const;

  const cardTextItem = {
    hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const cardBlock = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
  } as const;

  return (
    <motion.article
      className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-5 sm:shadow-elevated lg:p-6"
      variants={cardContainer}
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "show" : undefined}
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
        style={{ "--aspect-ratio": ratio }}
        variants={cardMedia}
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
      </motion.div>
      <motion.div className="mt-4 flex flex-1 flex-col gap-3" variants={cardContent}>
        <motion.div variants={cardTextItem}>
          <Text size="label-tight" className="type-card-title text-perazzi-red" leading="normal">
            Engraving Grade
          </Text>
        </motion.div>
        <motion.div variants={cardTextItem}>
          <Heading
            level={3}
            size="md"
            className="type-body-title text-ink text-xl sm:text-2xl lg:text-3xl uppercase not-italic"
          >
            {grade.name}
          </Heading>
        </motion.div>
        <motion.div variants={cardTextItem}>
          <Text className="type-body text-ink-muted" leading="normal">
            {grade.description}
          </Text>
        </motion.div>
        <motion.div className="mt-auto pt-2" variants={cardBlock}>
          <Link
            href={`/engravings?grade=${gradeAnchor}`}
            className="type-button inline-flex items-center justify-center gap-2 rounded-sm border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
          >
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </motion.div>
    </motion.article>
  );
}
