"use client";

import type { GuidesSection } from "@/types/service";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Section, Text } from "@/components/ui";
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
    <Section
      ref={analyticsRef}
      data-analytics-id="CareGuidesSeen"
      padding="md"
      className="space-y-6"
      aria-labelledby="care-guides-heading"
    >
      <div className="space-y-2">
        <Text size="xs" muted className="font-semibold">
          {careGuidesLabel}
        </Text>
        <Heading id="care-guides-heading" level={2} size="xl" className="text-ink">
          {heading}
        </Heading>
        {downloadsLabel ? (
          <Text size="md" muted leading="relaxed">
            {downloadsLabel}
          </Text>
        ) : null}
      </div>
      <ul className="space-y-4">
        {guides.map((guide) => (
          <li
            key={guide.id}
            className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-soft"
          >
            <Heading level={3} size="md" className="text-ink">
              {guide.title}
            </Heading>
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
    </Section>
  );
}
