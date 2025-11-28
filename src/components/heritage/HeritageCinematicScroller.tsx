"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type WheelEvent as ReactWheelEvent } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { formatEraRange } from "@/config/heritage-eras";
import { type HeritageEvent, type HeritageEventLink } from "@/types/heritage";
import {
  groupEventsByEra,
  type HeritageEraWithEvents,
} from "@/utils/heritage/groupEventsByEra";
import { cn } from "@/lib/utils";

const HERITAGE_SCROLL_CONFIG = {
  sectionHeightPerEventVh: 100,
  textRowHeightVh: 30,
  mediaRowHeightVh: 50,
  introEnd: 0.25,
  contentStart: 0.30,
  contentEnd: 0.42,
  outroStart: 0.90,
  outroEnd: 1.0,
};

type HeritageCinematicScrollerProps = {
  events: HeritageEvent[];
  className?: string;
};

export function HeritageCinematicScroller({
  events,
  className,
}: HeritageCinematicScrollerProps) {
  const eraGroups: HeritageEraWithEvents[] = groupEventsByEra(events);
  const shouldReduceMotionRaw = useReducedMotion();
  const shouldReduceMotion = shouldReduceMotionRaw ?? false;
  const eraRefs = useRef<(HTMLElement | null)[]>([]);
  const eventCounts = eraGroups.map((era) => era.events.length);
  const [globalActive, setGlobalActive] = useState<{
    eraIndex: number;
    eventIndex: number;
  }>({
    eraIndex: 0,
    eventIndex: 0,
  });

  return (
    <section
      id="heritage-cinematic-scroller"
      className={cn("relative w-screen bg-black text-white", className)}
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      {eraGroups.map((era, index) => (
        <EraStage
          key={era.id}
          era={era}
          eraIndex={index}
          totalEras={eraGroups.length}
          shouldReduceMotion={shouldReduceMotion}
          registerEraRef={(el) => {
            eraRefs.current[index] = el;
          }}
          onActiveEventChange={(eventIndex) => {
            setGlobalActive((prev) =>
              prev.eraIndex === index && prev.eventIndex === eventIndex
                ? prev
                : { eraIndex: index, eventIndex },
            );
          }}
        />
      ))}
    </section>
  );
}

function getEventSegmentMidScrollTop(params: {
  eventIndex: number;
  eventCount: number;
  eraTopPx: number;
  viewportHeightPx: number;
}) {
  const { eventIndex, eventCount, eraTopPx, viewportHeightPx } = params;
  const { sectionHeightPerEventVh, contentStart } = HERITAGE_SCROLL_CONFIG;

  const sectionHeightPx = (sectionHeightPerEventVh / 100) * viewportHeightPx * eventCount;
  const midMotionProgress = (eventIndex + 0.5) / eventCount;
  const scrollYProgressMid = contentStart + midMotionProgress * (1 - contentStart);

  return eraTopPx + scrollYProgressMid * sectionHeightPx;
}

function handleJumpToEvent(
  eventIndex: number,
  containerRef: MutableRefObject<HTMLElement | null>,
  eventCount: number,
  shouldReduceMotion: boolean,
) {
  const container = containerRef.current;
  if (!container) return;

  const clampedIndex = Math.max(0, Math.min(eventCount - 1, eventIndex));
  const rect = container.getBoundingClientRect();
  const eraTop = rect.top + window.scrollY;
  const viewportHeight = window.innerHeight || 1;
  const targetTop = getEventSegmentMidScrollTop({
    eventIndex: clampedIndex,
    eventCount,
    eraTopPx: eraTop,
    viewportHeightPx: viewportHeight,
  });

  window.scrollTo({
    top: targetTop,
    behavior: shouldReduceMotion ? "auto" : "smooth",
  });
}

type EraStageProps = {
  era: HeritageEraWithEvents;
  eraIndex: number;
  totalEras: number;
  shouldReduceMotion: boolean;
  registerEraRef: (el: HTMLElement | null) => void;
  onActiveEventChange: (eventIndex: number) => void;
};

function EraStage({
  era,
  eraIndex,
  totalEras,
  shouldReduceMotion,
  registerEraRef,
  onActiveEventChange,
}: EraStageProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const isSnappingRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const DEFAULT_X_RANGE = 800;
  const [textXRangePx, setTextXRangePx] = useState<number>(DEFAULT_X_RANGE);
  const [mediaXRangePx, setMediaXRangePx] = useState<number>(DEFAULT_X_RANGE);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const activeEventChangeRef = useRef(onActiveEventChange);

  const {
    introEnd,
    contentStart,
    contentEnd,
    outroStart,
    outroEnd,
    sectionHeightPerEventVh,
  } = HERITAGE_SCROLL_CONFIG;

  const eventCount = Math.max(era.events.length, 1);
  const sectionHeightVh = eventCount * sectionHeightPerEventVh;

  const blackOverlayCinematic = useTransform(
    scrollYProgress,
    [0, 0.05, introEnd, outroStart, outroEnd],
    [1, 1, 0, 0, 1],
  );
  const blackOverlayStatic = useTransform(scrollYProgress, () => 0);
  const blackOverlayOpacity: MotionValue<number> = shouldReduceMotion
    ? blackOverlayStatic
    : blackOverlayCinematic;

  const backgroundCinematic = useTransform(scrollYProgress, [0, 0.12, introEnd], [0, 1, 1]);
  const backgroundStatic = useTransform(scrollYProgress, () => 1);
  const backgroundOpacity: MotionValue<number> = shouldReduceMotion
    ? backgroundStatic
    : backgroundCinematic;

  const introTitleCinematic = useTransform(
    scrollYProgress,
    [0.1, 0.17, 0.23, introEnd],
    [0, 1, 1, 0],
  );
  const introTitleStatic = useTransform(scrollYProgress, () => 0);
  const introTitleOpacity: MotionValue<number> = shouldReduceMotion
    ? introTitleStatic
    : introTitleCinematic;

  const introYearsCinematic = useTransform(
    scrollYProgress,
    [0.16, 0.23, 0.29, contentStart],
    [0, 1, 1, 0],
  );
  const introYearsStatic = useTransform(scrollYProgress, () => 0);
  const introYearsOpacity: MotionValue<number> = shouldReduceMotion
    ? introYearsStatic
    : introYearsCinematic;

  const contentCinematic = useTransform(scrollYProgress, [contentStart, contentEnd], [0, 1]);
  const contentStatic = useTransform(scrollYProgress, () => 1);
  const contentOpacity: MotionValue<number> = shouldReduceMotion ? contentStatic : contentCinematic;
  const contentScale = useTransform(scrollYProgress, (value) => {
    if (shouldReduceMotion) return 1;
    const bumpStart = contentStart;
    const bumpMid = contentStart + 0.03;
    const bumpEnd = contentStart + 0.06;
    if (value <= bumpStart) return 1;
    if (value >= bumpEnd) return 1;
    if (value < bumpMid) {
      return 1 + ((value - bumpStart) / (bumpMid - bumpStart)) * 0.02;
    }
    return 1.02 - ((value - bumpMid) / (bumpEnd - bumpMid)) * 0.02;
  });

  const motionProgress = useTransform(scrollYProgress, (value) => {
    const normalized = (value - contentStart) / (1 - contentStart);
    return Math.min(Math.max(normalized, 0), 1);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateRanges = () => {
      const vw = window.innerWidth || 1024;
      const textRange = vw * 0.7;
      const mediaRange = vw * 0.7;
      setTextXRangePx(textRange);
      setMediaXRangePx(mediaRange);
    };

    updateRanges();
    window.addEventListener("resize", updateRanges);

    return () => {
      window.removeEventListener("resize", updateRanges);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = motionProgress.on("change", (value) => {
      if (eventCount === 0) {
        setActiveIndex(0);
        return;
      }

      const clamped = Math.min(Math.max(value, 0), 1);
      const rawIndex = clamped * eventCount;
      const index = Math.min(eventCount - 1, Math.max(0, Math.floor(rawIndex)));

      setActiveIndex(index);
    });

    return () => {
      unsubscribe();
    };
  }, [motionProgress, eventCount]);

  useEffect(() => {
    activeEventChangeRef.current = onActiveEventChange;
  }, [onActiveEventChange]);

  useEffect(() => {
    if (era.events.length === 0) return;
    activeEventChangeRef.current?.(activeIndex);
  }, [activeIndex, era.events.length]);

  useEffect(() => {
    wheelDeltaRef.current = 0;
  }, [activeIndex, eventCount]);

  const SNAP_THRESHOLD = 120;
  const SNAP_COOLDOWN_MS = 500;

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    if (era.events.length <= 1) return;

    const container = containerRef.current;
    if (!container) return;

    const deltaY = event.deltaY;
    const canGoNext = activeIndex < eventCount - 1;
    const canGoPrev = activeIndex > 0;

    if (deltaY > 0 && !canGoNext) {
      return;
    }
    if (deltaY < 0 && !canGoPrev) {
      return;
    }

    if (isSnappingRef.current) {
      event.preventDefault();
      return;
    }

    const prevDelta = wheelDeltaRef.current;
    if (prevDelta === 0 || (prevDelta > 0 && deltaY < 0) || (prevDelta < 0 && deltaY > 0)) {
      wheelDeltaRef.current = deltaY;
    } else {
      wheelDeltaRef.current += deltaY;
    }

    if (wheelDeltaRef.current > SNAP_THRESHOLD && canGoNext) {
      event.preventDefault();
      wheelDeltaRef.current = 0;
      isSnappingRef.current = true;
      handleJumpToEvent(activeIndex + 1, containerRef, eventCount, shouldReduceMotion);
      window.setTimeout(() => {
        isSnappingRef.current = false;
      }, SNAP_COOLDOWN_MS);
    } else if (wheelDeltaRef.current < -SNAP_THRESHOLD && canGoPrev) {
      event.preventDefault();
      wheelDeltaRef.current = 0;
      isSnappingRef.current = true;
      handleJumpToEvent(activeIndex - 1, containerRef, eventCount, shouldReduceMotion);
      window.setTimeout(() => {
        isSnappingRef.current = false;
      }, SNAP_COOLDOWN_MS);
    }
  };

  return (
    <section
      ref={(el) => {
        containerRef.current = el;
        registerEraRef(el);
      }}
      className="relative w-full"
      style={{ height: `${sectionHeightVh}vh` }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden"
        onWheel={handleWheel}
      >
        <EraBackground era={era} backgroundOpacity={backgroundOpacity} />

        {!shouldReduceMotion && (
          <motion.div
            className="absolute inset-0 z-0 bg-black"
            style={{ opacity: blackOverlayOpacity }}
          />
        )}

        {!shouldReduceMotion && (
          <EraIntroOverlay
            era={era}
            titleOpacity={introTitleOpacity}
            yearsOpacity={introYearsOpacity}
          />
        )}

        <EraIndexBadge
          eraIndex={eraIndex}
          totalEras={totalEras}
          opacity={contentOpacity}
        />

        <EventProgressRail
          events={era.events}
          activeIndex={activeIndex}
          onJumpToEvent={(index) =>
            handleJumpToEvent(index, containerRef, eventCount, shouldReduceMotion)
          }
          opacity={contentOpacity}
        />

        <motion.div
          className="relative z-20 flex h-full flex-col items-stretch justify-center gap-y-10 px-6 md:px-12 lg:px-20"
          style={{
            opacity: contentOpacity,
            scale: contentScale,
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <EraHeader era={era} />

          <div className="mt-24 w-full">
            <EraEventsColumn
              era={era}
              activeIndex={activeIndex}
              shouldReduceMotion={shouldReduceMotion}
              motionProgress={motionProgress}
              textXRange={textXRangePx}
            />
          </div>

          <div className="w-full">
            <EraMediaColumn
              era={era}
              activeIndex={activeIndex}
              shouldReduceMotion={shouldReduceMotion}
              motionProgress={motionProgress}
              mediaXRange={mediaXRangePx}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

type EraBackgroundProps = {
  era: HeritageEraWithEvents;
  backgroundOpacity: MotionValue<number>;
};

function EraBackground({ era, backgroundOpacity }: EraBackgroundProps) {
  return (
    <motion.div
      className="absolute inset-0 -z-10"
      style={{ opacity: backgroundOpacity }}
    >
      <Image
        src={era.backgroundSrc}
        alt={era.label}
        fill
        sizes="100vw"
        priority={false}
        className="object-cover"
      />
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{ background: era.overlayColor }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
    </motion.div>
  );
}

type EraHeaderProps = {
  era: HeritageEraWithEvents;
};

function EraHeader({ era }: EraHeaderProps) {
  return (
    <header className="absolute left-6 top-6 md:left-10 md:top-10">
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 md:text-xs">
        {formatEraRange(era)}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">
        {era.label}
      </h2>
    </header>
  );
}

type EraIntroOverlayProps = {
  era: HeritageEraWithEvents;
  titleOpacity: MotionValue<number>;
  yearsOpacity: MotionValue<number>;
};

function EraIntroOverlay({
  era,
  titleOpacity,
  yearsOpacity,
}: EraIntroOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="text-center">
        <motion.h2
          className="text-3xl font-semibold uppercase tracking-[0.25em] text-white/90 md:text-5xl lg:text-6xl"
          style={{ opacity: titleOpacity }}
        >
          {era.label}
        </motion.h2>
        <motion.p
          className="mt-4 text-xs uppercase tracking-[0.35em] text-white/70 md:text-sm lg:text-base"
          style={{ opacity: yearsOpacity }}
        >
          {formatEraRange(era)}
        </motion.p>
      </div>
    </div>
  );
}

type EraIndexBadgeProps = {
  eraIndex: number;
  totalEras: number;
  opacity: MotionValue<number>;
};

function EraIndexBadge({ eraIndex, totalEras, opacity }: EraIndexBadgeProps) {
  const displayIndex = eraIndex + 1;

  return (
    <motion.div
      className="pointer-events-none absolute right-6 top-6 z-20 md:right-10 md:top-10"
      style={{ opacity }}
    >
      <div className="inline-flex items-center rounded-full border border-white/30 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70 md:text-xs">
        <span className="mr-1">Era</span>
        <span className="mr-1">{displayIndex}</span>
        <span className="mx-1 text-white/40">/</span>
        <span>{totalEras}</span>
      </div>
    </motion.div>
  );
}

type EventProgressRailProps = {
  events: HeritageEraWithEvents["events"];
  activeIndex: number;
  onJumpToEvent: (index: number) => void;
  opacity: MotionValue<number>;
};

function EventProgressRail({
  events,
  activeIndex,
  onJumpToEvent,
  opacity,
}: EventProgressRailProps) {
  if (!events || events.length <= 1) return null;

  return (
    <motion.div
      className="absolute right-6 top-1/2 z-20 -translate-y-1/2 md:right-10"
      style={{ opacity }}
      aria-hidden={false}
    >
      <div className="flex flex-col items-center gap-2">
        {events.map((event, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onJumpToEvent(index)}
              className={cn(
                "h-2.5 w-2.5 rounded-full border transition",
                isActive
                  ? "border-white bg-white"
                  : "border-white/40 bg-white/10 hover:bg-white/30",
              )}
              aria-label={`Jump to event ${index + 1}: ${event.title}`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

type EraEventsColumnProps = {
  era: HeritageEraWithEvents;
  activeIndex: number;
  shouldReduceMotion: boolean;
  motionProgress: MotionValue<number>;
  textXRange: number;
};

function EraEventsColumn({
  era,
  activeIndex,
  shouldReduceMotion,
  motionProgress,
  textXRange,
}: EraEventsColumnProps) {
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const activeCardRef = useRef<HTMLElement | null>(null);
  const fallbackHeightPx = 280;

  useLayoutEffect(() => {
    const el = activeCardRef.current;
    if (!el) return;

    const measure = () => {
      const nextHeight = el.getBoundingClientRect().height;
      setCardHeight(nextHeight);
    };

    measure();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setCardHeight(entry.contentRect.height);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [activeIndex]);

  if (era.events.length === 0) {
    return (
      <article className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-sm md:p-8">
        <p className="text-sm text-white/70">
          No recorded milestones from this era yet.
        </p>
      </article>
    );
  }

  const eventCount = era.events.length;
  const containerHeight = cardHeight ?? fallbackHeightPx;

  return (
    <div
      className="relative mx-auto w-full max-w-4xl"
      style={{ height: containerHeight }}
    >
      {era.events.map((event, index) => (
        <EraEventCard
          key={event.id}
          event={event}
          index={index}
          activeIndex={activeIndex}
          eventCount={eventCount}
          shouldReduceMotion={shouldReduceMotion}
          motionProgress={motionProgress}
          textXRange={textXRange}
          cardRef={
            index === activeIndex
              ? (el) => {
                  activeCardRef.current = el;
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

type EraEventCardProps = {
  event: HeritageEvent;
  index: number;
  activeIndex: number;
  eventCount: number;
  shouldReduceMotion: boolean;
  motionProgress: MotionValue<number>;
  textXRange: number;
  cardRef?: (el: HTMLElement | null) => void;
};

function EraEventCard({
  event,
  index,
  activeIndex,
  eventCount,
  shouldReduceMotion,
  motionProgress,
  textXRange,
  cardRef,
}: EraEventCardProps) {
  const isActive = index === activeIndex;
  const isBefore = index < activeIndex;
  const headingId = `heritage-event-${event.id}-title`;
  const actionLinks: HeritageEventLink[] = Array.isArray(event.links)
    ? event.links
    : [];

  const segmentStart = index / eventCount;
  const segmentEnd = (index + 1) / eventCount;
  const segmentMid = (segmentStart + segmentEnd) / 2;
  const edgeWidth = 0.03;

  const x = useTransform(
    motionProgress,
    [segmentStart, segmentMid, segmentEnd],
    [-textXRange, 0, textXRange],
    { clamp: true },
  );
  const opacityFromScroll = useTransform(
    motionProgress,
    [segmentStart, segmentMid, Math.max(segmentMid, segmentEnd - edgeWidth), segmentEnd],
    [0, 1, 0.3, 0],
    { clamp: true },
  );
  const scaleFromScroll = useTransform(
    motionProgress,
    [segmentStart, segmentMid, segmentEnd],
    [0.96, 1, 0.96],
    { clamp: true },
  );
  const impulseRange = 0.015;
  const eventImpulse = useTransform(
    motionProgress,
    [segmentMid - impulseRange, segmentMid, segmentMid + impulseRange],
    [1, 1.03, 1],
    { clamp: true },
  );
  const combinedScale = useTransform(
    [scaleFromScroll, eventImpulse],
    ([base, impulse]) => (Number(base) || 0) * (Number(impulse) || 0),
  );

  const baseOpacity = isActive ? 1 : 0.15;

  const animateProps = shouldReduceMotion
    ? {
        animate: {
          opacity: baseOpacity,
          scale: isActive ? 1 : 0.96,
          x: isActive ? 0 : isBefore ? -100 : 100,
        },
        transition: { type: "spring" as const, stiffness: 140, damping: 20, mass: 0.9 },
      }
    : {};

  const styleProps = shouldReduceMotion
    ? {}
    : {
        x,
        opacity: opacityFromScroll,
        scale: combinedScale,
      };

  const cardClassName = cn(
    "absolute inset-x-0 bottom-0 flex flex-col justify-center rounded-2xl border border-white/15 bg-black/70 p-6 shadow-xl shadow-black/40 backdrop-blur-sm md:p-8",
    !isActive && !shouldReduceMotion ? "pointer-events-none" : "pointer-events-auto",
  );
  const ariaHidden = !shouldReduceMotion && !isActive ? true : undefined;

  return (
    <motion.article
      layout={false}
      className={cardClassName}
      {...animateProps}
      style={styleProps}
      ref={cardRef}
      aria-current={isActive ? "true" : undefined}
      aria-labelledby={headingId}
      aria-hidden={ariaHidden}
    >
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">
        {event.date}
      </p>
      <h3
        id={headingId}
        className="mb-4 text-lg font-semibold text-white md:text-xl"
      >
        {event.title}
      </h3>
      <div
        className="prose prose-invert prose-sm max-w-none text-white/80"
        dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
      />
      {actionLinks.length > 0 ? (
        <EventLinksRow
          links={actionLinks}
          isActive={isActive}
          shouldReduceMotion={shouldReduceMotion}
        />
      ) : null}
    </motion.article>
  );
}

type EraMediaColumnProps = {
  era: HeritageEraWithEvents;
  activeIndex: number;
  shouldReduceMotion: boolean;
  motionProgress: MotionValue<number>;
  mediaXRange: number;
};

function EraMediaColumn({
  era,
  activeIndex,
  shouldReduceMotion,
  motionProgress,
  mediaXRange,
}: EraMediaColumnProps) {
  const hasEvents = era.events.length > 0;
  const eventCount = era.events.length || 1;
  const clampedIndex = hasEvents
    ? Math.min(Math.max(activeIndex, 0), era.events.length - 1)
    : 0;
  const activeEvent = hasEvents ? era.events[clampedIndex] : null;
  const media = activeEvent?.media ?? null;
  const mediaRowHeight = HERITAGE_SCROLL_CONFIG.mediaRowHeightVh;

  const segmentStart = clampedIndex / eventCount;
  const segmentEnd = (clampedIndex + 1) / eventCount;
  const segmentMid = (segmentStart + segmentEnd) / 2;
  const plateauWidth = 0.12;

  const mediaX = useTransform(
    motionProgress,
    [segmentStart, segmentMid, segmentEnd],
    [mediaXRange, 0, -mediaXRange],
    { clamp: true },
  );
  const mediaScale = useTransform(
    motionProgress,
    [segmentStart, segmentMid, segmentEnd],
    [1.02, 1, 1.02],
    { clamp: true },
  );
  const mediaOpacity = useTransform(
    motionProgress,
    [
      segmentStart,
      Math.max(segmentStart, segmentMid - plateauWidth),
      segmentMid,
      Math.min(segmentEnd, segmentMid + plateauWidth),
      segmentEnd,
    ],
    [0, 1, 1, 0.4, 0],
    { clamp: true },
  );
  const mediaImpulse = useTransform(
    motionProgress,
    [segmentMid - 0.015, segmentMid, segmentMid + 0.015],
    [1, 1.02, 1],
    { clamp: true },
  );
  const mediaCombinedScale = useTransform(
    [mediaScale, mediaImpulse],
    ([base, impulse]) => (Number(base) || 0) * (Number(impulse) || 0),
  );

  const containerStyle = shouldReduceMotion
    ? {}
    : {
        x: mediaX,
        scale: mediaCombinedScale,
      };

  return (
    <motion.div
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-black/40"
      style={{ ...containerStyle, height: `${mediaRowHeight}vh` }}
    >
      <AnimatePresence>
        {media ? (
          <motion.div
            key={activeEvent?.id}
            className="absolute inset-0"
            style={shouldReduceMotion ? {} : { opacity: mediaOpacity }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 1 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.25 : 0.4,
              ease: "easeOut",
            }}
          >
            <Image
              src={media.url}
              alt={media.alt ?? activeEvent?.title ?? era.label}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/50" />
          </motion.div>
        ) : (
          <motion.div
            key="fallback"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.3 }}
          >
            <div className="rounded-full border border-white/20 bg-black/50 px-6 py-3 text-[11px] tracking-[0.3em] text-white/50">
              HERITAGE ARCHIVE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type EventLinksRowProps = {
  links: HeritageEventLink[];
  isActive: boolean;
  shouldReduceMotion: boolean;
};

function EventLinksRow({ links, isActive, shouldReduceMotion }: EventLinksRowProps) {
  if (!links || links.length === 0) return null;

  const linksInteractive = shouldReduceMotion || isActive;

  return (
    <div
      className="mt-6 flex flex-wrap gap-3"
      aria-hidden={!linksInteractive}
    >
      {links.map((link, idx) => {
        const isExternal = link.external ?? false;
        return (
          <a
            key={`${link.href}-${idx}`}
            href={link.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer noopener" : undefined}
            tabIndex={linksInteractive ? 0 : -1}
            className={cn(
              "inline-flex items-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              linksInteractive ? "hover:bg-white/10" : "opacity-40",
            )}
          >
            {link.label}
            {isExternal ? (
              <span aria-hidden="true" className="ml-1 text-[9px]">
                ↗
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
