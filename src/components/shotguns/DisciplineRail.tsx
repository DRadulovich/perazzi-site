"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { Container, Heading, Text } from "@/components/ui";

type DisciplineCard = ShotgunsLandingData["disciplines"][number];

type ModelDetail = {
  id: string;
  name: string;
  version?: string;
  platform?: string;
  use?: string;
  grade?: string;
  gaugeNames?: string[];
  triggerTypes?: string[];
  triggerSprings?: string[];
  ribTypes?: string[];
  ribStyles?: string[];
  imageUrl?: string;
  imageAlt?: string;
};

type DisciplineRailProps = Readonly<{
  disciplines: readonly DisciplineCard[];
  platforms: readonly Platform[];
  ui?: ShotgunsLandingData["disciplineRailUi"];
}>;

const DISCIPLINE_TABS = [
  {
    label: "American Disciplines",
    items: [
      ["sporting-disciplines", "sporting"],
      ["american-trap", "trap"],
      ["american-skeet", "skeet"],
    ],
  },
  {
    label: "Olympic Disciplines",
    items: [
      ["olympic-skeet"],
      ["olympic-trap"],
    ],
  },
  {
    label: "Live Game",
    items: [
      ["pigeons-helice"],
      ["game", "game-shooting"],
    ],
  },
] as const;

type DisciplineCategory = {
  label: string;
  disciplines: DisciplineCard[];
};

type DisciplineRailBackground = NonNullable<
  NonNullable<ShotgunsLandingData["disciplineRailUi"]>["background"]
>;

type DisciplineRailRevealSectionProps = {
  readonly categories: DisciplineCategory[];
  readonly selectedDiscipline: DisciplineCard | null;
  readonly heading: string;
  readonly subheading: string;
  readonly background: DisciplineRailBackground;
  readonly openCategory: string | null;
  readonly setOpenCategory: Dispatch<SetStateAction<string | null>>;
  readonly activeDisciplineId: string | null;
  readonly setActiveDisciplineId: Dispatch<SetStateAction<string | null>>;
  readonly platformName: (id: string) => string;
  readonly handleModelSelect: (id: string) => void;
  readonly modelLoadingId: string | null;
  readonly enableTitleReveal: boolean;
  readonly motionEnabled: boolean;
  readonly sectionRef: RefObject<HTMLElement | null>;
};

export function DisciplineRail({
  disciplines,
  platforms,
  ui,
}: DisciplineRailProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
  const railAnalyticsRef = useAnalyticsObserver<HTMLElement>("DisciplineRailSeen");

  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelModalPresent, setModelModalPresent] = useState(false);
  const [modelLoadingId, setModelLoadingId] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(DISCIPLINE_TABS[0]?.label ?? null);
  const [activeDisciplineId, setActiveDisciplineId] = useState<string | null>(null);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const modelRequestRef = useRef<AbortController | null>(null);
  const railKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  useEffect(() => {
    if (typeof document === "undefined") return;
    setModalRoot(document.body);
  }, []);

  const platformName = (platformId: string) =>
    platforms.find((platform) => platform.id === platformId)?.name ??
    platformId.replace("platform-", "").toUpperCase();

  const handleModelSelect = async (modelId: string) => {
    if (!modelId) return;
    modelRequestRef.current?.abort();
    const controller = new AbortController();
    modelRequestRef.current = controller;
    setModelLoadingId(modelId);
    setModelError(null);
    try {
      const response = await fetch(`/api/models/${modelId}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Unable to load model details.");
      }
      const data = (await response.json()) as ModelDetail;
      if (controller.signal.aborted) return;
      setSelectedModel(data);
      setModelModalOpen(true);
      setModelModalPresent(true);
    } catch (error) {
      if (controller.signal.aborted) return;
      setModelError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      if (modelRequestRef.current === controller) {
        setModelLoadingId(null);
        modelRequestRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!modelModalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModelModalOpen(false);
    };
    if (typeof globalThis.addEventListener !== "function" || typeof globalThis.removeEventListener !== "function") {
      return;
    }
    globalThis.addEventListener("keydown", handleKey);
    return () => { globalThis.removeEventListener("keydown", handleKey); };
  }, [modelModalOpen]);

  useEffect(() => {
    if (!modelModalPresent) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modelModalPresent]);

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
  const background = ui?.background ?? {
    id: "discipline-rail-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg",
    alt: "Perazzi discipline background",
  };

  return (
    <section
      ref={railAnalyticsRef}
      data-analytics-id="DisciplineRailSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
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
        motionEnabled={motionEnabled}
        sectionRef={railAnalyticsRef}
      />

      {modalRoot
        ? createPortal(
            <AnimatePresence
              onExitComplete={() => {
                if (!modelModalOpen) setModelModalPresent(false);
              }}
            >
              {modelModalOpen && selectedModel ? (
                <motion.div
                  className="fixed inset-0 z-80 flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={motionEnabled ? { opacity: 0 } : undefined}
                  transition={motionEnabled ? homeMotion.revealFast : undefined}
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
                  <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
                  <button
                    type="button"
                    className="absolute inset-0 z-0 cursor-default border-0 bg-transparent"
                    aria-label="Close modal"
                    onClick={() => { setModelModalOpen(false); }}
                  />
                  <motion.div
                    className="relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/12 bg-perazzi-black/90 text-white shadow-elevated ring-1 ring-white/15 backdrop-blur-xl"
                    initial={
                      motionEnabled
                        ? { opacity: 0, y: 18, scale: 0.985, filter: "blur(14px)" }
                        : false
                    }
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={motionEnabled ? { opacity: 0, y: 18, scale: 0.985, filter: "blur(14px)" } : undefined}
                    transition={motionEnabled ? homeMotion.revealFast : undefined}
                  >
                    <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
                    <button
                      type="button"
                      className="type-button absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-white shadow-soft backdrop-blur-sm transition hover:border-white/30 hover:bg-black/55 focus-ring sm:right-5 sm:top-5"
                      onClick={() => setModelModalOpen(false)}
                    >
                      Close
                    </button>

                    <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[3fr,1.6fr]">
                      <div className="group card-media relative aspect-16/10 w-full overflow-hidden rounded-3xl bg-white">
                        {selectedModel.imageUrl ? (
                          <Image
                            src={selectedModel.imageUrl}
                            alt={selectedModel.imageAlt || selectedModel.name}
                            fill
                            className="object-contain bg-white transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                            sizes="(min-width: 1024px) 70vw, 100vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-600">No Image Available</div>
                        )}
                        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                        <div className="absolute inset-x-0 bottom-6 flex flex-col gap-2 px-6 text-black">
                          <Text size="label-tight" className="text-perazzi-red">
                            {selectedModel.grade}
                          </Text>
                          <Heading
                            level={2}
                            size="xl"
                            className="text-black"
                          >
                            {selectedModel.name}
                          </Heading>
                          <Text size="sm" className="text-black/70">
                            {selectedModel.use}
                          </Text>
                        </div>
                      </div>
                      <div className="grid gap-4 rounded-3xl border border-white/12 bg-black/35 p-4 shadow-soft ring-1 ring-white/10 backdrop-blur-sm sm:p-6 sm:grid-cols-2 lg:grid-cols-3">
                        <Detail label="Platform" value={selectedModel.platform} />
                        <Detail label="Gauge" value={selectedModel.gaugeNames?.join(", ")} />
                        <Detail label="Trigger Type" value={selectedModel.triggerTypes?.join(", ")} />
                        <Detail label="Trigger Springs" value={selectedModel.triggerSprings?.join(", ")} />
                        <Detail label="Rib Type" value={selectedModel.ribTypes?.join(", ")} />
                        <Detail label="Rib Style" value={selectedModel.ribStyles?.join(", ")} />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            modalRoot,
          )
        : null}

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

const DisciplineRailRevealSection = ({
  categories,
  selectedDiscipline,
  heading,
  subheading,
  background,
  openCategory,
  setOpenCategory,
  activeDisciplineId,
  setActiveDisciplineId,
  platformName,
  handleModelSelect,
  modelLoadingId,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: DisciplineRailRevealSectionProps) => {
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const railShellRef = useRef<HTMLDivElement | null>(null);
  const railContentRef = useRef<HTMLDivElement | null>(null);
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

  const revealRail = phase === "expanded" || phase === "closingHold";
  const revealPhotoFocus = revealRail;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealRail && motionEnabled;
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
  const railLayoutTransition = motionEnabled
    ? {
        layout: {
          duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
          ease: EASE_CINEMATIC,
        },
      }
    : undefined;
  const railMinHeight = enableTitleReveal ? "min-h-[calc(600px+12rem)]" : null;
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
  const glassStyle = {
    ...(enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : {}),
    ...focusSurfaceStyle,
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

  const listStagger = motionEnabled ? 0.1 : 0;
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

  useEffect(() => {
    if (!enableTitleReveal || !revealRail) return;
    const node = railShellRef.current;
    if (!node) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!node) return;
        const contentNode = railContentRef.current;
        const contentHeight = contentNode?.getBoundingClientRect().height ?? node.getBoundingClientRect().height;
        const styles = window.getComputedStyle(node);
        const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
        const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
        const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
        const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;
        const nextHeight = Math.ceil(contentHeight + paddingTop + paddingBottom + borderTop + borderBottom);
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
  }, [enableTitleReveal, revealRail, openCategory, activeDisciplineId]);

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
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
        </motion.div>
      </motion.div>

      <Container size="xl" className="relative z-10">
        <motion.div
          ref={railShellRef}
          style={glassStyle}
          className={cn(
            "relative rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            railMinHeight,
          )}
          variants={slotVariants.glass}
          onKeyDown={onEscapeKeyDown}
        >
          <div ref={railContentRef} className="flex flex-col space-y-6">
            <LayoutGroup id="shotguns-discipline-rail-title">
              {showExpanded ? (
                <motion.div
                  key="discipline-rail-header"
                  className="relative z-10 space-y-4 md:flex md:items-start md:justify-between md:gap-8"
                  variants={slotContext}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  <motion.div className="space-y-3" variants={headerGroup}>
                    <motion.div
                      layoutId="discipline-rail-title"
                      layoutCrossfade={false}
                      transition={railLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headerItem}>
                        <Heading
                          id="discipline-rail-heading"
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
                      layoutId="discipline-rail-subtitle"
                      layoutCrossfade={false}
                      transition={railLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headerItem}>
                        <Text
                          size="lg"
                          className={cn(
                            "type-section-subtitle",
                            titleColorTransition,
                            headerThemeReady ? "text-ink-muted" : "text-white",
                          )}
                          style={titleColorStyle}
                        >
                          {subheading}
                        </Text>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  <motion.button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                    onClick={handleCollapse}
                    variants={surfaceItem}
                  >
                    Collapse
                  </motion.button>
                </motion.div>
              ) : null}
              {showCollapsed ? (
                <motion.div
                  key="discipline-rail-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  variants={slotContext}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                    <motion.div
                      layoutId="discipline-rail-title"
                      layoutCrossfade={false}
                      transition={railLayoutTransition}
                      className="relative inline-flex text-white"
                    >
                      <motion.div variants={collapsedHeaderItem}>
                        <Heading
                          id="discipline-rail-heading"
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
                        aria-controls="discipline-rail-body"
                        aria-labelledby="discipline-rail-heading"
                      >
                        <span className="sr-only">Expand {heading}</span>
                      </button>
                    </motion.div>
                    <motion.div
                      layoutId="discipline-rail-subtitle"
                      layoutCrossfade={false}
                      transition={railLayoutTransition}
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
                  key="discipline-rail-body"
                  id="discipline-rail-body"
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
                      className="space-y-3 rounded-2xl bg-card/0 p-4 sm:rounded-3xl sm:p-5"
                      variants={bodyItem}
                    >
                      <motion.div variants={bodyItem}>
                        <Text size="label-tight" className="type-label-tight text-ink-muted">
                          Discipline categories
                        </Text>
                      </motion.div>
                      <LayoutGroup id="shotguns-discipline-tabs">
                        <motion.div
                          className="space-y-3"
                          variants={listContainer}
                          initial={motionEnabled ? "hidden" : false}
                          animate={motionEnabled ? "show" : undefined}
                        >
                          {categories.map((category) => {
                            const isOpen = openCategory === category.label;
                            return (
                              <motion.div
                                key={category.label}
                                className="rounded-2xl border border-border/70 bg-card/75"
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
                                      key={`${category.label}-nested`}
                                      className="space-y-1 border-t border-border/70 p-3"
                                      variants={nestedList}
                                      initial={motionEnabled ? "hidden" : false}
                                      animate={motionEnabled ? "show" : undefined}
                                      exit="exit"
                                    >
                                      {category.disciplines.map((discipline) => {
                                        const isActive = discipline.id === activeDisciplineId;
                                        return (
                                          <motion.li key={discipline.id} variants={nestedItem}>
                                            <motion.button
                                              type="button"
                                              onClick={() => { setActiveDisciplineId(discipline.id); }}
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
                                                    layoutId="discipline-active-highlight"
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
                                                  "relative z-10 mt-0.5 block type-label-tight group-hover:text-ink-muted/90",
                                                  isActive ? "text-white" : "text-ink-muted",
                                                )}
                                              >
                                                {discipline.name || discipline.id.replaceAll("-", " ")}
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
                        {selectedDiscipline ? (
                          <motion.div
                            key={selectedDiscipline.id}
                            initial={motionEnabled ? { opacity: 0, y: 14 } : false}
                            animate={motionEnabled ? { opacity: 1, y: 0 } : undefined}
                            exit={motionEnabled ? { opacity: 0, y: -14 } : undefined}
                            transition={motionEnabled ? homeMotion.revealFast : undefined}
                          >
                            <DisciplineCard
                              discipline={selectedDiscipline}
                              index={0}
                              total={1}
                              platformName={platformName}
                              onSelectModel={handleModelSelect}
                              loadingModelId={modelLoadingId}
                            />
                          </motion.div>
                        ) : (
                          <Text className="text-ink-muted" leading="normal">
                            Select a discipline to view its details.
                          </Text>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </motion.div>
  );
};

type DisciplineCardProps = Readonly<{
  discipline: ShotgunsLandingData["disciplines"][number];
  index: number;
  total: number;
  platformName: (id: string) => string;
  onSelectModel: (id: string) => void;
  loadingModelId: string | null;
}>;

function DisciplineCard({
  discipline,
  index,
  total,
  platformName,
  onSelectModel,
  loadingModelId,
}: DisciplineCardProps) {
  const cardRef = useAnalyticsObserver<HTMLDivElement>(
    `shotguns_discipline_card_impression:${discipline.id}`,
    { threshold: 0.4 },
  );
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
    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const cardBlock = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
  } as const;

  const cardList = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.08 : 0,
        delayChildren: motionEnabled ? 0.05 : 0,
      },
    },
  } as const;

  const cardListItem = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
  } as const;

  return (
    <motion.article
      ref={cardRef}
      data-analytics-id={`DisciplineChip:${discipline.id}`}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card/60 text-left shadow-soft backdrop-blur-sm focus-ring sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
      aria-label={`Slide ${index + 1} of ${total}: ${discipline.name}`}
      variants={cardContainer}
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "show" : undefined}
    >
      <motion.div
        className="card-media relative aspect-30/11 w-full rounded-t-3xl bg-(--color-canvas)"
        variants={cardMedia}
      >
        {discipline.hero ? (
          <Image
            src={discipline.hero.url}
            alt={discipline.hero.alt}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
      </motion.div>
      <motion.div className="flex flex-1 flex-col gap-6 p-6" variants={cardContent}>
        <motion.div variants={cardTextItem}>
          <Heading
            level={3}
            className="type-card-title text-ink border-b border-perazzi-red/40 pb-2"
          >
            {discipline.name}
          </Heading>
        </motion.div>
        {discipline.overviewPortableText?.length ? (
          <motion.div variants={cardTextItem}>
            <PortableText
              className="max-w-none type-body text-ink-muted mb-7"
              blocks={discipline.overviewPortableText}
            />
          </motion.div>
        ) : discipline.overviewHtml ? (
          <motion.div variants={cardTextItem}>
            <SafeHtml
              className="max-w-none type-body text-ink-muted mb-7"
              html={discipline.overviewHtml}
            />
          </motion.div>
        ) : null}
        {discipline.recommendedPlatforms?.length ? (
          <motion.div className="space-y-2 mb-7" variants={cardBlock}>
            <Text size="label-tight" className="type-card-title text-ink-muted">
              Recommended platforms
            </Text>
            <motion.ul className="flex flex-wrap gap-2" variants={cardList}>
              {discipline.recommendedPlatforms.map((platformId) => (
                <motion.li
                  key={platformId}
                  className="pill border border-border type-label-tight text-ink-muted"
                  variants={cardListItem}
                >
                  {platformName(platformId)}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        ) : null}
        {discipline.popularModels?.length ? (
          <motion.div className="mt-auto flex flex-col gap-3" variants={cardBlock}>
            <Text size="label-tight" className="type-card-title text-ink-muted">
              Most Popular Models
            </Text>
            <motion.div className="flex flex-col gap-3" variants={cardList}>
              {discipline.popularModels.map((model) => (
                <motion.button
                  type="button"
                  key={model.idLegacy ?? model.id}
                  onClick={() => { onSelectModel(model.idLegacy ?? model.id); }}
                  className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                  variants={cardListItem}
                >
                  {model.hero ? (
                    <Image
                      src={model.hero.url}
                      alt={model.hero.alt}
                      width={800}
                      height={600}
                      className="w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      sizes="(min-width: 1024px) 320px, 100vw"
                    />
                  ) : null}
                  <span className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                  <div className="pointer-events-none absolute inset-0 bg-perazzi-black/75 transition duration-500 group-hover:bg-perazzi-black/60" />
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center p-2 text-center type-card-title text-white text-xl sm:text-2xl lg:text-3xl transition-opacity duration-500 group-hover:opacity-0",
                    )}
                  >
                    {loadingModelId === (model.idLegacy ?? model.id) ? "Loading…" : model.name || "Untitled"}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </motion.div>
    </motion.article>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value?: string }>) {
  return (
    <div>
      <Text size="label-tight" className="text-perazzi-red">
        {label}
      </Text>
      <Text size="sm" className="text-white">
        {value || "—"}
      </Text>
    </div>
  );
}
