"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FittingStage } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
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
        className="relative overflow-visible py-28 sm:py-32 lg:py-40"
        aria-labelledby="craft-timeline-heading"
      >
        <div
          id="craft-timeline-content"
          tabIndex={-1}
          className="mt-8 focus:outline-none"
        >
          {enablePinned ? (
            <div
              className="relative hidden w-screen lg:block"
              style={{
                minHeight: "80vh",
                marginLeft: "calc(50% - 50vw)",
                marginRight: "calc(50% - 50vw)",
              }}
            >
              <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                  src="/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg"
                  alt="Perazzi workshop background"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
                      "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%), " +
                      "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%)",
                  }}
                  aria-hidden
                />
              </div>
              <div className="min-h-[80vh] grid place-items-center">
                <div className="relative z-10 w-full max-w-7xl px-6 py-12 lg:px-10">
                  <div className="max-w-3xl space-y-3 text-ink">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
                      Craftsmanship journey
                    </p>
                    <h2
                      id="craft-timeline-heading"
                      className="text-2xl font-semibold text-ink"
                    >
                      Three rituals that define a bespoke Perazzi build
                    </h2>
                    <p className="max-w-none text-base text-ink-muted lg:max-w-4xl">
                      Scroll through each stage to see how measurement, tunnel testing, and
                      finishing combine into a legacy piece. A skip link is provided for assistive tech.
                    </p>
                    <a
                      href={`#${skipTargetId}`}
                      onClick={focusSkipTarget}
                      className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink focus-ring"
                    >
                      Skip timeline
                    </a>
                  </div>

                  <div className="mt-10 grid grid-cols-[minmax(230px,260px)_1fr] items-start gap-10">
                    <div className="flex flex-col gap-6 text-ink">
                      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-ink-muted">
                        <span className="h-px w-10 bg-[color:var(--border-color)]" aria-hidden />
                        <span>Fitting timeline</span>
                      </div>
                      <div className="relative pl-4">
                        <div
                          className="absolute left-1 top-1 bottom-1 w-px bg-[color:var(--border-color)]"
                          aria-hidden
                        />
                        <div className="flex flex-col gap-2">
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
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="relative min-h-[640px] overflow-hidden rounded-3xl bg-[color:var(--surface-elevated)] ring-1 ring-[color:var(--border-color)]">
                        {stages.map((stage, index) => (
                          <PinnedStageMedia
                            key={`media-${stage.id}`}
                            stage={stage}
                            active={activeStage === index}
                            animationsEnabled={animationsEnabled}
                          />
                        ))}
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)] via-transparent to-transparent"
                          aria-hidden
                        />
                      </div>

                      <div className="relative min-h-[380px] mb-10 sm:mb-14">
                        {stages.map((stage, index) => (
                          <PinnedStageText
                            key={`text-${stage.id}`}
                            stage={stage}
                            active={activeStage === index}
                            animationsEnabled={animationsEnabled}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
                  Craftsmanship journey
                </p>
                <h2
                  id="craft-timeline-heading"
                  className="text-2xl font-semibold text-ink"
                >
                  Three rituals that define a bespoke Perazzi build
                </h2>
                <p className="max-w-none text-base text-ink-muted md:max-w-3xl lg:max-w-4xl">
                  Scroll through each stage to see how measurement, tunnel testing, and
                  finishing combine into a legacy piece. A skip link is provided for assistive tech.
                </p>
              </div>

              <a
                href={`#${skipTargetId}`}
                onClick={focusSkipTarget}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink focus-ring"
              >
                Skip timeline
              </a>
              <div className="space-y-10">{stackedStages}</div>
            </div>
          )}
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
  const baseClass =
    "group relative flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 focus-ring " +
    (active
      ? "bg-[color:var(--color-canvas)]/50 text-ink shadow-elevated backdrop-blur-sm"
      : "text-ink-muted hover:text-ink");

  const dotClass = active
    ? "border-perazzi-red bg-perazzi-red"
    : "border-[color:var(--border-color)] bg-transparent";

  const content = (
    <>
      <span
        className={`mt-1 h-2 w-2 rounded-full border transition-colors duration-200 ${dotClass}`}
        aria-hidden
      />
      <div className="flex flex-col gap-1">
        <span className="text-[0.65rem] uppercase tracking-[0.24em] text-ink-muted">
          Stage {order}
        </span>
        <span className="text-sm font-semibold leading-snug">{label}</span>
      </div>
    </>
  );

  if (!animationsEnabled) {
    return (
      <button type="button" className={baseClass} onClick={onSelect}>
        {content}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      className={`${baseClass} transition-colors`}
      onClick={onSelect}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: active ? 1 : 0.85 }}
      transition={{ duration: 0.2 }}
    >
      {content}
    </motion.button>
  );
}

type PinnedStageProps = {
  stage: FittingStage;
  active: boolean;
  animationsEnabled: boolean;
};

function PinnedStageText({ stage, active, animationsEnabled }: PinnedStageProps) {
  const Wrapper = animationsEnabled ? motion.article : "article";
  const content = (
    <div className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/50 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ink-muted">
        Stage {stage.order}
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-ink">{stage.title}</h3>
      <p className="mt-4 text-base leading-relaxed text-ink-muted">{stage.body}</p>
      {stage.media.caption ? (
        <p className="mt-5 text-xs text-ink-muted">{stage.media.caption}</p>
      ) : null}
    </div>
  );

  if (!animationsEnabled) {
    return <article className="absolute inset-0">{content}</article>;
  }

  return (
    <Wrapper
      className="absolute inset-0"
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 24,
        pointerEvents: active ? "auto" : "none",
      }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
    >
      {content}
    </Wrapper>
  );
}

function PinnedStageMedia({ stage, active, animationsEnabled }: PinnedStageProps) {
  const sizes = "(min-width: 1600px) 860px, (min-width: 1280px) 760px, 100vw";
  const Wrapper = animationsEnabled ? motion.div : "div";

  const media = (
    <div className="flex h-full flex-col">
      <div className="relative h-full min-h-[520px] overflow-hidden bg-[color:var(--surface-elevated)]">
        <Image
          src={stage.media.url}
          alt={stage.media.alt}
          fill
          sizes={sizes}
          className="object-cover"
          priority={stage.order === 1}
        />
      </div>
    </div>
  );

  if (!animationsEnabled) {
    return <div className="absolute inset-0">{media}</div>;
  }

  return (
    <Wrapper
      className="absolute inset-0"
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 24,
        pointerEvents: active ? "auto" : "none",
      }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
    >
      {media}
    </Wrapper>
  );
}
