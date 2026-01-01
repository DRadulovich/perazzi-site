"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import type { ChampionEvergreen, ChampionsGalleryUi } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Container, Heading, Section, Text } from "@/components/ui";
import { homeMotion } from "@/lib/motionConfig";

type ChampionsGalleryProps = Readonly<{
  champions: ChampionEvergreen[];
  ui: ChampionsGalleryUi;
}>;

type ChampionsGalleryRevealSectionProps = Readonly<{
  champions: ChampionEvergreen[];
  ui: ChampionsGalleryUi;
  enableTitleReveal: boolean;
  motionEnabled: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}>;

export function ChampionsGallery({ champions, ui }: ChampionsGalleryProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
  const galleryKey = enableTitleReveal ? "title-reveal" : "always-reveal";
  const sectionRef = useRef<HTMLElement | null>(null);

  const verified = champions.filter((champion) => Boolean(champion?.name));

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
      ref={sectionRef}
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="heritage-champions-heading"
    >
      <ChampionsGalleryRevealSection
        key={galleryKey}
        champions={verified}
        ui={ui}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={sectionRef}
      />
    </section>
  );
}

const ChampionsGalleryRevealSection = ({
  champions,
  ui,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: ChampionsGalleryRevealSectionProps) => {
  const [galleryExpanded, setGalleryExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [selectedChampionId, setSelectedChampionId] = useState<string | null>(() => {
    return champions[0]?.id ?? null;
  });

  const galleryShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

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

  const heading = ui.heading ?? "Perazzi Champions";
  const subheading = ui.subheading ?? "The athletes who shaped our lineage";
  const championsLabel = ui.championsLabel ?? "Champions";
  const background = {
    url: ui.backgroundImage?.url ?? "/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg",
    alt: ui.backgroundImage?.alt ?? "Perazzi champions background",
  };
  const cardCtaLabel = ui.cardCtaLabel ?? "Read full interview";

  const revealGallery = !enableTitleReveal || galleryExpanded;
  const revealPhotoFocus = revealGallery;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealGallery;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition =
    "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition =
    "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const galleryReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const galleryRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const galleryCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const galleryBodyReveal = galleryReveal;
  const readMoreReveal = motionEnabled
    ? { duration: 0.5, ease: homeMotion.cinematicEase, delay: galleryReveal.duration }
    : undefined;
  const galleryLayoutTransition = motionEnabled ? { layout: galleryReveal } : undefined;
  const galleryMinHeight = enableTitleReveal ? "min-h-[calc(700px+16rem)]" : null;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", parallaxEnabled ? parallaxStrength : "0%"],
  );
  const parallaxStyle = parallaxEnabled ? { y: parallaxY } : undefined;
  const backgroundScale = parallaxEnabled ? 1.32 : 1;
  const backgroundScaleTransition = revealGallery ? galleryReveal : galleryCollapse;

  const headingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.16 : 0 } },
  } as const;

  const headingItem = {
    hidden: { y: 14, filter: "blur(10px)" },
    show: { y: 0, filter: "blur(0px)", transition: galleryReveal },
  } as const;

  const handleGalleryExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setGalleryExpanded(true);
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };

  const handleGalleryCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    setGalleryExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealGallery) return;
    const node = galleryShellRef.current;
    if (!node) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!node) return;
        const nextHeight = Math.ceil(node.getBoundingClientRect().height);
        setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return () => { cancelAnimationFrame(frame); };
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [
    enableTitleReveal,
    revealGallery,
    activeDiscipline,
    activeChampionId,
    champions.length,
  ]);

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={parallaxStyle}
          initial={false}
          animate={motionEnabled ? { scale: backgroundScale } : undefined}
          transition={motionEnabled ? backgroundScaleTransition : undefined}
        >
          <Image
            src={background.url}
            alt={background.alt}
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
          />
        </motion.div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealGallery ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 film-grain",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-20" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 overlay-gradient-ink",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <Container size="xl" className="relative z-10">
        <motion.div
          ref={galleryShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            galleryMinHeight,
          )}
        >
          <LayoutGroup id="heritage-champions-title">
            <AnimatePresence initial={false}>
              {revealGallery ? (
                <motion.div
                  key="heritage-champions-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1, transition: galleryReveal } : undefined}
                  exit={motionEnabled ? { opacity: 0, transition: galleryRevealFast } : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                  >
                    <motion.div
                      layoutId="heritage-champions-title"
                      layoutCrossfade={false}
                      transition={galleryLayoutTransition}
                      className="relative"
                    >
                      <Heading
                        id="heritage-champions-heading"
                        level={2}
                        size="xl"
                        className={cn(
                          titleColorTransition,
                          headerThemeReady ? "text-ink" : "text-white",
                        )}
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <motion.div
                      layoutId="heritage-champions-subtitle"
                      layoutCrossfade={false}
                      transition={galleryLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headingItem}>
                        <Text
                          className={cn(
                            "type-section-subtitle",
                            titleColorTransition,
                            headerThemeReady ? "text-ink-muted" : "text-white",
                          )}
                        >
                          {subheading}
                        </Text>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  {enableTitleReveal ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleGalleryCollapse}
                    >
                      Collapse
                    </button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="heritage-champions-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : false}
                  animate={motionEnabled ? { opacity: 1, filter: "blur(0px)" } : undefined}
                  exit={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : undefined}
                  transition={motionEnabled ? galleryRevealFast : undefined}
                >
                  <motion.div
                    layoutId="heritage-champions-title"
                    layoutCrossfade={false}
                    transition={galleryLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <Heading
                      id="heritage-champions-heading"
                      level={2}
                      size="xl"
                      className="type-section-collapsed"
                    >
                      {heading}
                    </Heading>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onPointerEnter={handleGalleryExpand}
                      onFocus={handleGalleryExpand}
                      onClick={handleGalleryExpand}
                      aria-expanded={revealGallery}
                      aria-controls="heritage-champions-body"
                      aria-labelledby="heritage-champions-heading"
                    >
                      <span className="sr-only">Expand {heading}</span>
                    </button>
                  </motion.div>
                  <motion.div
                    layoutId="heritage-champions-subtitle"
                    layoutCrossfade={false}
                    transition={galleryLayoutTransition}
                    className="relative text-white"
                  >
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {subheading}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: galleryRevealFast } : undefined}
                    className="mt-3"
                  >
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleGalleryExpand}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {revealGallery ? (
              <motion.div
                key="heritage-champions-body"
                id="heritage-champions-body"
                className="space-y-6"
                initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(12px)" } : false}
                animate={
                  motionEnabled
                    ? { opacity: 1, y: 0, filter: "blur(0px)", transition: galleryBodyReveal }
                    : undefined
                }
                exit={
                  motionEnabled
                    ? { opacity: 0, y: -16, filter: "blur(10px)", transition: galleryCollapse }
                    : undefined
                }
              >
                {disciplines.length ? (
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 12, filter: "blur(10px)" } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                    transition={motionEnabled ? homeMotion.revealFast : undefined}
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
                          whileTap={motionEnabled ? { scale: 0.98 } : undefined}
                          transition={motionEnabled ? homeMotion.micro : undefined}
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
                              whileTap={motionEnabled ? { scale: 0.98 } : undefined}
                              transition={motionEnabled ? homeMotion.micro : undefined}
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

                <motion.div
                  className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start"
                  initial={motionEnabled ? { opacity: 0, y: 18, filter: "blur(10px)" } : false}
                  animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                  transition={motionEnabled ? homeMotion.reveal : undefined}
                >
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
                            reduceMotion={!motionEnabled}
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

                  <div className="min-h-72 rounded-2xl border border-border/75 bg-card/75 p-5 shadow-soft sm:rounded-3xl">
                    <AnimatePresence mode="wait">
                      {selectedChampion ? (
                        <motion.div
                          key={selectedChampion.id}
                          initial={motionEnabled ? { opacity: 0, y: 12, filter: "blur(10px)" } : false}
                          animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                          exit={motionEnabled ? { opacity: 0, y: -10, filter: "blur(8px)" } : undefined}
                          transition={motionEnabled ? homeMotion.micro : undefined}
                          className="flex flex-col gap-6"
                        >
                          <ChampionDetail champion={selectedChampion} cardCtaLabel={cardCtaLabel} />
                        </motion.div>
                      ) : (
                        <motion.p
                          key="no-champion"
                          initial={motionEnabled ? { opacity: 0 } : false}
                          animate={motionEnabled ? { opacity: 1 } : undefined}
                          exit={motionEnabled ? { opacity: 0 } : undefined}
                          transition={motionEnabled ? homeMotion.micro : undefined}
                          className="type-body-sm text-ink-muted"
                        >
                          Select a champion on the left to view their story.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </Container>
    </>
  );
};

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
