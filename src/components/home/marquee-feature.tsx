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
      className="relative flex w-screen items-center overflow-hidden py-50 sm:py-60"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="champion-heading"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg"
          alt="Perazzi workshop background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/40 p-6 text-ink shadow-elevated backdrop-blur-sm sm:p-8 lg:p-10 md:grid md:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)] md:items-center md:gap-10">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: -30 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          >
            <div
              className="relative overflow-hidden rounded-2xl bg-[color:var(--surface-elevated)]"
              style={{ aspectRatio: ratio }}
            >
              <Image
                src={champion.image.url}
                alt={champion.image.alt}
                fill
                sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
        </div>
      </div>
    </section>
  );
}
