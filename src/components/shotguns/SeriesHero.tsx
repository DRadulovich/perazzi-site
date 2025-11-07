"use client";

import Image from "next/image";
import type { ShotgunsSeriesEntry } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type SeriesHeroProps = {
  hero: ShotgunsSeriesEntry["hero"];
  analyticsId?: string;
};

export function SeriesHero({ hero, analyticsId }: SeriesHeroProps) {
  const ratio = hero.media.aspectRatio ?? 16 / 9;
  const heroId = analyticsId ?? "HeroSeen:shotguns-series";
  const heroRef = useAnalyticsObserver(heroId);

  return (
    <section
      ref={heroRef}
      data-analytics-id={heroId}
      className="rounded-3xl bg-perazzi-black text-white"
      aria-labelledby="series-hero-heading"
    >
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={hero.media.url}
          alt={hero.media.alt}
          fill
          priority
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 text-left sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
            Perazzi series
          </p>
          <h1 id="series-hero-heading" className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            {hero.title}
          </h1>
          {hero.subheading ? (
            <p className="mt-4 max-w-2xl text-sm text-white/75">{hero.subheading}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
