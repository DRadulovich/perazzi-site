"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { homeMotion } from "@/lib/motionConfig";
import type { BuildHero } from "@/types/build";

type BuildHeroProps = Readonly<{
  hero: BuildHero;
  fullBleed?: boolean;
}>;

export function BuildHero({ hero, fullBleed = false }: BuildHeroProps) {
  const containerRef = useAnalyticsObserver("HeroSeen:bespoke");
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const parallax = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", motionEnabled ? "12%" : "0%"],
  );

  const mediaStyle = motionEnabled ? { y: parallax } : undefined;

  const content = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.12 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 16, filter: "blur(12px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

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
        initial={motionEnabled ? { scale: 1.03 } : false}
        animate={motionEnabled ? { scale: 1 } : undefined}
        transition={motionEnabled ? homeMotion.reveal : undefined}
      >
          <Image
            src={hero.media.url}
            alt={hero.media.alt}
            fill
            priority
            sizes="(min-width: 1536px) 1200px, (min-width: 1280px) 1100px, (min-width: 1024px) 80vw, 100vw"
            className="object-cover object-center"
          />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent"
          aria-hidden="true"
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 pb-16 text-center sm:px-2 lg:gap-2 lg:pb-24"
        variants={content}
        initial={motionEnabled ? "hidden" : false}
        animate={motionEnabled ? "show" : undefined}
      >
        <motion.p className="type-label text-white/80" variants={item}>
          {hero.eyebrow}
        </motion.p>
        <motion.h1
          className="mb-3 flex flex-wrap justify-center gap-2 text-balance type-display text-white transition-opacity duration-700 motion-reduce:transition-none leading-[0.85]"
          variants={item}
        >
          {hero.title}
        </motion.h1>
        <motion.div variants={item}>
          <SafeHtml
            className="mx-auto mt-1 mb-7 max-w-7xl font-artisan not-italic text-white/80 text-[1em] sm:text-[1.2em] lg:text-[1.4em]"
            html={hero.introHtml}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
