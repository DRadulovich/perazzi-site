"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Platform } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";

type PlatformGridProps = {
  platforms: Platform[];
};

export function PlatformGrid({ platforms }: PlatformGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const orderedPlatforms = useMemo(() => {
    const lookup = new Map(
      platforms.map((platform) => [platform.slug.toLowerCase(), platform]),
    );

    // Preserve existing ordering where possible
    const preferredOrder = ["ht", "mx", "tm", "dc", "sho"];
    const inOrder = preferredOrder
      .map((slug) => lookup.get(slug))
      .filter((platform): platform is Platform => Boolean(platform));
    const remaining = platforms.filter((platform) => !lookup.has(platform.slug.toLowerCase()));

    return [...inOrder, ...remaining];
  }, [platforms]);

  const activePlatform = orderedPlatforms[activeIndex] ?? orderedPlatforms[0];

  return (
    <section
      className="relative w-screen overflow-hidden py-16 sm:py-20"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        minHeight: "80vh",
      }}
      aria-labelledby="platforms-heading"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg"
          alt="Perazzi workshop background for platform section"
          fill
          sizes="80vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10" style={{ minHeight: "100vh" }}>
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-4xl font-black italic uppercase tracking-[0.35em] text-ink">
              Platforms & Lineages
            </p>
            <h2 id="platforms-heading" className="max-w-4xl text-xl font-light italic text-ink-muted mb-15">
              Explore the MX, HT, and TM Platforms and learn how each carry a different balance, design philosophy, and place on the line.
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Platforms"
            className="flex flex-wrap gap-2"
          >
            {orderedPlatforms.map((platform, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={platform.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] focus-ring transition ${
                    isActive
                      ? "border-perazzi-red bg-[color:var(--color-canvas)]/40 text-perazzi-red backdrop-blur-sm shadow-elevated"
                      : "border-border/70 bg-transparent text-ink-muted hover:border-ink/60"
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  {platform.name}
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2 min-h-[900px] sm:min-h-[820px] md:min-h-[750px] items-stretch">
            {activePlatform ? (
              <div className="space-y-3">
                <PlatformCard platform={activePlatform} priority={activeIndex === 0} />
                <ChatTriggerButton
                  label={`Ask about ${activePlatform.name}`}
                  variant="outline"
                  className="w-full justify-center"
                  payload={buildPlatformPrompt(activePlatform.slug)}
                />
              </div>
            ) : null}
            <div className="hidden h-full md:flex items-center justify-center">
              {activePlatform && (activePlatform.hallmark || activePlatform.champion) ? (
                <motion.div
                  key={activePlatform.id}
                  className="flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 text-ink text-center"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : { duration: 1.5, delay: 0.3, ease: [0.33, 1, 0.68, 1] }
                  }
                >
                  {activePlatform.hallmark ? (
                    <p className="text-xl italic text-ink">{activePlatform.hallmark}</p>
                  ) : null}
                  {activePlatform.champion ? (
                    <div className="flex items-center justify-center gap-5">
                      {activePlatform.champion.image ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[color:var(--surface-elevated)]">
                          <Image
                            src={activePlatform.champion.image.url}
                            alt={
                              activePlatform.champion.image.alt ??
                              `${activePlatform.champion.name ?? "Perazzi champion"}`
                            }
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        {activePlatform.champion.name ? (
                          <p className="text-xl font-semibold text-ink">{activePlatform.champion.name}</p>
                        ) : null}
                        {activePlatform.champion.title ? (
                          <p className="text-base text-ink-muted">{activePlatform.champion.title}</p>
                        ) : null}
                        {activePlatform.champion.resume?.winOne ? (
                          <p className="text-base text-ink-muted">
                            Win highlight:{" "}
                            <span className="font-medium">{activePlatform.champion.resume.winOne}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
