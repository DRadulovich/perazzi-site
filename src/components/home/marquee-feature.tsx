"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Container, Heading, Section, Text } from "@/components/ui";

type MarqueeFeatureProps = Readonly<{
  champion: Champion;
  ui: HomeData["marqueeUi"];
}>;

export function MarqueeFeature({ champion, ui }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver("ChampionStorySeen");
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;
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
      className="relative flex w-screen max-w-[100vw] items-center overflow-hidden py-10 sm:py-16 full-bleed mt-[15px]"
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
        <div className="absolute inset-0 bg-(--scrim-soft)" aria-hidden />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas-70" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <Section
          padding="md"
          className="md:grid md:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)] md:items-center md:gap-10"
        >
          <motion.div
            initial={motionEnabled ? { opacity: 0, x: -30 } : false}
            whileInView={motionEnabled ? { opacity: 1, x: 0 } : undefined}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          >
            <div
              className="relative overflow-hidden rounded-2xl bg-elevated ring-1 ring-border/70 aspect-dynamic"
              style={{ "--aspect-ratio": ratio }}
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
            initial={motionEnabled ? { opacity: 0, y: 20 } : false}
            whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
          >
            <Text size="label-tight" className="text-ink-muted">
              {eyebrow}
            </Text>
            <Heading
              id="champion-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {champion.name}
            </Heading>
            <Text size="sm" className="text-ink-muted">
              {champion.title}
            </Text>
            <Text
              asChild
              size="lg"
              className="border-l-2 border-perazzi-red/50 pl-4 type-quote font-artisan text-ink"
            >
              <blockquote>“{champion.quote}”</blockquote>
            </Text>
            {champion.article ? (
              <a
                href={`/journal/${champion.article.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {champion.article.title}
                <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </motion.div>
        </Section>
      </Container>
    </section>
  );
}
