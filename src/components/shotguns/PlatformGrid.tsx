"use client";

import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMemo, useState, useRef, useEffect, useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";
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
  const containerRect = container.getBoundingClientRect();
  const containerCenter = containerRect.left + containerRect.width / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  container.querySelectorAll<HTMLDivElement>("[data-index]").forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
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

const scrollToIndex = (container: HTMLDivElement | null, index: number) => {
  if (!container) return;

  const target = container.querySelector<HTMLDivElement>(`[data-index="${index}"]`);
  target?.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "nearest",
  });
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
}) => (
  <LayoutGroup id="shotguns-platform-tabs">
    <div role="tablist" aria-label="Platforms" className="flex flex-wrap gap-2">
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
            initial={false}
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
    </div>
  </LayoutGroup>
);

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
};

const MobilePlatformCarousel = ({
  platforms,
  cardFooterTemplate,
  chatLabelTemplate,
  buildPayload,
  scrollRef,
}: MobilePlatformCarouselProps) => (
  <div className="md:hidden">
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-6 -mx-6 pt-6 pb-6 sm:mx-0 sm:px-6"
      aria-label="Swipe to explore platforms"
    >
      {platforms.map((platform, index) => (
        <div key={platform.id} data-index={index} className="snap-center shrink-0 w-[85vw] max-w-sm">
          <PlatformCardWithChat
            platform={platform}
            priority={index === 0}
            footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
            chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
            payload={buildPayload(platform)}
          />
        </div>
      ))}
    </div>
  </div>
);

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
    <AnimatePresence initial={false} mode="popLayout">
      {platform ? (
        <motion.div
          key={platform.id}
          className="h-full"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, filter: "blur(10px)" }}
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
  const [platformExpanded, setPlatformExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const platformShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const headingTitle = templates.heading;
  const headingSubtitle = templates.subheading;
  const revealGrid = !enableTitleReveal || platformExpanded;
  const revealPhotoFocus = revealGrid;
  const activePlatform = platforms[activeIndex] ?? platforms[0];
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealGrid;

  const focusSurfaceTransition = "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition = "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition = "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const platformReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const platformRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const platformCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const platformBodyReveal = platformReveal;
  const readMoreReveal = motionEnabled
    ? { duration: 0.5, ease: homeMotion.cinematicEase, delay: platformReveal.duration }
    : undefined;
  const platformLayoutTransition = motionEnabled ? { layout: platformReveal } : undefined;
  const platformMinHeight = enableTitleReveal ? "min-h-[calc(750px+18rem)]" : null;
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
  const backgroundScaleTransition = revealGrid ? platformReveal : platformCollapse;

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setPlatformExpanded(true);
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
    setPlatformExpanded(false);
  };

  const handleTabSelect = useCallback((index: number) => {
    setActiveIndex(index);
    scrollToIndex(scrollRef.current, index);
  }, [setActiveIndex]);

  const headingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.16 : 0 } },
  } as const;

  const headingItem = {
    hidden: { y: 14, filter: "blur(10px)" },
    show: { y: 0, filter: "blur(0px)", transition: platformReveal },
  } as const;

  useEffect(() => {
    if (!enableTitleReveal || !revealGrid) return;
    const node = platformShellRef.current;
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
  }, [enableTitleReveal, revealGrid, activeIndex]);

  useEffect(() => {
    if (!revealGrid) return;
    const container = scrollRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      const closestIndex = getClosestCardIndex(container);
      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [revealGrid, setActiveIndex]);

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
            src={templates.background.url}
            alt={templates.background.alt}
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
            revealGrid ? "opacity-0" : "opacity-100",
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
            "pointer-events-none absolute inset-0 overlay-gradient-canvas",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          ref={platformShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-8 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            platformMinHeight,
          )}
        >
          <LayoutGroup id="shotguns-platform-grid-title">
            <AnimatePresence initial={false}>
              {revealGrid ? (
                <motion.div
                  key="platform-grid-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1, transition: platformReveal } : undefined}
                  exit={motionEnabled ? { opacity: 0, transition: platformRevealFast } : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                  >
                    <motion.div
                      layoutId="platform-grid-title"
                      layoutCrossfade={false}
                      transition={platformLayoutTransition}
                      className="relative"
                    >
                      <Heading
                        id="platforms-heading"
                        level={2}
                        size="xl"
                        className={cn(
                          titleColorTransition,
                          headerThemeReady ? "text-ink" : "text-white",
                        )}
                      >
                        {headingTitle}
                      </Heading>
                    </motion.div>
                    <motion.div
                      layoutId="platform-grid-subtitle"
                      layoutCrossfade={false}
                      transition={platformLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headingItem}>
                        <Text
                          className={cn(
                            "type-section-subtitle max-w-4xl",
                            titleColorTransition,
                            headerThemeReady ? "text-ink-muted" : "text-white",
                          )}
                          leading="normal"
                        >
                          {headingSubtitle}
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
                  key="platform-grid-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : false}
                  animate={motionEnabled ? { opacity: 1, filter: "blur(0px)" } : undefined}
                  exit={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : undefined}
                  transition={motionEnabled ? platformRevealFast : undefined}
                >
                  <motion.div
                    layoutId="platform-grid-title"
                    layoutCrossfade={false}
                    transition={platformLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <Heading
                      id="platforms-heading"
                      level={2}
                      size="xl"
                      className="type-section-collapsed"
                    >
                      {headingTitle}
                    </Heading>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onPointerEnter={handleExpand}
                      onFocus={handleExpand}
                      onClick={handleExpand}
                      aria-expanded={revealGrid}
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
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {headingSubtitle}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: platformRevealFast } : undefined}
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
            {revealGrid ? (
              <motion.div
                key="platform-grid-body"
                id="platform-grid-body"
                className="space-y-8"
                initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(12px)" } : false}
                animate={
                  motionEnabled
                    ? { opacity: 1, y: 0, filter: "blur(0px)", transition: platformBodyReveal }
                    : undefined
                }
                exit={
                  motionEnabled
                    ? { opacity: 0, y: -16, filter: "blur(10px)", transition: platformCollapse }
                    : undefined
                }
              >
                <PlatformTabs
                  platforms={platforms}
                  activeIndex={activeIndex}
                  onSelect={handleTabSelect}
                  motionEnabled={motionEnabled}
                />

                <MobilePlatformCarousel
                  platforms={platforms}
                  cardFooterTemplate={templates.cardFooterTemplate}
                  chatLabelTemplate={templates.chatLabelTemplate}
                  buildPayload={buildPayload}
                  scrollRef={scrollRef}
                />

                <DesktopPlatformGrid
                  platform={activePlatform}
                  activeIndex={activeIndex}
                  cardFooterTemplate={templates.cardFooterTemplate}
                  chatLabelTemplate={templates.chatLabelTemplate}
                  buildPayload={buildPayload}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export function PlatformGrid({ platforms, ui }: PlatformGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
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
