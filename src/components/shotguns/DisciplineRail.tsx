"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

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
        className="flex gap-4 overflow-x-auto scroll-px-6 pb-2 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible lg:grid-cols-3"
        tabIndex={0}
      >
        {disciplines.map((discipline, index) => (
          <DisciplineCard
            key={discipline.id}
            discipline={discipline}
            index={index}
            total={disciplines.length}
            platformName={platformName}
          />
        ))}
      </div>
    </section>
  );
}

type DisciplineCardProps = {
  discipline: ShotgunsLandingData["disciplines"][number];
  index: number;
  total: number;
  platformName: (id: string) => string;
};

function DisciplineCard({
  discipline,
  index,
  total,
  platformName,
}: DisciplineCardProps) {
  const cardRef = useAnalyticsObserver(
    `shotguns_discipline_card_impression:${discipline.id}`,
    { threshold: 0.4 },
  );

  return (
    <a
      ref={cardRef}
      href={`/shotguns/disciplines/${discipline.id}`}
      data-analytics-id={`DisciplineChip:${discipline.id}`}
      className="flex min-w-[260px] flex-col rounded-2xl border border-border/60 bg-card text-left shadow-sm focus-ring md:min-w-0"
      aria-label={`Slide ${index + 1} of ${total}: ${discipline.name}`}
      onClick={() =>
        logAnalytics(`shotguns_discipline_card_click:${discipline.id}`)
      }
    >
      <div className="card-media relative aspect-[32/9] w-full bg-neutral-900">
        {discipline.hero ? (
          <Image
            src={discipline.hero.url}
            alt={discipline.hero.alt}
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end p-4 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white">
            {discipline.name}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4 md:p-5 lg:p-6">
        <div
          className="prose prose-sm italic max-w-none text-ink-muted"
          dangerouslySetInnerHTML={{ __html: discipline.overviewHtml }}
        />
        {discipline.recommendedPlatforms?.length ? (
          <div className="space-y-1">
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
        {discipline.popularModels?.length ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
              Most Popular Models
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {discipline.popularModels.map((model) => (
                <figure
                  key={model.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-900"
                >
                  {model.hero ? (
                    <Image
                      src={model.hero.url}
                      alt={model.hero.alt}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                    {model.name || "Untitled"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </a>
  );
}
