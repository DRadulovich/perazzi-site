"use client";

import { useCallback, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { ServiceHero } from "@/types/service";

type Breadcrumb = { label: string; href: string };

type ServiceHeroProps = {
  hero: ServiceHero;
  breadcrumbs?: Breadcrumb[];
};

export function ServiceHero({ hero, breadcrumbs }: ServiceHeroProps) {
  const analyticsRef = useAnalyticsObserver("ServiceHeroSeen");
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

  return (
    <motion.section
      ref={setRefs}
      data-analytics-id="ServiceHeroSeen"
      className="relative isolate overflow-hidden rounded-3xl bg-perazzi-black text-white"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="relative w-full"
        style={prefersReducedMotion ? { aspectRatio: ratio } : { aspectRatio: ratio, y: parallax }}
        aria-hidden="true"
      >
        <Image
          src={hero.background.url}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      </motion.div>
      <div className="absolute inset-0 flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-4">
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
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Service
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {hero.title}
          </h1>
          {hero.subheading ? (
            <p className="text-lg text-white/80">{hero.subheading}</p>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
