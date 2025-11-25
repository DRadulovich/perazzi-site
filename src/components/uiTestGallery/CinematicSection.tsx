"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import clsx from "clsx";

type CinematicSectionProps = {
  id: string;
  background: string;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
};

export function CinematicSection({ id, background, children, className, overlayClassName }: CinematicSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallax = useTransform(scrollYProgress, [0, 1], ["-4%", "10%"]);

  return (
    <section
      id={id}
      ref={ref}
      className={clsx("relative isolate min-h-[70vh] overflow-hidden py-24 sm:py-28 lg:py-32", className)}
    >
      <motion.div
        className="absolute inset-0 -z-20 bg-cover bg-center motion-reduce:transform-none"
        style={{
          backgroundImage: `url(${background})`,
          y: prefersReducedMotion ? "0%" : parallax,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-[17] bg-[radial-gradient(circle_at_10%_0%,rgba(219,16,2,0.32),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(219,16,2,0.22),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-[15] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.65)_90%)]"
        aria-hidden
      />
      <div
        className={clsx(
          "absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/75",
          overlayClassName,
        )}
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-black via-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 sm:px-10">{children}</div>
    </section>
  );
}

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 18 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.72, ease: "easeOut", delay }}
      whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.01 }}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border border-white/12 bg-white/6 shadow-[0_40px_160px_rgba(0,0,0,0.65)] backdrop-blur-2xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.28),rgba(255,255,255,0.1)_34%,rgba(255,255,255,0)_64%)] before:opacity-65 before:transition-opacity before:duration-500 group-hover:before:opacity-85",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-1/2 after:bg-[radial-gradient(circle_at_50%_120%,rgba(219,16,2,0.28),transparent_60%)]",
        className,
      )}
    >
      <div className="relative z-10 p-6 sm:p-8">{children}</div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8 group-hover:ring-white/15" />
    </motion.div>
  );
}

type MatteChipProps = {
  children: ReactNode;
  className?: string;
};

export function MatteChip({ children, className }: MatteChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 shadow-lg shadow-black/30",
        className,
      )}
    >
      {children}
    </span>
  );
}

type GlassButtonProps = {
  href: string;
  label: string;
  variant?: "primary" | "ghost";
};

export function GlassButton({ href, label, variant = "primary" }: GlassButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
  const styles =
    variant === "primary"
      ? "border border-[#DB1002]/70 bg-[#DB1002]/20 text-white hover:border-[#DB1002] hover:bg-[#DB1002]/30"
      : "border border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:text-white";
  return (
    <Link href={href} className={clsx(base, styles)}>
      {label}
    </Link>
  );
}
