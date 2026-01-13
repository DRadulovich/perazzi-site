"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ChampionEvergreen } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import {
  buildChoreoGroupVars,
  buildChoreoItemVars,
  buildChoreoPresenceVars,
  choreoDistance,
  dreamyPace,
  prefersReducedMotion,
  type ChoreoPresenceState,
} from "@/lib/choreo";
import {
  ChoreoGroup,
  ChoreoPresence,
  Heading,
  RevealItem,
  Text,
} from "@/components/ui";

type ChampionsGalleryBodyFilters = Readonly<{
  disciplines: string[];
  active: string | null;
  onChange: (nextDiscipline: string | null) => void;
}>;

type ChampionsGalleryRoster = Readonly<{
  label: string;
  items: ChampionEvergreen[];
  activeId: string | null;
  onSelect: (championId: string) => void;
  selected: ChampionEvergreen | null;
  cardCtaLabel: string;
}>;

export type ChampionsGalleryBodyProps = Readonly<{
  revealGallery: boolean;
  filters: ChampionsGalleryBodyFilters;
  roster: ChampionsGalleryRoster;
}>;

const subtleUnderlayVars = buildChoreoPresenceVars({
  enterDurationMs: dreamyPace.textMs,
  exitDurationMs: dreamyPace.textMs,
  enterEase: dreamyPace.easing,
  exitEase: dreamyPace.easing,
  enterScale: 0.96,
  exitScale: 0.96,
  enterY: 0,
  exitY: 0,
});

const detailPresenceVars = buildChoreoPresenceVars({
  enterDurationMs: dreamyPace.textMs,
  exitDurationMs: dreamyPace.textMs,
  enterEase: dreamyPace.easing,
  exitEase: dreamyPace.easing,
  enterY: choreoDistance.base,
  exitY: choreoDistance.tight,
  enterScale: 0.98,
  exitScale: 0.98,
  enterBlur: 2,
  exitBlur: 2,
});

const useChampionPresence = (selectedChampion: ChampionEvergreen | null) => {
  const reduceMotion = prefersReducedMotion();
  const [displayChampion, setDisplayChampion] = useState(selectedChampion);
  const [presenceState, setPresenceState] = useState<ChoreoPresenceState>("enter");
  const presenceTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (presenceTimeoutRef.current) {
        globalThis.clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = null;
      }
      if (exitTimeoutRef.current) {
        globalThis.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (presenceTimeoutRef.current) {
      globalThis.clearTimeout(presenceTimeoutRef.current);
      presenceTimeoutRef.current = null;
    }
    if (exitTimeoutRef.current) {
      globalThis.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (!selectedChampion) {
      exitTimeoutRef.current = globalThis.setTimeout(() => {
        setDisplayChampion(null);
        setPresenceState("enter");
        exitTimeoutRef.current = null;
      }, 0);
      return;
    }

    if (reduceMotion || selectedChampion.id === displayChampion?.id) {
      exitTimeoutRef.current = globalThis.setTimeout(() => {
        setDisplayChampion(selectedChampion);
        setPresenceState("enter");
        exitTimeoutRef.current = null;
      }, 0);
      return;
    }

    exitTimeoutRef.current = globalThis.setTimeout(() => {
      setPresenceState("exit");
      exitTimeoutRef.current = null;
    }, 0);
    presenceTimeoutRef.current = globalThis.setTimeout(() => {
      setDisplayChampion(selectedChampion);
      setPresenceState("enter");
      presenceTimeoutRef.current = null;
    }, dreamyPace.staggerMs);
  }, [displayChampion?.id, reduceMotion, selectedChampion]);

  return { displayChampion, presenceState };
};

export function ChampionsGalleryBody({ revealGallery, filters, roster }: ChampionsGalleryBodyProps) {
  const { displayChampion, presenceState } = useChampionPresence(roster.selected);

  if (!revealGallery) return null;

  return (
    <div id="heritage-champions-body" className="space-y-6">
      <RevealItem index={0}>
        <ChampionsGalleryFilters
          disciplines={filters.disciplines}
          activeDiscipline={filters.active}
          onDisciplineChange={filters.onChange}
        />
      </RevealItem>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start">
        <RevealItem index={1}>
          <div className="rounded-2xl bg-card/0 p-4 sm:rounded-3xl">
            <Text
              size="label-tight"
              className="mb-3 text-ink-muted"
              leading="normal"
            >
              {roster.label}
            </Text>

            {roster.items.length ? (
              <ul
                className="choreo-group space-y-1"
                style={buildChoreoGroupVars({
                  durationMs: dreamyPace.textMs,
                  staggerMs: dreamyPace.staggerMs,
                  easing: dreamyPace.easing,
                })}
                aria-label="Select a champion to view their profile"
              >
                {roster.items.map((champion, index) => (
                  <ChampionNameItem
                    key={champion.id}
                    index={index}
                    champion={champion}
                    isActive={champion.id === roster.activeId}
                    onSelect={() => roster.onSelect(champion.id)}
                  />
                ))}
              </ul>
            ) : (
              <Text size="sm" className="text-ink-muted">
                No champions in this discipline yet—select another to continue exploring the lineage.
              </Text>
            )}
          </div>
        </RevealItem>

        <RevealItem index={2}>
          <div className="min-h-72 rounded-2xl border border-border/75 bg-card/75 p-5 shadow-soft sm:rounded-3xl">
            {displayChampion ? (
              <ChoreoPresence
                state={presenceState}
                style={detailPresenceVars}
                className="flex flex-col gap-6"
              >
                <ChampionDetail
                  champion={displayChampion}
                  cardCtaLabel={roster.cardCtaLabel}
                />
              </ChoreoPresence>
            ) : (
              <p className="type-body-sm text-ink-muted">
                Select a champion on the left to view their story.
              </p>
            )}
          </div>
        </RevealItem>
      </div>
    </div>
  );
}

type ChampionsGalleryFiltersProps = Readonly<{
  disciplines: string[];
  activeDiscipline: string | null;
  onDisciplineChange: (nextDiscipline: string | null) => void;
}>;

function ChampionsGalleryFilters({
  disciplines,
  activeDiscipline,
  onDisciplineChange,
}: ChampionsGalleryFiltersProps) {
  if (!disciplines.length) return null;

  return (
    <div>
      <fieldset
        className="border-0 p-0"
        aria-label="Filter champions by discipline"
      >
        <legend className="sr-only">Filter champions by discipline</legend>
        <ChoreoGroup
          effect="slide"
          axis="x"
          direction="right"
          distance={choreoDistance.base}
          durationMs={dreamyPace.textMs}
          easing={dreamyPace.easing}
          staggerMs={dreamyPace.staggerMs}
          className="flex flex-wrap gap-2"
          itemAsChild
        >
          <button
            type="button"
            aria-pressed={activeDiscipline === null}
            className={cn(
              "relative overflow-hidden pill border type-button focus-ring",
              activeDiscipline === null
                ? "border-perazzi-red text-perazzi-red"
                : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
            )}
            onClick={() => onDisciplineChange(null)}
          >
            {activeDiscipline === null ? (
              <ChoreoPresence
                state="enter"
                style={subtleUnderlayVars}
                asChild
              >
                <span
                  className="absolute inset-0 rounded-xs bg-perazzi-red/10"
                  aria-hidden="true"
                />
              </ChoreoPresence>
            ) : null}
            <span className="relative z-10">All</span>
          </button>
          {disciplines.map((discipline) => {
            const active = activeDiscipline === discipline;
            return (
              <button
                key={discipline}
                type="button"
                aria-pressed={active}
                className={cn(
                  "relative overflow-hidden pill border type-button focus-ring",
                  active
                    ? "border-perazzi-red text-perazzi-red"
                    : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
                )}
                onClick={() => onDisciplineChange(active ? null : discipline)}
              >
                {active ? (
                  <ChoreoPresence
                    state="enter"
                    style={subtleUnderlayVars}
                    asChild
                  >
                    <span
                      className="absolute inset-0 rounded-xs bg-perazzi-red/10"
                      aria-hidden="true"
                    />
                  </ChoreoPresence>
                ) : null}
                <span className="relative z-10">{discipline}</span>
              </button>
            );
          })}
        </ChoreoGroup>
      </fieldset>
    </div>
  );
}

type ChampionNameItemProps = Readonly<{
  index: number;
  champion: ChampionEvergreen;
  isActive: boolean;
  onSelect: () => void;
}>;

function ChampionNameItem({ index, champion, isActive, onSelect }: ChampionNameItemProps) {
  const analyticsRef = useAnalyticsObserver<HTMLLIElement>(
    `ChampionListItemViewed:${champion.id}`,
    { threshold: 0.3 },
  );
  const itemVars = buildChoreoItemVars("fade-lift", {
    index,
    distance: choreoDistance.tight,
  });

  return (
    <li
      ref={analyticsRef}
      data-analytics-id={`ChampionListItemViewed:${champion.id}`}
      className="choreo-item choreo-fade-lift"
      style={itemVars}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left focus-ring",
          isActive
            ? "text-white"
            : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
        )}
        aria-pressed={isActive}
      >
        {isActive ? (
          <ChoreoPresence
            state="enter"
            style={subtleUnderlayVars}
            asChild
          >
            <span
              className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
              aria-hidden="true"
            />
          </ChoreoPresence>
        ) : null}
        {champion.name ? (
          <span
            className={cn(
              "relative z-10 block type-card-title text-xl text-ink",
              isActive && "text-white",
            )}
          >
            {champion.name}
          </span>
        ) : null}
      </button>
    </li>
  );
}

type ChampionDetailProps = Readonly<{
  champion: ChampionEvergreen;
  cardCtaLabel: string;
}>;

function ChampionDetail({ champion, cardCtaLabel }: ChampionDetailProps) {
  return (
    <>
      <ChoreoGroup
        effect="scale-parallax"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        scaleFrom={1.02}
        itemAsChild
      >
        <div
          className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-3/2"
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
              "pointer-events-none absolute inset-0 bg-linear-to-t",
              "from-(--scrim-strong)/80 via-(--scrim-strong)/50 to-transparent",
            )}
            aria-hidden
          />
        </div>
      </ChoreoGroup>
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.tight}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-4"
        itemAsChild
      >
        <Heading level={3} className="type-section text-ink border-b border-perazzi-red/40 pb-2">
          {champion.name}
        </Heading>

        {champion.resume &&
        (champion.resume.winOne ||
          champion.resume.winTwo ||
          champion.resume.winThree) ? (
          <div className="space-y-2 mt-7">
            <Text size="label-tight" className="text-ink-muted">
              Career Highlights
            </Text>
            <ul className="space-y-1 type-card-title text-ink text-2xl list-none mb-7">
              {champion.resume.winOne ? <li>{champion.resume.winOne}</li> : null}
              {champion.resume.winTwo ? <li>{champion.resume.winTwo}</li> : null}
              {champion.resume.winThree ? <li>{champion.resume.winThree}</li> : null}
            </ul>
          </div>
        ) : null}

        {champion.bio ? (
          <Text className="type-body text-ink-muted mb-7">{champion.bio}</Text>
        ) : null}

        {champion.quote ? (
          <Text
            asChild
            size="md"
            className="border-l-2 border-perazzi-red/40 pl-3 font-artisan text-ink text-2xl my-7"
          >
            <blockquote>“{champion.quote}”</blockquote>
          </Text>
        ) : null}

        {champion.disciplines?.length ? (
          <div className="space-y-2">
            <Text size="label-tight" className="text-ink-muted">
              Disciplines
            </Text>
            <ChoreoGroup
              effect="fade-lift"
              distance={choreoDistance.tight}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              staggerMs={dreamyPace.staggerMs}
              className="flex flex-wrap gap-2 type-label-tight text-ink-muted"
              itemAsChild
            >
              {champion.disciplines.map((discipline) => (
                <div
                  key={discipline}
                  className="pill border border-border"
                >
                  {discipline}
                </div>
              ))}
            </ChoreoGroup>
          </div>
        ) : null}

        {champion.platforms?.length ? (
          <div className="space-y-2">
            <Text size="label-tight" className="text-ink-muted">
              Platforms
            </Text>
            <ChoreoGroup
              effect="fade-lift"
              distance={choreoDistance.tight}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              staggerMs={dreamyPace.staggerMs}
              className="flex flex-wrap gap-2 type-label-tight text-ink-muted"
              itemAsChild
            >
              {champion.platforms.map((platform) => (
                <div
                  key={platform}
                  className="pill border border-border"
                >
                  {platform}
                </div>
              ))}
            </ChoreoGroup>
          </div>
        ) : null}

        {champion.article ? (
          <a
            href={`/${champion.article.slug}`}
            className="inline-flex items-center gap-2 type-button text-perazzi-red focus-ring"
          >
            {cardCtaLabel}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </ChoreoGroup>
    </>
  );
}
