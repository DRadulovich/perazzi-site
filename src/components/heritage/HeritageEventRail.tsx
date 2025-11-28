"use client";

import * as React from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HeritageEvent } from "@/types/heritage";
import { HeritageEventSlide } from "./HeritageEventSlide";
import { heritageMotion } from "@/lib/motionConfig";

export type HeritageEventRailProps = {
  events: HeritageEvent[];
  className?: string;
  scrollProgress?: MotionValue<number>;
  activeEventIndex?: number;
  prefersReducedMotion?: boolean;
};

export function HeritageEventRail({
  events,
  className,
  scrollProgress,
  activeEventIndex = 0,
  prefersReducedMotion,
}: HeritageEventRailProps) {
  if (!events || events.length === 0) {
    return null;
  }

  const isSingle = events.length === 1;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [maxOffset, setMaxOffset] = React.useState(0);
  const isScrollable = maxOffset > 4;

  React.useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current || !trackRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const trackWidth = trackRef.current.scrollWidth;
      const offset = Math.max(0, trackWidth - containerWidth);
      setMaxOffset((prev) => {
        if (Math.abs(prev - offset) < 1) return prev;
        return offset;
      });
    }

    measure();

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [events.length]);

  const rawX: MotionValue<number> | undefined = React.useMemo(
    () =>
      scrollProgress && isScrollable && !isSingle
        ? useTransform(scrollProgress, [0, 1], [0, -maxOffset])
        : undefined,
    [scrollProgress, isScrollable, maxOffset, isSingle],
  );

  const x = React.useMemo(
    () => (rawX ? useSpring(rawX, heritageMotion.railSpring) : undefined),
    [rawX],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mt-8 h-[55vh] w-full overflow-hidden sm:h-[60vh] md:h-[70vh]",
        className,
      )}
    >
      <motion.div
        ref={trackRef}
        className="flex h-full w-full"
        style={x !== undefined ? { x } : undefined}
      >
        {events.map((event, index) => {
          const isActive = index === activeEventIndex;
          return (
            <motion.div
              key={event.id}
              className="flex h-full w-full flex-none items-stretch px-1 sm:px-2"
              animate={{
                scale: isActive ? 1.0 : 0.96,
                opacity: isActive ? 1 : 0.7,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : heritageMotion.slideEmphasisSpring
              }
            >
              <HeritageEventSlide
                event={event}
                isActive={isActive}
                className="w-full"
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
