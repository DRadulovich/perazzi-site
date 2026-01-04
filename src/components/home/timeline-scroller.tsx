"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { FittingStage, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useParallaxBackground } from "@/hooks/use-parallax-background";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { TimelineItem } from "./timeline-item";

type TimelineScrollerProps = {
  readonly stages: readonly FittingStage[];
  readonly framing: HomeData["timelineFraming"];
};

export function TimelineScroller({ stages, framing }: TimelineScrollerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const analyticsRef = useAnalyticsObserver("CraftTimelineSeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enablePinned = isDesktop;
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
          isCollapsed
            ? "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:content-['']"
            : null,
        )}
        aria-labelledby="craft-timeline-heading"
      >
        <TimelineRevealSection
          key={timelineKey}
          stages={stages}
          framing={framing}
          enableTitleReveal={enableTitleReveal}
          enablePinned={enablePinned}
          activeStage={activeStage}
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
  readonly activeStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly resolvedActiveStage: number;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

function TimelineRevealSection({
  stages,
  framing,
  enableTitleReveal,
  enablePinned,
  activeStage,
  setActiveStage,
  resolvedActiveStage,
  onCollapsedChange,
}: TimelineRevealSectionProps) {
  const [timelineExpanded, setTimelineExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);

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

  const handleTimelineExpand = () => {
    if (!enableTitleReveal) return;
    setTimelineExpanded(true);
    setHeaderThemeReady(true);
    onCollapsedChange?.(false);
  };
  const handleTimelineCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setTimelineExpanded(false);
    onCollapsedChange?.(true);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealTimeline) return;
    const node = timelineShellRef.current;
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
  }, [enableTitleReveal, revealTimeline, resolvedActiveStage]);

  return (
    <>
      <TimelineBackdrop
        backgroundUrl={backgroundUrl}
        backgroundAlt={backgroundAlt}
        revealTimeline={revealTimeline}
        revealPhotoFocus={revealPhotoFocus}
        enableParallax={enableTitleReveal && !revealTimeline}
      />

      <div
        id="craft-timeline-content"
        tabIndex={-1}
        className="focus:outline-none focus-ring"
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
          <div
            ref={timelineShellRef}
            style={
              enableTitleReveal && revealTimeline && expandedHeight
                ? { minHeight: expandedHeight }
                : undefined
            }
            className={cn(
              "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
              revealPhotoFocus
                ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
                : "border-transparent bg-transparent shadow-none backdrop-blur-none",
              timelineMinHeight,
            )}
          >
            <TimelineHeader
              revealTimeline={revealTimeline}
              enableTitleReveal={enableTitleReveal}
              headerThemeReady={headerThemeReady}
              headingTitle={headingTitle}
              headingEyebrow={headingEyebrow}
              headingInstructions={headingInstructions}
              onExpand={handleTimelineExpand}
              onCollapse={handleTimelineCollapse}
            />

            {revealTimeline ? (
              <TimelineBody
                enablePinned={enablePinned}
                stages={stages}
                resolvedActiveStage={resolvedActiveStage}
                activeStage={activeStage}
                setActiveStage={setActiveStage}
                alternateTitle={alternateTitle}
                revealPhotoFocus={revealPhotoFocus}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

type TimelineBackdropProps = {
  readonly backgroundUrl: string;
  readonly backgroundAlt: string;
  readonly revealTimeline: boolean;
  readonly revealPhotoFocus: boolean;
  readonly enableParallax: boolean;
};

function TimelineBackdrop({
  backgroundUrl,
  backgroundAlt,
  revealTimeline,
  revealPhotoFocus,
  enableParallax,
}: TimelineBackdropProps) {
  const parallaxRef = useParallaxBackground(enableParallax);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div ref={parallaxRef} className="absolute inset-x-0 -top-20 -bottom-20 parallax-image scale-105">
        <Image
          src={backgroundUrl}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div
        className={cn(
          "absolute inset-0 bg-(--scrim-strong)",
          revealTimeline ? "opacity-0" : "opacity-100",
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
          "absolute inset-0 overlay-gradient-canvas",
          revealPhotoFocus ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
    </div>
  );
}

type TimelineHeaderProps = {
  readonly revealTimeline: boolean;
  readonly enableTitleReveal: boolean;
  readonly headerThemeReady: boolean;
  readonly headingTitle: string;
  readonly headingEyebrow: string;
  readonly headingInstructions: string;
  readonly onExpand: () => void;
  readonly onCollapse: () => void;
};

function TimelineHeader({
  revealTimeline,
  enableTitleReveal,
  headerThemeReady,
  headingTitle,
  headingEyebrow,
  headingInstructions,
  onExpand,
  onCollapse,
}: TimelineHeaderProps) {
  if (revealTimeline) {
    return (
      <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
        <div className="space-y-3">
          <div className="relative">
            <Heading
              id="craft-timeline-heading"
              level={2}
              size="xl"
              className={headerThemeReady ? "text-ink" : "text-white"}
            >
              {headingTitle}
            </Heading>
          </div>
          <div className="relative">
            <Text
              size="lg"
              className={cn(
                "type-section-subtitle",
                headerThemeReady ? "text-ink-muted" : "text-white",
              )}
            >
              {headingEyebrow}
            </Text>
          </div>
          <span className="sr-only">{headingInstructions}</span>
        </div>
        {enableTitleReveal ? (
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
            onClick={onCollapse}
          >
            Collapse
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
      <div className="relative inline-flex text-white">
        <Heading
          id="craft-timeline-heading"
          level={2}
          size="xl"
          className="type-section-collapsed"
        >
          {headingTitle}
        </Heading>
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer focus-ring"


          onClick={onExpand}
          aria-expanded={revealTimeline}
          aria-controls="craft-timeline-body"
          aria-labelledby="craft-timeline-heading"
        >
          <span className="sr-only">Expand {headingTitle}</span>
        </button>
      </div>
      <div className="relative text-white">
        <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
          {headingEyebrow}
        </Text>
      </div>
      <div className="mt-3">
        <Text
          size="button"
          className="text-white/80 cursor-pointer focus-ring"
          asChild
        >
          <button type="button" onClick={onExpand}>
            Read more
          </button>
        </Text>
      </div>
    </div>
  );
}

type TimelineBodyProps = {
  readonly enablePinned: boolean;
  readonly stages: readonly FittingStage[];
  readonly resolvedActiveStage: number;
  readonly activeStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly alternateTitle: string;
  readonly revealPhotoFocus: boolean;
};

function TimelineBody({
  enablePinned,
  stages,
  resolvedActiveStage,
  activeStage,
  setActiveStage,
  alternateTitle,
  revealPhotoFocus,
}: TimelineBodyProps) {
  return (
    <div id="craft-timeline-body" className="space-y-6">
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
          activeStage={activeStage}
          setActiveStage={setActiveStage}
          alternateTitle={alternateTitle}
        />
      )}
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

function TimelinePinnedLayout({
  stages,
  resolvedActiveStage,
  setActiveStage,
  alternateTitle,
  revealPhotoFocus,
}: TimelinePinnedLayoutProps) {
  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
      <div className="space-y-4 border-none bg-card/0 p-4 shadow-none sm:border-none sm:bg-card/0 sm:p-4 sm:shadow-none">
        <Text size="label-tight" className="mb-3 text-ink">
          {alternateTitle}
        </Text>
        <div className="space-y-1">
          {stages.map((stage, index) => (
            <TimelineControlButton
              key={`control-${stage.id}`}
              label={stage.title}
              order={stage.order}
              active={resolvedActiveStage === index}
              onSelect={() => { setActiveStage(index); }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div
          className={cn(
            "relative min-h-[640px] overflow-hidden rounded-3xl border",
            revealPhotoFocus
              ? "border-border/70 bg-card/70 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm"
              : "border-transparent bg-transparent shadow-none ring-0 backdrop-blur-none",
          )}
        >
          {stages[resolvedActiveStage] ? (
            <PinnedStagePanel
              stage={stages[resolvedActiveStage]}
              revealPhotoFocus={revealPhotoFocus}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

type TimelineStackedLayoutProps = {
  readonly stages: readonly FittingStage[];
  readonly activeStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly alternateTitle: string;
};

function TimelineStackedLayout({
  stages,
  activeStage,
  setActiveStage,
  alternateTitle,
}: TimelineStackedLayoutProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Text size="label-tight" className="text-ink-muted">
          {alternateTitle}
        </Text>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const expanded = activeStage === index;
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
                onClick={() => { setActiveStage(expanded ? -1 : index); }}
                className="flex w-full items-center justify-between gap-3 text-left focus-ring"
              >
                <div>
                  <Text size="button" className="text-ink-muted mb-2">
                    Stage {stage.order}
                  </Text>
                  <Text className="text-lg type-body-title text-ink">
                    {stage.title}
                  </Text>
                </div>
                <span className="type-button text-perazzi-red/70">
                  {expanded ? "Collapse" : "Show more"}
                </span>
              </button>

              <div
                id={panelId}
                aria-labelledby={buttonId}
                className={cn(
                  "mt-3 overflow-hidden",
                  expanded
                    ? "max-h-[999px] opacity-100"
                    : "max-h-0 opacity-0",
                )}
              >
                {expanded && (
                  <div className="mt-2">
                    <TimelineItem stage={stage} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ControlButtonProps = {
  readonly label: string;
  readonly order: number;
  readonly active: boolean;
  readonly onSelect: () => void;
};

function TimelineControlButton({
  label,
  order,
  active,
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
      className={baseClass}
      onClick={onSelect}
      aria-pressed={active}
    >
      {active ? (
        <span
          className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
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

  const media = (
    <div className="flex h-full w-full flex-col gap-4 p-4 sm:p-6">
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

      <div className="space-y-3">
        <Text size="button" className="text-ink-muted">
          Stage {stage.order}
        </Text>
        <Heading level={3} size="lg" className="type-body-title text-ink not-italic">
          {stage.title}
        </Heading>
        <Text className="type-body text-ink-muted">
          {stage.body}
        </Text>
          {stage.media.caption ? (
            <Text size="caption" className="text-ink-muted">
              {stage.media.caption}
            </Text>
          ) : null}
      </div>
    </div>
  );

  return <div className="absolute inset-0">{media}</div>;
}
