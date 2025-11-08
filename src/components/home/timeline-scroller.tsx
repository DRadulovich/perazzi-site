"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
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

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!enablePinned) return;
    const nextIndex = Math.min(
      stages.length - 1,
      Math.max(0, Math.round(latest * (stages.length - 1))),
    );
    setActiveStage(nextIndex);
  });

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
      className="space-y-6"
      aria-labelledby="craft-timeline-heading"
    >
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
        className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-ink focus-ring"
      >
        Skip timeline
      </a>

      <div
        id="craft-timeline-content"
        tabIndex={-1}
        className="focus:outline-none"
      >
        {enablePinned ? (
          <div
            className="relative hidden lg:block"
            style={{ height: `${stages.length * 120}vh` }}
          >
            <div className="sticky top-24 z-0 h-[80vh] rounded-3xl bg-card/30 p-6">
              <div className="grid h-full grid-cols-[220px_minmax(0,1fr)_minmax(0,1.05fr)] gap-6">
                <div className="space-y-4 text-sm text-ink-muted">
                  {stages.map((stage, index) => (
                    <TimelineControlButton
                      key={`control-${stage.id}`}
                      label={stage.title}
                      active={activeStage === index}
                      onSelect={() => setActiveStage(index)}
                      animationsEnabled={animationsEnabled}
                    />
                  ))}
                </div>
                <div className="relative h-full overflow-hidden rounded-3xl bg-card/80 shadow-xl">
                  {stages.map((stage, index) => (
                    <PinnedStageText
                      key={`text-${stage.id}`}
                      stage={stage}
                      active={activeStage === index}
                      animationsEnabled={animationsEnabled}
                    />
                  ))}
                </div>
                <div className="relative h-full overflow-hidden rounded-3xl bg-card/80 shadow-xl">
                  {stages.map((stage, index) => (
                    <PinnedStageMedia
                      key={`media-${stage.id}`}
                      stage={stage}
                      active={activeStage === index}
                      animationsEnabled={animationsEnabled}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 lg:hidden">{stackedStages}</div>
        )}
      </div>
    </section>
    </>
  );
}

type ControlButtonProps = {
  label: string;
  active: boolean;
  onSelect: () => void;
  animationsEnabled: boolean;
};

function TimelineControlButton({
  label,
  active,
  onSelect,
  animationsEnabled,
}: ControlButtonProps) {
  const baseClass =
    "w-full rounded-full border px-4 py-2 text-left focus-ring " +
    (active
      ? "border-perazzi-red text-perazzi-red"
      : "border-border text-ink-muted hover:text-ink");

  if (!animationsEnabled) {
    return (
      <button type="button" className={baseClass} onClick={onSelect}>
        {label}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      className={`${baseClass} transition-colors`}
      onClick={onSelect}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: active ? 1 : 0.8 }}
      transition={{ duration: 0.2 }}
    >
      {label}
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
    <div className="flex h-full flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
        Stage {stage.order}
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-ink">{stage.title}</h3>
      <p className="mt-4 text-base leading-relaxed text-ink-muted">{stage.body}</p>
      {stage.media.caption ? (
        <p className="mt-auto pt-6 text-xs text-ink-muted">{stage.media.caption}</p>
      ) : null}
    </div>
  );

  if (!animationsEnabled) {
    return <article className="absolute inset-0 p-6">{content}</article>;
  }

  return (
    <Wrapper
      className="absolute inset-0 p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 30,
        pointerEvents: active ? "auto" : "none",
      }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
    >
      {content}
    </Wrapper>
  );
}

function PinnedStageMedia({ stage, active, animationsEnabled }: PinnedStageProps) {
  const sizes = "(min-width: 1600px) 520px, (min-width: 1280px) 400px, 100vw";
  const Wrapper = animationsEnabled ? motion.div : "div";

  const media = (
    <div className="flex h-full flex-col">
      <div className="relative h-full min-h-[360px] overflow-hidden rounded-3xl bg-neutral-200">
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
    return <div className="absolute inset-0 p-4">{media}</div>;
  }

  return (
    <Wrapper
      className="absolute inset-0 p-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 30,
        pointerEvents: active ? "auto" : "none",
      }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
    >
      {media}
    </Wrapper>
  );
}
