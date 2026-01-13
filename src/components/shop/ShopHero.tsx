"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button, Heading, Text } from "@/components/ui";
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

type CartButtonProps = Readonly<{
  cartHref?: string;
  cartLabel: string;
}>;

function CartButton({ cartHref, cartLabel }: CartButtonProps) {
  if (!cartHref) {
    return null;
  }

  return (
    <Button asChild size="md" variant="ghost" className="text-ink-muted hover:text-ink">
      <Link href={cartHref} prefetch={false}>
        {cartLabel}
      </Link>
    </Button>
  );
}

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
      className="relative isolate w-screen max-w-[100vw] overflow-hidden min-h-[60vh] pb-8 sm:pb-12 full-bleed full-bleed-offset-top-lg"
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
        <div className="absolute inset-0 bg-(--scrim-soft)" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-hero" aria-hidden="true" />
      </motion.div>

      <motion.section
        className="relative z-10 mx-auto min-h-[60vh] max-w-6xl px-6 pb-12 pt-10 sm:px-10 sm:pb-14 sm:pt-14 lg:px-16 lg:pb-16"
        initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(12px)" }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={reduceMotion ? undefined : homeMotion.reveal}
      >
        <motion.div
          className="max-w-3xl rounded-3xl border border-border/70 bg-card/75 p-7 shadow-elevated backdrop-blur-xl sm:p-10"
          variants={content}
          initial={motionEnabled ? "hidden" : false}
          animate={motionEnabled ? "show" : undefined}
        >
          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <Text size="label-tight" className="text-ink-muted">
              {hero.eyebrow}
            </Text>
            <span className="h-1 w-1 rounded-full bg-perazzi-red/70" aria-hidden="true" />
            <Text size="label-tight" className="text-ink-muted">
              Botticino atelier
            </Text>
          </motion.div>

          <motion.div variants={item} className="mt-5 space-y-4">
            <Heading id="shop-hero-heading" level={1} size="xl" className="text-ink">
              {hero.title}
            </Heading>
            <Text size="md" className="text-ink-muted">
              {hero.subtitle}
            </Text>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
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
            <CartButton cartHref={cartHref} cartLabel={cartLabel} />
          </motion.div>

          <motion.div variants={item} className="mt-7 flex flex-wrap items-center gap-3 text-ink-muted">
            <Text size="sm" className="text-ink-muted">
              Feeling overwhelmed by the catalog?
            </Text>
            <Button asChild size="sm" variant="ghost" className="-mx-2 text-ink hover:bg-ink/5">
              <Link href="#parts-concierge" prefetch={false}>
                Meet the Parts Concierge
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </motion.section>
    </section>
  );
}
