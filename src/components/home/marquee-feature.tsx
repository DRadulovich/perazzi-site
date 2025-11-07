"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Champion } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type MarqueeFeatureProps = {
  champion: Champion;
};

export function MarqueeFeature({ champion }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver("ChampionStorySeen");
  const prefersReducedMotion = useReducedMotion();
  const ratio = champion.image.aspectRatio ?? 3 / 4;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ChampionStorySeen"
      className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-ink shadow-sm sm:px-10 md:grid md:grid-cols-[minmax(280px,1fr)_minmax(320px,1fr)] md:items-center md:gap-10"
      aria-labelledby="champion-heading"
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, x: -30 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      >
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ aspectRatio: ratio }}
        >
          <Image
            src={champion.image.url}
            alt={champion.image.alt}
            fill
            sizes="(min-width: 1024px) 440px, 100vw"
            className="object-cover"
            loading="lazy"
          />
        </div>
      </motion.div>

      <motion.div
        className="mt-8 space-y-4 md:mt-0"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Champion spotlight
        </p>
        <h2 id="champion-heading" className="text-3xl font-semibold text-ink">
          {champion.name}
        </h2>
        <cite className="block text-base font-medium text-ink-muted not-italic">
          {champion.title}
        </cite>
        <blockquote className="border-l-2 border-perazzi-red/50 pl-4 text-xl italic leading-relaxed text-ink">
          “{champion.quote}”
        </blockquote>
        {champion.article ? (
          <a
            href={`/journal/${champion.article.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
          >
            {champion.article.title}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </motion.div>
    </section>
  );
}
