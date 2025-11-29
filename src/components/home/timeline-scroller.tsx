"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FittingStage } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { TimelineItem } from "./timeline-item";

type TimelineScrollerProps = {
  stages: FittingStage[];
};

export function TimelineScroller({ stages }: TimelineScrollerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const analyticsRef = useAnalyticsObserver("CraftTimelineSeen");
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enablePinned = isDesktop && !prefersReducedMotion;
  const animationsEnabled = enablePinned;
  const [activeStage, setActiveStage] = useState(0);
  const seenStagesRef = useRef(new Set<string>());
  const skipTargetId = "home-timeline-anchor";

  useEffect(() => {
    const currentStage = stages[activeStage];
    if (!currentStage) return;
    if (!seenStagesRef.current.has(currentStage.id)) {
      seenStagesRef.current.add(currentStage.id);
      logAnalytics(`CraftStagesSeen:${currentStage.id}`);
    }
  }, [activeStage, stages]);

  const stackedStages = useMemo(
    () =>
      stages.map((stage) => (
        <div
          key={`stacked-${stage.id}`}
          className="motion-reduce:opacity-100"
        >
          <TimelineItem stage={stage} />
        </div>
      )),
    [stages],
  );

  const focusSkipTarget = useCallback(() => {
    if (typeof document === "undefined") return;
    const anchor = document.getElementById(skipTargetId);
    anchor?.focus();
  }, [skipTargetId]);

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
        className="relative isolate w-screen overflow-hidden py-16 sm:py-20"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="craft-timeline-heading"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg"
            alt="Perazzi workshop background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0 bg-[color:var(--scrim-soft)]"
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
                "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
                "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
            }}
            aria-hidden
          />
        </div>

        <div
          id="craft-timeline-content"
          tabIndex={-1}
          className="focus:outline-none"
        >
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="space-y-6 rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-10">
              <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-8">
                <div className="space-y-3">
                  <p className="text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
                    Craftsmanship Journey
                  </p>
                  <h2
                    id="craft-timeline-heading"
                    className="text-xl font-light italic text-ink-muted"
                  >
                    Three rituals that define a bespoke Perazzi build
                  </h2>
                  <p className="max-w-3xl text-sm text-ink-muted lg:max-w-4xl">
                    Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a
                    legacy piece. A skip link is provided for assistive tech.
                  </p>
                </div>
              </div>

              {enablePinned ? (
                <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                  <div className="rounded-3xl bg-card/0 p-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink">
                      Fitting Timeline
                    </p>
                    <div className="space-y-1">
                      {stages.map((stage, index) => (
                        <TimelineControlButton
                          key={`control-${stage.id}`}
                          label={stage.title}
                          order={stage.order}
                          active={activeStage === index}
                          onSelect={() => setActiveStage(index)}
                          animationsEnabled={animationsEnabled}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="relative min-h-[640px] overflow-hidden rounded-3xl border border-border/70 bg-card/75 shadow-sm">
                      {stages.map((stage, index) => (
                        <PinnedStagePanel
                          key={`panel-${stage.id}`}
                          stage={stage}
                          active={activeStage === index}
                          animationsEnabled={animationsEnabled}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                      Fitting timeline
                    </p>
                    <p className="text-sm text-ink-muted">
                      Tap through each stage to follow the bespoke process from first measurements to the final finish.
                    </p>
                  </div>
                  <div className="space-y-10">{stackedStages}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

type ControlButtonProps = {
  label: string;
  order: number;
  active: boolean;
  onSelect: () => void;
  animationsEnabled: boolean;
};

function TimelineControlButton({
  label,
  order,
  active,
  onSelect,
  animationsEnabled,
}: ControlButtonProps) {
  const baseClass = cn(
    "group w-full rounded-2xl px-3 py-2 text-left transition-colors focus-ring",
    active
      ? "bg-ink text-card"
      : "bg-transparent text-ink-muted hover:bg-ink/10 hover:text-ink",
  );

  return (
    <motion.button
      type="button"
      className={baseClass}
      onClick={onSelect}
      initial={{ opacity: 0.85 }}
      animate={{
        opacity: active ? 1 : 0.9,
        scale: active ? 1.01 : 1,
      }}
      transition={{ duration: animationsEnabled ? 0.2 : 0 }}
      aria-pressed={active}
    >
      <span
        className={cn(
          "block text-[11px] uppercase font-bold tracking-[0.25em] text-perazzi-red/80 group-hover:text-ink-muted/90",
          active && "text-card/80",
        )}
      >
        Stage {order}
      </span>
      <span className="mt-0.5 block text-sm font-semibold tracking-wide">{label}</span>
    </motion.button>
  );
}

type PinnedStageProps = {
  stage: FittingStage;
  active: boolean;
  animationsEnabled: boolean;
};

function PinnedStagePanel({ stage, active, animationsEnabled }: PinnedStageProps) {
  const sizes = "(min-width: 1600px) 860px, (min-width: 1280px) 760px, 100vw";
  const Wrapper = animationsEnabled ? motion.div : "div";

  const media = (
    <div className="flex h-full w-full flex-col gap-4 p-4 sm:p-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]">
        <Image
          src={stage.media.url}
          alt={stage.media.alt}
          fill
          sizes={sizes}
          className="object-cover"
          priority={stage.order === 1}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/80 via-[color:var(--scrim-strong)]/50 to-transparent"
          aria-hidden
        />
      </div>
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Stage {stage.order}
        </p>
        <h3 className="text-2xl font-semibold text-ink">{stage.title}</h3>
        <p className="text-sm leading-relaxed text-ink-muted">{stage.body}</p>
        {stage.media.caption ? (
          <p className="text-xs text-ink-muted">{stage.media.caption}</p>
        ) : null}
      </div>
    </div>
  );

  if (!animationsEnabled) {
    return <div className="absolute inset-0">{media}</div>;
  }

  return (
    <Wrapper
      className="absolute inset-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 8,
        pointerEvents: active ? "auto" : "none",
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {media}
    </Wrapper>
  );
}
