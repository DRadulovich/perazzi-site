"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useEffect, useId, useState } from "react";
import Image from "next/image";
import type { OralHistory } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";

type OralHistoriesProps = {
  histories: OralHistory[];
};

export function OralHistories({ histories }: OralHistoriesProps) {
  if (!histories.length) {
    return null;
  }

  return (
    <section
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="oral-histories-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Oral histories
        </p>
        <h2
          id="oral-histories-heading"
          className="text-2xl font-semibold text-ink"
        >
          Voices from Botticino
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {histories.map((history) => (
          <OralHistoryCard key={history.id} history={history} />
        ))}
      </div>
    </section>
  );
}

type OralHistoryCardProps = {
  history: OralHistory;
};

function OralHistoryCard({ history }: OralHistoryCardProps) {
  const analyticsRef = useAnalyticsObserver(`OralHistorySeen:${history.id}`, {
    threshold: 0.5,
  });
  const [open, setOpen] = useState(false);
  const contentId = useId();

  useEffect(() => {
    if (open) {
      console.log(`[analytics] OralHistoryTranscript:${history.id}`);
    }
  }, [open, history.id]);

  return (
    <article
      ref={analyticsRef}
      data-analytics-id={`OralHistorySeen:${history.id}`}
      className="flex h-full flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm"
    >
      {history.image ? (
        <div
          className="relative overflow-hidden rounded-2xl bg-neutral-200"
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
        <h3 className="text-lg font-semibold text-ink">{history.title}</h3>
        <blockquote className="border-l-2 border-perazzi-red/50 pl-3 text-sm italic text-ink-muted">
          “{history.quote}”
        </blockquote>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
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
            console.log(`[analytics] OralHistoryAudioPlay:${history.id}`)
          }
        >
          <source src={history.audioSrc} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      ) : null}
      {history.transcriptHtml ? (
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger
            className="mt-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink focus-ring"
            aria-expanded={open}
            aria-controls={contentId}
          >
            {open ? "Hide transcript" : "Read transcript"}
            <span
              aria-hidden="true"
              className={cn("text-sm transition-transform", open ? "rotate-45" : "rotate-0")}
            >
              +
            </span>
          </Collapsible.Trigger>
          <Collapsible.Content
            id={contentId}
            className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 text-sm text-ink-muted"
          >
            <div
              dangerouslySetInnerHTML={{ __html: history.transcriptHtml }}
            />
          </Collapsible.Content>
          <noscript>
            <div
              className="mt-4 rounded-2xl border border-border/60 bg-card/70 p-4 text-sm text-ink-muted"
              dangerouslySetInnerHTML={{ __html: history.transcriptHtml }}
            />
          </noscript>
        </Collapsible.Root>
      ) : null}
    </article>
  );
}
