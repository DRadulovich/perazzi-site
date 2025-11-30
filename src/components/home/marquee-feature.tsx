"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type MarqueeFeatureProps = {
  champion: Champion;
  ui: HomeData["marqueeUi"];
};

export function MarqueeFeature({ champion, ui }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver("ChampionStorySeen");
  const prefersReducedMotion = useReducedMotion();
  const ratio = champion.image.aspectRatio ?? 3 / 4;
  const background = ui.background ?? {
    id: "marquee-background-fallback",
    kind: "image",
    url: "/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg",
    alt: "Perazzi workshop background",
  };
  const eyebrow = ui.eyebrow ?? "Champion spotlight";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ChampionStorySeen"
      className="relative flex w-screen max-w-[100vw] items-center overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="champion-heading"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={background.url}
          alt={background.alt}
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
        <div className="rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/30 p-4 text-ink shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-[color:var(--color-canvas)]/40 sm:p-6 sm:shadow-elevated lg:p-8 md:grid md:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)] md:items-center md:gap-10">
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
              {eyebrow}
            </p>
            <h2
              id="champion-heading"
              className="text-2xl sm:text-3xl font-semibold text-ink"
            >
              {champion.name}
            </h2>
            <cite className="block text-sm sm:text-base font-medium text-ink-muted not-italic">
              {champion.title}
            </cite>
            <blockquote className="border-l-2 border-perazzi-red/50 pl-4 text-base sm:text-lg italic leading-relaxed text-ink">
              “{champion.quote}”
            </blockquote>
            {champion.article ? (
              <a
                href={`/journal/${champion.article.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
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
