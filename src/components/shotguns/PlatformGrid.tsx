"use client";

import { useMemo, useState } from "react";
import type { Platform } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";

type PlatformGridProps = {
  platforms: Platform[];
};

const PLATFORM_TABS = [
  {
    label: "The Perazzi Standard",
    order: ["ht", "mx"],
  },
  {
    label: "Purpose-Built Variants",
    order: ["tm", "dc"],
  },
  {
    label: "Heritage Archive",
    order: ["sho"],
  },
] as const;

export function PlatformGrid({ platforms }: PlatformGridProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const orderedPlatforms = useMemo(() => {
    const lookup = new Map(
      platforms.map((platform) => [platform.slug.toLowerCase(), platform]),
    );

    const inOrder = PLATFORM_TABS.flatMap((tab) =>
      tab.order
        .map((slug) => lookup.get(slug))
        .filter((platform): platform is Platform => Boolean(platform)),
    );
    const remaining = platforms.filter((platform) => !lookup.has(platform.slug.toLowerCase()));

    return [...inOrder, ...remaining];
  }, [platforms]);

  const groupedPlatforms = useMemo(() => {
    const lookup = new Map(orderedPlatforms.map((platform) => [platform.slug.toLowerCase(), platform]));
    return PLATFORM_TABS.map((tab) => {
      const matches = tab.order
        .map((slug) => lookup.get(slug))
        .filter((platform): platform is Platform => Boolean(platform));
      return matches;
    });
  }, [orderedPlatforms]);

  const activeGroup = groupedPlatforms[activeTabIndex] ?? orderedPlatforms;

  return (
    <section
      className="space-y-6"
      aria-labelledby="platforms-heading"
    >
      <div className="space-y-2">
        <h2 id="platforms-heading" className="text-2xl font-semibold text-ink">
          Our Platforms and Lineages
        </h2>
        <p className="max-w-3xl text-base text-ink-muted">
          Explore the MX, HT, and TM Platforms and learn how each carry a different balance, design philosophy, and place on the line.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Choose a platform to explore.</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() =>
              setActiveTabIndex((index) =>
                index === 0 ? PLATFORM_TABS.length - 1 : index - 1,
              )
            }
            aria-label="Previous platform group"
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() =>
              setActiveTabIndex((index) =>
                (index + 1) % PLATFORM_TABS.length,
              )
            }
            aria-label="Next platform group"
          >
            Next
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Platform categories"
        className="flex flex-wrap gap-2"
      >
        {PLATFORM_TABS.map((tab, index) => {
          const isActive = index === activeTabIndex;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition ${
                isActive
                  ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                  : "border-border/70 bg-card/60 text-ink hover:border-ink/60"
              }`}
              onClick={() => setActiveTabIndex(index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {activeGroup.map((platform, index) => (
          <div key={platform.id} className="space-y-3">
            <PlatformCard platform={platform} priority={index === 0 && activeTabIndex === 0} />
            <ChatTriggerButton
              label={`Ask about ${platform.name}`}
              variant="outline"
              className="w-full justify-center"
              payload={buildPlatformPrompt(platform.slug)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
