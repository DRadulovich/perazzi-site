"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import {
  buildChoreoPresenceVars,
  choreoDistance,
  dreamyPace,
  prefersReducedMotion,
  type ChoreoPresenceState,
} from "@/lib/choreo";
import { cn } from "@/lib/utils";
import {
  ChoreoGroup,
  ChoreoPresence,
  RevealCollapsedHeader,
  RevealAnimatedBody,
  SectionBackdrop,
  SectionShell,
  Heading,
  Text,
  useRevealHeight,
} from "@/components/ui";

type PlatformGridExpandedHeaderProps = {
  readonly headingId: string;
  readonly heading: string;
  readonly subheading: string;
  readonly headerThemeReady: boolean;
  readonly enableTitleReveal: boolean;
  readonly onCollapse: () => void;
  readonly collapseLabel?: string;
};

function PlatformGridExpandedHeader({
  headingId,
  heading,
  subheading,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  collapseLabel = "Collapse",
}: PlatformGridExpandedHeaderProps) {
  const headingClass = headerThemeReady ? "text-ink" : "text-white";
  const subheadingClass = headerThemeReady ? "text-ink-muted" : "text-white";

  return (
    <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-3"
      >
        <div className="relative">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className={headingClass}
          >
            {heading}
          </Heading>
        </div>
        <div className="relative">
          <Text
            className={cn("type-section-subtitle max-w-4xl", subheadingClass)}
            leading="normal"
          >
            {subheading}
          </Text>
        </div>
      </ChoreoGroup>
      {enableTitleReveal ? (
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          delayMs={dreamyPace.staggerMs}
          durationMs={dreamyPace.textMs}
          easing={dreamyPace.easing}
          itemAsChild
        >
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
            onClick={onCollapse}
          >
            {collapseLabel}
          </button>
        </ChoreoGroup>
      ) : null}
    </div>
  );
}

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
const presenceExitDurationMs = 420;

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
    behavior: "auto",
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
}: {
  readonly platforms: readonly Platform[];
  readonly activeIndex: number;
  onSelect: (index: number) => void;
}) => (
  <ChoreoGroup
    effect="slide"
    axis="x"
    direction="right"
    distance={choreoDistance.base}
    durationMs={dreamyPace.textMs}
    easing={dreamyPace.easing}
    staggerMs={dreamyPace.staggerMs}
    className="flex flex-wrap gap-2"
    itemAsChild
  >
    {platforms.map((platform, index) => {
      const isActive = index === activeIndex;
      const buttonClass = cn(
        "group relative overflow-hidden type-label-tight pill border focus-ring backdrop-blur-sm",
        isActive
          ? "border-perazzi-red bg-card/60 text-perazzi-red shadow-elevated"
          : "border-border/70 bg-card/40 text-ink-muted hover:border-ink/60 hover:bg-card/60",
      );

      return (
        <button
          key={platform.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={buttonClass}
          onClick={() => { onSelect(index); }}
        >
          {isActive ? (
            <span className="absolute inset-0 bg-canvas/55 backdrop-blur-sm" aria-hidden="true" />
          ) : null}
          <span className="relative z-10">
            {platform.name}
            <span
              className={cn(
                "platform-tab-underline",
                isActive && "platform-tab-underline-active",
              )}
              aria-hidden="true"
            />
          </span>
        </button>
      );
    })}
  </ChoreoGroup>
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
      className="overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-10 px-4 py-8 sm:-mx-12"
      aria-label="Swipe to explore platforms"
    >
      <ChoreoGroup
        effect="slide"
        axis="x"
        direction="right"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="flex gap-4"
        itemAsChild
      >
        {platforms.map((platform, index) => (
          <div
            key={platform.id}
            data-index={index}
            className="snap-center shrink-0 w-[92vw]"
          >
            <PlatformCardWithChat
              platform={platform}
              priority={index === 0}
              footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
              chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
              payload={buildPayload(platform)}
            />
          </div>
        ))}
      </ChoreoGroup>
    </div>
  </div>
);

type ChampionHighlightProps = {
  hallmark?: string | null;
  champion?: Platform["champion"];
  platformId?: string;
};

const ChampionHighlight = ({
  hallmark,
  champion,
  platformId,
}: ChampionHighlightProps) => {
  if (!hallmark && !champion) return null;

  return (
    <div
      key={platformId}
      className="flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 text-ink text-center"
    >
      {hallmark ? (
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          durationMs={dreamyPace.textMs}
          easing={dreamyPace.easing}
          staggerMs={dreamyPace.staggerMs}
        >
          <p className="type-quote font-artisan text-ink">{hallmark}</p>
        </ChoreoGroup>
      ) : null}
      {champion ? (
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          durationMs={dreamyPace.textMs}
          easing={dreamyPace.easing}
          staggerMs={dreamyPace.staggerMs}
          className="flex items-center justify-center gap-5"
          itemAsChild
        >
          <div className="flex items-center justify-center gap-5">
            {champion.image ? (
              <ChoreoGroup
                effect="scale-parallax"
                distance={choreoDistance.tight}
                durationMs={dreamyPace.textMs}
                easing={dreamyPace.easing}
                scaleFrom={1.04}
                itemAsChild
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-(--surface-elevated)">
                  <Image
                    src={champion.image.url}
                    alt={champion.image.alt ?? `${champion.name ?? "Perazzi champion"}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              </ChoreoGroup>
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
        </ChoreoGroup>
      ) : null}
    </div>
  );
};

type DesktopPlatformGridProps = {
  platform?: Platform;
  presenceState: ChoreoPresenceState;
  presenceVars: React.CSSProperties;
  activeIndex: number;
  cardFooterTemplate: string;
  chatLabelTemplate: string;
  buildPayload: (platform: Platform) => ChatTriggerPayload;
};

const DesktopPlatformGrid = ({
  platform,
  presenceState,
  presenceVars,
  activeIndex,
  cardFooterTemplate,
  chatLabelTemplate,
  buildPayload,
}: DesktopPlatformGridProps) => (
  <div className="hidden md:grid gap-6 md:grid-cols-2 min-h-[720px] sm:min-h-[820px] md:min-h-[750px] items-stretch">
    {platform ? (
      <ChoreoPresence state={presenceState} style={presenceVars} className="h-full">
        <PlatformCardWithChat
          platform={platform}
          priority={activeIndex === 0}
          footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
          chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
          payload={buildPayload(platform)}
        />
      </ChoreoPresence>
    ) : null}
    <div className="hidden h-full md:flex items-center justify-center">
      {platform ? (
        <ChoreoPresence state={presenceState} style={presenceVars}>
          <ChampionHighlight
            hallmark={platform.hallmark}
            champion={platform.champion}
            platformId={platform.id}
          />
        </ChoreoPresence>
      ) : null}
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
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

type PlatformGridBodyProps = {
  readonly revealGrid: boolean;
  readonly platforms: readonly Platform[];
  readonly activeIndex: number;
  readonly activePlatform?: Platform;
  readonly templates: TemplateConfig;
  readonly buildPayload: (platform: Platform) => ChatTriggerPayload;
  readonly scrollRef: RefObject<HTMLDivElement | null>;
  readonly onSelect: (index: number) => void;
};

const PlatformGridBody = ({
  revealGrid,
  platforms,
  activeIndex,
  activePlatform,
  templates,
  buildPayload,
  scrollRef,
  onSelect,
  presenceState,
  presenceVars,
}: PlatformGridBodyProps & {
  presenceState: ChoreoPresenceState;
  presenceVars: React.CSSProperties;
}) => {
  if (!revealGrid) return null;

  return (
    <div id="platform-grid-body" className="space-y-8">
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-8"
      >
        <PlatformTabs
          platforms={platforms}
          activeIndex={activeIndex}
          onSelect={onSelect}
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
          presenceState={presenceState}
          presenceVars={presenceVars}
        />
      </ChoreoGroup>
    </div>
  );
};

const PlatformGridRevealSection = ({
  platforms,
  templates,
  activeIndex,
  setActiveIndex,
  buildPayload,
  enableTitleReveal,
  onCollapsedChange,
}: PlatformGridRevealSectionProps) => {
  const [platformExpanded, setPlatformExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [displayIndex, setDisplayIndex] = useState(activeIndex);
  const [presenceState, setPresenceState] = useState<ChoreoPresenceState>("enter");
  const presenceTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const reduceMotion = prefersReducedMotion();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const headingTitle = templates.heading;
  const headingSubtitle = templates.subheading;
  const revealGrid = !enableTitleReveal || platformExpanded;
  const revealPhotoFocus = revealGrid;
  const activePlatform = platforms[displayIndex] ?? platforms[0];
  const platformMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const presenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: presenceExitDurationMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterY: choreoDistance.tight,
    exitY: choreoDistance.tight,
    enterScale: 0.98,
    exitScale: 0.98,
    enterBlur: 2,
    exitBlur: 2,
  });
  const {
    ref: platformShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealGrid,
    deps: [activeIndex],
  });
  const revealGridForMeasure = revealGrid || isPreparing;

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setPlatformExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setPlatformExpanded(false);
    onCollapsedChange?.(true);
  };

  const handleTabSelect = useCallback((index: number) => {
    setActiveIndex(index);
    const scrollContainer = scrollRef.current;
    if (scrollContainer?.offsetParent) {
      scrollToIndex(scrollContainer, index);
    }

    if (presenceTimeoutRef.current) {
      globalThis.clearTimeout(presenceTimeoutRef.current);
      presenceTimeoutRef.current = null;
    }

    if (reduceMotion || index === displayIndex) {
      setDisplayIndex(index);
      setPresenceState("enter");
      return;
    }

    setPresenceState("exit");
    presenceTimeoutRef.current = globalThis.setTimeout(() => {
      setDisplayIndex(index);
      setPresenceState("enter");
      presenceTimeoutRef.current = null;
    }, presenceExitDurationMs);
  }, [displayIndex, reduceMotion, setActiveIndex]);

  const expandedContent = (
    <RevealAnimatedBody sequence>
      <PlatformGridExpandedHeader
        headingId="platforms-heading"
        heading={headingTitle}
        subheading={headingSubtitle}
        headerThemeReady={headerThemeReady}
        enableTitleReveal={enableTitleReveal}
        onCollapse={handleCollapse}
      />
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        delayMs={dreamyPace.staggerMs}
      >
        <PlatformGridBody
          revealGrid={revealGridForMeasure}
          platforms={platforms}
          activeIndex={activeIndex}
          activePlatform={activePlatform}
          templates={templates}
          buildPayload={buildPayload}
          scrollRef={scrollRef}
          onSelect={handleTabSelect}
          presenceState={presenceState}
          presenceVars={presenceVars}
        />
      </ChoreoGroup>
    </RevealAnimatedBody>
  );

  useEffect(() => {
    if (!revealGrid) return;
    const container = scrollRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      const closestIndex = getClosestCardIndex(container);
      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
      setDisplayIndex(closestIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [revealGrid, setActiveIndex]);

  useEffect(() => (
    () => {
      if (presenceTimeoutRef.current) {
        globalThis.clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = null;
      }
    }
  ), []);

  return (
    <>
      <SectionBackdrop
        image={{ url: templates.background.url, alt: templates.background.alt }}
        reveal={revealGrid}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealGrid}
        overlay="canvas"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <SectionShell
          ref={platformShellRef}
          style={minHeightStyle}
          reveal={false}
          minHeightClass={platformMinHeight ?? undefined}
          className="space-y-8"
        >
          {revealGrid ? (
            expandedContent
          ) : (
            <>
              <ChoreoGroup
                effect="fade-lift"
                distance={choreoDistance.base}
                staggerMs={dreamyPace.staggerMs}
                itemClassName="absolute inset-0"
              >
                <RevealCollapsedHeader
                  headingId="platforms-heading"
                  heading={headingTitle}
                  subheading={headingSubtitle}
                  controlsId="platform-grid-body"
                  expanded={revealGrid}
                  onExpand={handleExpand}
                />
              </ChoreoGroup>
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
      </div>
    </>
  );
};

export function PlatformGrid({ platforms, ui }: PlatformGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHydrated = useHydrated();
  const analyticsRef = useAnalyticsObserver("PlatformGridSeen");
  const enableTitleReveal = isHydrated && isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);

  const orderedPlatforms = useMemo(() => orderPlatforms(platforms), [platforms]);
  const templates = useMemo(() => buildTemplates(ui), [ui]);
  const buildPayload = useMemo(
    () => createPayloadBuilder(templates.chatPayloadTemplate),
    [templates.chatPayloadTemplate],
  );

  const gridKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PlatformGridSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-visible py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
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
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}
