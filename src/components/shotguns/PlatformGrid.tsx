"use client";

import { useCallback, useMemo, useRef } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import type { Platform } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";

type PlatformGridProps = {
  platforms: Platform[];
};

export function PlatformGrid({ platforms }: PlatformGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const orderedPlatforms = useMemo(() => {
    const order = ["mx", "ht", "tm", "dc", "sho"];
    const lookup = new Map(
      platforms.map((platform) => [platform.slug.toLowerCase(), platform]),
    );

    const inOrder = order
      .map((slug) => lookup.get(slug))
      .filter((platform): platform is Platform => Boolean(platform));

    const remaining = platforms.filter((platform) => !order.includes(platform.slug.toLowerCase()));

    return [...inOrder, ...remaining];
  }, [platforms]);

  const scrollBy = useCallback(
    (direction: 1 | -1) => {
      if (!scrollRef.current) return;
      const distance = scrollRef.current.clientWidth || 0;
      scrollRef.current.scrollBy({
        left: direction * distance,
        behavior: "smooth",
      });
    },
    [],
  );

  return (
    <section
      className="space-y-6"
      aria-labelledby="platforms-heading"
    >
      <div className="space-y-2">
        <h2 id="platforms-heading" className="text-2xl font-semibold text-ink">
          Platforms &amp; Purpose
        </h2>
        <p className="max-w-3xl text-base text-ink-muted">
          Begin with lineage: MX, High Tech, and TM each carry a different balance, trigger philosophy, and place on the line.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Scroll across the platform lineage.</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink hover:bg-card focus-ring"
            aria-label="Scroll platforms left"
            onClick={() => scrollBy(-1)}
          >
            <FiArrowLeft />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink hover:bg-card focus-ring"
            aria-label="Scroll platforms right"
            onClick={() => scrollBy(1)}
          >
            <FiArrowRight />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4"
      >
        {orderedPlatforms.map((platform, index) => (
          <div
            key={platform.id}
            className="flex-shrink-0 w-full md:w-[calc(50%-0.75rem)]"
          >
            <PlatformCard
              platform={platform}
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
