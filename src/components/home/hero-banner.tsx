"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { CleanText } from "@/components/system/CleanText";
import type { HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
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
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const heroImageRef = useRef<HTMLImageElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const analyticsRef = useAnalyticsObserver(analyticsId ?? "HeroSeen");
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);
  const heroHeading = hero.subheading ?? hero.tagline ?? "";
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
    className: "object-cover",
  });

  const tabletImageProps = hero.backgroundTablet
    ? getImageProps({
        src: hero.backgroundTablet.url,
        alt: hero.backgroundTablet.alt,
        fill: true,
        priority: true,
        sizes: heroSizes,
        className: "object-cover",
      }).props
    : null;

  const mobileImageProps = hero.backgroundMobile
    ? getImageProps({
        src: hero.backgroundMobile.url,
        alt: hero.backgroundMobile.alt,
        fill: true,
        priority: true,
        sizes: heroSizes,
        className: "object-cover",
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
  const secondaryLabel = ctas.secondaryLabel ?? fallbackCtas.secondaryLabel;
  const secondaryHref = ctas.secondaryHref ?? fallbackCtas.secondaryHref;

  const getFocusableElements = useCallback((container: HTMLElement) => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.getAttribute("aria-hidden"));
  }, []);

  const closeManifesto = useCallback(() => {
    setManifestoOpen(false);
    const focusTarget = triggerRef.current ?? lastFocusedRef.current;
    if (focusTarget) {
      focusTarget.focus();
    }
  }, []);

  const openManifesto = useCallback(() => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setManifestoOpen(true);
  }, []);

  const setRefs = useCallback((node: HTMLElement | null) => {
    sectionRef.current = node;
    analyticsRef.current = node;
  }, [analyticsRef]);

  useEffect(() => {
    if (!manifestoOpen) return;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const focusable = getFocusableElements(dialogEl);
    const first = focusable[0] ?? dialogEl;
    first.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeManifesto();
        return;
      }

      if (event.key !== "Tab") return;
      const currentFocusable = getFocusableElements(dialogEl);
      if (currentFocusable.length === 0) {
        event.preventDefault();
        dialogEl.focus();
        return;
      }

      const firstEl = currentFocusable[0];
      const lastEl = currentFocusable.at(-1) ?? firstEl;
      const activeEl = document.activeElement;

      if (event.shiftKey) {
        if (activeEl === firstEl || !dialogEl.contains(activeEl)) {
          event.preventDefault();
          lastEl.focus();
        }
        return;
      }

      if (activeEl === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!dialogEl.contains(event.target as Node)) {
        const focusableTargets = getFocusableElements(dialogEl);
        (focusableTargets[0] ?? dialogEl).focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [closeManifesto, getFocusableElements, manifestoOpen]);

  const overlayTransition = prefersReducedMotion ? { duration: 0.1 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const };
  const panelTransition = prefersReducedMotion ? { duration: 0.1 } : { delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };

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
      </motion.div>

      <div className="relative z-10 flex flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-2 px-6 pb-16 text-center sm:px-2 lg:gap-2 lg:pb-24">
          <p
            className={`type-label text-white/80 transition-opacity duration-700 motion-reduce:transition-none ${
              mediaLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            {hero.tagline}
          </p>
          <h1
            id="home-hero-heading"
            data-sanity-edit-target
            className={`mb-10 transition-opacity duration-700 motion-reduce:transition-none ${
              mediaLoaded ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            <button
              type="button"
              ref={triggerRef}
              onClick={openManifesto}
              className="flex flex-wrap justify-center gap-2 bg-transparent text-balance type-display text-white outline-none focus-ring cursor-pointer border-0 p-0"
            >
              <CleanText value={heroHeading} />
            </button>
          </h1>
          {hero.background.caption ? (
            <p className="mx-auto mt-3 mb-3 max-w-2xl type-body-lg text-white/80 md:max-w-4xl lg:max-w-4xl">
              {hero.background.caption}
            </p>
          ) : null}
          {hideCtas ? null : (
            <div className="mt-0 flex flex-wrap items-center justify-center gap-4">
              <ChatTriggerButton
                label={primaryLabel}
                payload={{
                  question: primaryPrompt,
                  context: { pageUrl: "/" },
                }}
              />
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-4 py-2 type-button text-white/85 shadow-soft backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10 hover:text-white focus-ring"
              >
                {secondaryLabel}
              </Link>
            </div>
          )}
        </div>
      </div>

      <ScrollIndicator className="bottom-10" />

      {manifestoOpen && (
        <motion.dialog
          ref={dialogRef}
          open
          initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={overlayTransition}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-6 text-center text-white backdrop-blur-sm"
          aria-labelledby="manifesto-title"
          aria-modal="true"
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeManifesto();
            }
          }}
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={panelTransition}
            className="max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-black/45 p-8 shadow-elevated ring-1 ring-white/10 backdrop-blur-xl"
          >
            <h2 id="manifesto-title" className="sr-only">
              Perazzi Manifesto
            </h2>
            <div className="space-y-3 type-caps text-white">
              {[
                "A Perazzi is not something you own.",
                "It is something you grow into.",
                "A quiet companion to the parts of you that refuse to be ordinary.",
                "It waits, patiently, for the moment you are ready to become it.",
              ].map((line, idx) => (
                <motion.p
                  key={line}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.01 }
                      : { delay: 0.3 + idx * 0.15, duration: 0.5, ease: "easeOut" }
                  }
                >
                  {line}
                </motion.p>
              ))}
            </div>
            <motion.button
              type="button"
              className="mt-8 inline-flex items-center justify-center rounded-full px-4 py-2 type-button text-white/70 underline underline-offset-4 transition hover:text-white focus-ring"
              onClick={closeManifesto}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 1.2, duration: 0.35, ease: "easeOut" }}
            >
              Close – return to the surface
            </motion.button>
          </motion.div>
        </motion.dialog>
      )}
    </section>
  );
}
