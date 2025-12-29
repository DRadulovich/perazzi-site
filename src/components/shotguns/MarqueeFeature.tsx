"use client";

import Image from "next/image";
import type { FactoryAsset } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading, Section, Text } from "@/components/ui";

type ChampionData = Readonly<{
  id: string;
  name?: string;
  title?: string;
  quote: string;
  image: FactoryAsset;
  href?: string;
}>;

type MarqueeFeatureProps = Readonly<{
  champion?: ChampionData;
  fallbackText?: string;
}>;

export function MarqueeFeature({ champion, fallbackText }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver<HTMLElement>("MarqueeFeatureSeen");

  if (!champion) {
    return (
      <Section
        ref={analyticsRef}
        data-analytics-id="MarqueeFeatureSeen"
        padding="md"
      >
        <Heading level={2} size="lg">
          Perazzi lineage
        </Heading>
        <Text className="mt-3 text-ink-muted">
          {fallbackText ??
            "Every Perazzi platform is validated by generations of champions. Visit the heritage timeline to explore their stories."}
        </Text>
      </Section>
    );
  }

  const ratio = champion.image.aspectRatio ?? 3 / 4;

  return (
    <Section
      ref={analyticsRef}
      data-analytics-id={`ChampionStory:${champion.id}`}
      padding="md"
      className="grid gap-8 md:grid-cols-[minmax(280px,1fr)_minmax(320px,1fr)] md:items-center"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-elevated ring-1 ring-border/70 aspect-dynamic"
        style={{ "--aspect-ratio": ratio }}
      >
        <Image
          src={champion.image.url}
          alt={champion.image.alt}
          fill
          sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="space-y-4">
        <Text size="label-tight" className="text-ink-muted" leading="normal">
          Champion spotlight
        </Text>
        {champion.name ? (
          <Heading level={2} size="xl" className="text-ink">
            {champion.name}
          </Heading>
        ) : null}
        {champion.title ? (
          <Text asChild size="sm" className="text-ink-muted">
            <span>{champion.title}</span>
          </Text>
        ) : null}
        <blockquote className="type-quote border-l-2 border-perazzi-red/50 pl-4 text-ink">
          “{champion.quote}”
        </blockquote>
        {champion.href ? (
          <a
            href={champion.href}
            className="type-button inline-flex min-h-10 items-center justify-center gap-2 text-perazzi-red focus-ring"
          >
            <span>Meet the champions</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </Section>
  );
}
