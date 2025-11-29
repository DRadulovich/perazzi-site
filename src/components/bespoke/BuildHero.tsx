"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { BuildHero } from "@/types/build";

type BuildHeroProps = {
  hero: BuildHero;
  fullBleed?: boolean;
};

export function BuildHero({ hero, fullBleed = false }: BuildHeroProps) {
  const containerRef = useAnalyticsObserver("HeroSeen:bespoke");
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const parallax = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", prefersReducedMotion ? "0%" : "12%"],
  );

  const mediaStyle = prefersReducedMotion
    ? { height: "100vh" }
    : { height: "100vh", y: parallax };

  return (
    <section
      ref={containerRef}
      data-analytics-id="HeroSeen:bespoke"
      className={`relative isolate min-h-screen overflow-hidden bg-perazzi-black text-white ${
        fullBleed ? "rounded-none" : "rounded-3xl"
      }`}
    >
      <motion.div
        className="relative h-full w-full"
        style={mediaStyle}
      >
          <Image
            src={hero.media.url}
            alt={hero.media.alt}
            fill
            priority
            sizes="(min-width: 1536px) 1200px, (min-width: 1280px) 1100px, (min-width: 1024px) 80vw, 100vw"
            className="object-cover"
          />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"
          aria-hidden="true"
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex flex-col justify-center px-6 py-16 text-center sm:px-10 lg:px-16"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
          {hero.eyebrow}
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          {hero.title}
        </h1>
        <div
          className="prose prose-base prose-invert mx-auto mt-6 max-w-none text-white/80 md:prose-lg md:max-w-3xl lg:max-w-4xl"
          dangerouslySetInnerHTML={{ __html: hero.introHtml }}
        />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
        aria-hidden="true"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
          Scroll
          <span className="text-lg leading-none">↓</span>
        </span>
      </div>
    </section>
  );
}
