"use client";

import Image from "next/image";
import type { FactoryAsset } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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
      <section
        ref={analyticsRef}
        data-analytics-id="MarqueeFeatureSeen"
        className="rounded-2xl border border-border/70 bg-card/40 p-4 text-ink shadow-sm backdrop-blur-md sm:rounded-3xl sm:bg-card/30 sm:px-6 sm:py-8 sm:shadow-elevated"
      >
        <Heading level={2} size="lg">
          Perazzi lineage
        </Heading>
        <Text className="mt-3 text-ink-muted">
          {fallbackText ??
            "Every Perazzi platform is validated by generations of champions. Visit the heritage timeline to explore their stories."}
        </Text>
      </section>
    );
  }

  const ratio = champion.image.aspectRatio ?? 3 / 4;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id={`ChampionStory:${champion.id}`}
      className="grid gap-8 rounded-2xl border border-border/70 bg-card/40 px-4 py-8 text-ink shadow-sm backdrop-blur-md sm:rounded-3xl sm:bg-card/30 sm:px-6 sm:py-10 sm:shadow-elevated md:grid-cols-[minmax(280px,1fr)_minmax(320px,1fr)] md:items-center lg:px-10"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-elevated ring-1 ring-border/70"
        style={{ aspectRatio: ratio }}
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
        <Text size="xs" className="font-semibold text-ink-muted" leading="normal">
          Champion spotlight
        </Text>
        {champion.name ? (
          <Heading level={2} size="xl" className="text-ink">
            {champion.name}
          </Heading>
        ) : null}
        {champion.title ? (
          <Text
            asChild
            size="md"
            className="font-medium text-ink-muted not-italic"
          >
            <cite>{champion.title}</cite>
          </Text>
        ) : null}
        <Text
          asChild
          size="lg"
          className="border-l-2 border-perazzi-red/50 pl-4 text-lg sm:text-xl italic text-ink"
        >
          <blockquote>“{champion.quote}”</blockquote>
        </Text>
        {champion.href ? (
          <a
            href={champion.href}
            className="inline-flex min-h-10 items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
          >
            <span>Meet the champions</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
