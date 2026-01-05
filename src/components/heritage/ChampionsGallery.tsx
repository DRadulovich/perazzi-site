"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ChampionEvergreen, ChampionsGalleryUi } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Container,
  Heading,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  Section,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

type ChampionsGalleryProps = Readonly<{
  champions: ChampionEvergreen[];
  ui: ChampionsGalleryUi;
}>;

type ChampionsGalleryRevealSectionProps = Readonly<{
  champions: ChampionEvergreen[];
  ui: ChampionsGalleryUi;
  enableTitleReveal: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}>;

export function ChampionsGallery({ champions, ui }: ChampionsGalleryProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const galleryKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const verified = champions.filter((champion) => Boolean(champion?.name));

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

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

  return (
    <section
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
      aria-labelledby="heritage-champions-heading"
    >
      <ChampionsGalleryRevealSection
        key={galleryKey}
        champions={verified}
        ui={ui}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}

const ChampionsGalleryRevealSection = ({
  champions,
  ui,
  enableTitleReveal,
  onCollapsedChange,
}: ChampionsGalleryRevealSectionProps) => {
  const [galleryExpanded, setGalleryExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [selectedChampionId, setSelectedChampionId] = useState<string | null>(() => {
    return champions[0]?.id ?? null;
  });
  const revealGallery = !enableTitleReveal || galleryExpanded;
  const revealPhotoFocus = revealGallery;
  const galleryMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    champions.forEach((champion) => {
      champion.disciplines?.forEach((discipline) => set.add(discipline));
    });
    return Array.from(set);
  }, [champions]);

  const filteredChampions = champions.filter((champion) => {
    if (!activeDiscipline) return true;
    return champion.disciplines?.includes(activeDiscipline);
  });

  const activeChampionId = useMemo(() => {
    if (!filteredChampions.length) return null;

    const stillPresent = selectedChampionId
      ? filteredChampions.some((champion) => champion.id === selectedChampionId)
      : false;

    if (stillPresent) return selectedChampionId;
    return filteredChampions[0].id;
  }, [filteredChampions, selectedChampionId]);

  const selectedChampion =
    filteredChampions.find((champion) => champion.id === activeChampionId) ?? null;

  const {
    ref: galleryShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealGallery,
    deps: [activeDiscipline, activeChampionId, champions.length],
  });
  const revealGalleryForMeasure = revealGallery || isPreparing;

  const heading = ui.heading ?? "Perazzi Champions";
  const subheading = ui.subheading ?? "The athletes who shaped our lineage";
  const championsLabel = ui.championsLabel ?? "Champions";
  const background = {
    url: ui.backgroundImage?.url ?? "/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg",
    alt: ui.backgroundImage?.alt ?? "Perazzi champions background",
  };
  const cardCtaLabel = ui.cardCtaLabel ?? "Read full interview";


  const handleGalleryExpand = () => {
    onCollapsedChange?.(false);
    beginExpand(() => {
      setGalleryExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleGalleryCollapse = () => {
    clearPremeasure();
    setHeaderThemeReady(false);
    setGalleryExpanded(false);
    onCollapsedChange?.(true);
  };

  const handleChampionSelect = (championId: string) => {
    setSelectedChampionId(championId);
    logAnalytics(`ChampionProfileSelected:${championId}`);
  };

  const expandedContent = (
    <>
      <RevealExpandedHeader
        headingId="heritage-champions-heading"
        heading={heading}
        subheading={subheading}
        headerThemeReady={headerThemeReady}
        enableTitleReveal={enableTitleReveal}
        onCollapse={handleGalleryCollapse}
      />
      <ChampionsGalleryBody
        revealGallery={revealGalleryForMeasure}
        disciplines={disciplines}
        activeDiscipline={activeDiscipline}
        onDisciplineChange={setActiveDiscipline}
        championsLabel={championsLabel}
        filteredChampions={filteredChampions}
        activeChampionId={activeChampionId}
        onChampionSelect={handleChampionSelect}
        selectedChampion={selectedChampion}
        cardCtaLabel={cardCtaLabel}
      />
    </>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealGallery}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealGallery}
        overlay="ink"
        loading="lazy"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={galleryShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={galleryMinHeight ?? undefined}
        >
          {revealGallery ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="heritage-champions-heading"
                heading={heading}
                subheading={subheading}
                controlsId="heritage-champions-body"
                expanded={revealGallery}
                onExpand={handleGalleryExpand}
              />
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
      </Container>
    </>
  );
};

type ChampionsGalleryBodyProps = Readonly<{
  revealGallery: boolean;
  disciplines: string[];
  activeDiscipline: string | null;
  onDisciplineChange: (nextDiscipline: string | null) => void;
  championsLabel: string;
  filteredChampions: ChampionEvergreen[];
  activeChampionId: string | null;
  onChampionSelect: (championId: string) => void;
  selectedChampion: ChampionEvergreen | null;
  cardCtaLabel: string;
}>;

function ChampionsGalleryBody({
  revealGallery,
  disciplines,
  activeDiscipline,
  onDisciplineChange,
  championsLabel,
  filteredChampions,
  activeChampionId,
  onChampionSelect,
  selectedChampion,
  cardCtaLabel,
}: ChampionsGalleryBodyProps) {
  if (!revealGallery) return null;

  return (
    <div id="heritage-champions-body" className="space-y-6">
      <ChampionsGalleryFilters
        disciplines={disciplines}
        activeDiscipline={activeDiscipline}
        onDisciplineChange={onDisciplineChange}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start">
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
                  onSelect={() => onChampionSelect(champion.id)}
                />
              ))}
            </ul>
          ) : (
            <Text size="sm" className="text-ink-muted">
              No champions in this discipline yet—select another to continue exploring the lineage.
            </Text>
          )}
        </div>

        <div className="min-h-72 rounded-2xl border border-border/75 bg-card/75 p-5 shadow-soft sm:rounded-3xl">
          {selectedChampion ? (
            <div className="flex flex-col gap-6">
              <ChampionDetail champion={selectedChampion} cardCtaLabel={cardCtaLabel} />
            </div>
          ) : (
            <p className="type-body-sm text-ink-muted">
              Select a champion on the left to view their story.
            </p>
          )}
        </div>
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
        className="flex flex-wrap gap-2 border-0 p-0"
        aria-label="Filter champions by discipline"
      >
        <legend className="sr-only">Filter champions by discipline</legend>
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
            <span
              className="absolute inset-0 rounded-xs bg-perazzi-red/10"
              aria-hidden="true"
            />
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
                <span
                  className="absolute inset-0 rounded-xs bg-perazzi-red/10"
                  aria-hidden="true"
                />
              ) : null}
              <span className="relative z-10">{discipline}</span>
            </button>
          );
        })}
      </fieldset>
    </div>
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
          "relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left focus-ring",
          isActive
            ? "bg-perazzi-red text-card"
            : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
        )}
        aria-pressed={isActive}
      >
        {champion.title ? (
          <span className={cn("block type-card-title text-xl text-ink", isActive && "text-white")}>
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
  return (
    <>
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
