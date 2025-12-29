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
      className="overflow-hidden rounded-3xl bg-perazzi-black text-white"
      aria-labelledby="series-hero-heading"
    >
      <div className="grid gap-8 px-6 py-12 sm:px-10 lg:px-16 md:grid-cols-12 lg:gap-12">
        <div className="space-y-4 md:col-span-5 lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
            Perazzi series
          </p>
          <h1 id="series-hero-heading" className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
            {hero.title}
          </h1>
          {hero.subheading ? (
            <p className="text-base text-white/80">{hero.subheading}</p>
          ) : null}
        </div>
        <div className="md:col-span-7 lg:col-span-7">
          <div
            className="relative overflow-hidden rounded-2xl aspect-dynamic"
            style={{ "--aspect-ratio": ratio }}
          >
            <Image
              src={hero.media.url}
              alt={hero.media.alt}
              fill
              priority
              sizes="(min-width: 1280px) 960px, (min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
