"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button, Heading, Text } from "@/components/ui";
import { ShopConciergePanel } from "@/components/shop/ShopConciergePanel";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { homeMotion } from "@/lib/motionConfig";
import { isSanityImageUrl, sanityImageLoader } from "@/lib/sanityImage";
import type { ShopHeroContent } from "@/content/shop/hero";

const HERO_BACKGROUND_SIZES = "(min-width: 1920px) 1920px, 100vw";

type ShopHeroProps = Readonly<{
  hero: ShopHeroContent;
  cartHref?: string;
  cartLabel?: string;
}>;

export function ShopHero({ hero, cartHref, cartLabel = "View cart" }: ShopHeroProps) {
  const analyticsRef = useAnalyticsObserver("HeroSeen:shop");
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const motionEnabled = !reduceMotion;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
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
      sectionRef.current = node;
    },
    [analyticsRef],
  );

  const content = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.12 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 16, filter: "blur(12px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const isSanityImage = isSanityImageUrl(hero.background.url);
  const mediaStyle = reduceMotion ? undefined : { y: parallax };

  return (
    <section
      ref={setRefs}
      data-analytics-id="HeroSeen:shop"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden min-h-[70vh] pb-10 sm:pb-16 full-bleed full-bleed-offset-top-lg"
      aria-labelledby="shop-hero-heading"
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={mediaStyle}
        aria-hidden="true"
      >
        <Image
          src={hero.background.url}
          alt=""
          fill
          priority
          sizes={HERO_BACKGROUND_SIZES}
          quality={isSanityImage ? 70 : undefined}
          loader={isSanityImage ? sanityImageLoader : undefined}
          className="object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-hero" aria-hidden="true" />
      </motion.div>

      <motion.section
        className="relative z-10 mx-auto min-h-[70vh] max-w-6xl overflow-hidden rounded-2xl border border-white/12 bg-black/45 text-white shadow-elevated ring-1 ring-white/10 backdrop-blur-xl sm:rounded-3xl"
        initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(12px)" }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={reduceMotion ? undefined : homeMotion.reveal}
      >
        <motion.div className="grid min-h-[70vh] items-start gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:px-16">
          <motion.div
            className="flex flex-col gap-6"
            variants={content}
            initial={motionEnabled ? "hidden" : false}
            animate={motionEnabled ? "show" : undefined}
          >
            <motion.div variants={item}>
              <Text size="label-tight" className="text-white/70">
                {hero.eyebrow}
              </Text>
            </motion.div>
            <motion.div variants={item} className="space-y-4">
              <Heading id="shop-hero-heading" level={1} size="xl" className="text-white">
                {hero.title}
              </Heading>
              <Text size="md" className="max-w-2xl text-white/80">
                {hero.subtitle}
              </Text>
            </motion.div>
            <motion.div variants={item} className="flex flex-wrap items-center gap-3">
              <Button asChild size="md">
                <Link href={hero.primaryCta.href} prefetch={false}>
                  {hero.primaryCta.label}
                </Link>
              </Button>
              <Button asChild size="md" variant="secondary">
                <Link href={hero.secondaryCta.href} prefetch={false}>
                  {hero.secondaryCta.label}
                </Link>
              </Button>
              {cartHref ? (
                <Button asChild size="sm" variant="ghost" className="text-white/80 hover:text-white">
                  <Link href={cartHref} prefetch={false}>
                    {cartLabel}
                  </Link>
                </Button>
              ) : null}
            </motion.div>
          </motion.div>

          {hero.conciergePanel ? (
            <motion.div
              variants={item}
              initial={motionEnabled ? "hidden" : false}
              animate={motionEnabled ? "show" : undefined}
              className="lg:self-center"
            >
              <ShopConciergePanel
                eyebrow={hero.conciergePanel.eyebrow}
                heading={hero.conciergePanel.heading}
                body={hero.conciergePanel.body}
                steps={hero.conciergePanel.steps}
                primaryCta={hero.conciergePanel.primaryCta}
                secondaryCta={hero.conciergePanel.secondaryCta}
              />
            </motion.div>
          ) : null}
        </motion.div>
      </motion.section>
    </section>
  );
}
