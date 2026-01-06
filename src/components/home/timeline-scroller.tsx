"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";
import type { FittingStage, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import {
  buildChoreoPresenceVars,
  choreoDistance,
  choreoDurations,
  dreamyPace,
  prefersReducedMotion,
  type ChoreoPresenceState,
} from "@/lib/choreo";
import { cn } from "@/lib/utils";
import {
  Button,
  ChoreoGroup,
  ChoreoPresence,
  Heading,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";
import { TimelineItem } from "./timeline-item";

type TimelineScrollerProps = {
  readonly stages: readonly FittingStage[];
  readonly framing: HomeData["timelineFraming"];
};

export function TimelineScroller({ stages, framing }: TimelineScrollerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const analyticsRef = useAnalyticsObserver("CraftTimelineSeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHydrated = useHydrated();
  const enablePinned = isHydrated && isDesktop;
  const enableTitleReveal = enablePinned;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const [activeStage, setActiveStage] = useState(0);
  const resolvedActiveStage = enablePinned ? Math.max(activeStage, 0) : activeStage;
  const seenStagesRef = useRef(new Set<string>());
  const skipTargetId = "home-timeline-anchor";
  const timelineKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  useEffect(() => {
    const currentStage = stages[resolvedActiveStage];
    if (!currentStage) return;
    if (!seenStagesRef.current.has(currentStage.id)) {
      seenStagesRef.current.add(currentStage.id);
      logAnalytics(`CraftTimeline.StageSeen:${currentStage.id}`);
    }
  }, [resolvedActiveStage, stages]);

  return (
    <>
      <div
        id={skipTargetId}
        tabIndex={-1}
        className="sr-only"
      />
      <section
        id="craft-timeline"
        ref={(node) => {
          sectionRef.current = node;
          analyticsRef.current = node;
        }}
        data-analytics-id="CraftTimelineSeen"
        className={cn(
          "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
          isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
        )}
        aria-labelledby="craft-timeline-heading"
      >
        <TimelineRevealSection
          key={timelineKey}
          stages={stages}
          framing={framing}
          enableTitleReveal={enableTitleReveal}
          enablePinned={enablePinned}
          setActiveStage={setActiveStage}
          resolvedActiveStage={resolvedActiveStage}
          onCollapsedChange={setIsCollapsed}
        />
      </section>
    </>
  );
}

type TimelineRevealSectionProps = {
  readonly stages: readonly FittingStage[];
  readonly framing: HomeData["timelineFraming"];
  readonly enableTitleReveal: boolean;
  readonly enablePinned: boolean;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly resolvedActiveStage: number;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

function TimelineRevealSection({
  stages,
  framing,
  enableTitleReveal,
  enablePinned,
  setActiveStage,
  resolvedActiveStage,
  onCollapsedChange,
}: TimelineRevealSectionProps) {
  const [timelineExpanded, setTimelineExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);

  const headingTitle = framing.title ?? "Craftsmanship Journey";
  const headingEyebrow = framing.eyebrow ?? "Three rituals that define a bespoke Perazzi build";
  const headingInstructions = framing.instructions
    ?? "Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.";
  const alternateTitle = framing.alternateTitle ?? "Fitting Timeline";
  const backgroundUrl = framing.background?.url
    ?? "/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg";
  const backgroundAlt = framing.background?.alt ?? "Perazzi workshop background";

  const revealTimeline = !enableTitleReveal || timelineExpanded;
  const revealPhotoFocus = revealTimeline;
  const timelineMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const {
    ref: timelineShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealTimeline,
    deps: [resolvedActiveStage],
  });

  const handleTimelineExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setTimelineExpanded(true);
      setHeaderThemeReady(true);
    });
  };
  const handleTimelineCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setTimelineExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <RevealAnimatedBody sequence>
      <RevealItem index={0}>
        <TimelineExpandedHeader
          headingId="craft-timeline-heading"
          heading={headingTitle}
          eyebrow={headingEyebrow}
          instructions={headingInstructions}
          headerThemeReady={headerThemeReady}
          enableTitleReveal={enableTitleReveal}
          onCollapse={handleTimelineCollapse}
        />
      </RevealItem>
      <RevealGroup delayMs={140}>
        <TimelineBody
          enablePinned={enablePinned}
          stages={stages}
          resolvedActiveStage={resolvedActiveStage}
          setActiveStage={setActiveStage}
          alternateTitle={alternateTitle}
          revealPhotoFocus={revealPhotoFocus}
        />
      </RevealGroup>
    </RevealAnimatedBody>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: backgroundUrl, alt: backgroundAlt }}
        reveal={revealTimeline}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealTimeline}
        overlay="canvas"
        priority
      />

      <div
        id="craft-timeline-content"
        tabIndex={-1}
        className="focus:outline-none focus-ring"
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
          <SectionShell
            ref={timelineShellRef}
            style={minHeightStyle}
            reveal={revealPhotoFocus}
            minHeightClass={timelineMinHeight ?? undefined}
          >
            {revealTimeline ? (
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
                    headingId="craft-timeline-heading"
                    heading={headingTitle}
                    subheading={headingEyebrow}
                    controlsId="craft-timeline-body"
                    expanded={revealTimeline}
                    onExpand={handleTimelineExpand}
                  />
                </ChoreoGroup>
                <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                  {expandedContent}
                </div>
              </>
            )}
          </SectionShell>
        </div>
      </div>
    </>
  );
}

type TimelineExpandedHeaderProps = {
  readonly headingId: string;
  readonly heading: string;
  readonly eyebrow?: string;
  readonly instructions?: string;
  readonly headerThemeReady: boolean;
  readonly enableTitleReveal: boolean;
  readonly onCollapse: () => void;
  readonly collapseLabel?: string;
};

function TimelineExpandedHeader({
  headingId,
  heading,
  eyebrow,
  instructions,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  collapseLabel = "Collapse",
}: TimelineExpandedHeaderProps) {
  const headingClass = headerThemeReady ? "text-ink" : "text-white";
  const eyebrowClass = headerThemeReady ? "text-ink-muted" : "text-white";
  const instructionsClass = headerThemeReady ? "text-ink-muted" : "text-white/80";

  return (
    <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.base}
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
        {eyebrow ? (
          <div className="relative">
            <Text
              size="lg"
              className={cn("type-section-subtitle", eyebrowClass)}
            >
              {eyebrow}
            </Text>
          </div>
        ) : null}
        {instructions ? (
          <div className="relative">
            <Text size="md" className={cn("max-w-2xl", instructionsClass)}>
              {instructions}
            </Text>
          </div>
        ) : null}
      </ChoreoGroup>
      {enableTitleReveal ? (
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          delayMs={choreoDurations.micro}
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

type TimelineBodyProps = {
  readonly enablePinned: boolean;
  readonly stages: readonly FittingStage[];
  readonly resolvedActiveStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly alternateTitle: string;
  readonly revealPhotoFocus: boolean;
};

function TimelineBody({
  enablePinned,
  stages,
  resolvedActiveStage,
  setActiveStage,
  alternateTitle,
  revealPhotoFocus,
}: TimelineBodyProps) {
  return (
    <div id="craft-timeline-body" className="space-y-6">
      <RevealItem index={0}>
        {enablePinned ? (
          <TimelinePinnedLayout
            stages={stages}
            resolvedActiveStage={resolvedActiveStage}
            setActiveStage={setActiveStage}
            alternateTitle={alternateTitle}
            revealPhotoFocus={revealPhotoFocus}
          />
        ) : (
          <TimelineStackedLayout
            stages={stages}
            setActiveStage={setActiveStage}
            alternateTitle={alternateTitle}
          />
        )}
      </RevealItem>
      <RevealItem index={1}>
        <div className="pt-2 sm:pt-4">
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="w-full type-button-eaves text-ink"
          >
            <Link href="/the-build/why-a-perazzi-has-a-soul">
              See the full build story
            </Link>
          </Button>
        </div>
      </RevealItem>
    </div>
  );
}

type TimelinePinnedLayoutProps = {
  readonly stages: readonly FittingStage[];
  readonly resolvedActiveStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly alternateTitle: string;
  readonly revealPhotoFocus: boolean;
};

const splitBodyLines = (body: string) =>
  body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const resolveStaggerForSpan = (durationMs: number, count: number, span: number) => {
  if (count <= 1) return 0;
  return Math.round((durationMs * span) / (count - 1));
};

function TimelinePinnedLayout({
  stages,
  resolvedActiveStage,
  setActiveStage,
  alternateTitle,
  revealPhotoFocus,
}: TimelinePinnedLayoutProps) {
  const reduceMotion = prefersReducedMotion();
  const [presenceStageIndex, setPresenceStageIndex] = useState(resolvedActiveStage);
  const [presenceState, setPresenceState] = useState<ChoreoPresenceState>("enter");
  const presenceTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelId = "craft-timeline-panel";
  const presenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.enterMs,
    enterEase: dreamyPace.easing,
    enterScale: 0.98,
    exitScale: 0.985,
    enterBlur: 2,
    exitBlur: 1,
  });

  useEffect(() => (
    () => {
      if (presenceTimeoutRef.current) {
        globalThis.clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = null;
      }
    }
  ), []);

  const handleStageSelect = (index: number) => {
    setActiveStage(index);

    if (presenceTimeoutRef.current) {
      globalThis.clearTimeout(presenceTimeoutRef.current);
      presenceTimeoutRef.current = null;
    }

    if (reduceMotion || index === presenceStageIndex) {
      setPresenceStageIndex(index);
      setPresenceState("enter");
      return;
    }

    setPresenceState("exit");
    presenceTimeoutRef.current = globalThis.setTimeout(() => {
      setPresenceStageIndex(index);
      setPresenceState("enter");
      presenceTimeoutRef.current = null;
    }, choreoDurations.short);
  };

  const focusTab = (index: number) => {
    if (stages.length === 0) return;
    const resolvedIndex = (index + stages.length) % stages.length;
    tabRefs.current[resolvedIndex]?.focus();
    handleStageSelect(resolvedIndex);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (stages.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight": {
        event.preventDefault();
        focusTab(index === stages.length - 1 ? 0 : index + 1);
        break;
      }
      case "ArrowUp":
      case "ArrowLeft": {
        event.preventDefault();
        focusTab(index === 0 ? stages.length - 1 : index - 1);
        break;
      }
      case "Home": {
        event.preventDefault();
        focusTab(0);
        break;
      }
      case "End": {
        event.preventDefault();
        focusTab(stages.length - 1);
        break;
      }
      default:
        break;
    }
  };

  const activeStage = stages[presenceStageIndex];
  const activeTabId = activeStage ? `craft-timeline-tab-${activeStage.id}` : undefined;

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
      <div className="space-y-4 border-none bg-card/0 p-4 shadow-none sm:border-none sm:bg-card/0 sm:p-4 sm:shadow-none">
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          staggerMs={dreamyPace.staggerMs}
          className="space-y-3"
        >
          <Text size="label-tight" className="text-ink">
            {alternateTitle}
          </Text>
        </ChoreoGroup>
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={`${alternateTitle} stages`}
        >
          <ChoreoGroup
            effect="fade-lift"
            distance={choreoDistance.tight}
            staggerMs={dreamyPace.staggerMs}
            delayMs={choreoDurations.micro}
            className="space-y-1"
          >
            {stages.map((stage, index) => (
              <TimelineControlButton
                key={`control-${stage.id}`}
                buttonRef={(node) => { tabRefs.current[index] = node; }}
                tabId={`craft-timeline-tab-${stage.id}`}
                panelId={panelId}
                label={stage.title}
                order={stage.order}
                active={resolvedActiveStage === index}
                tabIndex={resolvedActiveStage === index ? 0 : -1}
                onKeyDown={(event) => { handleTabKeyDown(event, index); }}
                onSelect={() => { handleStageSelect(index); }}
              />
            ))}
          </ChoreoGroup>
        </div>
      </div>

      <div className="space-y-5">
        <div
          className={cn(
            "relative min-h-[clamp(22rem,60vh,40rem)] overflow-hidden rounded-3xl border",
            revealPhotoFocus
              ? "border-border/70 bg-card/70 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm"
              : "border-transparent bg-transparent shadow-none ring-0 backdrop-blur-none",
          )}
        >
          {activeStage ? (
            <ChoreoPresence
              state={presenceState}
              className="relative"
              style={presenceVars}
              id={panelId}
              role="tabpanel"
              aria-labelledby={activeTabId}
              tabIndex={0}
            >
              <PinnedStagePanel
                stage={activeStage}
                revealPhotoFocus={revealPhotoFocus}
              />
            </ChoreoPresence>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type TimelineStackedLayoutProps = {
  readonly stages: readonly FittingStage[];
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly alternateTitle: string;
};

function TimelineStackedLayout({
  stages,
  setActiveStage,
  alternateTitle,
}: TimelineStackedLayoutProps) {
  const presenceVars = buildChoreoPresenceVars({
    enterY: choreoDistance.tight,
    exitY: choreoDistance.tight,
  });
  const [openStageIds, setOpenStageIds] = useState<Set<string>>(() => {
    const firstStageId = stages[0]?.id;
    return new Set(firstStageId ? [firstStageId] : []);
  });

  const stageIdSet = useMemo(() => new Set(stages.map((stage) => stage.id)), [stages]);
  const resolvedOpenStageIds = useMemo(() => {
    if (openStageIds.size === 0) return openStageIds;
    let hasInvalid = false;
    for (const id of openStageIds) {
      if (!stageIdSet.has(id)) {
        hasInvalid = true;
        break;
      }
    }
    if (!hasInvalid) return openStageIds;
    const next = new Set<string>();
    for (const id of openStageIds) {
      if (stageIdSet.has(id)) next.add(id);
    }
    return next;
  }, [openStageIds, stageIdSet]);

  const handleToggleStage = (stageId: string, index: number) => {
    const isOpen = resolvedOpenStageIds.has(stageId);
    setOpenStageIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (stageIdSet.has(id)) next.add(id);
      }
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
    if (!isOpen) {
      setActiveStage(index);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Text size="label-tight" className="text-ink-muted">
          {alternateTitle}
        </Text>
      </div>

      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-3"
        itemAsChild
      >
        {stages.map((stage, index) => {
          const expanded = resolvedOpenStageIds.has(stage.id);
          const panelId = `craft-stage-panel-${stage.id}`;
          const buttonId = `craft-stage-trigger-${stage.id}`;

          return (
            <div
              key={`stacked-${stage.id}`}
              className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:p-4"
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => { handleToggleStage(stage.id, index); }}
                className="flex w-full items-center justify-between gap-3 text-left focus-ring"
              >
                <div>
                  <Text size="button" className="mb-2 text-ink-muted">
                    Stage {stage.order}
                  </Text>
                  <Text className="text-lg type-body-title text-ink">
                    {stage.title}
                  </Text>
                </div>
                <span className="type-button text-center leading-tight text-perazzi-red/70">
                  {expanded ? (
                    "Collapse"
                  ) : (
                    <>
                      <span className="block">Show</span>
                      <span className="block">more</span>
                    </>
                  )}
                </span>
              </button>

              <div
                id={panelId}
                aria-labelledby={buttonId}
                className={cn(
                  "mt-3 overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none",
                  expanded ? "max-h-[9999px]" : "max-h-0",
                )}
              >
                <ChoreoPresence
                  state={expanded ? "enter" : "exit"}
                  style={presenceVars}
                  className={cn(
                    "mt-2",
                    expanded ? "pointer-events-auto" : "pointer-events-none",
                  )}
                  aria-hidden={!expanded}
                >
                  <TimelineItem stage={stage} />
                </ChoreoPresence>
              </div>
            </div>
          );
        })}
      </ChoreoGroup>
    </div>
  );
}

type ControlButtonProps = {
  readonly buttonRef?: (node: HTMLButtonElement | null) => void;
  readonly tabId: string;
  readonly panelId: string;
  readonly label: string;
  readonly order: number;
  readonly active: boolean;
  readonly tabIndex: number;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  readonly onSelect: () => void;
};

function TimelineControlButton({
  buttonRef,
  tabId,
  panelId,
  label,
  order,
  active,
  tabIndex,
  onKeyDown,
  onSelect,
}: ControlButtonProps) {
  const baseClass = cn(
    "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left focus-ring",
    active
      ? "text-white"
      : "bg-transparent text-ink-muted hover:bg-ink/10 hover:text-ink",
  );

  return (
    <button
      type="button"
      ref={buttonRef}
      id={tabId}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={tabIndex}
      className={baseClass}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      {active ? (
        <span
          className="timeline-control-pulse absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
          aria-hidden="true"
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 block type-button group-hover:text-ink-muted/90",
          active ? "text-white/90" : "text-perazzi-red/80",
        )}
      >
        Stage {order}
      </span>
      <span
        className={cn(
          "relative z-10 mt-0.5 block type-card-title text-xl",
          active ? "text-white" : "text-ink",
        )}
      >
        {label}
      </span>
    </button>
  );
}

type PinnedStageProps = {
  readonly stage: FittingStage;
  readonly revealPhotoFocus: boolean;
};

function PinnedStagePanel({
  stage,
  revealPhotoFocus,
}: PinnedStageProps) {
  const sizes = "(min-width: 1600px) 860px, (min-width: 1280px) 760px, 100vw";
  const bodyLines = splitBodyLines(stage.body);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 sm:p-6">
      <ChoreoGroup
        effect="scale-parallax"
        distance={choreoDistance.base}
        scaleFrom={1.02}
        itemAsChild
      >
        <div className="group relative aspect-3/2 sm:aspect-4/3 w-full overflow-hidden rounded-2xl bg-(--color-canvas)">
          <Image
            src={stage.media.url}
            alt={stage.media.alt}
            fill
            sizes={sizes}
            className="object-cover"
            priority={stage.order === 1}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/80 via-(--scrim-strong)/50 to-transparent",
              revealPhotoFocus ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          />
        </div>
      </ChoreoGroup>

      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.tight}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-3"
      >
        <Text size="button" className="text-ink-muted">
          Stage {stage.order}
        </Text>
        <Heading level={3} size="lg" className="type-body-title text-ink not-italic">
          {stage.title}
        </Heading>
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          durationMs={dreamyPace.lineMs}
          easing={dreamyPace.easing}
          staggerMs={resolveStaggerForSpan(
            dreamyPace.enterMs,
            bodyLines.length,
            dreamyPace.staggerSpan,
          )}
          className="space-y-2"
        >
          {bodyLines.map((line, index) => (
            <Text key={`stage-body-${stage.id}-${index}`} className="type-body text-ink-muted">
              {line}
            </Text>
          ))}
        </ChoreoGroup>
        {stage.media.caption ? (
          <Text size="caption" className="text-ink-muted">
            {stage.media.caption}
          </Text>
        ) : null}
      </ChoreoGroup>
    </div>
  );
}
