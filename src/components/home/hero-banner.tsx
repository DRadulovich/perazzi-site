"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { vercelStegaSplit } from "@vercel/stega";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { getImageProps } from "next/image";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import type { HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { homeMotion } from "@/lib/motionConfig";
import { ScrollIndicator } from "./scroll-indicator";

type HeroBannerProps = Readonly<{
  hero: HomeData["hero"];
  heroCtas?: HomeData["heroCtas"];
  analyticsId?: string;
  fullBleed?: boolean;
  hideCtas?: boolean;
}>;

export function HeroBanner({ hero, heroCtas, analyticsId, fullBleed = false, hideCtas = false }: HeroBannerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const heroImageRef = useRef<HTMLImageElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [visitedWords, setVisitedWords] = useState<Set<number>>(() => new Set());
  const analyticsRef = useAnalyticsObserver(analyticsId ?? "HeroSeen");
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);
  const heroHeading = hero.subheading ?? hero.tagline ?? "";
  const { cleaned: heroHeadingCleaned, encoded: heroHeadingEncoded } = vercelStegaSplit(heroHeading);
  const { headingWords, headingWordCount } = useMemo(() => {
    const words = heroHeadingCleaned.trim().split(/\s+/).filter(Boolean);
    return { headingWords: words, headingWordCount: words.length };
  }, [heroHeadingCleaned]);
  const heroSizes =
    "(min-width: 1536px) 1400px, (min-width: 1280px) 1200px, (min-width: 1024px) 90vw, 100vw";

  const handleMediaLoad = useCallback(() => {
    setMediaLoaded(true);
  }, []);

  const { props: desktopImageProps } = getImageProps({
    src: hero.background.url,
    alt: hero.background.alt,
    fill: true,
    priority: true,
    sizes: heroSizes,
    className: "object-cover object-center",
  });

  const tabletImageProps = hero.backgroundTablet
    ? getImageProps({
        src: hero.backgroundTablet.url,
        alt: hero.backgroundTablet.alt,
        fill: true,
        priority: true,
        sizes: heroSizes,
        className: "object-cover object-center",
      }).props
    : null;

  const mobileImageProps = hero.backgroundMobile
    ? getImageProps({
        src: hero.backgroundMobile.url,
        alt: hero.backgroundMobile.alt,
        fill: true,
        priority: true,
        sizes: heroSizes,
        className: "object-cover object-center",
      }).props
    : null;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "15%"],
  );

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!manifestoOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [manifestoOpen]);

  useEffect(() => {
    if (mediaLoaded) return;
    const img = heroImageRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setMediaLoaded(true);
    }
  }, [mediaLoaded]);

  useMotionValueEvent(scrollYProgress, "change", () => {
    // no-op; required for Framer to track parallax
  });

  const fallbackCtas: HomeData["heroCtas"] = {
    primaryLabel: "Ask the concierge",
    primaryPrompt:
      "Introduce me to Perazzi's bespoke philosophy and help me choose where to begin if I'm exploring my first build.",
    secondaryLabel: "Explore shotguns",
    secondaryHref: "/shotguns",
  };

  const ctas = heroCtas ?? fallbackCtas;
  const primaryLabel = ctas.primaryLabel ?? fallbackCtas.primaryLabel;
  const primaryPrompt = ctas.primaryPrompt ?? fallbackCtas.primaryPrompt;

  const closeManifesto = useCallback(() => {
    setManifestoOpen(false);
    setVisitedWords(new Set());
  }, []);

  const openManifesto = useCallback(() => {
    if (!lastFocusedRef.current && typeof document !== "undefined") {
      const activeElement = document.activeElement;
      lastFocusedRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    }
    setManifestoOpen(true);
  }, []);

  const setRefs = useCallback((node: HTMLElement | null) => {
    sectionRef.current = node;
    analyticsRef.current = node;
  }, [analyticsRef]);

  const handleWordVisit = useCallback((index: number, element?: HTMLElement | null) => {
    if (element) {
      lastFocusedRef.current = element;
    }
    setVisitedWords((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  useEffect(() => {
    setVisitedWords(new Set());
  }, [heroHeadingCleaned]);

  useEffect(() => {
    if (manifestoOpen) return;
    if (headingWordCount === 0) return;
    if (visitedWords.size === headingWordCount) {
      openManifesto();
    }
  }, [headingWordCount, manifestoOpen, openManifesto, visitedWords]);

  const handleCloseAutoFocus = useCallback((event: Event) => {
    if (typeof document === "undefined") return;
    const focusTarget = lastFocusedRef.current;
    if (!focusTarget || focusTarget === document.body) return;
    if (!document.contains(focusTarget)) return;
    event.preventDefault();
    focusTarget.focus();
  }, []);

  const motionEnabled = !reduceMotion;
  const revealTransition = motionEnabled ? homeMotion.reveal : { duration: 0.01 };
  const revealFastTransition = motionEnabled ? homeMotion.revealFast : { duration: 0.01 };
  const panelTransition = motionEnabled
    ? { delay: 0.1, ...revealFastTransition }
    : { duration: 0.01 };

  const introContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: motionEnabled ? 0.12 : 0,
        delayChildren: motionEnabled ? 0.1 : 0,
      },
    },
  } as const;

  const introItemVariants = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: revealTransition },
  } as const;

  const taglineVariants = {
    hidden: { opacity: 0, y: 10, filter: "blur(8px)", letterSpacing: "0.55em" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      letterSpacing: "0.25em",
      transition: revealFastTransition,
    },
  } as const;

  const headingMaskVariants = {
    hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
    show: { opacity: 1, clipPath: "inset(0 0 0% 0)", transition: revealTransition },
  } as const;

  return (
    <section
      ref={setRefs}
      data-analytics-id={analyticsId ?? "HeroSeen"}
      className={`relative isolate flex min-h-screen flex-col overflow-hidden bg-perazzi-black text-white ${
        fullBleed ? "full-bleed w-screen max-w-[100vw] rounded-none" : "w-full rounded-3xl"
      }`}
      aria-labelledby="home-hero-heading"
    >
      <motion.div
        className="absolute inset-0 home-hero-media"
        style={{
          y: reduceMotion ? "0%" : parallaxY,
        }}
        animate={motionEnabled ? { scale: mediaLoaded ? 1.02 : 1.08 } : undefined}
        transition={motionEnabled ? { duration: 1.2, ease: homeMotion.cinematicEase } : { duration: 0.01 }}
      >
        <picture className="absolute inset-0">
          {mobileImageProps ? (
            <source
              media="(max-width: 767px)"
              srcSet={mobileImageProps.srcSet}
              sizes={mobileImageProps.sizes}
            />
          ) : null}
          {tabletImageProps ? (
            <source
              media="(min-width: 768px) and (max-width: 1024px)"
              srcSet={tabletImageProps.srcSet}
              sizes={tabletImageProps.sizes}
            />
          ) : null}
          <img
            {...desktopImageProps}
            alt={hero.background.alt ?? ""}
            ref={heroImageRef}
            onLoad={handleMediaLoad}
          />
        </picture>
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/75 to-black/0" />
        <div className="pointer-events-none absolute inset-0 radial-vignette opacity-90" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-25" aria-hidden="true" />
      </motion.div>

      <div className="relative z-10 flex flex-1">
        <motion.div
          className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-2 px-6 pb-16 text-center sm:px-2 lg:gap-2 lg:pb-24"
          variants={introContainerVariants}
          initial="hidden"
          animate={mediaLoaded ? "show" : "hidden"}
        >
          <motion.p
            className="type-label text-white/80"
            variants={taglineVariants}
          >
            {hero.tagline}
          </motion.p>
          <motion.h1
            id="home-hero-heading"
            data-sanity-edit-target
            className="mb-3"
            variants={headingMaskVariants}
          >
            <motion.span
              className="text-balance type-display text-white leading-[0.85]"
              variants={introItemVariants}
            >
              {headingWords.map((word, index) => (
                <Fragment key={`${word}-${index}`}>
                  <button
                    type="button"
                    data-visited={visitedWords.has(index)}
                    onPointerEnter={(event) => {
                      handleWordVisit(index, event.currentTarget);
                    }}
                    onClick={(event) => {
                      handleWordVisit(index, event.currentTarget);
                    }}
                    className="relative inline-flex items-center justify-center rounded-sm border-0 bg-transparent px-1 text-white transition-colors duration-200 outline-none focus-ring cursor-pointer after:absolute after:-bottom-1 after:left-1/2 after:h-px after:w-0 after:bg-white/70 after:transition-all after:duration-200 hover:after:left-0 hover:after:w-full focus-visible:after:left-0 focus-visible:after:w-full data-[visited=true]:after:left-0 data-[visited=true]:after:w-full"
                  >
                    {word}
                  </button>
                  {index < headingWords.length - 1 ? " " : null}
                </Fragment>
              ))}
              {heroHeadingEncoded ? <span className="hidden">{heroHeadingEncoded}</span> : null}
            </motion.span>
          </motion.h1>
          {hero.background.caption ? (
            <motion.p
              className="mx-auto mt-1 mb-7 max-w-7xl font-artisan not-italic text-white/80 text-[1em] sm:text-[1.2em] lg:text-[1.4em]"
              variants={introItemVariants}
            >
              {hero.background.caption}
            </motion.p>
          ) : null}
          {hideCtas ? null : (
            <motion.div
              className="mt-0 flex flex-wrap items-center justify-center gap-4"
              variants={introItemVariants}
            >
              <ChatTriggerButton
                label={primaryLabel}
                payload={{
                  question: primaryPrompt,
                  context: { pageUrl: "/" },
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      <ScrollIndicator className="bottom-10" />

      <Dialog.Root
        open={manifestoOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeManifesto();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-80 bg-black/65 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
          <div className="pointer-events-none fixed inset-0 z-81 film-grain opacity-20" aria-hidden="true" />
          <Dialog.Content
            className="fixed inset-0 z-82 flex items-center justify-center px-6 text-center text-white outline-none"
            onCloseAutoFocus={handleCloseAutoFocus}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.985, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={panelTransition}
              className="relative w-[85vw] max-w-none space-y-6 p-8"
            >
              <Dialog.Title className="sr-only" id="manifesto-title">
                Perazzi Manifesto
              </Dialog.Title>
              <div className="space-y-3 type-caps font-artisan normal-case tracking-normal text-3xl leading-[1.8] text-white">
                {[
                  "A Perazzi is not something you own.",
                  "It is something you grow into.",
                  "A quiet companion to the parts of you that refuse to be ordinary.",
                  "It waits, patiently, for the moment you are ready to become it.",
                ].map((line, idx) => (
                  <motion.p
                    key={line}
                    initial={motionEnabled ? { opacity: 0, y: 10, filter: "blur(10px)" } : { opacity: 1 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={motionEnabled ? { delay: 0.22 + idx * 0.12, ...revealFastTransition } : { duration: 0.01 }}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
              <Dialog.Close asChild>
                <motion.button
                  type="button"
                  className="mt-8 inline-flex items-center justify-center rounded-full px-4 py-2 type-button text-white/70 underline underline-offset-4 transition hover:text-white focus-ring"
                  initial={motionEnabled ? { opacity: 0 } : { opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={motionEnabled ? { delay: 0.85, ...homeMotion.micro } : { duration: 0.01 }}
                >
                  Close – return to the surface
                </motion.button>
              </Dialog.Close>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
