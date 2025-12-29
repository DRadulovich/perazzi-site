"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import Image from "next/image";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { BuildHero } from "@/types/build";

type BuildHeroProps = Readonly<{
  hero: BuildHero;
  fullBleed?: boolean;
}>;

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

  const mediaStyle = prefersReducedMotion ? undefined : { y: parallax };

  return (
    <section
      ref={containerRef}
      data-analytics-id="HeroSeen:bespoke"
      className={`relative isolate min-h-screen overflow-hidden bg-perazzi-black text-white ${
        fullBleed ? "full-bleed w-screen max-w-[100vw] rounded-none" : "rounded-3xl"
      }`}
    >
      <motion.div
        className="relative h-screen w-full"
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
          className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent"
          aria-hidden="true"
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex flex-col justify-center px-6 py-16 text-center sm:px-10 lg:px-16"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="type-label text-white/70">
          {hero.eyebrow}
        </p>
        <h1 className="mt-1 mb-10 flex flex-wrap justify-center gap-2 text-balance type-display text-white transition-opacity duration-700 motion-reduce:transition-none">
          {hero.title}
        </h1>
        <SafeHtml
          className="mx-auto mt-3 mb-3 max-w-2xl type-body-lg text-white/80 md:max-w-4xl lg:max-w-4xl"
          html={hero.introHtml}
        />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
        aria-hidden="true"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-4 py-2 type-button text-white/85 shadow-soft backdrop-blur-sm">
          <span>Scroll</span>
          <span className="text-lg leading-none">↓</span>
        </span>
      </div>
    </section>
  );
}
