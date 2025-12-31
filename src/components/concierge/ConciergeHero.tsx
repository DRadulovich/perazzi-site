"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { FactoryAsset } from "@/types/content";
import { homeMotion } from "@/lib/motionConfig";
import { Heading, Text } from "@/components/ui";

type ConciergeHeroProps = {
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly subheading: string;
    readonly background: FactoryAsset;
    readonly bullets: ReadonlyArray<{ readonly title: string; readonly body: string }>;
  };
};

export function ConciergeHero({ hero }: ConciergeHeroProps) {
  const analyticsRef = useAnalyticsObserver("HeroSeen:concierge");
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;
  const revealTransition = motionEnabled ? homeMotion.reveal : { duration: 0.01 };
  const revealFastTransition = motionEnabled ? homeMotion.revealFast : { duration: 0.01 };

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduceMotion ? "0%" : "12%"],
  );

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      analyticsRef.current = node;
      sectionRef.current = node;
    },
    [analyticsRef],
  );

  const copyContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.12 : 0 },
    },
  } as const;

  const copyItem = {
    hidden: { opacity: 0, y: 16, filter: "blur(12px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: revealFastTransition },
  } as const;

  return (
    <section
      ref={setRefs}
      data-analytics-id="HeroSeen:concierge"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden bg-perazzi-black text-ink min-h-screen py-10 sm:py-16 full-bleed"
      aria-labelledby="concierge-hero-heading"
    >
      <motion.div
        className="absolute inset-0"
        style={reduceMotion ? undefined : { y: parallaxY }}
        initial={motionEnabled ? { scale: 1.06 } : undefined}
        animate={motionEnabled ? { scale: 1.02 } : undefined}
        transition={motionEnabled ? { duration: 1.2, ease: homeMotion.cinematicEase } : undefined}
        aria-hidden="true"
      >
        <Image
          src={hero.background.url}
          alt={hero.background.alt}
          fill
          priority
          sizes="(min-width: 1280px) 1200px, (min-width: 1024px) 80vw, 100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-black/10" aria-hidden />
        <div className="pointer-events-none absolute inset-0 radial-vignette opacity-80" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-25" aria-hidden="true" />
        <div className="absolute inset-0 overlay-fade-canvas" aria-hidden="true" />
      </motion.div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:px-10 lg:px-16 md:grid-cols-12 lg:gap-16">
        <motion.div
          className="space-y-6 md:col-span-6 lg:col-span-7"
          variants={copyContainer}
          initial={motionEnabled ? "hidden" : false}
          animate={motionEnabled ? "show" : undefined}
        >
          <motion.div variants={copyItem}>
            <Text size="label-tight" className="text-ink/70">
              {hero.eyebrow}
            </Text>
          </motion.div>
          <motion.div variants={copyItem} className="space-y-4">
            <Heading id="concierge-hero-heading" level={1} size="lg" className="text-ink">
              {hero.title}
            </Heading>
            <Text size="md" className="max-w-2xl text-ink/80">
              {hero.subheading}
            </Text>
          </motion.div>

          <motion.div variants={copyItem} className="flex flex-wrap gap-3">
            <motion.div
              whileHover={motionEnabled ? { y: -1, transition: homeMotion.micro } : undefined}
              whileTap={motionEnabled ? { y: 0, transition: homeMotion.micro } : undefined}
            >
              <Link
                href="#concierge-conversation"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand px-4 py-2 type-button text-ink transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                data-analytics-id="ConciergeHero:OpenConversation"
              >
                Open the conversation
              </Link>
            </motion.div>
            <motion.div
              whileHover={motionEnabled ? { y: -1, transition: homeMotion.micro } : undefined}
              whileTap={motionEnabled ? { y: 0, transition: homeMotion.micro } : undefined}
            >
              <Link
                href="#concierge-navigator"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-ink/30 bg-white/10 px-4 py-2 type-button text-ink/90 transition hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
                data-analytics-id="ConciergeHero:JumpToNavigator"
              >
                Jump to build flow
              </Link>
            </motion.div>
          </motion.div>

          <motion.div variants={copyItem} className="grid gap-3 sm:grid-cols-2">
            {hero.bullets.map((bullet) => (
              <motion.div
                key={bullet.title}
                className="rounded-2xl border border-ink/10 bg-white/5 px-4 py-3 shadow-soft backdrop-blur-md"
                whileHover={motionEnabled ? { y: -2, transition: homeMotion.micro } : undefined}
              >
                <Text className="type-title-sm text-ink">{bullet.title}</Text>
                <Text size="sm" className="mt-1 text-ink/75">{bullet.body}</Text>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="space-y-4 rounded-2xl border border-ink/20 bg-white/5 p-4 shadow-soft backdrop-blur-md md:col-span-6 lg:col-span-5 sm:rounded-3xl sm:p-5"
          initial={motionEnabled ? { opacity: 0, y: 18, filter: "blur(12px)" } : false}
          animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={motionEnabled ? { delay: 0.1, ...revealTransition } : undefined}
        >
          <div className="flex items-center justify-between gap-3">
            <Text size="label-tight" className="text-ink/70">
              Workshop snapshot
            </Text>
            <span className="flex items-center gap-2 pill bg-white/10 type-label-tight text-ink/80">
              <span className="h-2 w-2 rounded-full bg-perazzi-red" aria-hidden="true" /><span>Live</span>
            </span>
          </div>
          <Text size="md" className="text-ink/80">
            A guided build flow paired with the concierge. Keep your conversation, options, and dealer-ready
            brief in one place while you explore.
          </Text>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-linear-to-br from-white/10 via-white/5 to-transparent px-3 py-3">
              <Text size="label-tight" className="text-ink/70">Context</Text>
              <Text size="sm" className="mt-1 text-ink">
                Carries selections and history into every reply.
              </Text>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-linear-to-br from-perazzi-red/20 via-white/5 to-transparent px-3 py-3">
              <Text size="label-tight" className="text-ink/70">Navigator</Text>
              <Text size="sm" className="mt-1 text-ink">
                Step-by-step path from frame size to engraving.
              </Text>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Dealer brief ready", "Saved builds", "Desktop experience"].map((chip) => (
              <span
                key={chip}
                className="pill border border-ink/20 bg-white/10 type-label-tight text-ink/80"
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
