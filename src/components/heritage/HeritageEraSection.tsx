"use client";

import * as React from "react";
import { useInView, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HeritageEraWithEvents } from "@/types/heritage";
import { EraBackgroundLayer } from "./EraBackgroundLayer";
import { HeritageEventSlide } from "./HeritageEventSlide";
import { HeritageEventRail } from "./HeritageEventRail";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export type HeritageEraSectionProps = Readonly<{
  era: HeritageEraWithEvents;
  index: number;
  className?: string;
  registerEraRef?: (eraId: string, el: HTMLElement | null) => void;
  registerEraFocusRef?: (eraId: string, el: HTMLAnchorElement | null) => void;
  onActiveEventChange?: (eraId: string, eventIndex: number) => void;
  onEraInView?: (eraId: string, index: number) => void;
  onEraScrollProgress?: (eraId: string, index: number, progress: number) => void;
  prefersReducedMotion?: boolean;
  headerOffset?: number;
}>;

export function HeritageEraSection({
  era,
  index,
  className,
  registerEraRef,
  registerEraFocusRef,
  onActiveEventChange,
  onEraInView,
  onEraScrollProgress,
  prefersReducedMotion,
  headerOffset,
}: HeritageEraSectionProps) {
  const travelEndForEvents = 0.8;
  const forwardThreshold = 0.6;
  const backwardThreshold = 0.4;
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const eraFocusRef = React.useRef<HTMLAnchorElement | null>(null);
  const [isShortViewport, setIsShortViewport] = React.useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const isInView = useInView(sectionRef, {
    margin: "-40% 0px -40% 0px",
  });
  const [activeEventIndex, setActiveEventIndex] = React.useState(0);
  const activeEventRef = React.useRef(0);
  const totalEvents = era.events.length;
  const lastProgressRef = React.useRef(0);
  const yearRangeLabel = era.yearRangeLabel ?? `${era.startYear}–${era.isOngoing ? "Today" : era.endYear}`;

  React.useEffect(() => {
    const win = globalThis.window;
    if (!win) return;

    const handle = () => {
      setIsShortViewport(win.innerHeight < 600);
    };

    handle();
    win.addEventListener("resize", handle);
    return () => {
      win.removeEventListener("resize", handle);
    };
  }, []);

  React.useEffect(() => {
    if (isInView) {
      onEraInView?.(era.id, index);
    }
  }, [isInView, era.id, index, onEraInView]);

  React.useEffect(() => {
    activeEventRef.current = 0;
    setActiveEventIndex(0);
    onActiveEventChange?.(era.id, 0);
  }, [totalEvents, era.id, onActiveEventChange]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const progress = Math.min(1, Math.max(0, value));
    const prevProgress = lastProgressRef.current;
    if (Math.abs(progress - prevProgress) > 0.01) {
      lastProgressRef.current = progress;
      onEraScrollProgress?.(era.id, index, progress);
    }

    if (totalEvents <= 1) {
      return;
    }

    const capped = Math.min(progress, travelEndForEvents);
    const segmentedProgress =
      travelEndForEvents > 0 ? capped / travelEndForEvents : 0;

    const eventSpan = totalEvents > 1 ? totalEvents - 1 : 1;
    const eventPosition = segmentedProgress * eventSpan;

    const currentIndex = activeEventRef.current;
    const nextIndex = Math.min(totalEvents - 1, currentIndex + 1);
    const prevIndex = Math.max(0, currentIndex - 1);

    if (eventPosition > currentIndex + forwardThreshold && nextIndex !== currentIndex) {
      activeEventRef.current = nextIndex;
      setActiveEventIndex(nextIndex);
      onActiveEventChange?.(era.id, nextIndex);
    } else if (eventPosition < currentIndex - (1 - backwardThreshold) && prevIndex !== currentIndex) {
      activeEventRef.current = prevIndex;
      setActiveEventIndex(prevIndex);
      onActiveEventChange?.(era.id, prevIndex);
    }
  });

  if (prefersReducedMotion) {
    return (
      <section
        ref={(el) => {
          sectionRef.current = el;
          registerEraRef?.(era.id, el);
        }}
        className={cn("relative border-b border-white/5", className)}
        aria-labelledby={`heritage-era-${index}`}
      >
        <EraBackgroundLayer
          src={era.backgroundSrc}
          overlayColor={era.overlayColor}
          alt={era.label}
        />

        <a
          ref={(el) => {
            eraFocusRef.current = el;
            registerEraFocusRef?.(era.id, el);
          }}
          tabIndex={-1}
          className="sr-only"
        >
          {era.label}
        </a>

        <div className="relative z-10 px-4 py-16">
          <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-black/60 p-4 shadow-soft backdrop-blur-md sm:rounded-3xl sm:px-6 sm:py-8 sm:shadow-medium md:px-10 md:py-10">
            <header className="max-w-4xl">
              <Heading
                asChild
                size="sm"
                className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-neutral-300"
              >
                <h2 id={`heritage-era-${index}`}>{era.label}</h2>
              </Heading>
              <Text
                asChild
                size="xs"
                className="mt-2 tracking-[0.25em] text-neutral-500"
                leading="normal"
              >
                <p>{yearRangeLabel}</p>
              </Text>
            </header>

            <div className="mt-8 space-y-6">
              {era.events.map((event) => (
                <HeritageEventSlide
                  key={event.id}
                  event={event}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const extraEvents = Math.max(0, totalEvents - 1);
  const baseScreens = 2;
  const screensPerExtraEvent = 1;
  const extraPaddingScreens = 1;
  const totalScreens = baseScreens + extraEvents * screensPerExtraEvent + extraPaddingScreens;
  const sectionMinHeight = totalScreens * 100;

  return (
    <section
      ref={(el) => {
        sectionRef.current = el;
        registerEraRef?.(era.id, el);
      }}
      className={cn("relative border-b border-white/5", className)}
      aria-labelledby={`heritage-era-${index}`}
      style={{
        minHeight: `${sectionMinHeight}vh`,
      }}
    >
      <a
        ref={(el) => {
          eraFocusRef.current = el;
          registerEraFocusRef?.(era.id, el);
        }}
        tabIndex={-1}
        className="sr-only"
      >
        {era.label}
      </a>

      <div
        className={cn(
          "relative sticky flex items-center",
          isShortViewport ? "h-[85vh]" : "h-screen",
        )}
        style={{ top: headerOffset ?? 0 }}
      >
        <EraBackgroundLayer
          src={era.backgroundSrc}
          overlayColor={era.overlayColor}
          alt={era.label}
        />

        <div className="relative z-10 w-full px-4 py-10 md:px-8 md:py-16">
          <header className="mx-auto max-w-6xl pb-6">
            <Heading
              asChild
              size="sm"
              className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-neutral-300"
            >
              <h2 id={`heritage-era-${index}`}>{era.label}</h2>
            </Heading>
            <Text
              asChild
              size="xs"
              className="mt-2 tracking-[0.25em] text-neutral-500"
              leading="normal"
            >
              <p>{yearRangeLabel}</p>
            </Text>
          </header>

          <HeritageEventRail
            events={era.events}
            scrollProgress={scrollYProgress}
            activeEventIndex={activeEventIndex}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>
    </section>
  );
}
