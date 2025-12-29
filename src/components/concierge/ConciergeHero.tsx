"use client";

import Image from "next/image";
import Link from "next/link";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { FactoryAsset } from "@/types/content";

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
  const heroRef = useAnalyticsObserver("HeroSeen:concierge");

  return (
    <section
      ref={heroRef}
      data-analytics-id="HeroSeen:concierge"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden bg-perazzi-black text-ink py-10 sm:py-16 full-bleed full-bleed-offset-top-md"
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
        <div className="absolute inset-0 overlay-fade-canvas" aria-hidden="true" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:px-10 lg:px-16 md:grid-cols-12 lg:gap-16">
        <div className="space-y-6 md:col-span-6 lg:col-span-7">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink/70">
            {hero.eyebrow}
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
              {hero.title}
            </h1>
            <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-ink/80">
              {hero.subheading}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="#concierge-conversation"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-ink transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              data-analytics-id="ConciergeHero:OpenConversation"
            >
              Open the conversation
            </Link>
            <Link
              href="#concierge-navigator"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-ink/30 bg-white/10 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-ink/90 transition hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
              data-analytics-id="ConciergeHero:JumpToNavigator"
            >
              Jump to build flow
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {hero.bullets.map((bullet) => (
              <div
                key={bullet.title}
                className="rounded-2xl border border-ink/10 bg-white/5 px-4 py-3 shadow-soft backdrop-blur-md"
              >
                <p className="text-sm font-semibold text-ink">{bullet.title}</p>
                <p className="mt-1 text-sm text-ink/75">{bullet.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-ink/20 bg-white/5 p-4 shadow-soft backdrop-blur-md md:col-span-6 lg:col-span-5 sm:rounded-3xl sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-ink/70">
              Workshop snapshot
            </p>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80">
              <span className="h-2 w-2 rounded-full bg-perazzi-red" aria-hidden="true" /><span>Live</span>
            </span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-ink/80">
            A guided build flow paired with the concierge. Keep your conversation, options, and dealer-ready
            brief in one place while you explore.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-linear-to-br from-white/10 via-white/5 to-transparent px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/70">Context</p>
              <p className="mt-1 text-sm leading-relaxed font-semibold text-ink">
                Carries selections and history into every reply.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-linear-to-br from-perazzi-red/20 via-white/5 to-transparent px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/70">Navigator</p>
              <p className="mt-1 text-sm leading-relaxed font-semibold text-ink">
                Step-by-step path from frame size to engraving.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Dealer brief ready", "Saved builds", "Desktop experience"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-ink/20 bg-white/10 px-3 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink/80"
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
