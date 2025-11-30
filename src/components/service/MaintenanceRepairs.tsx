"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import type { GuideDownload, ServiceOverview } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type MaintenanceRepairsProps = {
  overview: ServiceOverview;
  guide?: GuideDownload;
};

export function MaintenanceRepairs({ overview, guide }: MaintenanceRepairsProps) {
  const analyticsRef = useAnalyticsObserver("MaintenanceRepairsSeen");
  const [open, setOpen] = useState(false);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="MaintenanceRepairsSeen"
      className="space-y-4 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="maintenance-heading"
    >
      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Maintenance &amp; repairs
        </p>
        <h2
          id="maintenance-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          How we service your Perazzi
        </h2>
      </div>
      <div
        className="prose prose-sm max-w-none leading-relaxed text-ink-muted md:prose-lg"
        dangerouslySetInnerHTML={{ __html: overview.checksHtml }}
      />
      {guide ? (
        <a
          href={guide.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
          onClick={() => logAnalytics(`GuideDownload:${guide.id}`)}
        >
          Download {guide.title}
          {guide.fileSize ? (
            <span className="text-[11px] sm:text-xs text-ink-muted">({guide.fileSize})</span>
          ) : null}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger
          className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/10 px-4 py-3 text-left text-sm font-semibold text-ink focus-ring sm:border-border sm:bg-card/40"
          aria-expanded={open}
          aria-controls="before-send-content"
        >
          Before you send your gun
          <span
            aria-hidden="true"
            className={`text-lg transition-transform ${open ? "rotate-45" : "rotate-0"}`}
          >
            +
          </span>
        </Collapsible.Trigger>
        <Collapsible.Content
          id="before-send-content"
          className="mt-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-ink-muted sm:bg-card/60"
        >
          <ul className="list-disc pl-5">
            <li>Record the serial number and trigger group number.</li>
            <li>Remove aftermarket accessories that could be damaged.</li>
            <li>Use the Perazzi travel case or double-box with foam.</li>
            <li>Include a note describing issues, desired break weight, and timeline.</li>
          </ul>
        </Collapsible.Content>
      </Collapsible.Root>
    </section>
  );
}
