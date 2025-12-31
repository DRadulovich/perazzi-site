"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { FittingStage, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
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
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enablePinned = isDesktop && !prefersReducedMotion;
  const animationsEnabled = enablePinned;
  const [activeStage, setActiveStage] = useState(0);
  const resolvedActiveStage = enablePinned ? Math.max(activeStage, 0) : activeStage;
  const seenStagesRef = useRef(new Set<string>());
  const skipTargetId = "home-timeline-anchor";
  const headingTitle = framing.title ?? "Craftsmanship Journey";
  const headingEyebrow = framing.eyebrow ?? "Three rituals that define a bespoke Perazzi build";
  const headingInstructions = framing.instructions
    ?? "Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.";
  const alternateTitle = framing.alternateTitle ?? "Fitting Timeline";
  const backgroundUrl = framing.background?.url
    ?? "/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg";
  const backgroundAlt = framing.background?.alt ?? "Perazzi workshop background";
  const motionEnabled = !prefersReducedMotion;

  const headingContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.1 : 0 },
    },
  } as const;

  const headingItem = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

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
        className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
        aria-labelledby="craft-timeline-heading"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={backgroundUrl}
            alt={backgroundAlt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0 bg-(--scrim-soft)"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
          <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
        </div>

        <div
          id="craft-timeline-content"
          tabIndex={-1}
          className="focus:outline-none focus-ring"
        >
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
              <div className="space-y-6 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-soft backdrop-blur-md sm:rounded-3xl sm:bg-card/25 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10">
                <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-8">
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.55 }}
                  >
                    <motion.div variants={headingItem}>
                      <Heading
                        id="craft-timeline-heading"
                        level={2}
                        size="xl"
                        className="text-ink"
                      >
                        {headingTitle}
                      </Heading>
                    </motion.div>
                    <motion.div variants={headingItem}>
                      <Text size="lg" className="type-section-subtitle text-ink-muted">
                        {headingEyebrow}
                      </Text>
                    </motion.div>
                    <span className="sr-only">{headingInstructions}</span>
                  </motion.div>
                </div>

              {enablePinned ? (
                <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                  <div className="space-y-4 border-none bg-card/0 p-4 shadow-none sm:border-none sm:bg-card/0 sm:p-4 sm:shadow-none">
                    <Text size="label-tight" className="mb-3 text-ink">
                      {alternateTitle}
                    </Text>
                    <LayoutGroup id="home-timeline-controls">
                      <div className="space-y-1">
                        {stages.map((stage, index) => (
                          <TimelineControlButton
                            key={`control-${stage.id}`}
                            label={stage.title}
                            order={stage.order}
                            active={resolvedActiveStage === index}
                            onSelect={() => { setActiveStage(index); }}
                            animationsEnabled={animationsEnabled}
                          />
                        ))}
                      </div>
                    </LayoutGroup>
                  </div>

                  <div className="space-y-5">
                    <div className="relative min-h-[640px] overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm">
                      <AnimatePresence initial={false} mode="popLayout">
                        {stages[resolvedActiveStage] ? (
                          <PinnedStagePanel
                            key={`panel-${stages[resolvedActiveStage].id}`}
                            stage={stages[resolvedActiveStage]}
                            animationsEnabled={animationsEnabled}
                          />
                        ) : null}
                      </AnimatePresence>
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
                        <motion.div
                          key={`stacked-${stage.id}`}
                          className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:p-4"
                          initial={motionEnabled ? { opacity: 0, y: 18, filter: "blur(10px)" } : false}
                          whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                          viewport={motionEnabled ? { once: true, amount: 0.25 } : undefined}
                          transition={motionEnabled ? homeMotion.revealFast : undefined}
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
                              "mt-3 overflow-hidden transition-all duration-300",
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
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
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
          </div>
        </div>
      </section>
    </>
  );
}

type ControlButtonProps = {
  readonly label: string;
  readonly order: number;
  readonly active: boolean;
  readonly onSelect: () => void;
  readonly animationsEnabled: boolean;
};

function TimelineControlButton({
  label,
  order,
  active,
  onSelect,
  animationsEnabled,
}: ControlButtonProps) {
  const baseClass = cn(
    "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-colors focus-ring",
    active
      ? "text-white"
      : "bg-transparent text-ink-muted hover:bg-ink/10 hover:text-ink",
  );

  return (
    <motion.button
      type="button"
      className={baseClass}
      onClick={onSelect}
      initial={false}
      whileHover={animationsEnabled ? { scale: active ? 1.012 : 1.006 } : undefined}
      whileTap={animationsEnabled ? { scale: 0.994 } : undefined}
      aria-pressed={active}
    >
      {active ? (
        animationsEnabled ? (
          <motion.span
            layoutId="timeline-control-highlight"
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
    </motion.button>
  );
}

type PinnedStageProps = {
  readonly stage: FittingStage;
  readonly animationsEnabled: boolean;
};

function PinnedStagePanel({
  stage,
  animationsEnabled,
}: PinnedStageProps) {
  const sizes = "(min-width: 1600px) 860px, (min-width: 1280px) 760px, 100vw";
  const Wrapper = animationsEnabled ? motion.div : "div";
  const motionEnabled = animationsEnabled;

  const content = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.08 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const media = (
    <motion.div
      className="flex h-full w-full flex-col gap-4 p-4 sm:p-6"
      variants={content}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="group relative aspect-3/2 sm:aspect-4/3 w-full overflow-hidden rounded-2xl bg-(--color-canvas)"
        initial={motionEnabled ? { clipPath: "inset(0 0 100% 0)" } : undefined}
        animate={motionEnabled ? { clipPath: "inset(0 0 0% 0)" } : undefined}
        transition={motionEnabled ? homeMotion.reveal : undefined}
      >
        <Image
          src={stage.media.url}
          alt={stage.media.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-1400 ease-out will-change-transform group-hover:scale-[1.04]"
          priority={stage.order === 1}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/80 via-(--scrim-strong)/50 to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
      </motion.div>

      <motion.div className="space-y-3" variants={item}>
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
      </motion.div>
    </motion.div>
  );

  if (!animationsEnabled) {
    return <div className="absolute inset-0">{media}</div>;
  }

  return (
    <Wrapper
      className="absolute inset-0"
      initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
      transition={homeMotion.revealFast}
    >
      {media}
    </Wrapper>
  );
}
