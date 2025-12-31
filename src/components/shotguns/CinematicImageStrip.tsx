"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

type CinematicImageStripProps = Readonly<{
  src?: string;
  image?: Readonly<{ url: string; alt?: string }>;
  alt?: string;
}>;

// Full-bleed cinematic band for the shotguns landing; breaks out of the SiteShell container without adding new content.
export function CinematicImageStrip({ src, image, alt }: CinematicImageStripProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-4%", "8%"]);

  const resolvedSrc = image?.url ?? src ?? "";
  const resolvedAlt = image?.alt ?? alt ?? "";

  if (!resolvedSrc) return null;

  return (
    <section
      ref={sectionRef}
      className="relative isolate w-screen max-w-[100vw] overflow-hidden bg-perazzi-black full-bleed"
      aria-hidden="true"
    >
      <div className="relative cinematic-strip-height">
        <motion.div
          className="absolute inset-0"
          style={{ y: prefersReducedMotion ? "0%" : parallaxY }}
        >
          <Image
            src={resolvedSrc}
            alt={resolvedAlt}
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-black/25"
            aria-hidden="true"
          />
        </motion.div>

        <div
          className="pointer-events-none absolute inset-0 overlay-gradient-canvas-70"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
