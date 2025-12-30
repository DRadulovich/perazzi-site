"use client";

import Image from "next/image";
import type { GradeSeries } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading, Text } from "@/components/ui";

type GradesHeroProps = {
  hero: {
    title: string;
    subheading?: string;
    background: GradeSeries["gallery"][number];
  };
};

export function GradesHero({ hero }: GradesHeroProps) {
  const ratio = hero.background.aspectRatio ?? 16 / 9;
  const heroRef = useAnalyticsObserver("HeroSeen:shotguns-grades");

  return (
    <section
      ref={heroRef}
      data-analytics-id="HeroSeen:shotguns-grades"
      className="relative overflow-hidden rounded-3xl bg-perazzi-black text-white"
    >
      <div
        className="relative aspect-dynamic"
        style={{ "--aspect-ratio": ratio }}
      >
        <Image
          src={hero.background.url}
          alt={hero.background.alt}
          fill
          priority
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 sm:px-12">
          <Heading level={1} size="display" className="text-white">
            {hero.title}
          </Heading>
          {hero.subheading ? (
            <Text size="sm" className="mt-3 max-w-2xl text-white/75">
              {hero.subheading}
            </Text>
          ) : null}
        </div>
      </div>
    </section>
  );
}
