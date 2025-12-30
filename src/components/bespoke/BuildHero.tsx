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
            className="object-cover object-center"
          />
        <div
          className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent"
          aria-hidden="true"
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 pb-16 text-center sm:px-2 lg:gap-2 lg:pb-24"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="type-label text-white/80">
          {hero.eyebrow}
        </p>
        <h1 className="mb-3 flex flex-wrap justify-center gap-2 text-balance type-display text-white transition-opacity duration-700 motion-reduce:transition-none leading-[0.85]">
          {hero.title}
        </h1>
        <SafeHtml
          className="mx-auto mt-1 mb-7 max-w-7xl font-artisan not-italic text-white/80 text-[1em] sm:text-[1.2em] lg:text-[1.4em]"
          html={hero.introHtml}
        />
      </motion.div>
    </section>
  );
}
