"use client";

import Image from "next/image";
import type { ShotgunsSeriesEntry } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading, Text } from "@/components/ui";

type SeriesHeroProps = {
  hero: ShotgunsSeriesEntry["hero"];
  analyticsId?: string;
};

export function SeriesHero({ hero, analyticsId }: Readonly<SeriesHeroProps>) {
  const ratio = hero.media.aspectRatio ?? 16 / 9;
  const heroId = analyticsId ?? "HeroSeen:shotguns-series";
  const heroRef = useAnalyticsObserver(heroId);
  const titleText = hero.title.replace(/\s*Platform\s*$/i, "").trim();
  const subheadingText = hero.subheading
    ? hero.subheading.replace(/\s*Platform\s*$/i, "").trim()
    : "";

  return (
    <section
      ref={heroRef}
      data-analytics-id={heroId}
      className="overflow-hidden rounded-3xl bg-perazzi-black text-white"
      aria-labelledby="series-hero-heading"
    >
      <div className="grid gap-8 px-6 py-12 sm:px-10 lg:px-16 md:grid-cols-12 lg:gap-12">
        <div className="space-y-4 md:col-span-5 lg:col-span-5">
          <Text size="label-tight" className="text-white/80">
            Perazzi series
          </Text>
          <Heading id="series-hero-heading" level={1} className="type-section text-white">
            {titleText}
          </Heading>
          {subheadingText ? (
            <Text className="type-section-subtitle text-white/80">
              {subheadingText}
            </Text>
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
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
