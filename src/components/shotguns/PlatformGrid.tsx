"use client";

import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll } from "framer-motion";
import { useMemo, useState, useRef, useEffect, useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { homeMotion } from "@/lib/motionConfig";
import {
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  EASE_CINEMATIC,
  EXPAND_TIME_SCALE,
  STAGGER_BODY_ITEMS_MS,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";
import { createExpandableSectionVariants } from "@/motion/createExpandableSectionVariants";
import {
  buildGlassToneVariants,
  buildTitleToneVariants,
  mergeVariants,
} from "@/motion/expandableSectionTone";
import { useExpandableSectionTimeline } from "@/motion/useExpandableSectionTimeline";
import { useParallaxMotion } from "@/motion/useParallaxMotion";
import { ExpandableTextReveal } from "@/components/motion/ExpandableTextReveal";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type PlatformGridProps = {
  readonly platforms: Platform[];
  readonly ui?: ShotgunsLandingData["platformGridUi"];
};

const defaultChatPayloadTemplate =
  "Help me understand the {platformName} platform and which model configurations I should start from.";

type PlatformBackground = NonNullable<NonNullable<ShotgunsLandingData["platformGridUi"]>["background"]>;
type TemplateConfig = {
  heading: string;
  subheading: string;
  background: PlatformBackground;
  chatLabelTemplate: string;
  chatPayloadTemplate?: string;
  cardFooterTemplate: string;
};

const preferredOrder = ["ht", "mx", "tm", "dc", "sho"];
const defaultBackground: PlatformBackground = {
  id: "platform-grid-bg",
  kind: "image",
  url: "/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg",
  alt: "Perazzi workshop background for platform section",
};

const formatTemplate = (template: string, platformName: string) =>
  template.replaceAll("{platformName}", platformName);

const normalizeTemplate = (value?: string) => value?.trim() ?? "";

const buildTemplates = (ui?: ShotgunsLandingData["platformGridUi"]): TemplateConfig => {
  const normalizedChatLabel = normalizeTemplate(ui?.chatLabelTemplate);
  const normalizedChatPayload = normalizeTemplate(ui?.chatPayloadTemplate);
  const normalizedFooter = normalizeTemplate(ui?.cardFooterTemplate);

  return {
    heading: ui?.heading ?? "Platforms & Lineages",
    subheading:
      ui?.subheading ??
      "Explore the MX, HT, and TM Platforms and learn how each carry a different balance, design philosophy, and place on the line.",
    background: ui?.background ?? defaultBackground,
    chatLabelTemplate: normalizedChatLabel || "Ask about {platformName}",
    chatPayloadTemplate: normalizedChatPayload || undefined,
    cardFooterTemplate: normalizedFooter || "Explore the {platformName} lineage",
  };
};

const orderPlatforms = (platforms: readonly Platform[]): Platform[] => {
  const lookup = new Map(platforms.map((platform) => [platform.slug.toLowerCase(), platform]));

  const inOrder = preferredOrder.map((slug) => lookup.get(slug)).filter(Boolean) as Platform[];
  const remaining = platforms.filter((platform) => !lookup.has(platform.slug.toLowerCase()));

  return [...inOrder, ...remaining];
};

const getClosestCardIndex = (container: HTMLDivElement) => {
  const containerCenter = container.scrollLeft + container.clientWidth / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  container.querySelectorAll<HTMLDivElement>("[data-index]").forEach((card) => {
    const cardCenter = card.offsetLeft + card.clientWidth / 2;
    const distance = Math.abs(cardCenter - containerCenter);
    const indexAttr = card.dataset.index;
    const index = indexAttr ? Number(indexAttr) : Number.NaN;

    if (!Number.isNaN(index) && distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const scrollToIndex = (
  container: HTMLDivElement | null,
  index: number,
  behavior: ScrollBehavior,
) => {
  if (!container) return;

  const target = container.querySelector<HTMLDivElement>(`[data-index="${index}"]`);
  if (!target) return;
  const offset = target.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
  container.scrollTo({ left: offset, behavior });
};

const createPayloadBuilder =
  (chatPayloadTemplate?: string) =>
  (platform: Platform): ChatTriggerPayload => {
    const basePayload = buildPlatformPrompt(platform.slug);
    if (chatPayloadTemplate && chatPayloadTemplate !== defaultChatPayloadTemplate) {
      return {
        question: formatTemplate(chatPayloadTemplate, platform.name),
        context: basePayload.context,
      };
    }
    return basePayload;
  };

const PlatformTabs = ({
  platforms,
  activeIndex,
  onSelect,
  motionEnabled,
}: {
  readonly platforms: readonly Platform[];
  readonly activeIndex: number;
  onSelect: (index: number) => void;
  motionEnabled: boolean;
}) => {
  const tabListVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.27 : 0,
        delayChildren: motionEnabled ? 0.25 : 0,
      },
    },
  } as const;

  const tabItemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
  } as const;

  return (
    <LayoutGroup id="shotguns-platform-tabs">
      <motion.div
        role="tablist"
        aria-label="Platforms"
        className="flex flex-wrap gap-2"
        variants={motionEnabled ? tabListVariants : undefined}
        initial={motionEnabled ? "hidden" : false}
        animate={motionEnabled ? "show" : undefined}
      >
        {platforms.map((platform, index) => {
          const isActive = index === activeIndex;
          const buttonClass = `group relative overflow-hidden type-label-tight pill border focus-ring transition ${
            isActive
              ? "border-perazzi-red text-perazzi-red shadow-elevated"
              : "border-border/70 bg-transparent text-ink-muted hover:border-ink/60"
          }`;

          return (
            <motion.button
              key={platform.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={buttonClass}
              onClick={() => { onSelect(index); }}
              variants={motionEnabled ? tabItemVariants : undefined}
              whileHover={motionEnabled ? { y: -1, transition: homeMotion.micro } : undefined}
              whileTap={motionEnabled ? { y: 0, transition: homeMotion.micro } : undefined}
            >
              {isActive ? (
                motionEnabled ? (
                  <motion.span
                    layoutId="platform-tab-highlight"
                    className="absolute inset-0 bg-canvas/55 backdrop-blur-sm"
                    transition={homeMotion.springHighlight}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="absolute inset-0 bg-canvas/55 backdrop-blur-sm" aria-hidden="true" />
                )
              ) : null}
              <span className="relative z-10">{platform.name}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </LayoutGroup>
  );
};

type PlatformCardWithChatProps = {
  platform: Platform;
  footerLabel: string;
  chatLabel: string;
  payload: ChatTriggerPayload;
  priority: boolean;
};

const PlatformCardWithChat = ({
  platform,
  footerLabel,
  chatLabel,
  payload,
  priority,
}: PlatformCardWithChatProps) => (
  <div className="space-y-3">
    <PlatformCard platform={platform} priority={priority} footerLabel={footerLabel} />
    <ChatTriggerButton
      label={chatLabel}
      variant="outline"
      className="w-full justify-center"
      payload={payload}
    />
  </div>
);

type MobilePlatformCarouselProps = {
  readonly platforms: readonly Platform[];
  readonly cardFooterTemplate: string;
  readonly chatLabelTemplate: string;
  buildPayload: (platform: Platform) => ChatTriggerPayload;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  motionEnabled: boolean;
};

const MobilePlatformCarousel = ({
  platforms,
  cardFooterTemplate,
  chatLabelTemplate,
  buildPayload,
  scrollRef,
  motionEnabled,
}: MobilePlatformCarouselProps) => {
  const railVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.1 : 0,
        delayChildren: motionEnabled ? 0.08 : 0,
      },
    },
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
  } as const;

  return (
    <div className="md:hidden">
      <motion.div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-6 -mx-10 pt-6 pb-6 sm:-mx-12"
        aria-label="Swipe to explore platforms"
        variants={motionEnabled ? railVariants : undefined}
        initial={motionEnabled ? "hidden" : false}
        animate={motionEnabled ? "show" : undefined}
      >
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.id}
            data-index={index}
            className="snap-center shrink-0 w-[85vw] max-w-sm"
            variants={motionEnabled ? cardVariants : undefined}
          >
            <PlatformCardWithChat
              platform={platform}
              priority={index === 0}
              footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
              chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
              payload={buildPayload(platform)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

type ChampionHighlightProps = {
  hallmark?: string | null;
  champion?: Platform["champion"];
  prefersReducedMotion: boolean;
  platformId?: string;
};

const ChampionHighlight = ({
  hallmark,
  champion,
  prefersReducedMotion,
  platformId,
}: ChampionHighlightProps) => {
  if (!hallmark && !champion) return null;

  return (
    <motion.div
      key={platformId}
      className="flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 text-ink text-center"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion ? undefined : { duration: 1.5, delay: 0.3, ease: [0.33, 1, 0.68, 1] }
      }
    >
      {hallmark ? (
        <p className="type-quote font-artisan text-ink">{hallmark}</p>
      ) : null}
      {champion ? (
        <div className="flex items-center justify-center gap-5">
          {champion.image ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-(--surface-elevated)">
              <Image
                src={champion.image.url}
                alt={champion.image.alt ?? `${champion.name ?? "Perazzi champion"}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            {champion.name ? (
              <p className="type-body-title text-ink">
                {champion.name}
              </p>
            ) : null}
            {champion.title ? (
              <Text size="md" className="type-label-tight text-ink-muted" leading="normal">
                {champion.title}
              </Text>
            ) : null}
            {champion.resume?.winOne ? (
              <Text size="md" className="text-ink-muted" leading="normal">
                Win highlight: <span className="text-ink">{champion.resume.winOne}</span>
              </Text>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

type DesktopPlatformGridProps = {
  platform?: Platform;
  activeIndex: number;
  cardFooterTemplate: string;
  chatLabelTemplate: string;
  buildPayload: (platform: Platform) => ChatTriggerPayload;
  prefersReducedMotion: boolean;
};

const DesktopPlatformGrid = ({
  platform,
  activeIndex,
  cardFooterTemplate,
  chatLabelTemplate,
  buildPayload,
  prefersReducedMotion,
}: DesktopPlatformGridProps) => (
  <div className="hidden md:grid gap-6 md:grid-cols-2 min-h-[720px] sm:min-h-[820px] md:min-h-[750px] items-stretch">
    <AnimatePresence initial={false} mode="wait">
      {platform ? (
        <motion.div
          key={platform.id}
          className="h-full"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, filter: "blur(6px)" }}
          transition={prefersReducedMotion ? undefined : homeMotion.revealFast}
        >
          <PlatformCardWithChat
            platform={platform}
            priority={activeIndex === 0}
            footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
            chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
            payload={buildPayload(platform)}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
    <div className="hidden h-full md:flex items-center justify-center">
      <ChampionHighlight
        hallmark={platform?.hallmark}
        champion={platform?.champion}
        prefersReducedMotion={prefersReducedMotion}
        platformId={platform?.id}
      />
    </div>
  </div>
);

type PlatformGridRevealSectionProps = {
  readonly platforms: readonly Platform[];
  readonly templates: TemplateConfig;
  readonly activeIndex: number;
  readonly setActiveIndex: Dispatch<SetStateAction<number>>;
  readonly buildPayload: (platform: Platform) => ChatTriggerPayload;
  readonly enableTitleReveal: boolean;
  readonly motionEnabled: boolean;
  readonly prefersReducedMotion: boolean;
  readonly sectionRef: RefObject<HTMLElement | null>;
};

const PlatformGridRevealSection = ({
  platforms,
  templates,
  activeIndex,
  setActiveIndex,
  buildPayload,
  enableTitleReveal,
  motionEnabled,
  prefersReducedMotion,
  sectionRef,
}: PlatformGridRevealSectionProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const {
    expanded,
    phase,
    open,
    close,
    onTriggerKeyDown,
    onEscapeKeyDown,
    showExpanded,
    showCollapsed,
  } = useExpandableSectionTimeline({
    defaultExpanded: false,
    containerRef: sectionRef,
    scrollOnExpand: true,
  });

  const headingTitle = templates.heading;
  const headingSubtitle = templates.subheading;
  const revealGrid = phase === "expanded" || phase === "closingHold";
  const isCollapsedPhase = phase === "collapsed" || phase === "prezoom";
  const isClosing = phase === "closingHold";
  const activePlatform = platforms[activeIndex] ?? platforms[0];
  const parallaxStrength = 0.16;
  const parallaxEnabled = enableTitleReveal && !revealGrid && motionEnabled;

  const platformLayoutTransition = motionEnabled
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
  const parallaxY = useParallaxMotion(scrollYProgress, {
    enabled: parallaxEnabled,
    strength: parallaxStrength,
    targetRef: sectionRef,
  });
  const parallaxStyle = motionEnabled ? { y: parallaxY } : undefined;
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
    blurPx: 6,
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
  const headingToneVariants = buildTitleToneVariants("--color-ink");
  const subheadingToneVariants = buildTitleToneVariants("--color-ink-muted");
  const headingItem = mergeVariants(slotVariants.expandedHeader, headingToneVariants);
  const subheadingItem = mergeVariants(slotVariants.expandedHeader, subheadingToneVariants);
  const collapsedHeaderItem = slotVariants.collapsedHeader;
  const bodyItem = slotVariants.content;
  const surfaceItem = surfaceVariants.content;
  const glassToneVariants = buildGlassToneVariants({
    backgroundStrength: 0,
    borderStrength: 0,
    blurPx: 0,
    shadow: "none",
  });
  const glassVariants = mergeVariants(slotVariants.glass, glassToneVariants);
  const containerLayoutTransition = {
    layout: {
      duration: motionEnabled
        ? (CONTAINER_EXPAND_MS / 1000) * (isClosing ? COLLAPSE_TIME_SCALE : EXPAND_TIME_SCALE)
        : 0,
      ease: EASE_CINEMATIC,
    },
  };
  const glassStyle = {
    minHeight: "40vh",
    overflow: isCollapsedPhase || isClosing ? "hidden" : "visible",
  };
  const contentWrapperClass = isClosing
    ? "absolute inset-0 w-full pointer-events-none flex flex-col space-y-8"
    : "relative flex flex-1 flex-col space-y-8";

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    open();
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    close();
  };

  const handleTabSelect = useCallback((index: number) => {
    setActiveIndex(index);
    scrollToIndex(scrollRef.current, index, motionEnabled ? "smooth" : "auto");
  }, [motionEnabled, setActiveIndex]);

  useEffect(() => {
    if (!revealGrid) return;
    const container = scrollRef.current;
    if (!container) return undefined;

    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const closestIndex = getClosestCardIndex(container);
        setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [revealGrid, setActiveIndex]);


  return (
    <motion.div
      variants={slotVariants.section}
      initial={motionEnabled ? "collapsed" : false}
      animate={phase}
    >
      <motion.div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute inset-0" variants={slotVariants.background}>
          <motion.div className="absolute inset-0 will-change-transform" style={parallaxStyle}>
            <Image
              src={templates.background.url}
              alt={templates.background.alt}
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
          <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas" aria-hidden />
        </motion.div>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          style={glassStyle}
          className="relative flex flex-col space-y-8 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10"
          variants={glassVariants}
          onKeyDown={onEscapeKeyDown}
          layout
          transition={containerLayoutTransition}
        >
          <div className={contentWrapperClass}>
            <LayoutGroup id="shotguns-platform-grid-title">
              {showExpanded ? (
                <motion.div
                  key="platform-grid-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  variants={slotVariants.section}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  <motion.div className="space-y-3" variants={headerGroup}>
                    <motion.div
                      layoutId="platform-grid-title"
                      layoutCrossfade={false}
                      transition={platformLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headingItem}>
                        <Heading
                          id="platforms-heading"
                          level={2}
                          size="xl"
                        >
                          <ExpandableTextReveal text={headingTitle} reduceMotion={!motionEnabled} />
                        </Heading>
                      </motion.div>
                    </motion.div>
                    <motion.div
                      layoutId="platform-grid-subtitle"
                      layoutCrossfade={false}
                      transition={platformLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={subheadingItem}>
                        <Text
                          className="type-section-subtitle max-w-4xl"
                          leading="normal"
                        >
                          <ExpandableTextReveal text={headingSubtitle} reduceMotion={!motionEnabled} />
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
                  key="platform-grid-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  variants={slotVariants.section}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                    <motion.div
                      layoutId="platform-grid-title"
                      layoutCrossfade={false}
                      transition={platformLayoutTransition}
                      className="relative inline-flex text-white"
                    >
                      <motion.div variants={collapsedHeaderItem}>
                        <Heading
                          id="platforms-heading"
                          level={2}
                          size="xl"
                          className="type-section-collapsed"
                        >
                          {headingTitle}
                        </Heading>
                      </motion.div>
                      <button
                        type="button"
                        className="absolute inset-0 z-10 cursor-pointer focus-ring"
                        onFocus={handleExpand}
                        onClick={handleExpand}
                        onKeyDown={onTriggerKeyDown}
                        aria-expanded={expanded}
                        aria-controls="platform-grid-body"
                        aria-labelledby="platforms-heading"
                      >
                        <span className="sr-only">Expand {headingTitle}</span>
                      </button>
                    </motion.div>
                    <motion.div
                      layoutId="platform-grid-subtitle"
                      layoutCrossfade={false}
                      transition={platformLayoutTransition}
                      className="relative text-white"
                    >
                      <motion.div variants={collapsedHeaderItem}>
                        <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                          {headingSubtitle}
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
              variants={slotVariants.section}
              initial={motionEnabled ? "collapsed" : false}
              animate={phase}
            >
              {showExpanded ? (
                <motion.div
                  key="platform-grid-body"
                  id="platform-grid-body"
                  className="space-y-8"
                  variants={slotVariants.section}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                <motion.div variants={bodyGroup} className="space-y-8">
                  <motion.div variants={bodyItem}>
                    <PlatformTabs
                      platforms={platforms}
                      activeIndex={activeIndex}
                      onSelect={handleTabSelect}
                      motionEnabled={motionEnabled}
                    />
                  </motion.div>

                  <motion.div variants={bodyItem}>
                    <MobilePlatformCarousel
                      platforms={platforms}
                      cardFooterTemplate={templates.cardFooterTemplate}
                      chatLabelTemplate={templates.chatLabelTemplate}
                      buildPayload={buildPayload}
                      scrollRef={scrollRef}
                      motionEnabled={motionEnabled}
                    />
                  </motion.div>

                  <motion.div variants={bodyItem}>
                    <DesktopPlatformGrid
                      platform={activePlatform}
                      activeIndex={activeIndex}
                      cardFooterTemplate={templates.cardFooterTemplate}
                      chatLabelTemplate={templates.chatLabelTemplate}
                      buildPayload={buildPayload}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </motion.div>
                </motion.div>
                </motion.div>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export function PlatformGrid({ platforms, ui }: PlatformGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const analyticsRef = useAnalyticsObserver("PlatformGridSeen");

  const orderedPlatforms = useMemo(() => orderPlatforms(platforms), [platforms]);
  const templates = useMemo(() => buildTemplates(ui), [ui]);
  const buildPayload = useMemo(
    () => createPayloadBuilder(templates.chatPayloadTemplate),
    [templates.chatPayloadTemplate],
  );

  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
  const gridKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PlatformGridSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-visible py-10 sm:py-16 min-h-[80vh] full-bleed"
      aria-labelledby="platforms-heading"
    >
      <PlatformGridRevealSection
        key={gridKey}
        platforms={orderedPlatforms}
        templates={templates}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        buildPayload={buildPayload}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        prefersReducedMotion={prefersReducedMotion}
        sectionRef={analyticsRef}
      />
    </section>
  );
}
