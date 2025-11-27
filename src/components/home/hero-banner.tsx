"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import type { HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { ScrollIndicator } from "./scroll-indicator";

type HeroBannerProps = {
  hero: HomeData["hero"];
  analyticsId?: string;
  fullBleed?: boolean;
};

export function HeroBanner({ hero, analyticsId, fullBleed = false }: HeroBannerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [touchedCount, setTouchedCount] = useState(0);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const analyticsRef = useAnalyticsObserver(analyticsId ?? "HeroSeen");
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "15%"],
  );

  useMotionValueEvent(scrollYProgress, "change", () => {
    // no-op; required for Framer to track parallax
  });

  const heroHeading = hero.subheading ?? hero.tagline;
  const heroWords = useMemo(() => (heroHeading ?? "").split(/\s+/).filter(Boolean), [heroHeading]);

  useEffect(() => {
    setTouchedCount(0);
    setManifestoOpen(false);
  }, [heroHeading]);

  const getFocusableElements = useCallback((container: HTMLElement) => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.getAttribute("aria-hidden"));
  }, []);

  const closeManifesto = useCallback(() => {
    setManifestoOpen(false);
    setTouchedCount(0);
    const focusTarget = triggerRef.current ?? lastFocusedRef.current;
    if (focusTarget) {
      focusTarget.focus();
    }
  }, []);

  const openManifesto = useCallback(() => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setTouchedCount(heroWords.length);
    setManifestoOpen(true);
  }, [heroWords.length]);

  const handleWordTouch = (index: number) => {
    if (manifestoOpen) return;
    if (index === touchedCount) {
      const next = index + 1;
      setTouchedCount(next);
      if (next === heroWords.length && heroWords.length > 0) {
        openManifesto();
      }
    }
  };

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
      const lastEl = currentFocusable[currentFocusable.length - 1];
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

  const navReserve = 0;
  const overlayTransition = prefersReducedMotion ? { duration: 0.1 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const };
  const panelTransition = prefersReducedMotion ? { duration: 0.1 } : { delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <section
      ref={setRefs}
      data-analytics-id={analyticsId ?? "HeroSeen"}
      className={`relative isolate flex min-h-screen w-screen flex-col overflow-hidden bg-perazzi-black text-white ${fullBleed ? "rounded-none" : "lg:rounded-none"}`}
      style={{
        marginLeft: fullBleed ? undefined : "calc(50% - 50vw)",
        marginRight: fullBleed ? undefined : "calc(50% - 50vw)",
        minHeight: `calc(100vh - ${navReserve}px)`,
        paddingTop: `${navReserve}px`,
      }}
      aria-labelledby="home-hero-heading"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          y: prefersReducedMotion ? "0%" : parallaxY,
        }}
      >
        <Image
          src={hero.background.url}
          alt={hero.background.alt}
          fill
          priority
          sizes="(min-width: 1536px) 1400px, (min-width: 1280px) 1200px, (min-width: 1024px) 90vw, 100vw"
          className="object-cover"
          onLoad={() => setMediaLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-perazzi-black via-black/75 to-black/75" />
      </motion.div>

      <div className="relative z-10 flex flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 pb-16 text-center sm:px-10 lg:gap-8 lg:pb-24">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.4em] text-white/80 transition-opacity duration-700 motion-reduce:transition-none ${
              mediaLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            {hero.tagline}
          </p>
          <h1
            id="home-hero-heading"
            className={`mt-0 flex flex-wrap justify-center gap-2 text-balance text-3xl font-semibold leading-[1.12] text-white transition-opacity duration-700 motion-reduce:transition-none sm:text-4xl lg:text-5xl ${
              mediaLoaded ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            {heroWords.map((word, index) => {
              const touched = index < touchedCount;
              return (
                <span
                  key={`${word}-${index}`}
                  className={`relative cursor-pointer transition-colors ${
                    touched ? "underline decoration-perazzi-red/0 decoration-0 underline-offset-4" : "hover:text-perazzi-red/0"
                  }`}
                  onMouseEnter={() => handleWordTouch(index)}
                  onTouchStart={() => handleWordTouch(index)}
                >
                  {word}
                </span>
              );
            })}
          </h1>
          {hero.background.caption ? (
            <p className="mt-0 w-full max-w-xl text-balance text-sm leading-relaxed text-white/75">
              {hero.background.caption}
            </p>
          ) : null}
          <div className="mt-0 flex flex-wrap items-center justify-center gap-4">
            <ChatTriggerButton
              label="Ask the concierge"
              payload={{
                question:
                  "Introduce me to Perazzi's bespoke philosophy and help me choose where to begin if I'm exploring my first build.",
                context: { pageUrl: "/" },
              }}
            />
            <Link
              href="/shotguns"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 underline underline-offset-4 hover:text-white focus-ring"
            >
              Explore shotguns
            </Link>
          </div>
        </div>
      </div>

      <ScrollIndicator className="bottom-10" />

      {manifestoOpen && (
        <motion.div
          initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={overlayTransition}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 text-center text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manifesto-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeManifesto();
            }
          }}
        >
          <motion.div
            ref={dialogRef}
            initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={panelTransition}
            className="max-w-2xl space-y-6 rounded-3xl bg-black/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur"
            tabIndex={-1}
          >
            <h2 id="manifesto-title" className="sr-only">
              Perazzi Manifesto
            </h2>
            <div className="space-y-3 text-xs font-semibold uppercase tracking-[0.35em] leading-6 text-white">
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
              className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 underline underline-offset-4 transition hover:text-white"
              onClick={closeManifesto}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 1.2, duration: 0.35, ease: "easeOut" }}
            >
              Close – return to the surface
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
