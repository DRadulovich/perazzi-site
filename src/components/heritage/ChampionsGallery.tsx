"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ChampionEvergreen, ChampionsGalleryUi } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Container, Heading, Section, Text } from "@/components/ui";

type ChampionsGalleryProps = Readonly<{
  champions: ChampionEvergreen[];
  ui: ChampionsGalleryUi;
}>;

export function ChampionsGallery({ champions, ui }: ChampionsGalleryProps) {
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

  const activeChampionId = useMemo(() => {
    if (!filteredChampions.length) return null;

    const stillPresent = selectedChampionId
      ? filteredChampions.some((champion) => champion.id === selectedChampionId)
      : false;

    if (stillPresent) return selectedChampionId;
    return filteredChampions[0].id;
  }, [filteredChampions, selectedChampionId]);

  if (!verified.length) {
    return (
      <Section padding="md">
        <blockquote className="text-base sm:text-lg italic leading-relaxed text-ink">
          “Perazzi heritage is carried by every athlete who chooses calm precision.”
        </blockquote>
      </Section>
    );
  }

  const selectedChampion =
    filteredChampions.find((champion) => champion.id === activeChampionId) ?? null;

  const heading = ui.heading ?? "Perazzi Champions";
  const subheading = ui.subheading ?? "The athletes who shaped our lineage";
  const championsLabel = ui.championsLabel ?? "Champions";
  const backgroundSrc = ui.backgroundImage?.url ?? "/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg";
  const backgroundAlt = ui.backgroundImage?.alt ?? "Perazzi champions background";
  const cardCtaLabel = ui.cardCtaLabel ?? "Read full interview";

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
          src={backgroundSrc}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          className="object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-(--scrim-soft)"
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
      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/10">
          <div className="space-y-2">
            <Heading
              id="heritage-champions-heading"
              level={2}
              size="xl"
              className="font-black uppercase italic tracking-[0.35em] text-ink"
            >
              {heading}
            </Heading>
            <Text className="mb-6 font-light italic text-ink-muted">
              {subheading}
            </Text>
          </div>

          {disciplines.length ? (
            <fieldset
              className="flex flex-wrap gap-2 border-0 p-0"
              aria-label="Filter champions by discipline"
            >
              <legend className="sr-only">Filter champions by discipline</legend>
              <button
                type="button"
                aria-pressed={activeDiscipline === null}
                className={cn(
                  "rounded-full border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition",
                  activeDiscipline === null
                    ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                    : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
                )}
                onClick={() => { setActiveDiscipline(null); }}
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
            </fieldset>
          ) : null}

          {/* Two-column layout: left = list of names, right = selected champion detail */}
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start">
            {/* Left column – names list */}
            <div className="rounded-2xl bg-card/0 p-4 sm:rounded-3xl">
              <Text
                size="xs"
                className="mb-3 font-semibold text-ink-muted"
                leading="normal"
              >
                {championsLabel}
              </Text>

              {filteredChampions.length ? (
                <ul className="space-y-1" aria-label="Select a champion to view their profile">
                  {filteredChampions.map((champion) => (
                    <ChampionNameItem
                      key={champion.id}
                      champion={champion}
                      isActive={champion.id === activeChampionId}
                      onSelect={() => {
                        setSelectedChampionId(champion.id);
                        logAnalytics(`ChampionProfileSelected:${champion.id}`);
                      }}
                    />
                  ))}
                </ul>
              ) : (
                <Text size="sm" className="text-ink-muted">
                  No champions in this discipline yet—select another to continue exploring the lineage.
                </Text>
              )}
            </div>

            {/* Right column – selected champion detail */}
            <div className="min-h-72 rounded-2xl border border-border/75 bg-card/75 p-5 shadow-soft sm:rounded-3xl">
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
                    <ChampionDetail champion={selectedChampion} cardCtaLabel={cardCtaLabel} />
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
        </Section>
      </Container>
    </section>
  );
}

type ChampionNameItemProps = Readonly<{
  champion: ChampionEvergreen;
  isActive: boolean;
  onSelect: () => void;
}>;

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

type ChampionDetailProps = Readonly<{
  champion: ChampionEvergreen;
  cardCtaLabel: string;
}>;

function ChampionDetail({ champion, cardCtaLabel }: ChampionDetailProps) {
  const ratio = 3 / 2; // Force 3:2 aspect ratio for champion images

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl bg-(--color-canvas)"
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
            "pointer-events-none absolute inset-0 bg-linear-to-t",
            "from-(--scrim-strong)/80 via-(--scrim-strong)/50 to-transparent",
          )}
          aria-hidden
        />
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <Heading level={3} size="sm" className="text-ink">
            {champion.name}
          </Heading>
          {champion.title ? (
            <Text size="xs" className="text-ink-muted" leading="normal">
              {champion.title}
            </Text>
          ) : null}
        </div>

        {champion.quote ? (
          <Text
            asChild
            size="md"
            className="border-l-2 border-perazzi-red/40 pl-3 text-[13px] sm:text-base italic text-ink"
          >
            <blockquote>“{champion.quote}”</blockquote>
          </Text>
        ) : null}

        {champion.bio ? (
          <Text className="text-ink-muted">{champion.bio}</Text>
        ) : null}

        {champion.resume &&
        (champion.resume.winOne ||
          champion.resume.winTwo ||
          champion.resume.winThree) ? (
          <div className="space-y-2">
            <Text size="xs" className="font-semibold text-ink-muted" leading="normal">
              Career Highlights
            </Text>
            <ul className="space-y-1 text-sm leading-relaxed text-ink">
              {champion.resume.winOne ? <li>• {champion.resume.winOne}</li> : null}
              {champion.resume.winTwo ? <li>• {champion.resume.winTwo}</li> : null}
              {champion.resume.winThree ? <li>• {champion.resume.winThree}</li> : null}
            </ul>
          </div>
        ) : null}

        {champion.disciplines?.length ? (
          <div className="space-y-2">
            <Text size="xs" className="font-semibold text-ink-muted" leading="normal">
              Disciplines
            </Text>
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
            <Text size="xs" className="font-semibold text-ink-muted" leading="normal">
              Platforms
            </Text>
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
            {cardCtaLabel}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </>
  );
}
