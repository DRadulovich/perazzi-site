"use client";

import Image from "next/image";
import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import {
  choreoDistance,
  choreoDurations,
  choreoStagger,
  dreamyPace,
} from "@/lib/choreo";
import { cn } from "@/lib/utils";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { ChoreoGroup, Heading, RevealItem, Text } from "@/components/ui";

import type { DisciplineCard, DisciplineCategory } from "./DisciplineRailData";

type DisciplineRailBodyProps = {
  readonly revealRail: boolean;
  readonly categories: DisciplineCategory[];
  readonly openCategory: string | null;
  readonly setOpenCategory: Dispatch<SetStateAction<string | null>>;
  readonly activeDisciplineId: string | null;
  readonly setActiveDisciplineId: Dispatch<SetStateAction<string | null>>;
  readonly selectedDiscipline: DisciplineCard | null;
  readonly platformName: (id: string) => string;
  readonly handleModelSelect: (id: string) => void;
  readonly modelLoadingId: string | null;
};

export function DisciplineRailBody({
  revealRail,
  categories,
  openCategory,
  setOpenCategory,
  activeDisciplineId,
  setActiveDisciplineId,
  selectedDiscipline,
  platformName,
  handleModelSelect,
  modelLoadingId,
}: DisciplineRailBodyProps) {
  if (!revealRail) return null;

  return (
    <div id="discipline-rail-body" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
        <RevealItem index={0}>
          <div className="space-y-3 rounded-2xl bg-card/0 p-4 sm:rounded-3xl sm:p-5">
            <Text size="label-tight" className="type-label-tight text-ink-muted">
              Discipline categories
            </Text>
            <ChoreoGroup
              effect="slide"
              axis="y"
              direction="down"
              distance={choreoDistance.base}
              durationMs={choreoDurations.base}
              staggerMs={choreoStagger.base}
              className="space-y-3"
              itemAsChild
            >
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
                          "text-lg transition-transform duration-200",
                          isOpen ? "rotate-45" : "rotate-0",
                        )}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    <div className="border-t border-border/70">
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-300 ease-out",
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                        aria-hidden={!isOpen}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={cn(
                              "p-3",
                              isOpen ? "pointer-events-auto" : "pointer-events-none",
                            )}
                          >
                            <ChoreoGroup
                              effect="fade-lift"
                              distance={choreoDistance.tight}
                              durationMs={choreoDurations.base}
                              staggerMs={choreoStagger.tight}
                              className="space-y-1"
                              itemAsChild
                            >
                              {category.disciplines.map((discipline) => {
                                const isActive = discipline.id === activeDisciplineId;
                                return (
                                  <div key={discipline.id}>
                                    <button
                                      type="button"
                                      tabIndex={isOpen ? 0 : -1}
                                      onClick={() => { setActiveDisciplineId(discipline.id); }}
                                      className={cn(
                                        "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left focus-ring",
                                        isActive
                                          ? "text-white"
                                          : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
                                      )}
                                      aria-pressed={isActive}
                                    >
                                      {isActive ? (
                                        <span
                                          className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                          aria-hidden="true"
                                        />
                                      ) : null}
                                      <span
                                        className={cn(
                                          "relative z-10 mt-0.5 block type-label-tight group-hover:text-ink-muted/90",
                                          isActive ? "text-white" : "text-ink-muted",
                                        )}
                                      >
                                        {discipline.name || discipline.id.replaceAll("-", " ")}
                                      </span>
                                    </button>
                                  </div>
                                );
                              })}
                            </ChoreoGroup>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ChoreoGroup>
          </div>
        </RevealItem>

        <RevealItem index={1}>
          <div className="min-h-104">
            {selectedDiscipline ? (
              <div>
                <DisciplineCard
                  discipline={selectedDiscipline}
                  index={0}
                  total={1}
                  platformName={platformName}
                  onSelectModel={handleModelSelect}
                  loadingModelId={modelLoadingId}
                />
              </div>
            ) : (
              <Text className="text-ink-muted" leading="normal">
                Select a discipline to view its details.
              </Text>
            )}
          </div>
        </RevealItem>
      </div>
    </div>
  );
}

type DisciplineCardProps = Readonly<{
  discipline: DisciplineCard;
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
  const [loadedHeroes, setLoadedHeroes] = useState<Record<string, boolean>>({});
  const [loadedModels, setLoadedModels] = useState<Record<string, boolean>>({});
  const heroLoaded = loadedHeroes[discipline.id] ?? false;
  let overviewContent: ReactNode = null;

  if (discipline.overviewPortableText?.length) {
    overviewContent = (
      <PortableText
        className="max-w-none type-body text-ink-muted mb-7"
        blocks={discipline.overviewPortableText}
      />
    );
  } else if (discipline.overviewHtml) {
    overviewContent = (
      <SafeHtml
        className="max-w-none type-body text-ink-muted mb-7"
        html={discipline.overviewHtml}
      />
    );
  }

  return (
    <article
      ref={cardRef}
      data-analytics-id={`DisciplineChip:${discipline.id}`}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card/60 text-left shadow-soft backdrop-blur-sm focus-ring sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
      aria-label={`Slide ${index + 1} of ${total}: ${discipline.name}`}
    >
      <ChoreoGroup
        effect="scale-parallax"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        scaleFrom={1.02}
        itemAsChild
      >
        <div className="card-media relative aspect-30/11 w-full overflow-hidden rounded-t-3xl bg-(--color-canvas)">
          <div
            className={cn(
              "absolute inset-0 bg-linear-to-br from-perazzi-black/20 via-transparent to-perazzi-red/20 transition-opacity duration-700 ease-out",
              heroLoaded ? "opacity-0" : "opacity-100",
            )}
            aria-hidden
          />
          {discipline.hero ? (
            <Image
              src={discipline.hero.url}
              alt={discipline.hero.alt}
              fill
              className={cn(
                "object-cover object-center transition-opacity duration-700 ease-out",
                heroLoaded ? "opacity-100" : "opacity-0",
              )}
              sizes="(min-width: 1024px) 33vw, 100vw"
              priority
              loading="eager"
              onLoad={() => {
                setLoadedHeroes((prev) => (
                  prev[discipline.id] ? prev : { ...prev, [discipline.id]: true }
                ));
              }}
            />
          ) : null}
        </div>
      </ChoreoGroup>
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.tight}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="flex flex-1 flex-col gap-6 p-6"
        itemAsChild
      >
        <Heading
          level={3}
          className="type-card-title text-ink border-b border-perazzi-red/40 pb-2"
        >
          {discipline.name}
        </Heading>
        {overviewContent}
        {discipline.recommendedPlatforms?.length ? (
          <div className="space-y-2 mb-7">
            <Text size="label-tight" className="type-card-title text-ink-muted">
              Recommended platforms
            </Text>
            <ChoreoGroup
              effect="fade-lift"
              distance={choreoDistance.tight}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              staggerMs={dreamyPace.staggerMs}
              className="flex flex-wrap gap-2"
              itemAsChild
            >
              {discipline.recommendedPlatforms.map((platformId) => (
                <div
                  key={platformId}
                  className="pill border border-border type-label-tight text-ink-muted"
                >
                  {platformName(platformId)}
                </div>
              ))}
            </ChoreoGroup>
          </div>
        ) : null}
        {discipline.popularModels?.length ? (
          <div className="mt-auto flex flex-col gap-3">
            <Text size="label-tight" className="type-card-title text-ink-muted">
              Most Popular Models
            </Text>
            <ChoreoGroup
              effect="scale-parallax"
              distance={choreoDistance.tight}
              scaleFrom={0.98}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              staggerMs={dreamyPace.staggerMs}
              className="flex flex-col gap-3"
              itemAsChild
            >
              {discipline.popularModels.map((model) => {
                const modelId = model.idLegacy ?? model.id;
                const modelLoaded = loadedModels[modelId];
                const modelAspectRatio = model.hero?.aspectRatio ?? 4 / 3;

                return (
                  <button
                    type="button"
                    key={modelId}
                    onClick={() => { onSelectModel(modelId); }}
                    className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm hover:border-ink/20 hover:bg-card/85 focus-ring"
                  >
                    <div
                      className="relative w-full bg-(--color-canvas)"
                      style={{ aspectRatio: modelAspectRatio }}
                    >
                      <div
                        className={cn(
                          "absolute inset-0 bg-linear-to-br from-perazzi-black/20 via-transparent to-perazzi-red/20 transition-opacity duration-700 ease-out",
                          modelLoaded ? "opacity-0" : "opacity-100",
                        )}
                        aria-hidden
                      />
                      {model.hero ? (
                        <Image
                          src={model.hero.url}
                          alt={model.hero.alt}
                          fill
                          className={cn(
                            "object-contain transition-opacity duration-700 ease-out",
                            modelLoaded ? "opacity-100" : "opacity-0",
                          )}
                          sizes="(min-width: 1024px) 320px, 100vw"
                          loading="eager"
                          onLoad={() => {
                            setLoadedModels((prev) => (
                              prev[modelId] ? prev : { ...prev, [modelId]: true }
                            ));
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-perazzi-black/75" />
                    <span
                      className={cn(
                        "absolute inset-0 flex items-center justify-center p-2 text-center type-card-title text-white text-xl sm:text-2xl lg:text-3xl group-hover:opacity-0",
                      )}
                    >
                      {loadingModelId === modelId ? "Loading…" : model.name || "Untitled"}
                    </span>
                  </button>
                );
              })}
            </ChoreoGroup>
          </div>
        ) : null}
      </ChoreoGroup>
    </article>
  );
}
