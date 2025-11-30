"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

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

type DisciplineRailProps = {
  disciplines: DisciplineCard[];
  platforms: Platform[];
  ariaPrevLabel?: string;
  ariaNextLabel?: string;
};

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
  ariaPrevLabel = "Previous slide",
  ariaNextLabel = "Next slide",
}: DisciplineRailProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelLoadingId, setModelLoadingId] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(DISCIPLINE_TABS[0]?.label ?? null);
  const [activeDisciplineId, setActiveDisciplineId] = useState<string | null>(null);
  const railAnalyticsRef = useAnalyticsObserver<HTMLElement>("DisciplineRailSeen");

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
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modelModalOpen]);

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
        .filter((item): item is DisciplineCard => Boolean(item));
      return { label: tab.label, disciplines: resolved };
    }).filter((category) => category.disciplines.length);
  }, [disciplineLookup]);

  useEffect(() => {
    const firstCategory = categories[0];
    if (!activeDisciplineId && firstCategory?.disciplines[0]) {
      setActiveDisciplineId(firstCategory.disciplines[0].id);
      setOpenCategory(firstCategory.label);
    }
  }, [categories, activeDisciplineId]);

  const selectedDiscipline =
    disciplines.find((discipline) => discipline.id === activeDisciplineId) ??
    categories[0]?.disciplines[0] ??
    disciplines[0] ??
    null;

  return (
    <section
      ref={railAnalyticsRef}
      data-analytics-id="DisciplineRailSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="discipline-rail-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg"
          alt="Perazzi discipline background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg lg:px-10">
          <div className="space-y-3">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-[0.35em] text-ink">
              Disciplines at a Glance
            </p>
            <h2
              id="discipline-rail-heading"
              className="text-sm sm:text-base font-light italic text-ink-muted"
            >
              Every discipline demands something unique from your platform, whether it's precision, speed, or adaptability.
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
            <div className="space-y-3 rounded-2xl bg-card/0 p-4 sm:rounded-3xl sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Discipline categories
              </p>
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
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-ink focus-ring"
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
                        <div className="border-t border-border/60">
                          <ul className="space-y-1 p-3">
                            {category.disciplines.map((discipline) => {
                              const isActive = discipline.id === activeDisciplineId;
                              return (
                                <li key={discipline.id}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveDisciplineId(discipline.id)}
                                    className={cn(
                                      "group w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors focus-ring",
                                      isActive
                                        ? "bg-ink text-card"
                                        : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
                                    )}
                                    aria-pressed={isActive}
                                  >
                                    <span className="block text-sm font-semibold tracking-wide">
                                      {discipline.name}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] uppercase tracking-[0.25em] text-ink-muted group-hover:text-ink-muted/90">
                                      {discipline.id.replace(/-/g, " ")}
                                    </span>
                                  </button>
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
            </div>

            <div className="min-h-[26rem]">
              {selectedDiscipline ? (
                <DisciplineCard
                  discipline={selectedDiscipline}
                  index={0}
                  total={1}
                  platformName={platformName}
                  isDarkTheme={isDarkTheme}
                  onSelectModel={handleModelSelect}
                  loadingModelId={modelLoadingId}
                />
              ) : (
                <p className="text-sm text-ink-muted">
                  Select a discipline to view its details.
                </p>
              )}
            </div>
          </div>
        </div>

        {modelModalOpen && selectedModel ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur"
            role="dialog"
            aria-modal="true"
            onClick={() => setModelModalOpen(false)}
          >
            <div
              className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950/95 text-white shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 z-10 rounded-full border border-black/30 bg-white/90 px-4 py-1 text-xs uppercase tracking-widest text-black transition hover:border-black hover:bg-white sm:right-5 sm:top-5 sm:text-sm"
                onClick={() => setModelModalOpen(false)}
              >
                Close
              </button>

              <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[3fr,1.6fr]">
                <div className="card-media relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-white">
                  {selectedModel.imageUrl ? (
                    <Image
                      src={selectedModel.imageUrl}
                      alt={selectedModel.imageAlt || selectedModel.name}
                      fill
                      className="object-contain bg-white"
                      sizes="(min-width: 1024px) 70vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-600">No Image Available</div>
                  )}
                  <div className="absolute inset-x-0 bottom-6 flex flex-col gap-2 px-6 text-black">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
                      {selectedModel.grade}
                    </p>
                    <h2 className="text-4xl font-semibold uppercase leading-tight tracking-[0.2em]">
                      {selectedModel.name}
                    </h2>
                    <p className="text-base uppercase tracking-[0.2em] text-black/70">
                      {selectedModel.use}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Platform" value={selectedModel.platform} />
                  <Detail label="Gauge" value={selectedModel.gaugeNames?.join(", ")} />
                  <Detail label="Trigger Type" value={selectedModel.triggerTypes?.join(", ")} />
                  <Detail label="Trigger Springs" value={selectedModel.triggerSprings?.join(", ")} />
                  <Detail label="Rib Type" value={selectedModel.ribTypes?.join(", ")} />
                  <Detail label="Rib Style" value={selectedModel.ribStyles?.join(", ")} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {modelError ? (
          <p className="text-center text-sm text-red-500" role="status">
            {modelError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

type DisciplineCardProps = {
  discipline: ShotgunsLandingData["disciplines"][number];
  index: number;
  total: number;
  platformName: (id: string) => string;
  isDarkTheme: boolean;
  onSelectModel: (id: string) => void;
  loadingModelId: string | null;
};

function DisciplineCard({
  discipline,
  index,
  total,
  platformName,
  isDarkTheme,
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
      className="flex flex-col rounded-2xl border border-border/60 bg-card/75 text-left shadow-sm focus-ring sm:rounded-3xl sm:border-border/70"
      aria-label={`Slide ${index + 1} of ${total}: ${discipline.name}`}
    >
      <div className="card-media relative aspect-[30/11] w-full rounded-t-3xl bg-[color:var(--color-canvas)]">
        {discipline.hero ? (
          <Image
            src={discipline.hero.url}
            alt={discipline.hero.alt}
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-black/50" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end p-6 text-white">
          <p className="text-sm sm:text-base font-semibold uppercase tracking-[0.35em] text-white">
            {discipline.name}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div
          className="prose prose-sm italic max-w-none text-ink-muted"
          dangerouslySetInnerHTML={{ __html: discipline.overviewHtml }}
        />
        {discipline.recommendedPlatforms?.length ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
              Recommended platforms
            </h3>
            <ul className="flex flex-wrap gap-2">
              {discipline.recommendedPlatforms.map((platformId) => (
                <li
                  key={platformId}
                  className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink-muted"
                >
                  {platformName(platformId)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {discipline.popularModels?.length ? (
          <div className="mt-auto flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
              Most Popular Models
            </h3>
            <div className="flex flex-col gap-3">
              {discipline.popularModels.map((model) => (
                <figure
                  key={model.idLegacy ?? model.id}
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectModel(model.idLegacy ?? model.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectModel(model.idLegacy ?? model.id);
                    }
                  }}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card/75 focus:outline-none focus:ring-2 focus:ring-perazzi-red"
                >
                  {model.hero ? (
                    <Image
                      src={model.hero.url}
                      alt={model.hero.alt}
                      width={800}
                      height={600}
                      className="w-full object-contain"
                      sizes="(min-width: 1024px) 320px, 100vw"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-perazzi-black/75 transition duration-500 group-hover:bg-perazzi-black/60" />
                  <figcaption
                    className={cn(
                      "absolute inset-0 flex items-center justify-center p-2 text-center text-md font-bold uppercase tracking-[0.3em] transition-opacity duration-500 group-hover:opacity-0",
                      isDarkTheme ? "text-white" : "text-white",
                    )}
                  >
                    {loadingModelId === model.id ? "Loading…" : model.name || "Untitled"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-perazzi-red">{label}</p>
      <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-white">
        {value || "—"}
      </p>
    </div>
  );
}
