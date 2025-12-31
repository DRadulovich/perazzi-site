"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HeritageEvent } from "@/types/heritage";
import { HeritageEventSlide } from "./HeritageEventSlide";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

export type HeritageEventRailProps = Readonly<{
  events: readonly HeritageEvent[];
  className?: string;
  scrollProgress?: MotionValue<number>;
  activeEventIndex?: number;
  prefersReducedMotion?: boolean;
}>;

export function HeritageEventRail({
  events,
  className,
  scrollProgress,
  activeEventIndex = 0,
  prefersReducedMotion = false,
}: HeritageEventRailProps) {
  const analyticsRef = useAnalyticsObserver<HTMLDivElement>("HeritageEventRailSeen");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [maxOffset, setMaxOffset] = React.useState(0);
  const isScrollable = maxOffset > 4;
  const movementStart = 0.03;
  const travelEnd = 0.6;
  const fallbackProgress = useMotionValue(0);
  const progress = scrollProgress ?? fallbackProgress;

  React.useLayoutEffect(() => {
    if (!containerRef.current || !trackRef.current) return;
    let frameId = 0;

    const measure = () => {
      frameId = 0;
      if (!containerRef.current || !trackRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const trackWidth = trackRef.current.scrollWidth;
      const offset = Math.max(0, trackWidth - containerWidth);
      setMaxOffset((prev) => {
        if (Math.abs(prev - offset) < 1) return prev;
        return offset;
      });
    };

    const scheduleMeasure = () => {
      if (frameId) return;
      frameId = globalThis.requestAnimationFrame(measure);
    };

    measure();

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => {
        scheduleMeasure();
      });
      observer.observe(containerRef.current);
      observer.observe(trackRef.current);
      return () => {
        observer.disconnect();
        if (frameId) globalThis.cancelAnimationFrame(frameId);
      };
    }

    globalThis.addEventListener("resize", scheduleMeasure);
    return () => {
      globalThis.removeEventListener("resize", scheduleMeasure);
      if (frameId) globalThis.cancelAnimationFrame(frameId);
    };
  }, [events.length]);

  const x: MotionValue<number> = useTransform(
    progress,
    [movementStart, travelEnd],
    [0, -maxOffset],
  );

  if (!events || events.length === 0) {
    return null;
  }

  const isSingle = events.length === 1;

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        analyticsRef.current = node;
      }}
      data-analytics-id="HeritageEventRailSeen"
      className={cn(
        "relative mt-8 h-[55vh] w-full overflow-hidden sm:h-[60vh] md:h-[70vh]",
        className,
      )}
    >
      <motion.div
        ref={trackRef}
        className="flex h-full w-full will-change-transform"
        style={isScrollable && !isSingle && !prefersReducedMotion ? { x } : undefined}
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            className="flex h-full w-full flex-none items-stretch px-1 sm:px-2"
          >
            <HeritageEventSlide
              event={event}
              className="w-full"
              isActive={index === activeEventIndex}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
