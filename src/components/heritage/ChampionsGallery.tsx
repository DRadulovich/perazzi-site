"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ChampionEvergreen, ChampionsGalleryUi } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Container, Heading, Section, Text } from "@/components/ui";
import { homeMotion } from "@/lib/motionConfig";

type ChampionsGalleryProps = Readonly<{
  champions: ChampionEvergreen[];
  ui: ChampionsGalleryUi;
}>;

export function ChampionsGallery({ champions, ui }: ChampionsGalleryProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
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
        <Text asChild className="type-quote text-ink">
          <blockquote>
            “Perazzi heritage is carried by every athlete who chooses calm precision.”
          </blockquote>
        </Text>
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
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
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
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 overlay-gradient-ink" aria-hidden />
      </div>

      {/* Foreground glass container */}
      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/10">
          <motion.div
            className="space-y-2"
            initial={reduceMotion ? false : { opacity: 0, y: 14, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={reduceMotion ? undefined : { once: true, amount: 0.6 }}
            transition={reduceMotion ? undefined : homeMotion.revealFast}
          >
            <Heading
              id="heritage-champions-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
            <Text className="type-section-subtitle mb-6 text-ink-muted">
              {subheading}
            </Text>
          </motion.div>

          {disciplines.length ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(10px)" }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={reduceMotion ? undefined : { once: true, amount: 0.6 }}
              transition={reduceMotion ? undefined : homeMotion.revealFast}
            >
              <LayoutGroup id="heritage-champions-discipline-filter">
                <fieldset
                  className="flex flex-wrap gap-2 border-0 p-0"
                  aria-label="Filter champions by discipline"
                >
                  <legend className="sr-only">Filter champions by discipline</legend>
                  <motion.button
                    type="button"
                    aria-pressed={activeDiscipline === null}
                    className={cn(
                      "relative overflow-hidden pill border type-button focus-ring transition",
                      activeDiscipline === null
                        ? "border-perazzi-red text-perazzi-red"
                        : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
                    )}
                    onClick={() => { setActiveDiscipline(null); }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={reduceMotion ? undefined : homeMotion.micro}
                  >
                    {activeDiscipline === null ? (
                      <motion.span
                        layoutId="heritage-champions-discipline-highlight"
                        className="absolute inset-0 rounded-[0.125rem] bg-perazzi-red/10"
                        transition={homeMotion.springHighlight}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="relative z-10">All</span>
                  </motion.button>
                  {disciplines.map((discipline) => {
                    const active = activeDiscipline === discipline;
                    return (
                      <motion.button
                        key={discipline}
                        type="button"
                        aria-pressed={active}
                        className={cn(
                          "relative overflow-hidden pill border type-button focus-ring transition",
                          active
                            ? "border-perazzi-red text-perazzi-red"
                            : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
                        )}
                        onClick={() =>
                          setActiveDiscipline(active ? null : discipline)
                        }
                        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        transition={reduceMotion ? undefined : homeMotion.micro}
                      >
                        {active ? (
                          <motion.span
                            layoutId="heritage-champions-discipline-highlight"
                            className="absolute inset-0 rounded-[0.125rem] bg-perazzi-red/10"
                            transition={homeMotion.springHighlight}
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="relative z-10">{discipline}</span>
                      </motion.button>
                    );
                  })}
                </fieldset>
              </LayoutGroup>
            </motion.div>
          ) : null}

          {/* Two-column layout: left = list of names, right = selected champion detail */}
          <motion.div
            className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start"
            initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={reduceMotion ? undefined : { once: true, amount: 0.4 }}
            transition={reduceMotion ? undefined : homeMotion.reveal}
          >
            {/* Left column – names list */}
            <div className="rounded-2xl bg-card/0 p-4 sm:rounded-3xl">
              <Text
                size="label-tight"
                className="mb-3 text-ink-muted"
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
                      reduceMotion={reduceMotion}
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
                    initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(10px)" }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -10, filter: "blur(8px)" }}
                    transition={reduceMotion ? undefined : homeMotion.micro}
                    className="flex flex-col gap-6"
                  >
                    <ChampionDetail champion={selectedChampion} cardCtaLabel={cardCtaLabel} />
                  </motion.div>
                ) : (
                  <motion.p
                    key="no-champion"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={reduceMotion ? undefined : { opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={reduceMotion ? undefined : homeMotion.micro}
                    className="type-body-sm text-ink-muted"
                  >
                    Select a champion on the left to view their story.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Section>
      </Container>
    </section>
  );
}

type ChampionNameItemProps = Readonly<{
  champion: ChampionEvergreen;
  isActive: boolean;
  reduceMotion: boolean;
  onSelect: () => void;
}>;

function ChampionNameItem({ champion, isActive, reduceMotion, onSelect }: ChampionNameItemProps) {
  const analyticsRef = useAnalyticsObserver<HTMLLIElement>(
    `ChampionListItemViewed:${champion.id}`,
    { threshold: 0.3 },
  );

  return (
    <li
      ref={analyticsRef}
      data-analytics-id={`ChampionListItemViewed:${champion.id}`}
    >
      <motion.button
        type="button"
        onClick={onSelect}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-colors focus-ring",
          isActive
            ? "bg-perazzi-red text-card"
            : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
        )}
        aria-pressed={isActive}
        whileHover={reduceMotion ? undefined : { x: 4, transition: homeMotion.micro }}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      >
        {champion.title ? (
          <span className={cn("block type-card-title text-xl text-ink", isActive && "text-white")}>
            {champion.title}
          </span>
        ) : null}
      </motion.button>
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
      <div
        className="group relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-[3/2]"
      >
        <Image
          src={champion.image.url}
          alt={champion.image.alt}
          fill
          sizes="(min-width: 1024px) 320px, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-12" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
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
          <Heading level={3} className="type-section text-ink border-b border-perazzi-red/40 pb-2">
            {champion.name}
          </Heading>
        </div>

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
            <ul className="flex flex-wrap gap-2 type-label-tight text-ink-muted">
              {champion.disciplines.map((discipline) => (
                <li
                  key={discipline}
                  className="pill border border-border"
                >
                  {discipline}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {champion.platforms?.length ? (
          <div className="space-y-2">
            <Text size="label-tight" className="text-ink-muted">
              Platforms
            </Text>
            <ul className="flex flex-wrap gap-2 type-label-tight text-ink-muted">
              {champion.platforms.map((platform) => (
                <li
                  key={platform}
                  className="pill border border-border"
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
            className="inline-flex items-center gap-2 type-button text-perazzi-red focus-ring"
          >
            {cardCtaLabel}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </>
  );
}
