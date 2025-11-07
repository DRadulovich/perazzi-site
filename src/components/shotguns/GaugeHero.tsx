"use client";

import Image from "next/image";
import type { FactoryAsset } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type GaugeHeroProps = {
  title: string;
  subheading?: string;
  background: FactoryAsset;
  dataAnalyticsId?: string;
};

export function GaugeHero({
  title,
  subheading,
  background,
  dataAnalyticsId,
}: GaugeHeroProps) {
  const ratio = background.aspectRatio ?? 16 / 9;
  const analyticsId = dataAnalyticsId ?? "HeroSeen:shotguns-gauges";
  const heroRef = useAnalyticsObserver(analyticsId);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden rounded-3xl bg-perazzi-black text-white"
      data-analytics-id={analyticsId}
    >
      <div
        className="relative"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={background.url}
          alt={background.alt}
          priority
          fill
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Gauge primer
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
          {subheading ? (
            <p className="mt-3 max-w-3xl text-sm text-white/80">{subheading}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
