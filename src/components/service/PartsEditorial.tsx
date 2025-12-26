"use client";

import type { PartsEditorialSection } from "@/types/service";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type PartsEditorialProps = Readonly<{
  partsEditorialSection: PartsEditorialSection;
}>;

export function PartsEditorial({ partsEditorialSection }: PartsEditorialProps) {
  const analyticsRef = useAnalyticsObserver("PartsEditorialSeen");
  const heading = partsEditorialSection.heading ?? "Parts guidance";
  const intro = partsEditorialSection.intro ?? "Genuine components, fitted correctly";
  const parts = partsEditorialSection.parts;

  if (!parts.length) return null;

  return (
    <Section
      ref={analyticsRef}
      data-analytics-id="PartsEditorialSeen"
      padding="md"
      className="space-y-6"
      aria-labelledby="parts-editorial-heading"
    >
      <div className="space-y-2">
        <Text size="xs" muted className="font-semibold">
          {heading}
        </Text>
        <Heading id="parts-editorial-heading" level={2} size="xl" className="text-ink">
          {intro}
        </Heading>
      </div>
      <ul className="space-y-4">
        {parts.map((part) => (
          <li
            key={part.name}
            className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Heading level={3} size="md" className="text-ink">
                {part.name}
              </Heading>
              <Text size="xs" muted className="whitespace-nowrap">
                Fitment: {part.fitment}
              </Text>
            </div>
            <Text size="md" muted>
              {part.purpose}
            </Text>
            {part.notesHtml ? (
              <SafeHtml
                className="mt-2 text-sm leading-relaxed text-ink-muted"
                html={part.notesHtml}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
