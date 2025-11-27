"use client";

import NextImage from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useRef } from "react";
import type { FittingStage } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

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
  const trackerRef = useAnalyticsObserver("BuildStepsSeen");
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? prefersReducedMotion;
  const mappedSteps = useMemo(() => steps, [steps]);
  const seenStepsRef = useRef<Set<string>>(new Set());
  void initialStepId;
  void pinnedBreakpoint;

  return (
    <section
      ref={trackerRef}
      aria-labelledby="build-steps-heading"
      data-analytics-id="BuildStepsSeen"
      className="relative w-screen overflow-hidden py-16 sm:py-20"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <NextImage
          src="/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg"
          alt="Perazzi bespoke build steps background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-6 lg:px-10">
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
        <div className="relative mx-auto max-w-5xl">
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-[color:var(--border-color)] lg:block"
            aria-hidden
          />
          <div className="space-y-12 lg:space-y-20">
            {mappedSteps.map((step, index) => (
              <motion.div
                key={step.id}
                className="relative"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={
                  shouldReduceMotion
                    ? undefined
                    : { duration: 0.6, ease: [0.33, 1, 0.68, 1] }
                }
                onViewportEnter={() => {
                  if (seenStepsRef.current.has(step.id)) return;
                  seenStepsRef.current.add(step.id);
                  logAnalytics(`BuildStepActive:${step.id}`);
                  onStepView?.(step.id);
                }}
              >
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-perazzi-red bg-[color:var(--color-canvas)] lg:block"
                  aria-hidden
                />
                <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  {index % 2 === 0 ? (
                    <>
                      <StepText step={step} index={index} onStepCta={onStepCta} />
                      <StepImage step={step} />
                    </>
                  ) : (
                    <>
                      <StepImage step={step} />
                      <StepText step={step} index={index} onStepCta={onStepCta} />
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {skipTargetId === "build-steps-end" ? (
          <div id={skipTargetId} className="sr-only" tabIndex={-1}>
            Step-by-step overview complete.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StepText({
  step,
  index,
  onStepCta,
}: {
  step: FittingStage;
  index: number;
  onStepCta?: (id: string) => void;
}) {
  const hasCta = step.ctaHref && step.ctaLabel;
  return (
    <div className="space-y-4 text-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
        Step {index + 1}
      </p>
      <h3 className="text-2xl font-semibold">{step.title}</h3>
      {step.bodyHtml ? (
        <div
          className="prose prose-sm max-w-none text-ink-muted"
          dangerouslySetInnerHTML={{ __html: step.bodyHtml }}
        />
      ) : null}
      {hasCta ? (
        <a
          href={step.ctaHref}
          onClick={() => onStepCta?.(step.id)}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
        >
          {step.ctaLabel}
          <span aria-hidden="true">→</span>
        </a>
      ) : null}
    </div>
  );
}

function StepImage({ step }: { step: FittingStage }) {
  if (step.media.kind !== "image") return null;
  const ratio = step.media.aspectRatio ?? 16 / 9;
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[color:var(--surface-elevated)]"
      style={{ aspectRatio: ratio }}
    >
      <NextImage
        src={step.media.url}
        alt={step.media.alt ?? step.title}
        fill
        sizes="(min-width: 1280px) 520px, (min-width: 1024px) 50vw, 100vw"
        className="object-cover object-center"
      />
    </div>
  );
}
