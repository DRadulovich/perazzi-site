"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FittingStage } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { BuildStepItem } from "./BuildStepItem";

type BuildStepsScrollerProps = {
  steps: FittingStage[];
  initialStepId?: string;
  onStepView?: (id: string) => void;
  onStepCta?: (id: string) => void;
  pinnedBreakpoint?: "lg" | "xl";
  reduceMotion?: boolean;
  skipTargetId?: string;
};

export function BuildStepsScroller({
  steps,
  initialStepId,
  onStepView,
  onStepCta,
  pinnedBreakpoint = "lg",
  reduceMotion,
  skipTargetId = "build-steps-end",
}: BuildStepsScrollerProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const trackerRef = useAnalyticsObserver("BuildStepsSeen");
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? prefersReducedMotion;
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const breakpointEnabled = pinnedBreakpoint === "xl" ? isXl : isLg;
  const pinnedEnabled = breakpointEnabled && !shouldReduceMotion;
  const initialIndex = initialStepId
    ? Math.max(0, steps.findIndex((step) => step.id === initialStepId))
    : 0;
  const [activeStep, setActiveStep] = useState(initialIndex);

  const scrollTargetRef = pinnedEnabled ? containerRef : trackerRef;

  const { scrollYProgress } = useScroll({
    target: scrollTargetRef,
    offset: ["start start", "end start"],
  });

  const mappedSteps = useMemo(() => steps, [steps]);

  const progress = useTransform(scrollYProgress, [0, 1], [0, mappedSteps.length - 1]);
  useEffect(() => {
    const unsubscribe = progress.on("change", (value) => {
      if (!pinnedEnabled) return;
      const index = Math.round(value);
      if (index !== activeStep) {
        setActiveStep(index);
      }
    });
    return () => unsubscribe();
  }, [progress, pinnedEnabled, activeStep]);

  useEffect(() => {
    const current = mappedSteps[activeStep];
    if (current) {
      logAnalytics(`BuildStepActive:${current.id}`);
      onStepView?.(current.id);
      const next = mappedSteps[activeStep + 1];
      if (next && next.media.kind === "image") {
        const preload = new Image();
        preload.src = next.media.url;
      }
    }
  }, [activeStep, mappedSteps, onStepView]);

  return (
    <section
      ref={trackerRef}
      aria-labelledby="build-steps-heading"
      data-analytics-id="BuildStepsSeen"
      className="space-y-6"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          The journey
        </p>
        <h2 id="build-steps-heading" className="text-2xl font-semibold text-ink">
          Six moments that shape a bespoke Perazzi
        </h2>
        <a
          href={`#${skipTargetId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
        >
          Skip step-by-step
          <span aria-hidden="true">→</span>
        </a>
      </div>
      {pinnedEnabled ? (
        <div
          ref={containerRef}
          className="relative"
          style={{ height: `${mappedSteps.length * 120}vh` }}
        >
          <div className="sticky top-24 flex h-[70vh] flex-col gap-6 rounded-3xl bg-card/60 p-6 shadow-lg backdrop-blur">
            <div
              className="flex justify-center gap-2"
              role="tablist"
              aria-label="Build steps"
            >
              {mappedSteps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  id={`build-step-tab-${step.id}`}
                  role="tab"
                  aria-selected={activeStep === index}
                  aria-current={activeStep === index ? "true" : undefined}
                  aria-controls={`build-step-panel-${step.id}`}
                  className={`h-2 w-8 rounded-full transition-colors focus-ring ${
                    activeStep === index ? "bg-perazzi-red" : "bg-border"
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <span className="sr-only">{step.title}</span>
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              {mappedSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  id={`build-step-panel-${step.id}`}
                  role="tabpanel"
                  aria-labelledby={`build-step-tab-${step.id}`}
                  className="absolute inset-0"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
                  animate={{
                    opacity: activeStep === index ? 1 : 0,
                    y: shouldReduceMotion ? 0 : activeStep === index ? 0 : 40,
                  }}
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : { duration: 0.4, ease: [0.33, 1, 0.68, 1] }
                  }
                >
                  <BuildStepItem
                    step={step}
                    index={index}
                    onCtaClick={onStepCta}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {mappedSteps.map((step, index) => (
            <BuildStepItem
              key={step.id}
              step={step}
              index={index}
              onCtaClick={onStepCta}
            />
          ))}
        </div>
      )}
      {skipTargetId === "build-steps-end" ? (
        <div id={skipTargetId} className="sr-only" tabIndex={-1}>
          Step-by-step overview complete.
        </div>
      ) : null}
    </section>
  );
}
