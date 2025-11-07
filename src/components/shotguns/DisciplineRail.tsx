 "use client";

import Image from "next/image";
import { useRef } from "react";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";

type DisciplineCard = ShotgunsLandingData["disciplines"][number];

type DisciplineRailProps = {
  disciplines: DisciplineCard[];
  platforms: Platform[];
  ariaPrevLabel?: string;
  ariaNextLabel?: string;
};

export function DisciplineRail({
  disciplines,
  platforms,
  ariaPrevLabel = "Previous slide",
  ariaNextLabel = "Next slide",
}: DisciplineRailProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const platformName = (platformId: string) =>
    platforms.find((platform) => platform.id === platformId)?.name ??
    platformId.replace("platform-", "").toUpperCase();

  const scrollBy = (direction: "prev" | "next") => {
    const node = listRef.current;
    if (!node) return;
    const amount = direction === "next" ? node.clientWidth : -node.clientWidth;
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section
      className="space-y-4"
      aria-labelledby="discipline-rail-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 id="discipline-rail-heading" className="text-xl font-semibold text-ink">
            Disciplines at a glance
          </h2>
          <p className="text-sm text-ink-muted">
            Trap, skeet, and sporting each ask something different of your platform.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() => scrollBy("prev")}
            aria-label={ariaPrevLabel}
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() => scrollBy("next")}
            aria-label={ariaNextLabel}
          >
            Next
          </button>
        </div>
      </div>
      <div
        ref={listRef}
        role="region"
        aria-live="polite"
        aria-label="Discipline overview cards"
        className="flex gap-4 overflow-x-auto scroll-px-6 pb-2 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible"
        tabIndex={0}
      >
        {disciplines.map((discipline, index) => (
          <a
            key={discipline.id}
            href={`/shotguns/disciplines/${discipline.id}`}
            data-analytics-id={`DisciplineChip:${discipline.id}`}
            className="flex min-w-[260px] flex-col rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm focus-ring"
            aria-label={`Slide ${index + 1} of ${disciplines.length}: ${discipline.name}`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
              {discipline.name}
            </span>
            <div
              className="prose prose-sm mt-3 max-w-none text-ink"
              dangerouslySetInnerHTML={{ __html: discipline.overviewHtml }}
            />
            {discipline.champion?.image ? (
              <div className="mt-3 flex items-center gap-3">
                <figure className="relative h-12 w-12 overflow-hidden rounded-full border border-border/60 bg-neutral-200">
                  <Image
                    src={discipline.champion.image.url}
                    alt={discipline.champion.image.alt}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </figure>
                <div className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {discipline.champion.name}
                  <span className="block text-[0.6rem] tracking-[0.25em] text-ink-muted/80">
                    {discipline.champion.title}
                  </span>
                </div>
              </div>
            ) : null}
            {discipline.recommendedPlatforms?.length ? (
              <div className="mt-3 space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                  Recommended platforms
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {discipline.recommendedPlatforms.map((platformId) => (
                    <li
                      key={platformId}
                      className="rounded-full bg-ink/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink"
                    >
                      {platformName(platformId)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {discipline.champion ? (
              <blockquote className="mt-4 border-l-2 border-perazzi-red/40 pl-3 text-sm italic text-ink">
                “{discipline.champion.quote}”
                <cite className="mt-2 block text-xs not-italic uppercase tracking-[0.3em] text-ink-muted">
                  {discipline.champion.name} · {discipline.champion.title}
                </cite>
              </blockquote>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
