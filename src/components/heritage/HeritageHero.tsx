"use client";

import { useCallback, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
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
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const parallax = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", prefersReducedMotion ? "0%" : "12%"],
  );

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      analyticsRef.current = node;
      containerRef.current = node;
    },
    [analyticsRef],
  );

  const mediaStyle = prefersReducedMotion ? undefined : { y: parallax };

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
        <div className="pointer-events-none absolute inset-0 overlay-gradient-hero" />
      </motion.div>

      <motion.section
        ref={setRefs}
        data-analytics-id="HeroSeen:heritage"
        className="relative z-10 mx-auto min-h-screen max-w-6xl overflow-hidden rounded-2xl border border-gray-700/30 bg-card/10 text-white shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/0 sm:shadow-elevated"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex min-h-screen flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-6 lg:max-w-4xl">
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
              <h1 className="text-balance type-section">
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
          </div>

          <motion.div
            style={mediaStyle}
            aria-hidden="true"
          >
            <div className="relative aspect-[16/9] w-full min-h-[360px] overflow-hidden rounded-2xl shadow-elevated ring-1 ring-white/10">
              <Image
                src={hero.background.url}
                alt={hero.background.alt || hero.title}
                fill
                priority
                sizes="(min-width: 1280px) 1200px, (min-width: 1024px) 960px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      </motion.section>
    </section>
  );
}
