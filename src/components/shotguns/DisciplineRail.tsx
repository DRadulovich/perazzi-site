"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import {
  Container,
  Heading,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

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

type DisciplineCategory = {
  label: string;
  disciplines: DisciplineCard[];
};

type DisciplineRailBackground = NonNullable<
  NonNullable<ShotgunsLandingData["disciplineRailUi"]>["background"]
>;

type DisciplineRailRevealSectionProps = {
  readonly categories: DisciplineCategory[];
  readonly selectedDiscipline: DisciplineCard | null;
  readonly heading: string;
  readonly subheading: string;
  readonly background: DisciplineRailBackground;
  readonly openCategory: string | null;
  readonly setOpenCategory: Dispatch<SetStateAction<string | null>>;
  readonly activeDisciplineId: string | null;
  readonly setActiveDisciplineId: Dispatch<SetStateAction<string | null>>;
  readonly platformName: (id: string) => string;
  readonly handleModelSelect: (id: string) => void;
  readonly modelLoadingId: string | null;
  readonly enableTitleReveal: boolean;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

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

export function DisciplineRail({
  disciplines,
  platforms,
  ui,
}: DisciplineRailProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const railAnalyticsRef = useAnalyticsObserver<HTMLElement>("DisciplineRailSeen");
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);

  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelLoadingId, setModelLoadingId] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(DISCIPLINE_TABS[0]?.label ?? null);
  const [activeDisciplineId, setActiveDisciplineId] = useState<string | null>(null);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const modelRequestRef = useRef<AbortController | null>(null);
  const railKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setModalRoot(document.body);
  }, []);

  const platformName = (platformId: string) =>
    platforms.find((platform) => platform.id === platformId)?.name ??
    platformId.replace("platform-", "").toUpperCase();

  const handleModelSelect = async (modelId: string) => {
    if (!modelId) return;
    modelRequestRef.current?.abort();
    const controller = new AbortController();
    modelRequestRef.current = controller;
    setModelLoadingId(modelId);
    setModelError(null);
    try {
      const response = await fetch(`/api/models/${modelId}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Unable to load model details.");
      }
      const data = (await response.json()) as ModelDetail;
      if (controller.signal.aborted) return;
      setSelectedModel(data);
      setModelModalOpen(true);
    } catch (error) {
      if (controller.signal.aborted) return;
      setModelError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      if (modelRequestRef.current === controller) {
        setModelLoadingId(null);
        modelRequestRef.current = null;
      }
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
    if (!modelModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modelModalOpen]);

  const disciplineLookup = useMemo(() => {
    const map = new Map<string, DisciplineCard>();
    disciplines.forEach((discipline) => {
      map.set(discipline.id, discipline);
    });
    return map;
  }, [disciplines]);

  const categories = useMemo<DisciplineCategory[]>(() => {
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
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
      aria-labelledby="discipline-rail-heading"
    >
      <DisciplineRailRevealSection
        key={railKey}
        categories={categories}
        selectedDiscipline={selectedDiscipline}
        heading={heading}
        subheading={subheading}
        background={background}
        openCategory={openCategory}
        setOpenCategory={setOpenCategory}
        activeDisciplineId={activeDisciplineId}
        setActiveDisciplineId={setActiveDisciplineId}
        platformName={platformName}
        handleModelSelect={handleModelSelect}
        modelLoadingId={modelLoadingId}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />

      {modalRoot && modelModalOpen && selectedModel
        ? createPortal(
            <div
              className="fixed inset-0 z-80 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
              <button
                type="button"
                className="absolute inset-0 z-0 cursor-default border-0 bg-transparent"
                aria-label="Close modal"
                onClick={() => { setModelModalOpen(false); }}
              />
              <div className="relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/12 bg-perazzi-black/90 text-white shadow-elevated ring-1 ring-white/15 backdrop-blur-xl">
                <button
                  type="button"
                  className="type-button absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-white shadow-soft backdrop-blur-sm hover:border-white/30 hover:bg-black/55 focus-ring sm:right-5 sm:top-5"
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
                        className="object-contain bg-white"
                        sizes="(min-width: 1024px) 70vw, 100vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-600">No Image Available</div>
                    )}
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
              </div>
            </div>,
            modalRoot,
          )
        : null}

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
    </section>
  );
}

const DisciplineRailRevealSection = ({
  categories,
  selectedDiscipline,
  heading,
  subheading,
  background,
  openCategory,
  setOpenCategory,
  activeDisciplineId,
  setActiveDisciplineId,
  platformName,
  handleModelSelect,
  modelLoadingId,
  enableTitleReveal,
  onCollapsedChange,
}: DisciplineRailRevealSectionProps) => {
  const [railExpanded, setRailExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const revealRail = !enableTitleReveal || railExpanded;
  const revealPhotoFocus = revealRail;
  const railMinHeight =
    enableTitleReveal && !revealRail ? "min-h-[50vh]" : null;
  const {
    ref: railShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealRail,
    deps: [openCategory, activeDisciplineId, modelLoadingId],
  });
  const revealRailForMeasure = revealRail || isPreparing;

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setRailExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setRailExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <RevealAnimatedBody sequence>
      <RevealItem index={0}>
        <RevealExpandedHeader
          headingId="discipline-rail-heading"
          heading={heading}
          subheading={subheading}
          headerThemeReady={headerThemeReady}
          enableTitleReveal={enableTitleReveal}
          onCollapse={handleCollapse}
        />
      </RevealItem>
      <RevealGroup delayMs={140}>
        <DisciplineRailBody
          revealRail={revealRailForMeasure}
          categories={categories}
          openCategory={openCategory}
          setOpenCategory={setOpenCategory}
          activeDisciplineId={activeDisciplineId}
          setActiveDisciplineId={setActiveDisciplineId}
          selectedDiscipline={selectedDiscipline}
          platformName={platformName}
          handleModelSelect={handleModelSelect}
          modelLoadingId={modelLoadingId}
        />
      </RevealGroup>
    </RevealAnimatedBody>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealRail}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealRail}
        overlay="canvas"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={railShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={railMinHeight ?? undefined}
        >
          {revealRail ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="discipline-rail-heading"
                heading={heading}
                subheading={subheading}
                controlsId="discipline-rail-body"
                expanded={revealRail}
                onExpand={handleExpand}
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

function DisciplineRailBody({
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
                          "text-lg",
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
                                <button
                                  type="button"
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
      <div className="card-media relative aspect-30/11 w-full rounded-t-3xl bg-(--color-canvas)">
        {discipline.hero ? (
          <Image
            src={discipline.hero.url}
            alt={discipline.hero.alt}
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-6 p-6">
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
                  className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm hover:border-ink/20 hover:bg-card/85 focus-ring"
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
                  <div className="pointer-events-none absolute inset-0 bg-perazzi-black/75" />
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center p-2 text-center type-card-title text-white text-xl sm:text-2xl lg:text-3xl group-hover:opacity-0",
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
