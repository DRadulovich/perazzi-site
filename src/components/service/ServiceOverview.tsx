"use client";

import type { ServiceOverview as ServiceOverviewType } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type ServiceOverviewProps = {
  overview: ServiceOverviewType;
};

export function ServiceOverview({ overview }: ServiceOverviewProps) {
  const analyticsRef = useAnalyticsObserver("ServiceOverviewSeen");

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ServiceOverviewSeen"
      className="grid gap-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:grid-cols-[1.2fr_1fr]"
      aria-labelledby="service-overview-heading"
    >
      <div className="space-y-4">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Overview
        </p>
        <h2
          id="service-overview-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          Factory-level care, wherever you are
        </h2>
        <div
          className="prose prose-base max-w-none leading-relaxed text-ink-muted md:prose-lg"
          dangerouslySetInnerHTML={{ __html: overview.introHtml }}
        />
      </div>
      <div className="rounded-2xl border border-border/75 bg-card/75 p-5 shadow-sm sm:rounded-3xl md:p-6 lg:p-8">
        <h3 className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Standard checks
        </h3>
        <div
          className="prose prose-base max-w-none leading-relaxed text-ink md:prose-lg"
          dangerouslySetInnerHTML={{ __html: overview.checksHtml }}
        />
      </div>
    </section>
  );
}
