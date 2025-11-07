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
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="care-guides-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Care guides
        </p>
        <h2 id="care-guides-heading" className="text-2xl font-semibold text-ink">
          Downloads & checklists
        </h2>
      </div>
      <ul className="space-y-4">
        {guides.map((guide) => (
          <li
            key={guide.id}
            className="rounded-2xl border border-border/70 bg-card/70 p-4"
          >
            <h3 className="text-lg font-semibold text-ink">{guide.title}</h3>
            <div
              className="text-sm text-ink-muted"
              dangerouslySetInnerHTML={{ __html: guide.summaryHtml }}
            />
            <a
              href={guide.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-perazzi-red focus-ring"
              onClick={() => logAnalytics(`GuideDownload:${guide.id}`)}
            >
              Download
              {guide.fileSize ? (
                <span className="text-xs text-ink-muted">({guide.fileSize})</span>
              ) : null}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
