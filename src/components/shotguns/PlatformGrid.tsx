"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useRef, useEffect } from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";

type PlatformGridProps = {
  platforms: Platform[];
  ui?: ShotgunsLandingData["platformGridUi"];
};

const defaultChatPayloadTemplate =
  "Help me understand the {platformName} platform and which model configurations I should start from.";

export function PlatformGrid({ platforms, ui }: PlatformGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const analyticsRef = useAnalyticsObserver("PlatformGridSeen");

  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = activeIndex;
      let closestDistance = Infinity;

      const cards = container.querySelectorAll<HTMLDivElement>("[data-index]");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(cardCenter - containerCenter);
        const indexAttr = card.getAttribute("data-index");
        const index = indexAttr ? Number(indexAttr) : 0;

        if (!Number.isNaN(index) && distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== activeIndex) {
        setActiveIndex(closestIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [activeIndex]);

  const heading = ui?.heading ?? "Platforms & Lineages";
  const subheading =
    ui?.subheading ??
    "Explore the MX, HT, and TM Platforms and learn how each carry a different balance, design philosophy, and place on the line.";
  const background = ui?.background ?? {
    id: "platform-grid-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg",
    alt: "Perazzi workshop background for platform section",
  };
  const chatLabelTemplate =
    ui?.chatLabelTemplate && ui.chatLabelTemplate.trim().length
      ? ui.chatLabelTemplate
      : "Ask about {platformName}";
  const chatPayloadTemplate =
    ui?.chatPayloadTemplate && ui.chatPayloadTemplate.trim().length
      ? ui.chatPayloadTemplate
      : undefined;
  const cardFooterTemplate =
    ui?.cardFooterTemplate && ui.cardFooterTemplate.trim().length
      ? ui.cardFooterTemplate
      : "Explore the {platformName} lineage";

  const formatTemplate = (template: string, platformName: string) =>
    template.replace(/{platformName}/g, platformName);

  const buildPayload = (platform: Platform) => {
    if (chatPayloadTemplate && chatPayloadTemplate !== defaultChatPayloadTemplate) {
      return {
        question: formatTemplate(chatPayloadTemplate, platform.name),
        context: { platformSlug: platform.slug },
      };
    }
    return buildPlatformPrompt(platform.slug);
  };

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PlatformGridSeen"
      className="relative w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        minHeight: "80vh",
      }}
      aria-labelledby="platforms-heading"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={background.url}
          alt={background.alt}
          fill
          sizes="100vw"
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

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-[0.35em] text-ink">
              {heading}
            </p>
            <h2
              id="platforms-heading"
              className="mb-6 max-w-4xl text-sm sm:text-base font-light italic text-ink-muted"
            >
              {subheading}
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
                  onClick={() => {
                    setActiveIndex(index);
                    const container = scrollRef.current;
                    if (!container) return;
                    const target = container.querySelector<HTMLDivElement>(
                      `[data-index="${index}"]`,
                    );
                    if (target) {
                      target.scrollIntoView({
                        behavior: "smooth",
                        inline: "center",
                        block: "nearest",
                      });
                    }
                  }}
                >
                  {platform.name}
                </button>
              );
            })}
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none"
              aria-label="Swipe to explore platforms"
            >
              {orderedPlatforms.map((platform, index) => (
                <div
                  key={platform.id}
                  data-index={index}
                  className="snap-center shrink-0 w-[85vw] max-w-sm"
                >
                  <div className="space-y-3">
                    <PlatformCard
                      platform={platform}
                      priority={index === 0}
                      footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
                    />
                    <ChatTriggerButton
                      label={formatTemplate(chatLabelTemplate, platform.name)}
                      variant="outline"
                      className="w-full justify-center"
                      payload={buildPayload(platform)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid gap-6 md:grid-cols-2 min-h-[720px] sm:min-h-[820px] md:min-h-[750px] items-stretch">
            {activePlatform ? (
              <div className="space-y-3">
                <PlatformCard
                  platform={activePlatform}
                  priority={activeIndex === 0}
                  footerLabel={formatTemplate(cardFooterTemplate, activePlatform.name)}
                />
                <ChatTriggerButton
                  label={formatTemplate(chatLabelTemplate, activePlatform.name)}
                  variant="outline"
                  className="w-full justify-center"
                  payload={buildPayload(activePlatform)}
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
