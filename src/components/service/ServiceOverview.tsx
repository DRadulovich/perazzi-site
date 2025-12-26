"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Heading, Text } from "@/components/ui";
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
  const checksList = hasCustomChecksHtml ? [] : overview.checks ?? [];

  let checksContent: React.ReactNode = null;
  if (hasCustomChecksHtml) {
    checksContent = (
      <div className="prose prose-base max-w-none leading-relaxed text-ink md:prose-lg">
        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
          {overview.checksHtml ?? ""}
        </ReactMarkdown>
      </div>
    );
  } else if (checksList.length) {
    checksContent = (
      <ul className="prose prose-base max-w-none list-disc pl-5 leading-relaxed text-ink md:prose-lg">
        {checksList.map((item) => (
          <li key={typeof item === "string" ? item : JSON.stringify(item)} className="marker:text-ink-muted">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ServiceOverviewSeen"
      className="grid gap-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:grid-cols-[1.2fr_1fr]"
      aria-labelledby="service-overview-heading"
    >
      <div className="space-y-4">
        <Text size="xs" muted className="font-semibold">
          {heading}
        </Text>
        <Heading id="service-overview-heading" level={2} size="xl" className="text-ink">
          {subheading}
        </Heading>
        <div className="prose prose-base max-w-none leading-relaxed text-ink-muted md:prose-lg">
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {overview.introHtml}
          </ReactMarkdown>
        </div>
      </div>
      <div className="rounded-2xl border border-border/75 bg-card/75 p-5 shadow-sm sm:rounded-3xl md:p-6 lg:p-8">
        <Text size="xs" muted className="font-semibold">
          {checksHeading}
        </Text>
        {checksContent}
      </div>
    </section>
  );
}
