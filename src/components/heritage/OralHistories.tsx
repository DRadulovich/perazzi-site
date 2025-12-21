"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import SafeHtml from "@/components/SafeHtml";
import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import type { OralHistoriesUi, OralHistory } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";

const FALLBACK_TRACK_SRC = `data:text/vtt;charset=utf-8,${encodeURIComponent(
  "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nCaptions not available.",
)}`;

type OralHistoriesProps = Readonly<{
  histories: readonly OralHistory[];
  ui: OralHistoriesUi;
}>;

type OralHistoryCardProps = Readonly<{
  history: OralHistory;
  readLabel: string;
  hideLabel: string;
}>;

function buildTranscriptTrack(transcriptHtml: string) {
  const plainText = transcriptHtml
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();

  if (!plainText) {
    return FALLBACK_TRACK_SRC;
  }

  const vtt = `WEBVTT\n\n00:00:00.000 --> 99:59:59.000\n${plainText}`;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

export function OralHistories({ histories, ui }: OralHistoriesProps) {
  const sectionRef = useAnalyticsObserver<HTMLElement>("OralHistoriesSeen");

  if (!histories.length) {
    return null;
  }

  const eyebrow = ui.eyebrow ?? "Oral histories";
  const heading = ui.heading ?? "Voices from Botticino";
  const readLabel = ui.readLabel ?? "Read transcript";
  const hideLabel = ui.hideLabel ?? "Hide transcript";

  return (
    <section
      ref={sectionRef}
      data-analytics-id="OralHistoriesSeen"
      className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8"
      aria-labelledby="oral-histories-heading"
    >
      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          {eyebrow}
        </p>
        <h2
          id="oral-histories-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          {heading}
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {histories.map((history) => (
          <OralHistoryCard
            key={history.id}
            history={history}
            readLabel={readLabel}
            hideLabel={hideLabel}
          />
        ))}
      </div>
    </section>
  );
}

function OralHistoryCard({ history, readLabel, hideLabel }: OralHistoryCardProps) {
  const analyticsRef = useAnalyticsObserver(`OralHistorySeen:${history.id}`, {
    threshold: 0.5,
  });
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      logAnalytics(`OralHistoryTranscript:${history.id}`);
    }
  }, [open, history.id]);

  return (
    <article
      ref={analyticsRef}
      data-analytics-id={`OralHistorySeen:${history.id}`}
      className="flex h-full flex-col gap-4 rounded-2xl border border-border/75 bg-card/80 p-5 shadow-sm sm:rounded-3xl sm:p-6"
    >
      {history.image ? (
        <div
          className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
          style={{ aspectRatio: history.image.aspectRatio ?? 1 }}
        >
          <Image
            src={history.image.url}
            alt={history.image.alt}
            fill
            sizes="(min-width: 1024px) 320px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-semibold text-ink">
          {history.title}
        </h3>
        <blockquote className="border-l-2 border-perazzi-red/50 pl-3 text-sm italic leading-relaxed text-ink-muted">
          “{history.quote}”
        </blockquote>
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink-muted">
          {history.attribution}
        </p>
      </div>
      {history.audioSrc ? (
        <audio
          controls
          preload="none"
          className="w-full"
          aria-label={`Audio interview: ${history.title}`}
          onPlay={() =>
            logAnalytics(`OralHistoryAudioPlay:${history.id}`)
          }
        >
          <source src={history.audioSrc} type="audio/mpeg" />
          <track
            kind="captions"
            label={`${history.title} transcript`}
            srcLang="en"
            src={
              history.transcriptHtml
                ? buildTranscriptTrack(history.transcriptHtml)
                : FALLBACK_TRACK_SRC
            }
          />
          Your browser does not support the audio element.
        </audio>
      ) : null}
      {history.transcriptHtml ? (
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger
            className="mt-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink focus-ring"
            aria-expanded={open}
            aria-controls={contentId}
          >
            {open ? hideLabel : readLabel}
            <span
              aria-hidden="true"
              className={cn(
                "text-sm",
                prefersReducedMotion ? "transition-none" : "transition-transform",
                open ? "rotate-45" : "rotate-0",
              )}
            >
              +
            </span>
          </Collapsible.Trigger>
          <Collapsible.Content
            id={contentId}
            className={cn(
              "mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-ink-muted sm:bg-card/70",
              prefersReducedMotion
                ? "transition-none"
                : "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
            )}
          >
            <SafeHtml html={history.transcriptHtml} />
          </Collapsible.Content>
          <noscript>
            <SafeHtml
              className="mt-4 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-ink-muted sm:bg-card/70"
              html={history.transcriptHtml}
            />
          </noscript>
        </Collapsible.Root>
      ) : null}
    </article>
  );
}
