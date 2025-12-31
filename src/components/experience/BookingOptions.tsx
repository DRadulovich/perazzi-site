"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { Button, Container, Heading, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import type { BookingSection } from "@/types/experience";

type BookingOptionsProps = Readonly<{
  bookingSection: BookingSection;
}>;

export function BookingOptions({ bookingSection }: BookingOptionsProps) {
  const analyticsRef = useAnalyticsObserver("ExperienceBookingSeen");
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerLoaded, setSchedulerLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const schedulerPanelId = "experience-scheduler-panel";
  const schedulerNoteId = "experience-scheduler-note";
  const options = bookingSection.options;
  const scheduler = bookingSection.scheduler;
  const heading = bookingSection.heading ?? "Book a fitting";
  const subheading = bookingSection.subheading ?? "Choose the session that fits your journey";
  const optionCtaLabel = bookingSection.optionCtaLabel ?? "Reserve this session";

  if (!options.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperienceBookingSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="experience-booking-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/experience/pweb-experience-bookingoptions-bg.jpg"
          alt="Perazzi booking options background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div
          className="absolute inset-0 bg-(--scrim-soft)"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/40">
          <motion.div
            className="space-y-2"
            initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
            whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
          >
            <Heading
              id="experience-booking-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
            <Text className="type-section-subtitle mb-4 text-ink-muted">
              {subheading}
            </Text>
          </motion.div>

          <motion.div
            className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-3"
            initial={motionEnabled ? "hidden" : false}
            whileInView={motionEnabled ? "show" : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: motionEnabled ? 0.08 : 0 } },
            }}
          >
            {options.map((option) => (
              <motion.article
                key={option.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated md:p-7 lg:p-8"
                variants={{
                  hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
                  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
                }}
              >
                <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                <div className="space-y-2">
                  <Heading level={3} className="type-card-title text-ink">
                    {option.title}
                  </Heading>
                  <Text size="caption" muted>
                    {option.durationLabel ?? (option.durationMins ? `${option.durationMins} minutes` : "")}
                  </Text>
                  <SafeHtml
                    className="type-body max-w-none leading-relaxed text-ink-muted"
                    html={option.descriptionHtml}
                  />
                </div>
                <div className="mt-auto pt-6">
                  <Button
                    asChild
                    variant="secondary"
                    size="md"
                    className="rounded-full px-6 py-3 type-button"
                    onClick={() =>
                      logAnalytics(`FittingCtaClick:${option.id}`)
                    }
                  >
                    <a href={option.href}>{optionCtaLabel}</a>
                  </Button>
                </div>
              </motion.article>
            ))}
          </motion.div>
          {scheduler ? (
            <motion.div
              className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated md:p-8 lg:p-10"
              initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
              whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
              viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
              transition={motionEnabled ? homeMotion.revealFast : undefined}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Heading level={3} className="type-card-title text-ink">
                  {scheduler.title}
                </Heading>
                <Button
                  variant="primary"
                  size="sm"
                  aria-controls={schedulerPanelId}
                  aria-expanded={schedulerOpen}
                  aria-describedby={schedulerNoteId}
                  className="rounded-full px-4 py-2 type-button"
                  onClick={() => {
                    setSchedulerOpen((prev) => {
                      const next = !prev;
                      if (next && !schedulerLoaded) {
                        setSchedulerLoaded(true);
                      }
                      logAnalytics(
                        `ExperienceScheduler:${next ? "open" : "close"}`,
                      );
                      return next;
                    });
                  }}
                >
                  {schedulerOpen
                    ? scheduler.toggleCloseLabel ?? "Hide scheduler"
                    : scheduler.toggleOpenLabel ?? "Begin Your Fitting"}
                </Button>
              </div>
              <p id={schedulerNoteId} className="sr-only">
                {scheduler.helperText ?? "Selecting Begin Your Fitting loads an embedded booking form below."}
              </p>
                <div
                  id={schedulerPanelId}
                  className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:bg-card/80 md:p-4 lg:p-5"
                  aria-live="polite"
                >
                  {schedulerLoaded ? (
                    <motion.div
                      className="overflow-hidden"
                      initial={motionEnabled ? { height: 0, opacity: 0, filter: "blur(10px)" } : false}
                      animate={schedulerOpen ? { height: "auto", opacity: 1, filter: "blur(0px)" } : { height: 0, opacity: 0, filter: "blur(10px)" }}
                      transition={motionEnabled ? homeMotion.revealFast : undefined}
                      aria-hidden={!schedulerOpen}
                    >
                      <iframe
                        src={scheduler.src}
                        title={scheduler.iframeTitle ?? `Booking — ${scheduler.title}`}
                        className="h-[480px] w-full rounded-2xl border border-border/70 bg-card/0"
                        loading="lazy"
                      />
                    </motion.div>
                  ) : (
                    <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-dashed border-border/70 type-body-sm text-ink-muted">
                      The booking form appears here once you choose Begin Your Fitting.
                    </div>
                  )}
              </div>
              <p className="type-caption text-ink-muted">
                Prefer email?{" "}
                <a
                  href={scheduler.fallbackHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-perazzi-red focus-ring"
                >
                  Open booking in a new tab{" "}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            </motion.div>
          ) : null}
        </Section>
      </Container>
    </section>
  );
}
