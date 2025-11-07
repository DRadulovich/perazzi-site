"use client";

import type { KeyboardEvent } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { useReducedMotion } from "framer-motion";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import type { HeritageEvent } from "@/types/heritage";
import { MilestoneDetailDrawer } from "./MilestoneDetailDrawer";

type BrandTimelineProps = {
  events: HeritageEvent[];
  skipTargetId?: string;
};

export function BrandTimeline({ events, skipTargetId }: BrandTimelineProps) {
  const listRef = useRef<(HTMLButtonElement | null)[]>([]);
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const visitedRef = useRef(new Set<string>());
  const [activeIndex, setActiveIndex] = useState(0);
  const analyticsRef = useAnalyticsObserver("HeritageTimelineSeen", {
    threshold: 0.4,
  });
  const prefersReducedMotion = useReducedMotion();

  const safeEvents = useMemo(() => events.filter(Boolean), [events]);
  const activeEvent = safeEvents[activeIndex] ?? safeEvents[0];

  useEffect(() => {
    if (!activeEvent) return;
    if (!visitedRef.current.has(activeEvent.id)) {
      visitedRef.current.add(activeEvent.id);
      logAnalytics(`TimelineEventViewed:${activeEvent.id}`);
    }
    if (typeof window !== "undefined") {
      const next = safeEvents[activeIndex + 1];
      if (next?.media?.kind === "image") {
        const preload = new window.Image();
        preload.src = next.media.url;
      }
    }
  }, [activeEvent, activeIndex, safeEvents]);

  useEffect(() => {
    const button = listRef.current[activeIndex];
    if (button) {
      button.focus();
    }
  }, [activeIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!safeEvents.length) return;
    let nextIndex = index;

    switch (event.key) {
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = Math.max(0, index - 1);
        break;
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = Math.min(safeEvents.length - 1, index + 1);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = safeEvents.length - 1;
        break;
      case "PageUp":
        nextIndex = Math.max(0, index - 2);
        break;
      case "PageDown":
        nextIndex = Math.min(safeEvents.length - 1, index + 2);
        break;
      default:
        return;
    }

    if (nextIndex !== index) {
      event.preventDefault();
      setActiveIndex(nextIndex);
    }
  };

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      listRef.current[activeIndex]?.focus();
    }
  };

  const renderEventContent = (event: HeritageEvent) => (
    <Fragment>
      {event.media ? (
        <figure className="space-y-3">
          <div
            className="relative overflow-hidden rounded-2xl bg-neutral-200"
            style={{ aspectRatio: event.media.aspectRatio ?? 16 / 9 }}
          >
            <NextImage
              src={event.media.url}
              alt={event.media.alt}
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
          {event.media.caption ? (
            <figcaption className="text-xs text-ink-muted">
              {event.media.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
        {event.date}
      </p>
      <h3 className="text-xl font-semibold text-ink">{event.title}</h3>
      <div
        className="prose prose-sm max-w-none text-ink-muted"
        dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
      />
      {event.links ? (
        <div className="space-y-1 text-sm">
          {event.links.articles?.map((article) => (
            <a
              key={article.id}
              href={`/${article.slug}`}
              className="focus-ring inline-flex items-center gap-2 text-perazzi-red hover:underline"
            >
              Read: {article.title}
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      ) : null}
      <MilestoneDetailDrawer event={event} />
    </Fragment>
  );

  if (!safeEvents.length) {
    return null;
  }

  const targetId = skipTargetId ?? "heritage-after-timeline";

  return (
    <>
      <a
        href={`#${targetId}`}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
      >
        Skip timeline
        <span aria-hidden="true">→</span>
      </a>
      <section
        ref={analyticsRef}
        data-analytics-id="HeritageTimelineSeen"
        id="heritage-timeline"
        aria-labelledby="heritage-timeline-heading"
        className="space-y-8 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
            Timeline
          </p>
          <h2
            id="heritage-timeline-heading"
            className="text-2xl font-semibold text-ink"
          >
            Moments that shaped Perazzi
          </h2>
        </div>
        <div
          className="hidden gap-8 lg:flex"
          aria-live={prefersReducedMotion ? undefined : "polite"}
        >
          <nav
            aria-label="Brand timeline"
            className="lg:max-w-[280px]"
            ref={navContainerRef}
          >
            <ol className="flex flex-col gap-3" role="tablist">
              {safeEvents.map((event, index) => {
                const isActive = index === activeIndex;
                return (
                  <li key={event.id}>
                    <button
                      ref={(node) => {
                        listRef.current[index] = node;
                      }}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-current={isActive ? "true" : undefined}
                      aria-controls={`timeline-panel-${event.id}`}
                      className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition-colors focus-ring ${
                        isActive
                          ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                          : "border-border bg-card text-ink"
                      }`}
                      onClick={() => setActiveIndex(index)}
                      onKeyDown={(event) => handleKeyDown(event, index)}
                    >
                      <span className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                        {event.date}
                      </span>
                      <span className="font-semibold">{event.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="sr-only" role="status" aria-live="polite">
              Viewing {activeEvent?.title}
            </div>
          </nav>
          <div
            role="region"
            aria-labelledby={
              activeEvent ? `timeline-panel-${activeEvent.id}-title` : undefined
            }
            className="flex-1 space-y-5 rounded-3xl border border-border/70 bg-card/80 p-6"
            onKeyDown={handlePanelKeyDown}
          >
            {activeEvent ? (
              <div id={`timeline-panel-${activeEvent.id}`}>
                <div id={`timeline-panel-${activeEvent.id}-title`} className="sr-only">
                  {activeEvent.title}
                </div>
                {renderEventContent(activeEvent)}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                Select a milestone to explore its story.
              </p>
            )}
          </div>
        </div>
        <ol className="space-y-6 lg:hidden">
          {safeEvents.map((event) => (
            <li
              key={`mobile-${event.id}`}
              className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {event.date}
              </div>
              <div className="text-lg font-semibold text-ink">{event.title}</div>
              {renderEventContent(event)}
            </li>
          ))}
        </ol>
        <noscript>
          <ol className="space-y-4">
            {events.map((event) => (
              <li key={event.id} className="rounded-2xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {event.date}
                </p>
                <h3 className="text-lg font-semibold text-ink">{event.title}</h3>
                <div
                  className="prose prose-sm max-w-none text-ink-muted"
                  dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
                />
              </li>
            ))}
          </ol>
        </noscript>
      </section>
      <div
        id={targetId}
        tabIndex={-1}
        className="sr-only"
        aria-hidden="true"
      />
    </>
  );
}
