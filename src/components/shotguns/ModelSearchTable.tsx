"use client";

import clsx from "clsx";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { Button, Heading, Input, Text } from "@/components/ui";
import { getSanityImageUrl } from "@/lib/sanityImage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type SpecList = readonly string[] | undefined;

export type ModelSearchRow = {
  _id: string;
  name: string;
  version?: string;
  platform?: string;
  use?: string | null;
  grade?: string;
  gaugeNames?: string[];
  triggerTypes?: string[];
  triggerSprings?: string[];
  ribTypes?: string[];
  ribStyles?: string[];
  ribNotch?: number | null;
  ribHeight?: number | null;
  image?: SanityImageSource | null;
  imageFallbackUrl?: string | null;
  imageAlt?: string;
};

type ModelShowcaseProps = {
  readonly models: readonly ModelSearchRow[];
};

type FilterOption = Readonly<{ value: string; count: number }>;
type FilterGroupProps = Readonly<{
  label: string;
  options: ReadonlyArray<FilterOption>;
  values: readonly string[];
  onToggle: (value: string) => void;
}>;
type FilterChipProps = Readonly<{ label: string; active: boolean; onClick: () => void }>;
type SpecProps = Readonly<{ label: string; value?: string }>;

const PAGE_SIZE = 9;
const FILTER_PANEL_CLASS =
  "space-y-4 rounded-3xl border border-white/15 bg-[linear-gradient(135deg,var(--perazzi-black),color-mix(in srgb,var(--perazzi-black) 85%, black))]/95 px-4 py-5 shadow-elevated sm:px-6 sm:py-6";
const CARD_SHELL_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-perazzi-black/80 text-left shadow-medium ring-1 ring-white/10 backdrop-blur-sm transition hover:-translate-y-1 hover:border-perazzi-red/70 focus-within:outline focus-within:outline-2 focus-within:outline-perazzi-red sm:rounded-3xl";
const SPEC_PANEL_CLASS =
  "grid gap-4 border-t border-white/10 bg-black/40 px-4 py-4 text-neutral-200 sm:grid-cols-2 sm:px-6 sm:py-5";
const DETAIL_PANEL_CLASS =
  "flex-1 space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4 sm:rounded-3xl sm:p-5";

function resolveFilterValues(value: string, current: string[]) {
  if (value === "__reset__") return [];
  if (current.includes(value)) return current.filter((entry) => entry !== value);
  return [...current, value];
}

export function ModelSearchTable({ models }: ModelShowcaseProps) {
  const [query, setQuery] = useState("");
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);
  const [gaugeFilters, setGaugeFilters] = useState<string[]>([]);
  const [useFilters, setUseFilters] = useState<string[]>([]);
  const [triggerTypeFilters, setTriggerTypeFilters] = useState<string[]>([]);
  const [ribTypeFilters, setRibTypeFilters] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelSearchRow | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isPending, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const detailButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lastFocusedId, setLastFocusedId] = useState<string | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const analyticsRef = useAnalyticsObserver<HTMLElement>("ModelSearchTableSeen");
  const resetVisibleCount = useCallback(() => { setVisibleCount(PAGE_SIZE); }, []);
  const closeModal = useCallback(() => {
    setSelectedModel(null);
    setHeroLoaded(false);
  }, []);

  useEffect(() => {
    if (selectedModel || !lastFocusedId) return;
    const targetButton = detailButtonRefs.current[lastFocusedId];
    targetButton?.focus();
  }, [selectedModel, lastFocusedId]);

  const searchFiltered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return models;
    return models.filter((model) => {
      const haystack = [
        model.name,
        model.version,
        model.platform,
        model.use,
        model.grade,
        (model.gaugeNames || []).join(" "),
        (model.triggerTypes || []).join(" "),
        (model.triggerSprings || []).join(" "),
        (model.ribTypes || []).join(" "),
        (model.ribStyles || []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [models, query]);

  const optionCounts = useMemo(() => {
    const platform: Record<string, number> = {};
    const gauge: Record<string, number> = {};
    const useCount: Record<string, number> = {};
    const triggerTypeCount: Record<string, number> = {};
    const ribTypeCount: Record<string, number> = {};

    for (const model of searchFiltered) {
      if (model.platform) platform[model.platform] = (platform[model.platform] || 0) + 1;
      (model.gaugeNames || []).forEach((g) => {
        gauge[g] = (gauge[g] || 0) + 1;
      });
      if (model.use) useCount[model.use] = (useCount[model.use] || 0) + 1;
      (model.triggerTypes || []).forEach((t) => {
        if (t) triggerTypeCount[t] = (triggerTypeCount[t] || 0) + 1;
      });
      (model.ribTypes || []).forEach((r) => {
        if (r) ribTypeCount[r] = (ribTypeCount[r] || 0) + 1;
      });
    }
    return { platform, gauge, use: useCount, triggerType: triggerTypeCount, ribType: ribTypeCount };
  }, [searchFiltered]);

  const platformOptions = useMemo(
    () => Object.entries(optionCounts.platform).map(([value, count]) => ({ value, count })),
    [optionCounts.platform],
  );
  const gaugeOptions = useMemo(
    () => Object.entries(optionCounts.gauge).map(([value, count]) => ({ value, count })),
    [optionCounts.gauge],
  );
  const useOptions = useMemo(
    () => Object.entries(optionCounts.use).map(([value, count]) => ({ value, count })),
    [optionCounts.use],
  );
  const triggerTypeOptions = useMemo(
    () => Object.entries(optionCounts.triggerType).map(([value, count]) => ({ value, count })),
    [optionCounts.triggerType],
  );
  const ribTypeOptions = useMemo(
    () => Object.entries(optionCounts.ribType).map(([value, count]) => ({ value, count })),
    [optionCounts.ribType],
  );

  const filteredModels = useMemo(() => {
    return searchFiltered.filter((model) => {
      const matchesPlatform =
        !platformFilters.length || (model.platform && platformFilters.includes(model.platform));
      const matchesUse = !useFilters.length || (model.use && useFilters.includes(model.use));
      const matchesGauge =
        !gaugeFilters.length ||
        (model.gaugeNames || []).some((gauge) => gaugeFilters.includes(gauge));
      const matchesTrigger =
        !triggerTypeFilters.length ||
        (model.triggerTypes || []).some((t) => triggerTypeFilters.includes(t));
      const matchesRib =
        !ribTypeFilters.length || (model.ribTypes || []).some((r) => ribTypeFilters.includes(r));

      return matchesPlatform && matchesUse && matchesGauge && matchesTrigger && matchesRib;
    });
  }, [searchFiltered, platformFilters, useFilters, gaugeFilters, triggerTypeFilters, ribTypeFilters]);

  const incrementVisibleCount = useCallback(() => {
    setVisibleCount((prev) => {
      if (prev >= filteredModels.length) return prev;
      return prev + PAGE_SIZE;
    });
  }, [filteredModels.length]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return undefined;

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          incrementVisibleCount();
          break;
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.25 });

    observer.observe(node);
    return () => { observer.disconnect(); };
  }, [incrementVisibleCount]);

  const handleQueryChange = (value: string) => {
    startTransition(() => {
      setQuery(value);
      resetVisibleCount();
    });
  };

  const toggleFilter = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    startTransition(() => {
      setter((current) => resolveFilterValues(value, current));
      resetVisibleCount();
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setPlatformFilters([]);
      setGaugeFilters([]);
      setUseFilters([]);
      setTriggerTypeFilters([]);
      setRibTypeFilters([]);
      resetVisibleCount();
    });
  };

  const handleCardMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const moveX = ((offsetX / rect.width) - 0.5) * 20;
    const moveY = ((offsetY / rect.height) - 0.5) * 12;
    target.style.setProperty("--parallax-x", `${moveX}px`);
    target.style.setProperty("--parallax-y", `${moveY}px`);
  }, []);

  const handleCardMouseLeave = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.currentTarget as HTMLElement;
    target.style.setProperty("--parallax-x", "0px");
    target.style.setProperty("--parallax-y", "0px");
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      platformFilters.length > 0 ||
      gaugeFilters.length > 0 ||
      useFilters.length > 0 ||
      triggerTypeFilters.length > 0 ||
      ribTypeFilters.length > 0,
    [
      gaugeFilters.length,
      platformFilters.length,
      ribTypeFilters.length,
      triggerTypeFilters.length,
      useFilters.length,
    ],
  );

  const displayModels = filteredModels.slice(0, visibleCount);
  const showSkeletons = isPending && models.length > 0;
  const skeletonPlaceholders = useMemo(
    () =>
      Array.from(
        { length: Math.max(3, Math.min(PAGE_SIZE, models.length || PAGE_SIZE)) },
        (_, idx) => `skeleton-${models.length}-${idx}`,
      ),
    [models.length],
  );
  const hasMore = visibleCount < filteredModels.length;
  const renderItems: Array<ModelSearchRow | string> = showSkeletons
    ? skeletonPlaceholders
    : displayModels;
  const modalImageUrl = selectedModel
    ? getSanityImageUrl(selectedModel.image, { width: 3200, quality: 95 }) ||
      selectedModel.imageFallbackUrl ||
      null
    : null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ModelSearchTableSeen"
      className="mt-10 space-y-8"
    >
      <div className={FILTER_PANEL_CLASS}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex w-full items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 type-body-sm text-neutral-300 focus-within:border-white">
            <span className="text-neutral-500">Search</span>
            <Input
              type="search"
              placeholder="Search models, gauges, triggers..."
              value={query}
              onChange={(event) => { handleQueryChange(event.target.value); }}
              className="w-full border-0 bg-transparent px-0 py-0 type-body-sm text-white placeholder:text-neutral-600 shadow-none focus:border-0"
            />
          </label>
          <Text
            asChild
            size="caption"
            className="text-neutral-400"
            leading="normal"
          >
            <p aria-live="polite" aria-atomic="true">
              Showing <span className="text-white">{filteredModels.length}</span>{" "}
              of <span className="text-white">{models.length}</span>
            </p>
          </Text>
        </div>

        <div className="flex flex-wrap gap-4">
          <FilterGroup
            label="Platform"
            options={platformOptions}
            values={platformFilters}
            onToggle={(value) => { toggleFilter(value, setPlatformFilters); }}
          />
          <FilterGroup
            label="Gauge"
            options={gaugeOptions}
            values={gaugeFilters}
            onToggle={(value) => { toggleFilter(value, setGaugeFilters); }}
          />
          <FilterGroup
            label="Use"
            options={useOptions}
            values={useFilters}
            onToggle={(value) => { toggleFilter(value, setUseFilters); }}
          />
          <FilterGroup
            label="Trigger"
            options={triggerTypeOptions}
            values={triggerTypeFilters}
            onToggle={(value) => { toggleFilter(value, setTriggerTypeFilters); }}
          />
          <FilterGroup
            label="Rib"
            options={ribTypeOptions}
            values={ribTypeFilters}
            onToggle={(value) => { toggleFilter(value, setRibTypeFilters); }}
          />
          {hasActiveFilters && (
            <Button
              type="button"
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="rounded-full border border-white/30 text-white/80 hover:border-white hover:text-white hover:bg-white/5"
            >
              Reset filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {renderItems.map((item) => {
          if (typeof item === "string") {
            return <CardSkeleton key={item} />;
          }
          const model = item;
          const cardImageUrl =
            getSanityImageUrl(model.image, { width: 2400, quality: 90 }) ||
            model.imageFallbackUrl ||
            null;
          return (
            <article
              key={model._id}
              className={CARD_SHELL_CLASS}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="card-media relative aspect-16/10 w-full bg-perazzi-white">
                {cardImageUrl ? (
                  <Image
                    src={cardImageUrl}
                    alt={model.imageAlt || model.name}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-contain bg-perazzi-white transition-transform duration-500 parallax-image"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-card text-ink-muted">
                    No Image Available
                  </div>
                )}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-ink">
                  <Text size="label-tight" className="text-perazzi-red">
                    {model.use}
                  </Text>
                 {/*
                    Keep highlight behavior consistent while showing only the model name on the card.
                  */}
                  <Heading level={3} size="lg" className="text-ink">
                    {highlightText(model.name, query)}
                  </Heading>
                  <Text size="sm" className="text-ink-muted">
                    {highlightText((model.gaugeNames || []).join(", ") || "", query)}
                  </Text>
                </div>
              </div>

              <div className={SPEC_PANEL_CLASS}>
                <Spec label="Trigger" value={(model.triggerTypes || []).join(", ") || undefined} />
                <Spec label="Springs" value={(model.triggerSprings || []).join(", ") || undefined} />
                <Spec label="Rib" value={(model.ribTypes || []).join(", ") || undefined} />
                <Spec label="Rib Style" value={(model.ribStyles || []).join(", ") || undefined} />
                <Spec
                  label="Rib Notch"
                  value={
                    model.ribNotch !== null && model.ribNotch !== undefined
                      ? String(model.ribNotch)
                      : undefined
                  }
                />
                <Spec
                  label="Rib Height"
                  value={
                    model.ribHeight !== null && model.ribHeight !== undefined
                      ? `${model.ribHeight} mm`
                      : undefined
                  }
                />
              </div>
              <div className="border-t border-white/5 bg-black/50 px-6 py-4 text-right">
                <Button
                  ref={(node) => {
                    detailButtonRefs.current[model._id] = node;
                  }}
                  onClick={() => {
                    setHeroLoaded(false);
                    setSelectedModel(model);
                    setLastFocusedId(model._id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-white/30 px-5 text-white hover:border-white hover:text-white hover:bg-white/5"
                >
                  View details
                </Button>
              </div>
            </article>
          );
        })}
        {!showSkeletons && filteredModels.length === 0 && (
          <Text
            asChild
            className="col-span-full rounded-3xl border border-dashed border-white/20 py-16 text-center text-neutral-500"
            leading="normal"
          >
            <p>No models match your current filters.</p>
          </Text>
        )}
      </div>
      {hasMore && !showSkeletons && (
        <div ref={loadMoreRef} className="h-10 w-full" aria-hidden="true" />
      )}

      <Dialog.Root
        open={Boolean(selectedModel)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeModal();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
          <Dialog.Content className="fixed inset-0 z-60 flex max-h-screen w-full items-center justify-center p-3 outline-none sm:p-4 md:p-6 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2 data-[state=open]:opacity-100 data-[state=open]:translate-y-0 transition duration-200">
            {selectedModel ? (
              <div className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/12 bg-perazzi-black/90 text-white shadow-elevated ring-1 ring-white/15 backdrop-blur-xl">
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 px-4 text-white shadow-soft backdrop-blur-sm hover:border-white/30 hover:bg-black/55 sm:right-5 sm:top-5"
                  >
                    Close
                  </Button>
                </Dialog.Close>

                <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[3fr,2fr]">
                  <div className="relative aspect-16/10 w-full overflow-hidden rounded-3xl bg-white">
                    {modalImageUrl ? (
                      <Image
                        src={modalImageUrl}
                        alt={selectedModel.imageAlt || selectedModel.name}
                        fill
                        sizes="(min-width: 1024px) 80vw, 100vw"
                        className={clsx(
                          "object-contain bg-white transition-opacity duration-700",
                          heroLoaded ? "opacity-100" : "opacity-0",
                        )}
                        priority
                        onLoadingComplete={() => { setHeroLoaded(true); }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-600">
                        No Image Available
                      </div>
                    )}
                    <div className="absolute bottom-6 left-6 right-6 text-black">
                      <Text size="label-tight" className="text-perazzi-red">
                        {selectedModel.use}
                      </Text>
                      <Heading level={2} size="xl" className="text-black">
                        {selectedModel.name}
                      </Heading>
                      <Text size="sm" className="text-neutral-300">
                        {selectedModel.version}
                      </Text>
                    </div>
                  </div>

                  <div className={`${DETAIL_PANEL_CLASS} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
                    {[
                      { label: "Platform", value: selectedModel.platform },
                      { label: "Use", value: selectedModel.use || undefined },
                      { label: "Gauge", value: renderList(selectedModel.gaugeNames) },
                      { label: "Trigger Type", value: renderList(selectedModel.triggerTypes) },
                      { label: "Trigger Springs", value: renderList(selectedModel.triggerSprings) },
                      { label: "Rib Type", value: renderList(selectedModel.ribTypes) },
                      { label: "Rib Style", value: renderList(selectedModel.ribStyles) },
                      {
                        label: "Rib Notch",
                        value:
                          selectedModel.ribNotch !== null && selectedModel.ribNotch !== undefined
                            ? String(selectedModel.ribNotch)
                            : undefined,
                      },
                      {
                        label: "Rib Height",
                        value:
                          selectedModel.ribHeight !== null && selectedModel.ribHeight !== undefined
                            ? `${selectedModel.ribHeight} mm`
                            : undefined,
                      },
                      { label: "Grade", value: selectedModel.grade || undefined },
                    ]
                      .filter((entry) => Boolean(entry.value))
                      .map((entry) => (
                        <DetailGrid key={entry.label} label={entry.label} value={entry.value} />
                      ))}
                  </div>
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/5 bg-perazzi-black/60 sm:rounded-3xl">
      <div className="aspect-16/10 w-full bg-white" />
      <div className="space-y-3 border-t border-white/5 bg-black/30 p-4 sm:p-6">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-6 w-2/3 rounded bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          {["trigger", "springs", "rib", "rib-style", "notch", "height"].map((placeholder) => (
            <div key={placeholder} className="h-4 rounded bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  values,
  onToggle,
}: FilterGroupProps) {
  if (!options.length) return null;
  const handleAll = () => {
    onToggle("__reset__");
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Text asChild size="label-tight" className="text-neutral-500" leading="normal">
        <span>{label}</span>
      </Text>
      <div className="flex flex-wrap gap-2">
        <FilterChip active={!values.length} label="All" onClick={handleAll} />
        {options.map((option) => (
          <FilterChip
            key={option.value}
            active={values.includes(option.value)}
            label={option.value}
            onClick={() => { onToggle(option.value); }}
          />
        ))}
      </div>
    </div>
  );
}

function humanizeValue(value?: string | null) {
  if (!value) return undefined;
  const mmMatch = /^(\d+(?:\.\d+)?)\s*mm$/i.exec(value);
  if (mmMatch) {
    return `${mmMatch[1]}mm`;
  }
  const cleaned = value.replaceAll(/[_-]+/g, " ").trim();
  return cleaned
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ")
    .trim();
}

function FilterChip({
  label,
  active,
  onClick,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "type-label-tight pill transition",
        active
          ? "bg-white text-black"
          : "border border-white/20 bg-transparent text-white/70 hover:border-white/60",
      )}
    >
      {label}
    </button>
  );
}

function Spec({ label, value }: SpecProps) {
  const display = humanizeValue(value) ?? value;
  return (
    <div>
      <Text size="label-tight" className="text-perazzi-red">
        {label}
      </Text>
      <Text size="sm" className="text-white">
        {display || "—"}
      </Text>
    </div>
  );
}

function DetailGrid({ label, value }: SpecProps) {
  const display = humanizeValue(value) ?? value;
  return (
    <div>
      <Text size="label-tight" className="text-perazzi-red">
        {label}
      </Text>
      <Text size="sm" className="text-white">
        {display || "—"}
      </Text>
    </div>
  );
}

function renderList(list: SpecList) {
  if (!list?.length) return undefined;
  const mapped = list.flatMap((entry) => {
    const display = humanizeValue(entry) ?? entry;
    return display ? [display] : [];
  });
  if (!mapped.length) return undefined;
  return mapped.join(", ");
}

function highlightText(text: string, needle: string): ReactNode {
  const trimmed = needle.trim();
  if (!trimmed) return text;
  const lowerText = text.toLowerCase();
  const lowerNeedle = trimmed.toLowerCase();
  const nodes: ReactNode[] = [];
  let start = 0;
  let matchIndex = lowerText.indexOf(lowerNeedle, start);
  let keyIndex = 0;

  while (matchIndex !== -1) {
    if (matchIndex > start) {
      nodes.push(<span key={`text-${keyIndex}`}>{text.slice(start, matchIndex)}</span>);
      keyIndex += 1;
    }
    const end = matchIndex + trimmed.length;
    nodes.push(
      <mark key={`mark-${keyIndex}`} className="bg-transparent text-perazzi-red">
        {text.slice(matchIndex, end)}
      </mark>,
    );
    keyIndex += 1;
    start = end;
    matchIndex = lowerText.indexOf(lowerNeedle, start);
  }

  if (start < text.length) {
    nodes.push(<span key={`text-${keyIndex}`}>{text.slice(start)}</span>);
  }

  return nodes;
}
