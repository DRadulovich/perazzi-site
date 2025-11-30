"use client";

import type { GuideDownload } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type CareGuidesDownloadsProps = {
  guides: GuideDownload[];
};

export function CareGuidesDownloads({ guides }: CareGuidesDownloadsProps) {
  const analyticsRef = useAnalyticsObserver("CareGuidesSeen");

  if (!guides.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="CareGuidesSeen"
      className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="care-guides-heading"
    >
      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Care guides
        </p>
        <h2
          id="care-guides-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          Downloads & checklists
        </h2>
      </div>
      <ul className="space-y-4">
        {guides.map((guide) => (
          <li
            key={guide.id}
            className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-ink">{guide.title}</h3>
            <div
              className="text-sm leading-relaxed text-ink-muted"
              dangerouslySetInnerHTML={{ __html: guide.summaryHtml }}
            />
            <a
              href={guide.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
              onClick={() => logAnalytics(`GuideDownload:${guide.id}`)}
            >
              Download
              {guide.fileSize ? (
                <span className="text-[11px] sm:text-xs text-ink-muted">
                  ({guide.fileSize})
                </span>
              ) : null}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
