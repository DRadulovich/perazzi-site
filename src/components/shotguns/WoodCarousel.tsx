"use client";

import Image from "next/image";
import { useRef } from "react";
import type { GradeSeries } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";

type WoodCarouselProps = {
  grades: GradeSeries[];
};

export function WoodCarousel({ grades }: WoodCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);

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
        <h2 id="wood-carousel-heading" className="text-xl font-semibold text-ink">
          Wood sets &amp; embellishments
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() => scrollBy("prev")}
            aria-label="Scroll wood carousel left"
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() => scrollBy("next")}
            aria-label="Scroll wood carousel right"
          >
            Next
          </button>
        </div>
      </div>
      <div
        ref={railRef}
        role="region"
        aria-live="polite"
        aria-label="Perazzi grade wood carousel"
        className="flex gap-4 overflow-x-auto scroll-px-6 pb-2"
        tabIndex={0}
      >
        {grades.map((grade) => {
          const asset = grade.gallery[1] ?? grade.gallery[0];
          if (!asset) return null;
          const ratio = asset.aspectRatio ?? 3 / 2;
          return (
            <div
              key={grade.id}
              data-analytics-id={`WoodCarousel:${grade.id}`}
              className="flex min-w-[260px] flex-col rounded-3xl border border-border/70 bg-card p-4 shadow-sm md:min-w-[320px] md:p-6 lg:min-w-0 lg:p-8"
            >
              <div
                className="relative overflow-hidden rounded-xl bg-neutral-200"
                style={{ aspectRatio: ratio }}
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
              <h3 className="mt-3 text-base font-semibold text-ink">
                {grade.name}
              </h3>
              <p className="mt-2 text-sm text-ink-muted">{grade.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
