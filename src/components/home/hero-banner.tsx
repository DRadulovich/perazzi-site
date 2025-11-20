"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [touchedCount, setTouchedCount] = useState(0);
  const [manifestoOpen, setManifestoOpen] = useState(false);
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
  const heroWords = useMemo(() => (heroHeading ?? "").split(/\s+/).filter(Boolean), [heroHeading]);

  useEffect(() => {
    setTouchedCount(0);
    setManifestoOpen(false);
  }, [heroHeading]);

  const handleWordTouch = (index: number) => {
    if (manifestoOpen) return;
    if (index === touchedCount) {
      const next = index + 1;
      setTouchedCount(next);
      if (next === heroWords.length && heroWords.length > 0) {
        setManifestoOpen(true);
      }
    }
  };
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
            className={`mt-4 flex flex-wrap justify-center gap-2 text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl transition-opacity duration-700 ${
              mediaLoaded ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            {heroWords.map((word, index) => {
              const touched = index < touchedCount;
              return (
                <span
                  key={`${word}-${index}`}
                  className={`relative cursor-pointer transition-colors ${
                    touched ? "underline decoration-perazzi-red decoration-2 underline-offset-4" : "hover:text-perazzi-red"
                  }`}
                  onMouseEnter={() => handleWordTouch(index)}
                  onTouchStart={() => handleWordTouch(index)}
                >
                  {word}
                </span>
              );
            })}
          </h1>
          {hero.background.caption ? (
            <p className="mt-6 w-full max-w-xl text-balance text-sm leading-relaxed text-white/75">
              {hero.background.caption}
            </p>
          ) : null}
        </div>
      </div>

      <ScrollIndicator />

      {manifestoOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 text-center text-white"
          role="dialog"
          aria-label="Perazzi Manifesto"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl space-y-6"
          >
            <div className="space-y-3 text-xs font-semibold uppercase tracking-[0.35em] leading-6 text-white">
              {[
                "A Perazzi is not something you own.",
                "It is something you grow into.",
                "A quiet companion to the parts of you that refuse to be ordinary.",
                "It waits, patiently, for the moment you are ready to become it.",
              ].map((line, idx) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.2, duration: 0.6, ease: "easeOut" }}
                >
                  {line}
                </motion.p>
              ))}
            </div>
            <motion.button
              type="button"
              className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 underline underline-offset-4 transition hover:text-white"
              onClick={() => {
                setManifestoOpen(false);
                setTouchedCount(0);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 0.45, ease: "easeOut" }}
            >
              Close – return to the surface
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
