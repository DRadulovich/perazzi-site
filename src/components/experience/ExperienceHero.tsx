"use client";

import { useCallback, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { ExperienceHero } from "@/types/experience";

type Breadcrumb = {
  label: string;
  href: string;
};

type ExperienceHeroProps = {
  hero: ExperienceHero;
  breadcrumbs?: Breadcrumb[];
};

export function ExperienceHero({ hero, breadcrumbs }: ExperienceHeroProps) {
  const analyticsRef = useAnalyticsObserver("HeroSeen:experience");
  const containerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const ratio = hero.background.aspectRatio ?? 16 / 9;
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

  const mediaStyle = prefersReducedMotion
    ? undefined
    : { y: parallax };

  return (
    <motion.section
      ref={setRefs}
      data-analytics-id="HeroSeen:experience"
      className="overflow-hidden rounded-3xl bg-perazzi-black text-white"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="grid gap-8 px-6 py-12 sm:px-10 lg:px-16 md:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-6 md:col-span-5 lg:col-span-5">
          {breadcrumbs?.length ? (
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
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
          <div className="space-y-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              Experience
            </p>
            <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {hero.title}
            </h1>
            {hero.subheading ? (
              <p className="text-lg text-white/80">{hero.subheading}</p>
            ) : null}
          </div>
          <div
            className="pointer-events-none text-xs font-semibold uppercase tracking-[0.3em] text-white/70 md:mt-auto"
            aria-hidden="true"
          >
            Scroll
          </div>
        </div>
        <motion.div
          className="md:col-span-7 lg:col-span-7"
          style={mediaStyle}
          aria-hidden="true"
        >
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ aspectRatio: ratio }}
          >
            <Image
              src={hero.background.url}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 960px, (min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
