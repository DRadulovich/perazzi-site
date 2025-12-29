"use client";

import Image from "next/image";
import { useRef } from "react";
import { logAnalytics } from "@/lib/analytics";
import type { GradeSeries } from "@/types/catalog";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type WoodCarouselProps = {
  readonly grades: readonly GradeSeries[];
};

export function WoodCarousel({ grades }: WoodCarouselProps) {
  const railRef = useRef<HTMLElement | null>(null);

  const scrollBy = (direction: "prev" | "next") => {
    const node = railRef.current;
    if (!node) return;
    const amount = direction === "next" ? node.clientWidth : -node.clientWidth;
    logAnalytics(`WoodCarousel:${direction}`);
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section
      className="space-y-4"
      aria-labelledby="wood-carousel-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading id="wood-carousel-heading" level={2} size="lg" className="text-ink">
          Wood sets &amp; embellishments
        </Heading>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() => { scrollBy("prev"); }}
            aria-label="Scroll wood carousel left"
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() => { scrollBy("next"); }}
            aria-label="Scroll wood carousel right"
          >
            Next
          </button>
        </div>
      </div>
      <section
        ref={railRef}
        aria-label="Perazzi grade wood carousel"
        aria-live="polite"
        className="flex gap-4 overflow-x-auto scroll-px-6 pb-2"
      >
        {grades.map((grade) => {
          const asset = grade.gallery[1] ?? grade.gallery[0];
          if (!asset) return null;
          const ratio = asset.aspectRatio ?? 3 / 2;
          return (
            <div
              key={grade.id}
              data-analytics-id={`WoodCarousel:${grade.id}`}
              className="flex min-w-[260px] flex-col rounded-3xl border border-border/70 bg-card p-4 shadow-soft md:min-w-80 md:p-6 lg:min-w-0 lg:p-8"
            >
              <div
                className="relative overflow-hidden rounded-xl bg-border aspect-dynamic"
                style={{ "--aspect-ratio": ratio }}
              >
                <Image
                  src={asset.url}
                  alt={asset.alt}
                  fill
                  sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <Heading level={3} size="sm" className="mt-3 text-ink">
                {grade.name}
              </Heading>
              <Text className="mt-2 text-ink-muted" leading="normal">
                {grade.description}
              </Text>
            </div>
          );
        })}
      </section>
    </section>
  );
}
