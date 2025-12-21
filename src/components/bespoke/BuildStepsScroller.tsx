"use client";

import NextImage from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import { useMemo, useRef, useState, type MouseEvent } from "react";
import type { FittingStage } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type BuildStepsScrollerProps = Readonly<{
  steps: FittingStage[];
  intro?: {
    heading?: string;
    subheading?: string;
    ctaLabel?: string;
    background?: { url: string; alt?: string; aspectRatio?: number };
  };
  initialStepId?: string;
  onStepView?: (id: string) => void;
  onStepCta?: (id: string) => void;
  pinnedBreakpoint?: "lg" | "xl";
  reduceMotion?: boolean;
  skipTargetId?: string;
}>;

export function BuildStepsScroller({
  steps,
  intro,
  initialStepId,
  onStepView,
  onStepCta,
  pinnedBreakpoint: _pinnedBreakpoint = "lg",
  reduceMotion,
  skipTargetId = "build-steps-end",
}: BuildStepsScrollerProps) {
  void _pinnedBreakpoint; // reserved for future responsive layout options
  const trackerRef = useAnalyticsObserver("BuildStepsSeen");
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? prefersReducedMotion;

  const mappedSteps = useMemo(() => steps, [steps]);
  const seenStepsRef = useRef<Set<string>>(new Set());
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [activeStepId, setActiveStepId] = useState<string | undefined>(
    initialStepId ?? mappedSteps[0]?.id
  );
  const [openStepId, setOpenStepId] = useState<string | undefined>(undefined);

  // pinnedBreakpoint is accepted for future layout variants but not yet used

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
    const container = scrollContainerRef.current;
    if (!step || !el) return;

    if (container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: offset, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    logAnalytics(`BuildStepRailJump:${step.id}`);
  };

  const toggleStepOpen = (stepId: string) => {
    setOpenStepId((prev) => (prev === stepId ? undefined : stepId));
  };

  const handleMobileDotClick = (
    event: MouseEvent<HTMLButtonElement>,
    stepId: string,
  ) => {
    event.stopPropagation();
    const targetIndex = mappedSteps.findIndex((ms) => ms.id === stepId);
    if (targetIndex !== -1) {
      handleRailClick(targetIndex);
    }
  };

  const totalSteps = mappedSteps.length;
  const background = intro?.background ?? {
    url: "/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg",
    alt: "Perazzi bespoke build steps background",
  };
  const heading = intro?.heading ?? "The journey";
  const subheading = intro?.subheading ?? "Six moments that shape a bespoke Perazzi";
  const ctaLabel = intro?.ctaLabel ?? "Begin the ritual";

  return (
    <section
      ref={trackerRef}
      aria-labelledby="build-steps-heading"
      data-analytics-id="BuildStepsSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      {/* Static background & global scrim/gradient frame */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <NextImage
          src={background.url}
          alt={background.alt ?? "Perazzi bespoke build steps background"}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
          loading="lazy"
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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl px-6 lg:px-10">
        <div className="flex w-full flex-col gap-8 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg lg:px-10">
          {/* Intro block */}
          <div className="max-w-3xl space-y-3 shrink-0">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
              {heading}
            </p>
            <h2
              id="build-steps-heading"
              className="text-sm sm:text-base font-light italic text-ink-muted"
            >
              {subheading}
            </h2>
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-ink-muted">
              Scroll to move from moment to moment. Each step is a chapter in the
              ritual of building a Perazzi to your measure.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#build-steps-sequence"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-ink/60 px-4 py-2 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.2em] text-ink hover:border-ink focus-ring"
              >
                <span>{ctaLabel}</span>
                <span aria-hidden="true">↓</span>
              </a>
              <a
                href={`#${skipTargetId}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                <span>Skip step-by-step</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* Sequence container: vertical scroll-snap with a sticky progress rail */}
          <div id="build-steps-sequence" className="relative">
            <div className="flex">
              {/* Scroll-snap cards column */}
              <div className="relative flex-1">
                <nav className="absolute inset-x-3 top-3 z-20 hidden lg:block sm:inset-x-4 lg:inset-x-6 lg:top-4">
                  <div className="grid grid-flow-col auto-cols-fr items-center gap-2 rounded-2xl border border-border/75 bg-card/75 px-4 py-3 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted shadow-sm backdrop-blur-sm">
                    {mappedSteps.map((step, index) => {
                      const isActive = step.id === activeStepId;
                      const stepNumber = index + 1;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => { handleRailClick(index); }}
                          aria-label={`Go to step ${stepNumber}: ${step.title}`}
                          aria-current={isActive ? "step" : undefined}
                          className={`group flex w-full justify-center items-center gap-2 rounded-full border border-transparent px-3 py-1.5 transition focus-ring ${
                            isActive
                              ? "bg-ink/10 text-ink"
                              : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full border border-border transition ${
                              isActive ? "bg-perazzi-red" : "bg-card"
                            }`}
                          />
                          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em]">
                            {`Step ${stepNumber}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </nav>

                <div
                  className="overflow-y-auto rounded-2xl border border-border/60 bg-card/25 shadow-sm snap-y snap-mandatory lg:pt-24 sm:rounded-3xl sm:border-border/70"
                  ref={scrollContainerRef}
                  style={{ height: "80vh" }}
                >
                  {mappedSteps.map((step, index) => {
                    const isImage =
                      step.media?.kind === "image" && step.media.url;

                    return (
                      <motion.article
                        key={step.id}
                        ref={(el) => {
                          stepRefs.current[index] = el;
                        }}
                        data-step-id={step.id}
                        aria-labelledby={`build-step-heading-${step.id}`}
                        className="relative snap-start"
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
                        onViewportEnter={() => { handleStepEnter(step.id); }}
                      >
                        <div className="relative flex min-h-[80vh]">
                          {/* Step background */}
                          <div className="absolute inset-0 overflow-hidden rounded-3xl">
                            {isImage ? (
                              <NextImage
                                src={step.media.url}
                                alt={step.media.alt ?? step.title}
                                fill
                                sizes="100vw"
                                className="object-cover object-center"
                                loading="lazy"
                              />
                            ) : null}
                            <div
                              className="pointer-events-none absolute inset-0"
                              style={{
                                backgroundImage:
                                  "linear-gradient(to right, color-mix(in srgb, var(--color-perazzi-black) 0%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 0%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 0%, transparent) 0%), " +
                                  "linear-gradient(to bottom, color-mix(in srgb, var(--color-perazzi-black) 100%, transparent) 0%, transparent 50%), " +
                                  "linear-gradient(to top, color-mix(in srgb, var(--color-perazzi-black) 100%, transparent) 0%, transparent 50%)",
                              }}
                              aria-hidden
                            />
                          </div>

                          {/* Foreground content */}
                          <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
                            <div className="mx-auto max-w-3xl rounded-2xl border border-border/75 bg-card/75 p-5 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:p-6">
                              <button
                                type="button"
                                className="flex w-full flex-col items-start gap-3 text-left"
                                aria-expanded={openStepId === step.id}
                                onClick={() => { toggleStepOpen(step.id); }}
                              >
                                <div className="w-full space-y-1">
                                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                                    Step {index + 1} of {totalSteps}
                                  </p>
                                  <h3
                                    id={`build-step-heading-${step.id}`}
                                    className="text-xl sm:text-2xl font-semibold text-ink"
                                  >
                                    {step.title}
                                  </h3>
                                </div>
                                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red/70">
                                  {openStepId === step.id ? "Collapse" : "Read More"}
                                </span>
                              </button>

                              <AnimatePresence initial={false}>
                                {openStepId === step.id ? (
                                  <motion.div
                                    key="content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="space-y-4 pt-4">
                                      {step.bodyHtml ? (
                                        <SafeHtml
                                          className="prose prose-sm max-w-none text-ink-muted sm:prose"
                                          html={step.bodyHtml}
                                        />
                                      ) : null}
                                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                        {step.ctaHref && step.ctaLabel ? (
                                          <a
                                            href={step.ctaHref}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onStepCta?.(step.id);
                                            }}
                                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
                                          >
                                            {step.ctaLabel}
                                            <span aria-hidden="true">→</span>
                                          </a>
                                        ) : (
                                          <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-ink-muted">
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
                                                onClick={(event) =>
                                                  { handleMobileDotClick(event, s.id); }
                                                }
                                                aria-label={`Go to step ${
                                                  mappedSteps.findIndex(
                                                    (ms) => ms.id === s.id
                                                  ) + 1
                                                }`}
                                                aria-current={
                                                  dotActive ? "step" : undefined
                                                }
                                                className={`h-2.5 w-2.5 rounded-full border border-border transition ${
                                                  dotActive ? "bg-perazzi-red" : "bg-card"
                                                }`}
                                              />
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
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
