"use client";

import Image from "next/image";
import type { PlatformHighlight } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading, Text } from "@/components/ui";

type EngHighlightsGridProps = {
  readonly highlights: readonly PlatformHighlight[];
};

export function EngHighlightsGrid({ highlights }: EngHighlightsGridProps) {
  const analyticsRef = useAnalyticsObserver<HTMLElement>("EngHighlightsGridSeen");

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="EngHighlightsGridSeen"
      className="space-y-4"
      aria-labelledby="engineering-highlights-heading"
    >
      <Heading id="engineering-highlights-heading" level={2} className="type-section text-ink">
        Engineering highlights
      </Heading>
      <div className="grid gap-6 md:grid-cols-2">
        {highlights.map((highlight) => {
          const ratio = highlight.media.aspectRatio ?? 3 / 2;
          return (
            <article
              key={highlight.title}
              className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated"
            >
              <div
                className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)] aspect-dynamic"
                style={{ "--aspect-ratio": ratio }}
              >
                <Image
                  src={highlight.media.url}
                  alt={highlight.media.alt}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <Heading level={3} className="mt-4 type-card-title text-ink">
                {highlight.title}
              </Heading>
              <Text className="mt-2 type-body text-ink-muted" leading="relaxed">
                {highlight.body}
              </Text>
            </article>
          );
        })}
      </div>
    </section>
  );
}
