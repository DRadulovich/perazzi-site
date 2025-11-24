"use client";

import { Children, useRef, type ReactNode } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type CinematicSectionProps = {
  id?: string;
  label?: string;
  title?: string;
  body?: string;
  backgroundImage: string;
  backgroundAlt: string;
  align?: "left" | "right" | "center";
  priority?: boolean;
  labelPlacement?: "card" | "outside";
  outsideLabelClassName?: string;
  contentPosition?: "start" | "center" | "end";
  contentClassName?: string;
  primaryCardClassName?: string;
  childrenWrapperClassName?: string;
  floatingOverlay?: ReactNode;
  children?: ReactNode;
};

type GlassCardProps = {
  className?: string;
  children: ReactNode;
};

type MatteCardProps = {
  className?: string;
  children: ReactNode;
};

type MatteChipProps = {
  className?: string;
  children: ReactNode;
};

export const glassCardBaseClasses =
  "relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.12),rgba(255,255,255,0.06)_18%,rgba(0,0,0,0)_100%)] bg-white/6 px-6 py-6 backdrop-blur-2xl shadow-[0_26px_90px_rgba(0,0,0,0.8)] sm:px-8 sm:py-8";

export const matteCardBaseClasses =
  "relative overflow-hidden rounded-2xl border border-white/10 bg-black/70 px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.65)] sm:px-6 sm:py-6";

export const matteChipBaseClasses =
  "inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/70 px-4 py-2 text-[0.75rem] uppercase tracking-[0.18em] text-white/70 shadow-[0_12px_36px_rgba(0,0,0,0.55)]";

const heroCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] },
  },
};

const chipVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] },
  },
};

const labelVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] },
  },
};

export function CinematicSection({
  id,
  label,
  title,
  body,
  backgroundImage,
  backgroundAlt,
  align = "left",
  priority = false,
  labelPlacement = "card",
  outsideLabelClassName,
  contentPosition = "center",
  contentClassName,
  primaryCardClassName,
  childrenWrapperClassName,
  floatingOverlay,
  children,
}: CinematicSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  const contentY = useTransform(scrollYProgress, [0, 1], [8, -8]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0.72, 0.32]);

  return (
    <section
      id={id}
      ref={ref}
      className="relative isolate flex min-h-[78vh] w-full items-stretch overflow-hidden"
    >
      <motion.div
        aria-hidden
        style={{ y: bgY }}
        className="absolute inset-0"
      >
        <Image
          src={backgroundImage}
          alt={backgroundAlt}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/72" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.85),rgba(0,0,0,0)_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78),rgba(0,0,0,0)_52%)]" />
      </motion.div>

      <motion.div
        aria-hidden
        style={{ opacity: glowOpacity }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_24%,rgba(0,0,0,0.38),transparent_36%),radial-gradient(circle_at_76%_18%,rgba(60,60,70,0.18),transparent_40%),radial-gradient(circle_at_50%_82%,rgba(80,90,110,0.14),transparent_42%)]"
      />

      <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.96),rgba(0,0,0,0)_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(0,0,0,0.92),rgba(0,0,0,0)_70%)]" />

      {floatingOverlay ? (
        <div className="pointer-events-none absolute inset-0">{floatingOverlay}</div>
      ) : null}

      <div
        className={cn(
          "relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col px-6 py-16 sm:px-10 lg:px-16",
          contentPosition === "start" && "justify-start",
          contentPosition === "center" && "justify-center",
          contentPosition === "end" && "justify-end",
          contentClassName,
        )}
      >
        {labelPlacement === "outside" && label ? (
          <motion.div
            variants={labelVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            style={{ y: contentY }}
            className={cn(
              "mb-4 text-xs uppercase tracking-[0.25em] text-neutral-300/70",
              align === "right" && "ml-auto text-right",
              align === "center" && "mx-auto text-center",
              outsideLabelClassName,
            )}
          >
            {label}
          </motion.div>
        ) : null}
        <motion.div
          variants={heroCardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.45 }}
          style={{ y: contentY }}
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "flex w-full max-w-4xl flex-col gap-5 sm:gap-6 outline-none",
            align === "right" && "ml-auto text-right",
            align === "center" && "mx-auto text-center",
          )}
        >
          <GlassCard className={cn("max-w-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0", primaryCardClassName)}>
            {labelPlacement === "card" && label ? (
              <p className="text-[0.65rem] uppercase tracking-[0.38em] text-white/60">
                {label}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.65rem]">
                {title}
              </h2>
            ) : null}
            {body ? (
              <p className="mt-3 max-w-3xl text-base text-white/75 sm:text-lg">
                {body}
              </p>
            ) : null}
          </GlassCard>
        </motion.div>

        {children ? (
          <div
            className={cn(
              "mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6",
              align === "left" && "mr-auto",
              align === "right" && "ml-auto",
              align === "center" && "mx-auto max-w-5xl",
              childrenWrapperClassName,
            )}
          >
            {Children.map(children, (child) => (
              <motion.div
                variants={chipVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {child}
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function GlassCard({ className, children }: GlassCardProps) {
  return (
    <div className={cn(glassCardBaseClasses, className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/8 via-white/2 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(255,255,255,0.24),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(255,190,140,0.16),transparent_32%)] opacity-70"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function MatteCard({ className, children }: MatteCardProps) {
  return (
    <div className={cn(matteCardBaseClasses, className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.08),transparent_36%)] opacity-70"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function MatteChip({ className, children }: MatteChipProps) {
  return <div className={cn(matteChipBaseClasses, className)}>{children}</div>;
}
