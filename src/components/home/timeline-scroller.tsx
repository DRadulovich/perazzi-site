"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FittingStage } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  const [activeStage, setActiveStage] = useState(0);
  const seenStagesRef = useRef(new Set<string>());

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
      console.log(`[analytics] CraftStagesSeen:${currentStage.id}`);
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

  return (
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
        <p className="max-w-2xl text-base text-ink-muted">
          Scroll through each stage to see how measurement, tunnel testing, and
          finishing combine into a legacy piece. A skip link is provided for assistive tech.
        </p>
      </div>

      <a
        href="#craft-timeline-content"
        className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-ink focus-ring"
      >
        Skip to timeline content
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
            <div className="sticky top-24 z-0 flex h-[80vh] items-stretch gap-8 rounded-3xl bg-card/30 p-6">
              <div className="relative flex-1">
                {stages.map((stage, index) => (
                  <TimelineItem
                    key={stage.id}
                    stage={stage}
                    layout="pinned"
                    active={activeStage === index}
                  />
                ))}
              </div>
              <div className="w-64 space-y-4 text-sm text-ink-muted">
                {stages.map((stage, index) => (
                  <motion.button
                    key={`control-${stage.id}`}
                    type="button"
                    className={`w-full rounded-full border px-4 py-2 text-left transition-colors ${
                      activeStage === index
                        ? "border-perazzi-red text-perazzi-red"
                        : "border-border text-ink-muted hover:text-ink"
                    }`}
                    onClick={() => setActiveStage(index)}
                  >
                    {stage.title}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 lg:hidden">{stackedStages}</div>
        )}
      </div>
    </section>
  );
}
