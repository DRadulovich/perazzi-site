"use client";

import type { PartsEditorialSection } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type PartsEditorialProps = Readonly<{
  partsEditorialSection: PartsEditorialSection;
}>;

export function PartsEditorial({ partsEditorialSection }: PartsEditorialProps) {
  const analyticsRef = useAnalyticsObserver("PartsEditorialSeen");
  const heading = partsEditorialSection.heading ?? "Parts guidance";
  const intro = partsEditorialSection.intro ?? "Genuine components, fitted correctly";
  const parts = partsEditorialSection.parts;

  if (!parts.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PartsEditorialSeen"
      className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="parts-editorial-heading"
    >
      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          {heading}
        </p>
        <h2
          id="parts-editorial-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          {intro}
        </h2>
      </div>
      <ul className="space-y-4">
        {parts.map((part) => (
          <li
            key={part.name}
            className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-ink">{part.name}</h3>
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink-muted">
                Fitment: {part.fitment}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">{part.purpose}</p>
            {part.notesHtml ? (
              <div
                className="mt-2 text-sm leading-relaxed text-ink-muted"
                dangerouslySetInnerHTML={{ __html: part.notesHtml }}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
