"use client";

import SafeHtml from "@/components/SafeHtml";
import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import type { OralHistoriesUi, OralHistory } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Heading, Section, Text } from "@/components/ui";

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
    <Section
      ref={sectionRef}
      data-analytics-id="OralHistoriesSeen"
      padding="md"
      className="space-y-6"
      aria-labelledby="oral-histories-heading"
    >
      <div className="space-y-2">
        <Text size="xs" className="font-semibold tracking-[0.35em] text-ink-muted" leading="normal">
          {eyebrow}
        </Text>
        <Heading id="oral-histories-heading" level={2} size="xl" className="text-ink">
          {heading}
        </Heading>
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
    </Section>
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
      className="flex h-full flex-col gap-4 rounded-2xl border border-border/75 bg-card/80 p-5 shadow-soft sm:rounded-3xl sm:p-6"
    >
      {history.image ? (
        <div
          className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
          style={{ "--aspect-ratio": history.image.aspectRatio ?? 1 }}
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
        <Heading level={3} size="sm" className="text-ink">
          {history.title}
        </Heading>
        <Text
          asChild
          size="md"
          className="border-l-2 border-perazzi-red/50 pl-3 italic text-ink-muted"
        >
          <blockquote>“{history.quote}”</blockquote>
        </Text>
        <Text size="xs" className="text-ink-muted" leading="normal">
          {history.attribution}
        </Text>
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
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
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
          </CollapsibleTrigger>
          <CollapsibleContent
            id={contentId}
            className={cn(
              "mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-ink-muted sm:bg-card/70",
              prefersReducedMotion
                ? "transition-none"
                : "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
            )}
          >
            <SafeHtml html={history.transcriptHtml} />
          </CollapsibleContent>
          <noscript>
            <SafeHtml
              className="mt-4 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-ink-muted sm:bg-card/70"
              html={history.transcriptHtml}
            />
          </noscript>
        </Collapsible>
      ) : null}
    </article>
  );
}
