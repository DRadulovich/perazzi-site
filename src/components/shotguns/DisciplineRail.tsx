 "use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useTheme } from "@/components/theme/ThemeProvider";

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
  const listRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelLoadingId, setModelLoadingId] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const platformName = (platformId: string) =>
    platforms.find((platform) => platform.id === platformId)?.name ??
    platformId.replace("platform-", "").toUpperCase();

  const scrollBy = (direction: "prev" | "next") => {
    const node = listRef.current;
    if (!node) return;
    const amount = direction === "next" ? node.clientWidth : -node.clientWidth;
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

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

  const displayedDisciplines = useMemo(() => {
    const tab = DISCIPLINE_TABS[activeTabIndex];
    if (!tab) return disciplines;

    const ordered = tab.items
      .map((aliases) => {
        for (const alias of aliases) {
          const match = disciplineLookup.get(alias);
          if (match) return match;
        }
        return undefined;
      })
      .filter((item): item is DisciplineCard => Boolean(item));

    return ordered.length ? ordered : disciplines;
  }, [activeTabIndex, disciplineLookup, disciplines]);

  const tabPanelId = "discipline-tabpanel";

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
            onClick={() =>
              setActiveTabIndex((index) =>
                index === 0 ? DISCIPLINE_TABS.length - 1 : index - 1,
              )
            }
            aria-label={ariaPrevLabel}
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() =>
              setActiveTabIndex((index) =>
                (index + 1) % DISCIPLINE_TABS.length,
              )
            }
            aria-label={ariaNextLabel}
          >
            Next
          </button>
        </div>
      </div>
      <div
        role="tablist"
        aria-label="Discipline categories"
        className="flex flex-wrap gap-2"
      >
        {DISCIPLINE_TABS.map((tab, index) => {
          const isActive = index === activeTabIndex;
          const tabId = `discipline-tab-${index}`;
          return (
            <button
              key={tab.label}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={tabPanelId}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition ${
                isActive
                  ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                  : "border-border/70 bg-card/60 text-ink hover:border-ink/60"
              }`}
              onClick={() => setActiveTabIndex(index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        ref={listRef}
        role="tabpanel"
        id={tabPanelId}
        aria-live="polite"
        aria-labelledby={`discipline-rail-heading discipline-tab-${activeTabIndex}`}
        className="grid gap-6 pb-4 md:grid-cols-2 lg:grid-cols-3"
        tabIndex={0}
      >
        {displayedDisciplines.map((discipline, index) => (
          <DisciplineCard
            key={discipline.id}
            discipline={discipline}
            index={index}
            total={displayedDisciplines.length}
            platformName={platformName}
            isDarkTheme={isDarkTheme}
            onSelectModel={handleModelSelect}
            loadingModelId={modelLoadingId}
          />
        ))}
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
                  <h2 className="text-4xl font-semibold leading-tight">{selectedModel.name}</h2>
                  <p className="text-base text-black/70">{selectedModel.use}</p>
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

  const heroOverlayClass = isDarkTheme
    ? "pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent"
    : "pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent";
  const heroTextClass = isDarkTheme ? "text-black" : "text-white";
  const modelOverlayBase = isDarkTheme ? "bg-white/90" : "bg-black/95";
  const modelOverlayHover = isDarkTheme ? "group-hover:bg-white/70" : "group-hover:bg-black/75";
  const modelTextClass = isDarkTheme ? "text-black" : "text-white";

  return (
    <article
      ref={cardRef}
      data-analytics-id={`DisciplineChip:${discipline.id}`}
      className="flex flex-col rounded-3xl border border-border/70 bg-card text-left shadow-lg focus-ring"
      aria-label={`Slide ${index + 1} of ${total}: ${discipline.name}`}
    >
      <div className="card-media relative aspect-[30/11] w-full rounded-t-3xl bg-neutral-900">
        {discipline.hero ? (
          <Image
            src={discipline.hero.url}
            alt={discipline.hero.alt}
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : null}
        <div className={heroOverlayClass} />
        <div className={`absolute inset-x-0 bottom-0 flex flex-col items-center justify-end p-6 ${heroTextClass}`}>
          <p className="text-base font-semibold uppercase tracking-[0.35em]">
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
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink"
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
                  key={model.id}
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectModel(model.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectModel(model.id);
                    }
                  }}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-perazzi-red"
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
                  <div
                    className={`pointer-events-none absolute inset-0 transition-[background-color] duration-700 ${modelOverlayBase} ${modelOverlayHover}`}
                  />
                  <figcaption
                    className={`absolute inset-0 flex items-center justify-center p-2 text-center text-xs font-semibold uppercase tracking-[0.3em] transition-opacity duration-700 group-hover:opacity-0 ${modelTextClass}`}
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
      <p className="text-base text-white">{value || "—"}</p>
    </div>
  );
}
