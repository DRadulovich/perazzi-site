"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

type CinematicImageStripProps = {
  src: string;
  alt?: string;
};

// Full-bleed cinematic band for the shotguns landing; breaks out of the SiteShell container without adding new content.
export function CinematicImageStrip({ src, alt }: CinematicImageStripProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-4%", "8%"]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate w-screen overflow-hidden bg-perazzi-black"
      style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}
    >
      <div
        className="relative"
        style={{ height: "clamp(380px, 55vh, 720px)" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ y: prefersReducedMotion ? "0%" : parallaxY }}
        >
          <Image
            src={src}
            alt={alt ?? ""}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-black/25"
            aria-hidden="true"
          />
        </motion.div>

        <div
          className="pointer-events-none absolute inset-0"
          // Uses var(--color-canvas) which the theme toggles for light/dark surfaces.
          style={{
            backgroundImage:
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)," +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
