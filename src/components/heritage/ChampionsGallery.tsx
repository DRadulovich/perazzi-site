"use client";

import { useEffect, useMemo, useState, type ComponentProps, type ReactNode, type Ref } from "react";
import type { ChampionEvergreen, ChampionsGalleryUi } from "@/types/heritage";
import { useHydrated } from "@/hooks/use-hydrated";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { choreoDistance, dreamyPace } from "@/lib/choreo";
import {
  ChoreoGroup,
  Container,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  RevealGroup,
  RevealItem,
  Section,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";
import { ChampionsGalleryBody } from "./ChampionsGalleryBody";

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

type ChampionsGalleryCopy = Readonly<{
  heading: string;
  subheading: string;
  championsLabel: string;
  background: { url: string; alt: string };
  cardCtaLabel: string;
}>;

const resolveChampionsGalleryCopy = (ui: ChampionsGalleryUi): ChampionsGalleryCopy => ({
  heading: ui.heading ?? "Perazzi Champions",
  subheading: ui.subheading ?? "The athletes who shaped our lineage",
  championsLabel: ui.championsLabel ?? "Champions",
  background: {
    url: ui.backgroundImage?.url ?? "/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg",
    alt: ui.backgroundImage?.alt ?? "Perazzi champions background",
  },
  cardCtaLabel: ui.cardCtaLabel ?? "Read full interview",
});

type ChampionsRoster = Readonly<{
  disciplines: string[];
  activeDiscipline: string | null;
  setActiveDiscipline: (nextDiscipline: string | null) => void;
  filteredChampions: ChampionEvergreen[];
  activeChampionId: string | null;
  selectedChampion: ChampionEvergreen | null;
  setSelectedChampionId: (championId: string) => void;
}>;

const useChampionsRoster = (champions: ChampionEvergreen[]): ChampionsRoster => {
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [selectedChampionId, setSelectedChampionId] = useState<string | null>(() => {
    return champions[0]?.id ?? null;
  });

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    champions.forEach((champion) => {
      champion.disciplines?.forEach((discipline) => set.add(discipline));
    });
    return Array.from(set);
  }, [champions]);

  const filteredChampions = useMemo(() => {
    if (!activeDiscipline) return champions;
    return champions.filter((champion) => champion.disciplines?.includes(activeDiscipline));
  }, [activeDiscipline, champions]);

  const activeChampionId = useMemo(() => {
    if (!filteredChampions.length) return null;

    const stillPresent = selectedChampionId
      ? filteredChampions.some((champion) => champion.id === selectedChampionId)
      : false;

    if (stillPresent) return selectedChampionId;
    return filteredChampions[0].id;
  }, [filteredChampions, selectedChampionId]);

  const selectedChampion = useMemo(() => {
    return filteredChampions.find((champion) => champion.id === activeChampionId) ?? null;
  }, [activeChampionId, filteredChampions]);

  return {
    disciplines,
    activeDiscipline,
    setActiveDiscipline,
    filteredChampions,
    activeChampionId,
    selectedChampion,
    setSelectedChampionId,
  };
};

export function ChampionsGallery({ champions, ui }: ChampionsGalleryProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHydrated = useHydrated();
  const enableTitleReveal = isHydrated && isDesktop;
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

function ChampionsGalleryRevealSection({
  champions,
  ui,
  enableTitleReveal,
  onCollapsedChange,
}: ChampionsGalleryRevealSectionProps) {
  const [galleryExpanded, setGalleryExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const {
    disciplines,
    activeDiscipline,
    setActiveDiscipline,
    filteredChampions,
    activeChampionId,
    selectedChampion,
    setSelectedChampionId,
  } = useChampionsRoster(champions);

  const revealGallery = !enableTitleReveal || galleryExpanded;
  const revealPhotoFocus = revealGallery;
  const galleryMinHeight = enableTitleReveal ? "min-h-[50vh]" : undefined;

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
  const copy = useMemo(() => resolveChampionsGalleryCopy(ui), [ui]);

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

  const bodyProps = {
    revealGallery: revealGalleryForMeasure,
    filters: {
      disciplines,
      active: activeDiscipline,
      onChange: setActiveDiscipline,
    },
    roster: {
      label: copy.championsLabel,
      items: filteredChampions,
      activeId: activeChampionId,
      onSelect: handleChampionSelect,
      selected: selectedChampion,
      cardCtaLabel: copy.cardCtaLabel,
    },
  };

  const expandedContent = (
    <GalleryExpandedContent
      heading={copy.heading}
      subheading={copy.subheading}
      headerThemeReady={headerThemeReady}
      enableTitleReveal={enableTitleReveal}
      onCollapse={handleGalleryCollapse}
      bodyProps={bodyProps}
    />
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: copy.background.url, alt: copy.background.alt }}
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
          minHeightClass={galleryMinHeight}
        >
          {revealGallery ? (
            expandedContent
          ) : (
            <GalleryCollapsedContent
              headingId="heritage-champions-heading"
              heading={copy.heading}
              subheading={copy.subheading}
              expanded={revealGallery}
              onExpand={handleGalleryExpand}
              measureRef={measureRef}
              expandedContent={expandedContent}
            />
          )}
        </SectionShell>
      </Container>
    </>
  );
}

type GalleryExpandedContentProps = Readonly<{
  heading: string;
  subheading: string;
  headerThemeReady: boolean;
  enableTitleReveal: boolean;
  onCollapse: () => void;
  bodyProps: ComponentProps<typeof ChampionsGalleryBody>;
}>;

function GalleryExpandedContent({
  heading,
  subheading,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  bodyProps,
}: GalleryExpandedContentProps) {
  return (
    <RevealAnimatedBody sequence>
      <RevealItem index={0}>
        <RevealExpandedHeader
          headingId="heritage-champions-heading"
          heading={heading}
          subheading={subheading}
          headerThemeReady={headerThemeReady}
          enableTitleReveal={enableTitleReveal}
          onCollapse={onCollapse}
        />
      </RevealItem>
      <RevealGroup delayMs={140}>
        <ChampionsGalleryBody {...bodyProps} />
      </RevealGroup>
    </RevealAnimatedBody>
  );
}

type GalleryCollapsedContentProps = Readonly<{
  headingId: string;
  heading: string;
  subheading: string;
  expanded: boolean;
  onExpand: () => void;
  measureRef: Ref<HTMLDivElement>;
  expandedContent: ReactNode;
}>;

function GalleryCollapsedContent({
  headingId,
  heading,
  subheading,
  expanded,
  onExpand,
  measureRef,
  expandedContent,
}: GalleryCollapsedContentProps) {
  return (
    <>
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        itemClassName="absolute inset-0"
      >
        <RevealCollapsedHeader
          headingId={headingId}
          heading={heading}
          subheading={subheading}
          controlsId="heritage-champions-body"
          expanded={expanded}
          onExpand={onExpand}
        />
      </ChoreoGroup>
      <div ref={measureRef} className="section-reveal-measure" aria-hidden>
        {expandedContent}
      </div>
    </>
  );
}
