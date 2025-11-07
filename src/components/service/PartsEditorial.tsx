"use client";

import type { PartEditorial as PartEditorialType } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type PartsEditorialProps = {
  parts: PartEditorialType[];
};

export function PartsEditorial({ parts }: PartsEditorialProps) {
  const analyticsRef = useAnalyticsObserver("PartsEditorialSeen");

  if (!parts.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PartsEditorialSeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="parts-editorial-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Parts guidance
        </p>
        <h2
          id="parts-editorial-heading"
          className="text-2xl font-semibold text-ink"
        >
          Genuine components, fitted correctly
        </h2>
      </div>
      <ul className="space-y-4">
        {parts.map((part) => (
          <li
            key={part.name}
            className="rounded-2xl border border-border/70 bg-card/70 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-ink">{part.name}</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                Fitment: {part.fitment}
              </span>
            </div>
            <p className="text-sm text-ink-muted">{part.purpose}</p>
            {part.notesHtml ? (
              <div
                className="mt-2 text-sm text-ink-muted"
                dangerouslySetInnerHTML={{ __html: part.notesHtml }}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
