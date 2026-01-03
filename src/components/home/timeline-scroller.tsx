"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import type { FittingStage, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { ExpandableSection } from "@/motion/expandable/ExpandableSection";
import type { ExpandableSectionMotionApi } from "@/motion/expandable/expandable-section-motion";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { TimelineItem } from "./timeline-item";

type TimelineScrollerProps = {
  readonly stages: readonly FittingStage[];
  readonly framing: HomeData["timelineFraming"];
};

const TIMELINE_TITLE_ID = "craft-timeline-title";

export function TimelineScroller({ stages, framing }: TimelineScrollerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const analyticsRef = useAnalyticsObserver("CraftTimelineSeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enablePinned = isDesktop;
  const enableTitleReveal = enablePinned;
  const timelineKey = enableTitleReveal ? "title-reveal" : "always-reveal";
  const [activeStage, setActiveStage] = useState(0);
  const resolvedActiveStage = enablePinned ? Math.max(activeStage, 0) : activeStage;
  const seenStagesRef = useRef(new Set<string>());
  const skipTargetId = "home-timeline-anchor";
  const rootRef = useCallback((node: HTMLElement | null) => {
    sectionRef.current = node;
    analyticsRef.current = node;
  }, [analyticsRef]);

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
      <ExpandableSection
        key={timelineKey}
        sectionId="home.timelineScroller"
        defaultExpanded={!enableTitleReveal}
        rootRef={rootRef}
        id="craft-timeline"
        data-analytics-id="CraftTimelineSeen"
        className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
        aria-labelledby={TIMELINE_TITLE_ID}
      >
        {(es) => (
          <TimelineRevealSection
            stages={stages}
            framing={framing}
            enablePinned={enablePinned}
            activeStage={activeStage}
            setActiveStage={setActiveStage}
            resolvedActiveStage={resolvedActiveStage}
            es={es}
          />
        )}
      </ExpandableSection>
    </>
  );
}

type TimelineRevealSectionProps = {
  readonly stages: readonly FittingStage[];
  readonly framing: HomeData["timelineFraming"];
  readonly enablePinned: boolean;
  readonly activeStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly resolvedActiveStage: number;
  readonly es: ExpandableSectionMotionApi;
};

function TimelineRevealSection({
  stages,
  framing,
  enablePinned,
  activeStage,
  setActiveStage,
  resolvedActiveStage,
  es,
}: TimelineRevealSectionProps) {
  const {
    getTriggerProps,
    getCloseProps,
    layoutProps,
    contentVisible,
    bodyId,
  } = es;

  const headingTitle = framing.title ?? "Craftsmanship Journey";
  const headingEyebrow = framing.eyebrow ?? "Three rituals that define a bespoke Perazzi build";
  const headingInstructions = framing.instructions
    ?? "Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.";
  const alternateTitle = framing.alternateTitle ?? "Fitting Timeline";
  const backgroundUrl = framing.background?.url
    ?? "/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg";
  const backgroundAlt = framing.background?.alt ?? "Perazzi workshop background";

  const timelineMinHeight = contentVisible ? null : "min-h-[calc(640px+18rem)]";
  const headerThemeReady = contentVisible;

  return (
    <>
      <span id={TIMELINE_TITLE_ID} className="sr-only">
        {headingTitle}
      </span>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div data-es="bg" className="absolute inset-0">
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
          data-es="scrim-bottom"
          className="absolute inset-0 bg-(--scrim-strong)"
          aria-hidden
        />
        <div
          data-es="scrim-top"
          className="absolute inset-0 overlay-gradient-canvas"
          aria-hidden
        />
      </div>

      <div
        tabIndex={-1}
        className="focus:outline-none focus-ring"
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            {...layoutProps}
            className={cn("relative", timelineMinHeight)}
          >
            <div
              data-es="glass"
              className={cn(
                "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
                contentVisible
                  ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
                  : "border-transparent bg-transparent shadow-none backdrop-blur-none",
              )}
            >
              {contentVisible ? (
                <>
                  <div data-es="header-expanded" className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
                    <div className="space-y-3">
                      <div className="relative">
                        <Heading
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
                    </div>
                    <button
                      type="button"
                      data-es="close"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
                      {...getCloseProps()}
                    >
                      Collapse
                    </button>
                  </div>

                  <div data-es="body" id={bodyId}>
                    <Text muted leading="relaxed">
                      {headingInstructions}
                    </Text>
                  </div>

                  <div data-es="main" className="space-y-6">
                    {enablePinned ? (
                  <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                    <div className="space-y-4 border-none bg-card/0 p-4 shadow-none sm:border-none sm:bg-card/0 sm:p-4 sm:shadow-none">
                      <Text size="label-tight" className="mb-3 text-ink">
                        {alternateTitle}
                      </Text>
                      <div data-es="list" className="space-y-1">
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
                          contentVisible
                            ? "border-border/70 bg-card/70 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm"
                            : "border-transparent bg-transparent shadow-none ring-0 backdrop-blur-none",
                        )}
                      >
                        {stages[resolvedActiveStage] ? (
                          <PinnedStagePanel
                            stage={stages[resolvedActiveStage]}
                            revealPhotoFocus={contentVisible}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                    ) : (
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
                              onClick={() =>
                                { setActiveStage(expanded ? -1 : index); }
                              }
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
                    )}
                  </div>
                  <div data-es="cta" className="pt-2 sm:pt-4">
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
                </>
              ) : null}
            </div>

            <div
              data-es="header-collapsed"
              className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center",
                contentVisible && "pointer-events-none",
              )}
              aria-hidden={contentVisible}
            >
              <div className="relative inline-flex text-white">
                <Heading
                  level={2}
                  size="xl"
                  className="type-section-collapsed"
                >
                  {headingTitle}
                </Heading>
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer focus-ring"
                  {...getTriggerProps({ kind: "header", withHover: true })}
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
                  <button type="button" {...getTriggerProps({ kind: "cta" })}>
                    Read more
                  </button>
                </Text>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
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
      data-es="item"
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
