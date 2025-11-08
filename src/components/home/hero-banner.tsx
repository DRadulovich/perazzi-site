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
      className="relative isolate w-full overflow-hidden rounded-3xl bg-perazzi-black text-white"
      aria-labelledby="home-hero-heading"
    >
      <div className="relative w-full" style={{ aspectRatio: ratio }}>
        <motion.div
          className="absolute inset-0"
          style={{
            y: prefersReducedMotion ? "0%" : parallaxY,
          }}
        >
          <Image
            src={hero.background.url}
            alt={hero.background.alt}
            fill
            priority
            sizes="(min-width: 1536px) 1200px, (min-width: 1280px) 1100px, (min-width: 1024px) 80vw, 100vw"
            className="object-cover"
            onLoad={() => setMediaLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>

        <div className="relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center px-6 py-12 text-center sm:px-10 lg:py-16">
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
            <p className="mt-6 w-full max-w-xl text-balance text-sm leading-relaxed text-white/75">
              {hero.background.caption}
            </p>
          ) : null}
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
