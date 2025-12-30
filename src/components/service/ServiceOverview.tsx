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
        className="prose max-w-none type-section-subtitle text-ink text-2xl"
        html={overview.checksHtml ?? ""}
      />
    );
  } else if (checksList.length) {
    checksContent = (
      <ul className="list-disc pl-5 type-section-subtitle text-ink text-2xl">
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
        <Heading id="service-overview-heading" level={2} className="type-section text-ink">
          {heading}
        </Heading>
        <Text className="type-section-subtitle text-ink-muted">
          {subheading}
        </Text>
        <SafeHtml
          className="type-body max-w-none text-ink-muted"
          html={overview.introHtml}
        />
      </div>
      <Section padding="sm" className="bg-card/75">
        <Text className="type-card-title text-ink-muted">
          {checksHeading}
        </Text>
        {checksContent}
      </Section>
    </Section>
  );
}
