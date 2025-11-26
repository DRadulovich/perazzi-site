"use client";

import Image from "next/image";
import Link from "next/link";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { FactoryAsset } from "@/types/content";

type ConciergeHeroProps = {
  hero: {
    eyebrow: string;
    title: string;
    subheading: string;
    background: FactoryAsset;
    bullets: Array<{ title: string; body: string }>;
  };
};

export function ConciergeHero({ hero }: ConciergeHeroProps) {
  const heroRef = useAnalyticsObserver("HeroSeen:concierge");

  return (
    <section
      ref={heroRef}
      data-analytics-id="HeroSeen:concierge"
      className="relative isolate w-screen overflow-hidden bg-perazzi-black text-white"
      style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}
    >
      <div
        className="absolute inset-0"
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
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent 0%) 0%, color-mix(in srgb, var(--color-canvas) 100%, transparent 100%) 100%, transparent 25%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:px-10 lg:px-16 md:grid-cols-12 lg:gap-16">
        <div className="space-y-6 md:col-span-6 lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">{hero.eyebrow}</p>
          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {hero.title}
            </h1>
            <p className="max-w-2xl text-lg text-white/80">
              {hero.subheading}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="#concierge-conversation"
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              data-analytics-id="ConciergeHero:OpenConversation"
            >
              Open the conversation
            </Link>
            <Link
              href="#concierge-navigator"
              className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 transition hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              data-analytics-id="ConciergeHero:JumpToNavigator"
            >
              Jump to build flow
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {hero.bullets.map((bullet) => (
              <div
                key={bullet.title}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-white">{bullet.title}</p>
                <p className="mt-1 text-sm text-white/75">{bullet.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm md:col-span-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              Workshop snapshot
            </p>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-perazzi-red" aria-hidden="true" />
              Live
            </span>
          </div>
          <p className="text-sm text-white/80">
            A guided build flow paired with the concierge. Keep your conversation, options, and dealer-ready
            brief in one place while you explore.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">Context</p>
              <p className="mt-1 text-sm font-semibold text-white">Carries selections and history into every reply.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-perazzi-red/20 via-white/5 to-transparent px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">Navigator</p>
              <p className="mt-1 text-sm font-semibold text-white">Step-by-step path from frame size to engraving.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Dealer brief ready", "Saved builds", "Desktop experience"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
