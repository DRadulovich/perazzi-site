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
  const HEADER_OFFSET = 80;
  const analyticsRef = useAnalyticsObserver("HeroSeen:experience");
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

  const mediaStyle = prefersReducedMotion
    ? undefined
    : { y: parallax };

  return (
    <section
      className="relative isolate w-screen overflow-hidden py-6 sm:py-8 min-h-screen"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        marginTop: `-${HEADER_OFFSET}px`,
        paddingTop: `${HEADER_OFFSET}px`,
      }}
      aria-labelledby="experience-hero-heading"
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
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-black) 16%, transparent) 0%, color-mix(in srgb, var(--color-black) 4%, transparent) 50%, color-mix(in srgb, var(--color-black) 16%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-black) 60%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-black) 60%, transparent) 0%, transparent 75%)",
          }}
        />
      </motion.div>

      <motion.section
        ref={setRefs}
        data-analytics-id="HeroSeen:experience"
        className="relative z-10 mx-auto min-h-screen max-w-6xl overflow-hidden rounded-3xl bg-card/0 text-white shadow-lg backdrop-blur-sm border border-gray-700/30"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex min-h-screen flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-6 lg:max-w-4xl">
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
              className="pointer-events-none text-xs font-semibold uppercase tracking-[0.3em] text-white/70"
              aria-hidden="true"
            >
              Scroll
            </div>
          </div>

          <motion.div
            style={prefersReducedMotion ? undefined : mediaStyle}
            aria-hidden="true"
          >
            <div
              className="relative aspect-[16/9] w-full min-h-[360px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
            >
              <Image
                src={hero.background.url}
                alt={hero.background.alt ?? hero.title}
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
