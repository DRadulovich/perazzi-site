"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import type { HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { ScrollIndicator } from "./scroll-indicator";

type HeroBannerProps = {
  hero: HomeData["hero"];
  analyticsId?: string;
};

export function HeroBanner({ hero, analyticsId }: HeroBannerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const analyticsRef = useAnalyticsObserver(analyticsId ?? "HeroSeen");
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "15%"],
  );

  useMotionValueEvent(scrollYProgress, "change", () => {
    // no-op; required for Framer to track parallax
  });

  const heroHeading = hero.subheading ?? hero.tagline;
  const ratio = hero.background.aspectRatio ?? 16 / 9;

  const setRefs = useCallback((node: HTMLElement | null) => {
    sectionRef.current = node;
    analyticsRef.current = node;
  }, [analyticsRef]);

  return (
    <section
      ref={setRefs}
      data-analytics-id={analyticsId ?? "HeroSeen"}
      className="relative isolate min-h-[70vh] w-full overflow-hidden rounded-3xl bg-perazzi-black text-white lg:min-h-[90vh]"
      aria-labelledby="home-hero-heading"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          y: prefersReducedMotion ? "0%" : parallaxY,
        }}
      >
        <div className="relative h-full w-full" style={{ aspectRatio: ratio }}>
          <Image
            src={hero.background.url}
            alt={hero.background.alt}
            fill
            priority
            sizes="(min-width: 1024px) 1100px, 100vw"
            className="object-cover"
            onLoad={() => setMediaLoaded(true)}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </motion.div>

      <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-6 py-12 text-center sm:px-10 lg:min-h-[90vh]">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.4em] text-white/80 transition-opacity duration-700 ${
            mediaLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          {hero.tagline}
        </p>
        <h1
          id="home-hero-heading"
          className={`mt-4 text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl transition-opacity duration-700 ${
            mediaLoaded ? "opacity-100 delay-100" : "opacity-0"
          }`}
        >
          {heroHeading}
        </h1>
        {hero.background.caption ? (
          <p className="mt-6 max-w-xl text-sm text-white/75">{hero.background.caption}</p>
        ) : null}
      </div>

      <ScrollIndicator />
    </section>
  );
}
