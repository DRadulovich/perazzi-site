"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { ServiceOverviewSection } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type ServiceOverviewProps = {
  readonly overview: ServiceOverviewSection;
};

export function ServiceOverview({ overview }: ServiceOverviewProps) {
  const analyticsRef = useAnalyticsObserver("ServiceOverviewSeen");
  const heading = overview.heading ?? "Overview";
  const subheading = overview.subheading ?? "Factory-level care, wherever you are";
  const checksHeading = overview.checksHeading ?? "Standard checks";
  const hasCustomChecksHtml = Boolean(overview.checksHtml);
  const checksList = !hasCustomChecksHtml ? overview.checks ?? [] : [];

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ServiceOverviewSeen"
      className="grid gap-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:grid-cols-[1.2fr_1fr]"
      aria-labelledby="service-overview-heading"
    >
      <div className="space-y-4">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          {heading}
        </p>
        <h2
          id="service-overview-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          {subheading}
        </h2>
        <div className="prose prose-base max-w-none leading-relaxed text-ink-muted md:prose-lg">
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {overview.introHtml}
          </ReactMarkdown>
        </div>
      </div>
      <div className="rounded-2xl border border-border/75 bg-card/75 p-5 shadow-sm sm:rounded-3xl md:p-6 lg:p-8">
        <h3 className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          {checksHeading}
        </h3>
        {hasCustomChecksHtml ? (
          <div className="prose prose-base max-w-none leading-relaxed text-ink md:prose-lg">
            <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
              {overview.checksHtml ?? ""}
            </ReactMarkdown>
          </div>
        ) : checksList.length ? (
          <ul className="prose prose-base max-w-none list-disc pl-5 leading-relaxed text-ink md:prose-lg">
            {checksList.map((item, index) => (
              <li key={index} className="marker:text-ink-muted">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
