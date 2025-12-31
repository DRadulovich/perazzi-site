"use client";

import NextImage from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import { useMemo, useRef, useState, type MouseEvent } from "react";
import type { FittingStage } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import { Heading, Text } from "@/components/ui";

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
  pinnedBreakpoint?: "lg" | "xl"; // reserved for future layout options
  reduceMotion?: boolean;
  skipTargetId?: string;
}>;

export function BuildStepsScroller({
  steps,
  intro,
  initialStepId,
  onStepView,
  onStepCta,
  reduceMotion,
  skipTargetId = "build-steps-end",
}: BuildStepsScrollerProps) {
  const trackerRef = useAnalyticsObserver("BuildStepsSeen");
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? prefersReducedMotion;
  const motionEnabled = !shouldReduceMotion;

  const mappedSteps = useMemo(() => steps, [steps]);
  const seenStepsRef = useRef<Set<string>>(new Set());
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [activeStepId, setActiveStepId] = useState<string | undefined>(
    initialStepId ?? mappedSteps[0]?.id
  );
  const [openStepId, setOpenStepId] = useState<string | undefined>(undefined);

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

  const background = intro?.background ?? {
    url: "/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg",
    alt: "Perazzi bespoke build steps background",
  };
  const heading = intro?.heading ?? "The journey";
  const subheading = intro?.subheading ?? "Six moments that shape a bespoke Perazzi";
  const ctaLabel = intro?.ctaLabel ?? "Begin the ritual";

  const introContent = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.1 : 0 },
    },
  } as const;

  const introItem = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  return (
    <section
      ref={trackerRef}
      aria-labelledby="build-steps-heading"
      data-analytics-id="BuildStepsSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
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
          className="absolute inset-0 bg-(--scrim-soft)"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl px-6 lg:px-10">
        <div className="flex w-full flex-col gap-8 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-soft backdrop-blur-md sm:rounded-3xl sm:bg-card/25 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10">
          {/* Intro block */}
          <motion.div
            className="space-y-3 shrink-0"
            variants={introContent}
            initial={motionEnabled ? "hidden" : false}
            whileInView={motionEnabled ? "show" : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
          >
            <motion.div variants={introItem}>
              <Heading
                id="build-steps-heading"
                level={2}
                className="type-section text-ink"
              >
                {heading}
              </Heading>
            </motion.div>
            <motion.div variants={introItem}>
              <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                Scroll to move from moment to moment. Each step is a chapter in the
                ritual of building a Perazzi to your measure.
              </Text>
            </motion.div>
            <motion.div variants={introItem}>
              <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                {subheading}
              </Text>
            </motion.div>
            <motion.div variants={introItem} className="flex flex-wrap items-center gap-4">
              <a
                href="#build-steps-sequence"
                className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-ink/60 text-ink transition hover:border-ink hover:translate-x-0.5 focus-ring"
              >
                <span>{ctaLabel}</span>
                <span aria-hidden="true">↓</span>
              </a>
              <a
                href={`#${skipTargetId}`}
                className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-perazzi-red/60 text-perazzi-red transition hover:border-perazzi-red hover:text-perazzi-red hover:translate-x-0.5 focus-ring"
              >
                <span>Skip step-by-step</span>
                <span aria-hidden="true">→</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Sequence container: vertical scroll-snap with a sticky progress rail */}
          <div id="build-steps-sequence" className="relative">
            <div className="flex">
              {/* Scroll-snap cards column */}
              <div className="relative flex-1">
                <nav className="absolute inset-x-3 top-3 z-20 hidden lg:block sm:inset-x-4 lg:inset-x-6 lg:top-4">
                  <LayoutGroup id="bespoke-build-step-rail">
                    <div className="grid grid-flow-col auto-cols-fr items-center gap-2 rounded-2xl border border-border/75 bg-card/75 px-4 py-3 type-label-tight text-ink-muted shadow-soft backdrop-blur-md">
                      {mappedSteps.map((step, index) => {
                        const isActive = step.id === activeStepId;
                        const stepNumber = index + 1;

                        return (
                          <motion.button
                            key={step.id}
                            type="button"
                            onClick={() => { handleRailClick(index); }}
                            aria-label={`Go to step ${stepNumber}: ${step.title}`}
                            aria-current={isActive ? "step" : undefined}
                            className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-transparent px-3 py-1.5 transition focus-ring ${
                              isActive
                                ? "text-white"
                                : "text-ink-muted hover:text-ink"
                            }`}
                            initial={false}
                            whileHover={motionEnabled ? { y: -1, transition: homeMotion.micro } : undefined}
                            whileTap={motionEnabled ? { y: 0, transition: homeMotion.micro } : undefined}
                          >
                            {isActive ? (
                              motionEnabled ? (
                                <motion.span
                                  layoutId="bespoke-build-step-rail-highlight"
                                  className="absolute inset-0 rounded-full bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                  transition={homeMotion.springHighlight}
                                  aria-hidden="true"
                                />
                              ) : (
                                <span
                                  className="absolute inset-0 rounded-full bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                  aria-hidden="true"
                                />
                              )
                            ) : null}
                            <span
                              className="relative z-10 flex items-center justify-center gap-2"
                            >
                              <span
                                className={`h-2 w-2 rounded-full border transition ${
                                  isActive ? "border-white/40 bg-white/85" : "border-border bg-card"
                                }`}
                                aria-hidden="true"
                              />
                              <span>{`Step ${stepNumber}`}</span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </LayoutGroup>
                </nav>

                <div
                  className="overflow-y-auto rounded-2xl border border-border/70 bg-card/30 shadow-soft backdrop-blur-sm snap-y snap-mandatory lg:pt-24 sm:rounded-3xl h-[80vh]"
                  ref={scrollContainerRef}
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
                        className="group relative snap-start"
                        initial={
                          motionEnabled ? { opacity: 0, y: 16, filter: "blur(12px)" } : false
                        }
                        whileInView={
                          motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined
                        }
                        viewport={{ amount: 0.6, once: true }}
                        transition={motionEnabled ? homeMotion.revealFast : undefined}
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
                                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                loading="lazy"
                              />
                            ) : null}
                            <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
                            <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                            <div className="pointer-events-none absolute inset-0 overlay-gradient-ink-50" aria-hidden />
                          </div>

                          {/* Foreground content */}
                          <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
                            <div className="mx-auto max-w-3xl rounded-2xl border border-border/75 bg-card/80 p-5 shadow-elevated ring-1 ring-border/70 backdrop-blur-md sm:rounded-3xl sm:p-6">
                              <button
                                type="button"
                                className="flex w-full flex-col items-start gap-3 text-left"
                                aria-expanded={openStepId === step.id}
                                onClick={() => { toggleStepOpen(step.id); }}
                              >
                                <div className="w-full space-y-1">
                                  <Heading
                                    id={`build-step-heading-${step.id}`}
                                    level={3}
                                    size="lg"
                                    className="type-card-title text-ink text-2xl sm:text-3xl"
                                  >
                                    {step.title}
                                  </Heading>
                                </div>
                                <span className="type-label-tight text-perazzi-red/70">
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
                                          className="max-w-none type-body text-ink-muted"
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
                                            className="inline-flex min-h-10 items-center justify-center gap-2 pill border border-perazzi-red/60 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
                                          >
                                            {step.ctaLabel}
                                            <span aria-hidden="true">→</span>
                                          </a>
                                        ) : (
                                          <span className="type-label-tight text-ink-muted">
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
