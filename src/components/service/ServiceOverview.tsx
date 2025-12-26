"use client";

import { Heading, Section, Text } from "@/components/ui";
import type { ServiceOverviewSection } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import SafeHtml from "@/components/SafeHtml";

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
      <SafeHtml
        className="prose prose-base max-w-none leading-relaxed text-ink md:prose-lg"
        html={overview.checksHtml ?? ""}
      />
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
    <Section
      ref={analyticsRef}
      data-analytics-id="ServiceOverviewSeen"
      padding="md"
      className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
      aria-labelledby="service-overview-heading"
    >
      <div className="space-y-4">
        <Text size="xs" muted className="font-semibold">
          {heading}
        </Text>
        <Heading id="service-overview-heading" level={2} size="xl" className="text-ink">
          {subheading}
        </Heading>
        <SafeHtml
          className="prose prose-base max-w-none leading-relaxed text-ink-muted md:prose-lg"
          html={overview.introHtml}
        />
      </div>
      <Section padding="sm" className="bg-card/75">
        <Text size="xs" muted className="font-semibold">
          {checksHeading}
        </Text>
        {checksContent}
      </Section>
    </Section>
  );
}
