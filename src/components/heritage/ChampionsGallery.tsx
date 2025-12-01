"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ChampionEvergreen } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type ChampionsGalleryProps = {
  champions: ChampionEvergreen[];
};

export function ChampionsGallery({ champions }: ChampionsGalleryProps) {
  const verified = champions.filter((champion) => Boolean(champion?.name));

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    verified.forEach((champion) => {
      champion.disciplines?.forEach((d) => set.add(d));
    });
    return Array.from(set);
  }, [verified]);

  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);

  const filteredChampions = verified.filter((champion) => {
    if (!activeDiscipline) return true;
    return champion.disciplines?.includes(activeDiscipline);
  });

  const [selectedChampionId, setSelectedChampionId] = useState<string | null>(() => {
    return filteredChampions[0]?.id ?? null;
  });

  // Ensure selected champion stays in sync with the filtered set
  useEffect(() => {
    if (!filteredChampions.length) {
      setSelectedChampionId(null);
      return;
    }

    // If the currently selected champion is no longer in the filtered list, fall back to the first
    const stillPresent = filteredChampions.some(
      (champion) => champion.id === selectedChampionId,
    );

    if (!stillPresent) {
      setSelectedChampionId(filteredChampions[0].id);
    }
  }, [filteredChampions, selectedChampionId]);

  if (!verified.length) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/10 px-4 py-6 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8">
        <blockquote className="text-base sm:text-lg italic leading-relaxed text-ink">
          “Perazzi heritage is carried by every athlete who chooses calm precision.”
        </blockquote>
      </section>
    );
  }

  const selectedChampion =
    filteredChampions.find((champion) => champion.id === selectedChampionId) ??
    filteredChampions[0] ??
    null;

  return (
    <section
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="heritage-champions-heading"
    >
      {/* Full-bleed background image with soft scrim */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/heritage/pweb-heritage-champions-bg.jpg"
          alt="Perazzi champions background"
          fill
          sizes="100vw"
          className="object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-[color:var(--scrim-soft)]"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-black) 24%, transparent) 0%, color-mix(in srgb, var(--color-black) 6%, transparent) 50%, color-mix(in srgb, var(--color-black) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-black) 100%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-black) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      {/* Foreground glass container */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg lg:px-10">
          <div className="space-y-2">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
              Perazzi Champions
            </p>
            <h2
              id="heritage-champions-heading"
              className="mb-6 text-sm sm:text-base font-light italic leading-relaxed text-ink-muted"
            >
              The athletes who shaped our lineage
            </h2>
          </div>

          {disciplines.length ? (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter champions by discipline"
            >
              <button
                type="button"
                aria-pressed={activeDiscipline === null}
                className={cn(
                  "rounded-full border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition",
                  activeDiscipline === null
                    ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                    : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
                )}
                onClick={() => setActiveDiscipline(null)}
              >
                All
              </button>
              {disciplines.map((discipline) => (
                <button
                  key={discipline}
                  type="button"
                  aria-pressed={activeDiscipline === discipline}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition",
                    activeDiscipline === discipline
                      ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                      : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
                  )}
                  onClick={() =>
                    setActiveDiscipline(
                      activeDiscipline === discipline ? null : discipline,
                    )
                  }
                >
                  {discipline}
                </button>
              ))}
            </div>
          ) : null}

          {/* Two-column layout: left = list of names, right = selected champion detail */}
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start">
            {/* Left column – names list */}
            <div className="rounded-2xl bg-card/0 p-4 sm:rounded-3xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Champions
              </p>

              {filteredChampions.length ? (
                <ul
                  role="list"
                  className="space-y-1"
                  aria-label="Select a champion to view their profile"
                >
                  {filteredChampions.map((champion) => (
                    <ChampionNameItem
                      key={champion.id}
                      champion={champion}
                      isActive={champion.id === selectedChampionId}
                      onSelect={() => {
                        setSelectedChampionId(champion.id);
                        logAnalytics(`ChampionProfileSelected:${champion.id}`);
                      }}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] sm:text-xs leading-relaxed text-ink-muted">
                  No champions in this discipline yet—select another to continue exploring the lineage.
                </p>
              )}
            </div>

            {/* Right column – selected champion detail */}
            <div className="min-h-[18rem] rounded-2xl border border-border/75 bg-card/75 p-5 shadow-sm sm:rounded-3xl">
              <AnimatePresence mode="wait">
                {selectedChampion ? (
                  <motion.div
                    key={selectedChampion.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex flex-col gap-6"
                  >
                    <ChampionDetail champion={selectedChampion} />
                  </motion.div>
                ) : (
                  <motion.p
                    key="no-champion"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-ink-muted"
                  >
                    Select a champion on the left to view their story.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ChampionNameItemProps = {
  champion: ChampionEvergreen;
  isActive: boolean;
  onSelect: () => void;
};

function ChampionNameItem({ champion, isActive, onSelect }: ChampionNameItemProps) {
  const analyticsRef = useAnalyticsObserver<HTMLLIElement>(
    `ChampionListItemViewed:${champion.id}`,
    { threshold: 0.3 },
  );

  return (
    <li
      ref={analyticsRef}
      data-analytics-id={`ChampionListItemViewed:${champion.id}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors focus-ring",
          isActive
            ? "bg-ink text-card"
            : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
        )}
        aria-pressed={isActive}
      >
        <span className="block text-sm font-semibold tracking-wide">
          {champion.name}
        </span>
        {champion.title ? (
          <span className="mt-0.5 block text-[11px] sm:text-xs uppercase tracking-[0.25em] text-ink-muted group-hover:text-ink-muted/90">
            {champion.title}
          </span>
        ) : null}
      </button>
    </li>
  );
}

type ChampionDetailProps = {
  champion: ChampionEvergreen;
};

function ChampionDetail({ champion }: ChampionDetailProps) {
  const ratio = 3 / 2; // Force 3:2 aspect ratio for champion images

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={champion.image.url}
          alt={champion.image.alt}
          fill
          sizes="(min-width: 1024px) 320px, 100vw"
          className="object-cover"
          loading="lazy"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t",
            "from-[color:var(--scrim-strong)]/80 via-[color:var(--scrim-strong)]/50 to-transparent",
          )}
          aria-hidden
        />
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-semibold text-ink">
            {champion.name}
          </h3>
          {champion.title ? (
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink-muted">
              {champion.title}
            </p>
          ) : null}
        </div>

        {champion.quote ? (
          <blockquote className="border-l-2 border-perazzi-red/40 pl-3 text-[13px] sm:text-base italic leading-relaxed text-ink">
            “{champion.quote}”
          </blockquote>
        ) : null}

        {champion.bio ? (
          <p className="text-sm leading-relaxed text-ink-muted">{champion.bio}</p>
        ) : null}

        {champion.resume &&
        (champion.resume.winOne ||
          champion.resume.winTwo ||
          champion.resume.winThree) ? (
          <div className="space-y-2">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
              Career Highlights
            </p>
            <ul className="space-y-1 text-sm leading-relaxed text-ink">
              {champion.resume.winOne ? <li>• {champion.resume.winOne}</li> : null}
              {champion.resume.winTwo ? <li>• {champion.resume.winTwo}</li> : null}
              {champion.resume.winThree ? <li>• {champion.resume.winThree}</li> : null}
            </ul>
          </div>
        ) : null}

        {champion.disciplines?.length ? (
          <div className="space-y-2">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
              Disciplines
            </p>
            <ul className="flex flex-wrap gap-2 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">
              {champion.disciplines.map((discipline) => (
                <li
                  key={discipline}
                  className="rounded-full border border-border px-3 py-1"
                >
                  {discipline}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {champion.platforms?.length ? (
          <div className="space-y-2">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
              Platforms
            </p>
            <ul className="flex flex-wrap gap-2 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">
              {champion.platforms.map((platform) => (
                <li
                  key={platform}
                  className="rounded-full border border-border px-3 py-1"
                >
                  {platform}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {champion.article ? (
          <a
            href={`/${champion.article.slug}`}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
          >
            Read full interview
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </>
  );
}
