"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { Container, Heading, Section, Text } from "@/components/ui";

type DisciplineCard = ShotgunsLandingData["disciplines"][number];

type ModelDetail = {
  id: string;
  name: string;
  version?: string;
  platform?: string;
  use?: string;
  grade?: string;
  gaugeNames?: string[];
  triggerTypes?: string[];
  triggerSprings?: string[];
  ribTypes?: string[];
  ribStyles?: string[];
  imageUrl?: string;
  imageAlt?: string;
};

type DisciplineRailProps = Readonly<{
  disciplines: readonly DisciplineCard[];
  platforms: readonly Platform[];
  ui?: ShotgunsLandingData["disciplineRailUi"];
}>;

const DISCIPLINE_TABS = [
  {
    label: "American Disciplines",
    items: [
      ["sporting-disciplines", "sporting"],
      ["american-trap", "trap"],
      ["american-skeet", "skeet"],
    ],
  },
  {
    label: "Olympic Disciplines",
    items: [
      ["olympic-skeet"],
      ["olympic-trap"],
    ],
  },
  {
    label: "Live Game",
    items: [
      ["pigeons-helice"],
      ["game", "game-shooting"],
    ],
  },
] as const;

export function DisciplineRail({
  disciplines,
  platforms,
  ui,
}: DisciplineRailProps) {
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelModalPresent, setModelModalPresent] = useState(false);
  const [modelLoadingId, setModelLoadingId] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(DISCIPLINE_TABS[0]?.label ?? null);
  const [activeDisciplineId, setActiveDisciplineId] = useState<string | null>(null);
  const railAnalyticsRef = useAnalyticsObserver<HTMLElement>("DisciplineRailSeen");
  const motionEnabled = !reduceMotion;

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const platformName = (platformId: string) =>
    platforms.find((platform) => platform.id === platformId)?.name ??
    platformId.replace("platform-", "").toUpperCase();

  const handleModelSelect = async (modelId: string) => {
    if (!modelId) return;
    setModelLoadingId(modelId);
    setModelError(null);
    try {
      const response = await fetch(`/api/models/${modelId}`);
      if (!response.ok) {
        throw new Error("Unable to load model details.");
      }
      const data = (await response.json()) as ModelDetail;
      setSelectedModel(data);
      setModelModalOpen(true);
      setModelModalPresent(true);
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setModelLoadingId(null);
    }
  };

  useEffect(() => {
    if (!modelModalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModelModalOpen(false);
    };
    if (typeof globalThis.addEventListener !== "function" || typeof globalThis.removeEventListener !== "function") {
      return;
    }
    globalThis.addEventListener("keydown", handleKey);
    return () => { globalThis.removeEventListener("keydown", handleKey); };
  }, [modelModalOpen]);

  useEffect(() => {
    if (!modelModalPresent) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modelModalPresent]);

  const disciplineLookup = useMemo(() => {
    const map = new Map<string, DisciplineCard>();
    disciplines.forEach((discipline) => {
      map.set(discipline.id, discipline);
    });
    return map;
  }, [disciplines]);

  const categories = useMemo(() => {
    return DISCIPLINE_TABS.map((tab) => {
      const resolved = tab.items
        .map((aliases) => {
          for (const alias of aliases) {
            const match = disciplineLookup.get(alias);
            if (match) return match;
          }
          return undefined;
        })
        .filter((item): item is DisciplineCard => item !== undefined);
      return { label: tab.label, disciplines: resolved };
    }).filter((category) => category.disciplines.length);
  }, [disciplineLookup]);

  useEffect(() => {
    const firstCategory = categories[0];
    if (!activeDisciplineId && firstCategory.disciplines[0]) {
      setActiveDisciplineId(firstCategory.disciplines[0].id);
      setOpenCategory(firstCategory.label);
    }
  }, [categories, activeDisciplineId]);

  const selectedDiscipline =
    disciplines.find((discipline) => discipline.id === activeDisciplineId) ??
    categories[0]?.disciplines[0] ??
    disciplines[0] ??
    null;

  const heading = ui?.heading ?? "Disciplines at a Glance";
  const subheading =
    ui?.subheading ??
    "Every discipline demands something unique from your platform, whether it's precision, speed, or adaptability.";
  const background = ui?.background ?? {
    id: "discipline-rail-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg",
    alt: "Perazzi discipline background",
  };

  return (
    <section
      ref={railAnalyticsRef}
      data-analytics-id="DisciplineRailSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="discipline-rail-heading"
      >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={background.url}
          alt={background.alt}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-(--scrim-soft)" aria-hidden />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/40">
          <motion.div
            className="space-y-3"
            initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
            whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
          >
            <Heading
              id="discipline-rail-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
            <Text size="md" className="type-section-subtitle text-ink-muted">
              {subheading}
            </Text>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
            <div className="space-y-3 rounded-2xl bg-card/0 p-4 sm:rounded-3xl sm:p-5">
              <Text size="label-tight" className="type-label-tight text-ink-muted">
                Discipline categories
              </Text>
              <LayoutGroup id="shotguns-discipline-tabs">
                <div className="space-y-3">
                  {categories.map((category) => {
                    const isOpen = openCategory === category.label;
                    return (
                      <div
                        key={category.label}
                        className="rounded-2xl border border-border/70 bg-card/75"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-4 py-3 text-left type-label-tight text-ink focus-ring"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenCategory((prev) =>
                              prev === category.label ? null : category.label,
                            )
                          }
                        >
                          {category.label}
                          <span
                            className={cn(
                              "text-lg transition-transform",
                              isOpen ? "rotate-45" : "rotate-0",
                            )}
                            aria-hidden="true"
                          >
                            +
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="border-t border-border/70">
                            <ul className="space-y-1 p-3">
                              {category.disciplines.map((discipline) => {
                                const isActive = discipline.id === activeDisciplineId;
                                return (
                                  <li key={discipline.id}>
                                    <motion.button
                                      type="button"
                                      onClick={() => { setActiveDisciplineId(discipline.id); }}
                                      className={cn(
                                        "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-colors focus-ring",
                                        isActive
                                          ? "text-white"
                                          : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
                                      )}
                                      aria-pressed={isActive}
                                      initial={false}
                                      whileHover={motionEnabled ? { x: 2, transition: homeMotion.micro } : undefined}
                                      whileTap={motionEnabled ? { x: 0, transition: homeMotion.micro } : undefined}
                                    >
                                      {isActive ? (
                                        motionEnabled ? (
                                          <motion.span
                                            layoutId="discipline-active-highlight"
                                            className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                            transition={homeMotion.springHighlight}
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <span
                                            className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                            aria-hidden="true"
                                          />
                                        )
                                      ) : null}
                                      <span
                                        className={cn(
                                          "relative z-10 mt-0.5 block type-label-tight group-hover:text-ink-muted/90",
                                          isActive ? "text-white" : "text-ink-muted",
                                        )}
                                      >
                                        {discipline.id.replaceAll("-", " ")}
                                      </span>
                                    </motion.button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            <div className="min-h-104">
              <AnimatePresence initial={false} mode="popLayout">
                {selectedDiscipline ? (
                  <motion.div
                    key={selectedDiscipline.id}
                    initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={motionEnabled ? { opacity: 0, y: -14, filter: "blur(10px)" } : undefined}
                    transition={motionEnabled ? homeMotion.revealFast : undefined}
                  >
                    <DisciplineCard
                      discipline={selectedDiscipline}
                      index={0}
                      total={1}
                      platformName={platformName}
                      onSelectModel={handleModelSelect}
                      loadingModelId={modelLoadingId}
                    />
                  </motion.div>
                ) : (
                  <Text className="text-ink-muted" leading="normal">
                    Select a discipline to view its details.
                  </Text>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Section>

        <AnimatePresence
          onExitComplete={() => {
            if (!modelModalOpen) setModelModalPresent(false);
          }}
        >
          {modelModalOpen && selectedModel ? (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              initial={motionEnabled ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={motionEnabled ? { opacity: 0 } : undefined}
              transition={motionEnabled ? homeMotion.revealFast : undefined}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
              <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
              <button
                type="button"
                className="absolute inset-0 z-0 cursor-default border-0 bg-transparent"
                aria-label="Close modal"
                onClick={() => { setModelModalOpen(false); }}
              />
              <motion.div
                className="relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/12 bg-perazzi-black/90 text-white shadow-elevated ring-1 ring-white/15 backdrop-blur-xl"
                initial={
                  motionEnabled
                    ? { opacity: 0, y: 18, scale: 0.985, filter: "blur(14px)" }
                    : false
                }
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={motionEnabled ? { opacity: 0, y: 18, scale: 0.985, filter: "blur(14px)" } : undefined}
                transition={motionEnabled ? homeMotion.revealFast : undefined}
              >
                <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
                <button
                  type="button"
                  className="type-button absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-white shadow-soft backdrop-blur-sm transition hover:border-white/30 hover:bg-black/55 focus-ring sm:right-5 sm:top-5"
                  onClick={() => setModelModalOpen(false)}
                >
                  Close
                </button>

                <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[3fr,1.6fr]">
                  <div className="group card-media relative aspect-16/10 w-full overflow-hidden rounded-3xl bg-white">
                    {selectedModel.imageUrl ? (
                      <Image
                        src={selectedModel.imageUrl}
                        alt={selectedModel.imageAlt || selectedModel.name}
                        fill
                        className="object-contain bg-white transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                        sizes="(min-width: 1024px) 70vw, 100vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-600">No Image Available</div>
                    )}
                    <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-6 flex flex-col gap-2 px-6 text-black">
                      <Text size="label-tight" className="text-perazzi-red">
                        {selectedModel.grade}
                      </Text>
                      <Heading
                        level={2}
                        size="xl"
                        className="text-black"
                      >
                        {selectedModel.name}
                      </Heading>
                      <Text size="sm" className="text-black/70">
                        {selectedModel.use}
                      </Text>
                    </div>
                  </div>
                  <div className="grid gap-4 rounded-3xl border border-white/12 bg-black/35 p-4 shadow-soft ring-1 ring-white/10 backdrop-blur-sm sm:p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Detail label="Platform" value={selectedModel.platform} />
                    <Detail label="Gauge" value={selectedModel.gaugeNames?.join(", ")} />
                    <Detail label="Trigger Type" value={selectedModel.triggerTypes?.join(", ")} />
                    <Detail label="Trigger Springs" value={selectedModel.triggerSprings?.join(", ")} />
                    <Detail label="Rib Type" value={selectedModel.ribTypes?.join(", ")} />
                    <Detail label="Rib Style" value={selectedModel.ribStyles?.join(", ")} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {modelError ? (
          <Text
            asChild
            className="block text-center text-red-500"
            leading="normal"
          >
            <output aria-live="polite">
            {modelError}
            </output>
          </Text>
        ) : null}
      </Container>
    </section>
  );
}

type DisciplineCardProps = Readonly<{
  discipline: ShotgunsLandingData["disciplines"][number];
  index: number;
  total: number;
  platformName: (id: string) => string;
  onSelectModel: (id: string) => void;
  loadingModelId: string | null;
}>;

function DisciplineCard({
  discipline,
  index,
  total,
  platformName,
  onSelectModel,
  loadingModelId,
}: DisciplineCardProps) {
  const cardRef = useAnalyticsObserver<HTMLDivElement>(
    `shotguns_discipline_card_impression:${discipline.id}`,
    { threshold: 0.4 },
  );

  return (
    <article
      ref={cardRef}
      data-analytics-id={`DisciplineChip:${discipline.id}`}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card/60 text-left shadow-soft backdrop-blur-sm focus-ring sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
      aria-label={`Slide ${index + 1} of ${total}: ${discipline.name}`}
    >
      <div className="card-media relative aspect-30/11 w-full rounded-t-3xl bg-(--color-canvas)">
        {discipline.hero ? (
          <Image
            src={discipline.hero.url}
            alt={discipline.hero.alt}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
      </div>
          <div className="flex flex-1 flex-col gap-6 p-6">
        <Heading
          level={3}
          className="type-card-title text-ink border-b border-perazzi-red/40 pb-2"
        >
          {discipline.name}
        </Heading>
        {discipline.overviewPortableText?.length ? (
          <PortableText
            className="max-w-none type-body text-ink-muted mb-7"
            blocks={discipline.overviewPortableText}
          />
        ) : discipline.overviewHtml ? (
          <SafeHtml
            className="max-w-none type-body text-ink-muted mb-7"
            html={discipline.overviewHtml}
          />
        ) : null}
        {discipline.recommendedPlatforms?.length ? (
          <div className="space-y-2 mb-7">
            <Text size="label-tight" className="type-card-title text-ink-muted">
              Recommended platforms
            </Text>
            <ul className="flex flex-wrap gap-2">
              {discipline.recommendedPlatforms.map((platformId) => (
                <li
                  key={platformId}
                  className="pill border border-border type-label-tight text-ink-muted"
                >
                  {platformName(platformId)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {discipline.popularModels?.length ? (
          <div className="mt-auto flex flex-col gap-3">
            <Text size="label-tight" className="type-card-title text-ink-muted">
              Most Popular Models
            </Text>
            <div className="flex flex-col gap-3">
              {discipline.popularModels.map((model) => (
                <button
                  type="button"
                  key={model.idLegacy ?? model.id}
                  onClick={() => { onSelectModel(model.idLegacy ?? model.id); }}
                  className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                >
                  {model.hero ? (
                    <Image
                      src={model.hero.url}
                      alt={model.hero.alt}
                      width={800}
                      height={600}
                      className="w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      sizes="(min-width: 1024px) 320px, 100vw"
                    />
                  ) : null}
                  <span className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                  <div className="pointer-events-none absolute inset-0 bg-perazzi-black/75 transition duration-500 group-hover:bg-perazzi-black/60" />
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center p-2 text-center type-card-title text-white text-xl sm:text-2xl lg:text-3xl transition-opacity duration-500 group-hover:opacity-0",
                    )}
                  >
                    {loadingModelId === (model.idLegacy ?? model.id) ? "Loading…" : model.name || "Untitled"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value?: string }>) {
  return (
    <div>
      <Text size="label-tight" className="text-perazzi-red">
        {label}
      </Text>
      <Text size="sm" className="text-white">
        {value || "—"}
      </Text>
    </div>
  );
}
