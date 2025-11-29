"use client";

import NextImage from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const [activeStepId, setActiveStepId] = useState<string | undefined>(
    initialStepId ?? mappedSteps[0]?.id
  );

  const [viewportAspectRatio, setViewportAspectRatio] = useState<number>(() => {
    if (typeof window === "undefined" || window.innerHeight === 0) return 16 / 9;
    return window.innerWidth / window.innerHeight;
  });

  useEffect(() => {
    const updateAspectRatio = () => {
      if (window.innerHeight === 0) return;
      setViewportAspectRatio(window.innerWidth / window.innerHeight);
    };

    updateAspectRatio();
    window.addEventListener("resize", updateAspectRatio);
    window.addEventListener("orientationchange", updateAspectRatio);

    return () => {
      window.removeEventListener("resize", updateAspectRatio);
      window.removeEventListener("orientationchange", updateAspectRatio);
    };
  }, []);

  void pinnedBreakpoint;

  const handleStepEnter = (stepId: string) => {
    setActiveStepId((prev) => (prev === stepId ? prev : stepId));

    if (seenStepsRef.current.has(stepId)) return;
    seenStepsRef.current.add(stepId);
    logAnalytics(`BuildStepActive:${stepId}`);
    onStepView?.(stepId);
  };

  const handleRailClick = (index: number) => {
    const step = mappedSteps[index];
    const el = stepRefs.current[index];
    if (!step || !el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    logAnalytics(`BuildStepRailJump:${step.id}`);
  };

  const totalSteps = mappedSteps.length;

  return (
    <section
      ref={trackerRef}
      aria-labelledby="build-steps-heading"
      data-analytics-id="BuildStepsSeen"
      className="relative isolate w-screen overflow-hidden py-16 sm:py-20 max-h-screen"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        aspectRatio: viewportAspectRatio,
        maxHeight: "100vh",
      }}
    >
      {/* Static background & global scrim/gradient frame */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <NextImage
          src="/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg"
          alt="Perazzi bespoke build steps background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div
          className="absolute inset-0 bg-[color:var(--scrim-soft)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl px-6 lg:px-10">
        <div className="flex h-full flex-col gap-8 rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-10">
          {/* Intro block */}
          <div className="max-w-3xl space-y-4 shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
              The journey
            </p>
            <h2
              id="build-steps-heading"
              className="text-xl font-light italic text-ink sm:text-2xl"
            >
              Six moments that shape a bespoke Perazzi
            </h2>
            <p className="max-w-xl text-sm text-ink-muted sm:text-base">
              Scroll to move from moment to moment. Each step is a chapter in the
              ritual of building a Perazzi to your measure.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#build-steps-sequence"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-ink focus-ring"
              >
                Begin the ritual
                <span aria-hidden="true">↓</span>
              </a>
              <a
                href={`#${skipTargetId}`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
              >
                Skip step-by-step
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* Sequence container: vertical scroll-snap with a sticky progress rail */}
          <div id="build-steps-sequence" className="relative flex-1 min-h-0">
            <div className="flex h-full gap-4 lg:gap-10">
              {/* Scroll-snap cards column */}
              <div className="relative flex-1 min-h-0">
                <div className="h-full overflow-y-auto rounded-3xl border border-border/70 bg-card/25 shadow-sm snap-y snap-mandatory">
                  {mappedSteps.map((step, index) => {
                    const isActive = step.id === activeStepId;

                    const isImage =
                      step.media && step.media.kind === "image" && step.media.url;

                    return (
                      <motion.article
                        key={step.id}
                        ref={(el) => {
                          stepRefs.current[index] = el;
                        }}
                        data-step-id={step.id}
                        aria-labelledby={`build-step-heading-${step.id}`}
                        className="relative min-h-full snap-start"
                        initial={
                          shouldReduceMotion ? false : { opacity: 0, y: 16 }
                        }
                        whileInView={
                          shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                        }
                        viewport={{ amount: 0.6, once: true }}
                        transition={
                          shouldReduceMotion
                            ? undefined
                            : { duration: 0.35, ease: "easeOut" }
                        }
                        onViewportEnter={() => handleStepEnter(step.id)}
                      >
                        {/* Step background */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl">
                          {isImage ? (
                            <NextImage
                              src={step.media.url}
                              alt={step.media.alt ?? step.title}
                              fill
                              sizes="100vw"
                              className="object-cover object-center"
                            />
                          ) : null}
                          <div
                            className="absolute inset-0 bg-[color:var(--scrim-strong)]"
                            aria-hidden
                          />
                        </div>

                        {/* Foreground content */}
                        <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
                          <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-lg backdrop-blur-sm sm:p-8">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                              Step {index + 1} of {totalSteps}
                            </p>
                            <h3
                              id={`build-step-heading-${step.id}`}
                              className="text-2xl font-semibold text-ink sm:text-3xl"
                            >
                              {step.title}
                            </h3>
                            {step.bodyHtml ? (
                              <div
                                className="prose prose-sm max-w-none text-ink-muted sm:prose"
                                dangerouslySetInnerHTML={{
                                  __html: step.bodyHtml,
                                }}
                              />
                            ) : null}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                              {step.ctaHref && step.ctaLabel ? (
                                <a
                                  href={step.ctaHref}
                                  onClick={() => onStepCta?.(step.id)}
                                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
                                >
                                  {step.ctaLabel}
                                  <span aria-hidden="true">→</span>
                                </a>
                              ) : (
                                <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">
                                  Bespoke moment {index + 1}
                                </span>
                              )}

                              {/* Mobile step indicator */}
                              <div className="flex items-center gap-2 lg:hidden">
                                {mappedSteps.map((s) => {
                                  const dotActive = s.id === activeStepId;
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => {
                                        const targetIndex = mappedSteps.findIndex(
                                          (ms) => ms.id === s.id
                                        );
                                        if (targetIndex !== -1) {
                                          handleRailClick(targetIndex);
                                        }
                                      }}
                                      aria-label={`Go to step ${
                                        mappedSteps.findIndex(
                                          (ms) => ms.id === s.id
                                        ) + 1
                                      }`}
                                      aria-current={
                                        dotActive ? "step" : undefined
                                      }
                                      className={`h-2 w-2 rounded-full border border-border transition ${
                                        dotActive ? "bg-perazzi-red" : "bg-card"
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>

              {/* Desktop progress rail */}
              {totalSteps > 0 ? (
                <nav
                  aria-label="Build steps"
                  className="relative hidden w-24 shrink-0 lg:block"
                >
                  <div className="sticky top-1/2 -translate-y-1/2">
                    <div className="inline-flex flex-col items-end gap-3 rounded-3xl border border-border/70 bg-card/85 px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-ink-muted backdrop-blur-sm shadow-sm">
                      {mappedSteps.map((step, index) => {
                        const isActive = step.id === activeStepId;
                        const stepNumber = index + 1;

                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => handleRailClick(index)}
                            aria-label={`Go to step ${stepNumber}: ${step.title}`}
                            aria-current={isActive ? "step" : undefined}
                            className="group flex items-center gap-2"
                          >
                            <span
                              className={`h-2 w-2 rounded-full border border-border transition ${
                                isActive ? "bg-perazzi-red" : "bg-card"
                              }`}
                            />
                            <span
                              className={`transition ${
                                isActive ? "text-ink" : "text-ink-muted"
                              }`}
                            >
                              {stepNumber.toString().padStart(2, "0")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </nav>
              ) : null}
            </div>
          </div>

          {/* Skip target sentinel */}
          {skipTargetId ? (
            <div id={skipTargetId} className="sr-only" tabIndex={-1}>
              Step-by-step overview complete.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
