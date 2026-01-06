"use client";

import Image from "next/image";
import type { DisciplineSummary } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading, Text } from "@/components/ui";

type DisciplineHeroProps = Readonly<{
  hero?: DisciplineSummary["hero"];
  name: string;
}>;

export function DisciplineHero({ hero, name }: DisciplineHeroProps) {
  const analyticsRef = useAnalyticsObserver<HTMLElement>("HeroSeen:discipline");

  if (!hero) {
    return (
      <section
        ref={analyticsRef}
        data-analytics-id="HeroSeen:discipline"
        className="rounded-2xl bg-perazzi-black px-4 py-10 text-white sm:rounded-3xl sm:px-6 sm:py-12"
      >
        <Heading level={1} size="display" className="text-white">
          {name}
        </Heading>
        <Text size="sm" className="mt-3 text-white/75">
          Explore recommended platforms, setup recipes, and stories from the line.
        </Text>
      </section>
    );
  }

  const ratio = hero.aspectRatio ?? 3 / 2;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="HeroSeen:discipline"
      className="relative overflow-hidden rounded-2xl bg-perazzi-black text-white sm:rounded-3xl"
    >
      <div
        className="relative aspect-dynamic"
        style={{ "--aspect-ratio": ratio }}
      >
        <Image
          src={hero.url}
          alt={hero.alt}
          fill
          priority
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 sm:px-12">
          <Heading level={1} size="display" className="text-white">
            {name}
          </Heading>
        </div>
      </div>
    </section>
  );
}
