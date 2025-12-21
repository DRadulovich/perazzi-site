"use client";

import type { GuidesSection } from "@/types/service";
import SafeHtml from "@/components/SafeHtml";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type CareGuidesDownloadsProps = Readonly<{
  guidesSection: GuidesSection;
}>;

export function CareGuidesDownloads({ guidesSection }: CareGuidesDownloadsProps) {
  const analyticsRef = useAnalyticsObserver("CareGuidesSeen");
  const heading = guidesSection.heading ?? "Downloads & checklists";
  const careGuidesLabel = guidesSection.careGuidesLabel ?? "Care guides";
  const downloadButtonLabel = guidesSection.downloadButtonLabel ?? "Download";
  const downloadsLabel = guidesSection.downloadsLabel;
  const guides = guidesSection.guides;

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
          {careGuidesLabel}
        </p>
        <h2
          id="care-guides-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          {heading}
        </h2>
        {downloadsLabel ? (
          <p className="text-sm sm:text-base leading-relaxed text-ink-muted">
            {downloadsLabel}
          </p>
        ) : null}
      </div>
      <ul className="space-y-4">
        {guides.map((guide) => (
          <li
            key={guide.id}
            className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-ink">{guide.title}</h3>
            <SafeHtml
              className="text-sm leading-relaxed text-ink-muted"
              html={guide.summaryHtml}
            />
            <a
              href={guide.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
              onClick={() => logAnalytics(`GuideDownload:${guide.id}`)}
            >
              {downloadButtonLabel}
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
