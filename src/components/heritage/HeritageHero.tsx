"use client";

import { useCallback, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { homeMotion } from "@/lib/motionConfig";
import type { HeritageHero } from "@/types/heritage";

type Breadcrumb = Readonly<{
  label: string;
  href: string;
}>;

type HeritageHeroProps = Readonly<{
  hero: HeritageHero;
  breadcrumbs?: Breadcrumb[];
}>;

export function HeritageHero({ hero, breadcrumbs }: HeritageHeroProps) {
  const analyticsRef = useAnalyticsObserver("HeroSeen:heritage");
  const containerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const parallax = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduceMotion ? "0%" : "12%"],
  );

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      analyticsRef.current = node;
      containerRef.current = node;
    },
    [analyticsRef],
  );

  const mediaStyle = reduceMotion ? undefined : { y: parallax };

  const content = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.1 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 16, filter: "blur(12px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  return (
    <section
      className="relative isolate w-screen max-w-[100vw] overflow-hidden min-h-screen pb-10 sm:pb-16 full-bleed full-bleed-offset-top-lg"
      aria-labelledby="heritage-hero-heading"
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={mediaStyle}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url(${hero.background.url})`,
          }}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-hero" />
      </motion.div>

      <motion.section
        ref={setRefs}
        data-analytics-id="HeroSeen:heritage"
        className="relative z-10 mx-auto min-h-screen max-w-6xl overflow-hidden rounded-2xl border border-white/12 bg-black/40 text-white shadow-elevated ring-1 ring-white/10 backdrop-blur-xl sm:rounded-3xl"
        initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(12px)" }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={reduceMotion ? undefined : homeMotion.reveal}
      >
        <motion.div
          className="flex min-h-screen flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16"
          variants={content}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "show"}
        >
          <motion.div className="flex flex-col gap-6 lg:max-w-4xl" variants={item}>
            {breadcrumbs?.length ? (
              <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-2 type-label-tight text-white/70">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center gap-2">
                      <Link
                        href={crumb.href}
                        className="focus-ring rounded-full px-3 py-1 hover:text-white"
                        prefetch={false}
                      >
                        {crumb.label}
                      </Link>
                      {index < breadcrumbs.length - 1 ? (
                        <span aria-hidden="true" className="text-white/40">
                          /
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <div className="space-y-4">
              <p className="type-label text-white/70">
                Heritage
              </p>
              <h1 id="heritage-hero-heading" className="text-balance type-section">
                {hero.title}
              </h1>
              {hero.subheading ? (
                <p className="type-card-body text-white/80 italic text-2xl">
                  {hero.subheading}
                </p>
              ) : null}
            </div>
            <div
              className="pointer-events-none type-label-tight text-white/70"
              aria-hidden="true"
            >
              Scroll
            </div>
          </motion.div>

          <motion.div
            style={reduceMotion ? undefined : mediaStyle}
            aria-hidden="true"
            variants={item}
          >
            <div className="group relative aspect-[16/9] w-full min-h-[360px] overflow-hidden rounded-2xl bg-black/30 shadow-elevated ring-1 ring-white/10">
              <Image
                src={hero.background.url}
                alt={hero.background.alt || hero.title}
                fill
                priority
                sizes="(min-width: 1280px) 1200px, (min-width: 1024px) 960px, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
              <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          </motion.div>
        </motion.div>
      </motion.section>
    </section>
  );
}
