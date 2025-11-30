"use client";

import Image from "next/image";
import type { FactoryAsset } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type ChampionData = {
  id: string;
  name?: string;
  title?: string;
  quote: string;
  image: FactoryAsset;
  href?: string;
};

type MarqueeFeatureProps = {
  champion?: ChampionData;
  fallbackText?: string;
};

export function MarqueeFeature({ champion, fallbackText }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver<HTMLElement>("MarqueeFeatureSeen");

  if (!champion) {
    return (
      <section
        ref={analyticsRef}
        data-analytics-id="MarqueeFeatureSeen"
        className="rounded-2xl border border-border/60 bg-card/10 p-4 text-ink shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8"
      >
        <h2 className="text-xl sm:text-2xl font-semibold">Perazzi lineage</h2>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink-muted">
          {fallbackText ??
            "Every Perazzi platform is validated by generations of champions. Visit the heritage timeline to explore their stories."}
        </p>
      </section>
    );
  }

  const ratio = champion.image.aspectRatio ?? 3 / 4;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id={`ChampionStory:${champion.id}`}
      className="grid gap-8 rounded-2xl border border-border/60 bg-card/10 px-4 py-8 text-ink shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-10 sm:shadow-md md:grid-cols-[minmax(280px,1fr)_minmax(320px,1fr)] md:items-center lg:px-10"
    >
      <div
        className="relative overflow-hidden rounded-2xl"
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
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Champion spotlight
        </p>
        {champion.name ? (
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink">
            {champion.name}
          </h2>
        ) : null}
        {champion.title ? (
          <cite className="block text-sm sm:text-base leading-relaxed font-medium text-ink-muted not-italic">
            {champion.title}
          </cite>
        ) : null}
        <blockquote className="border-l-2 border-perazzi-red/50 pl-4 text-lg sm:text-xl italic leading-relaxed text-ink">
          “{champion.quote}”
        </blockquote>
        {champion.href ? (
          <a
            href={champion.href}
            className="inline-flex min-h-10 items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
          >
            Meet the champions
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
