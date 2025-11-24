"use client";

import clsx from "clsx";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { getSanityImageUrl } from "@/lib/sanityImage";

type SpecList = string[] | undefined;

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
  models: ModelSearchRow[];
};

const PAGE_SIZE = 9;
const FILTER_PANEL_CLASS =
  "space-y-4 rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,#070707,#101010)]/95 px-4 py-5 shadow-[0_35px_120px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6";
const CARD_SHELL_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/80 text-left shadow-2xl shadow-black/40 transition hover:-translate-y-1 hover:border-perazzi-red/70 focus-within:outline focus-within:outline-2 focus-within:outline-perazzi-red";
const SPEC_PANEL_CLASS =
  "grid gap-4 border-t border-white/10 bg-black/40 px-6 py-5 text-sm text-neutral-200 sm:grid-cols-2";
const DETAIL_PANEL_CLASS =
  "flex-1 space-y-4 rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5";

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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const closeModal = useCallback(() => {
    setSelectedModel(null);
    setHeroLoaded(false);
  }, []);

  useEffect(() => {
    if (!selectedModel) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedModel, closeModal]);

  useEffect(() => {
    if (!selectedModel) return;
    const modalNode = modalRef.current;
    if (!modalNode) return;
    const focusableSelectors = [
      "a[href]",
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const focusables = Array.from(
      modalNode.querySelectorAll<HTMLElement>(focusableSelectors.join(",")),
    );
    focusables[0]?.focus();

    const handleTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    modalNode.addEventListener("keydown", handleTrap);
    return () => modalNode.removeEventListener("keydown", handleTrap);
  }, [selectedModel]);

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

      if (!matchesPlatform) return false;
      if (!matchesUse) return false;
      if (!matchesGauge) return false;
      if (!matchesTrigger) return false;
      if (!matchesRib) return false;
      return true;
    });
  }, [searchFiltered, platformFilters, useFilters, gaugeFilters, triggerTypeFilters, ribTypeFilters]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => {
              if (prev >= filteredModels.length) return prev;
              return prev + PAGE_SIZE;
            });
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredModels.length]);

  const handleQueryChange = (value: string) => {
    startTransition(() => {
      setQuery(value);
      setVisibleCount(PAGE_SIZE);
    });
  };

  const handleMultiFilterChange = (
    current: string[],
    setter: (value: string[]) => void,
  ) => (value: string) => {
    startTransition(() => {
      if (value === "__reset__") {
        setter([]);
      } else if (current.includes(value)) {
        setter(current.filter((entry) => entry !== value));
      } else {
        setter([...current, value]);
      }
      setVisibleCount(PAGE_SIZE);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setPlatformFilters([]);
      setGaugeFilters([]);
      setUseFilters([]);
      setVisibleCount(PAGE_SIZE);
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

  const displayModels = filteredModels.slice(0, visibleCount);
  const showSkeletons = isPending && models.length > 0;
  const hasMore = visibleCount < filteredModels.length;
  const renderItems: (ModelSearchRow | null)[] = showSkeletons
    ? Array.from(
        { length: Math.max(3, Math.min(PAGE_SIZE, models.length || PAGE_SIZE)) },
        () => null,
      )
    : displayModels;
  const modalImageUrl = selectedModel
    ? getSanityImageUrl(selectedModel.image, { width: 3200, quality: 95 }) ||
      selectedModel.imageFallbackUrl ||
      null
    : null;

  return (
    <section className="mt-10 space-y-8">
      <div className={FILTER_PANEL_CLASS}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex w-full items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-neutral-300 focus-within:border-white">
            <span className="text-neutral-500">Search</span>
            <input
              type="search"
              placeholder="Search models, gauges, triggers..."
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              className="w-full bg-transparent text-base text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </label>
          <p className="text-sm text-neutral-400" aria-live="polite" aria-atomic="true">
            Showing <span className="font-semibold text-white">{filteredModels.length}</span> of
            <span className="font-semibold text-white"> {models.length}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <FilterGroup
            label="Platform"
            options={platformOptions}
            values={platformFilters}
            onToggle={handleMultiFilterChange(platformFilters, setPlatformFilters)}
          />
          <FilterGroup
            label="Gauge"
            options={gaugeOptions}
            values={gaugeFilters}
            onToggle={handleMultiFilterChange(gaugeFilters, setGaugeFilters)}
          />
          <FilterGroup
            label="Use"
            options={useOptions}
            values={useFilters}
            onToggle={handleMultiFilterChange(useFilters, setUseFilters)}
          />
          <FilterGroup
            label="Trigger"
            options={triggerTypeOptions}
            values={triggerTypeFilters}
            onToggle={handleMultiFilterChange(triggerTypeFilters, setTriggerTypeFilters)}
          />
          <FilterGroup
            label="Rib"
            options={ribTypeOptions}
            values={ribTypeFilters}
            onToggle={handleMultiFilterChange(ribTypeFilters, setRibTypeFilters)}
          />
          {(platformFilters.length ||
            gaugeFilters.length ||
            useFilters.length ||
            triggerTypeFilters.length ||
            ribTypeFilters.length) && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest text-white/80 transition hover:border-white hover:text-white"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {renderItems.map((model, index) => {
          if (!model) {
            return <CardSkeleton key={`skeleton-${index}`} />;
          }
          const cardImageUrl =
            getSanityImageUrl(model.image, { width: 2400, quality: 90 }) || model.imageFallbackUrl || null;
          return (
            <article
              key={model._id}
              className={CARD_SHELL_CLASS}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="card-media relative aspect-[16/10] w-full bg-white">
                {cardImageUrl ? (
                  <Image
                    src={cardImageUrl}
                    alt={model.imageAlt || model.name}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-contain bg-white transition-transform duration-500"
                    style={{
                      transform: "translate3d(var(--parallax-x,0px), var(--parallax-y,0px), 0)",
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-neutral-900 text-neutral-600">
                    No Image Available
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-black">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
                    {model.use}
                  </p>
                 {/*
                    Keep highlight behavior consistent while showing only the model name on the card.
                  */}
                  <h3 className="text-2xl font-semibold leading-tight">
                    {highlightText(model.name, query)}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {highlightText((model.gaugeNames || []).join(", ") || "", query)}
                  </p>
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
                <button
                  ref={(node) => {
                    detailButtonRefs.current[model._id] = node;
                  }}
                  onClick={() => {
                    setHeroLoaded(false);
                    setSelectedModel(model);
                    setLastFocusedId(model._id);
                  }}
                  className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-perazzi-red"
                >
                  View details
                </button>
              </div>
            </article>
          );
        })}
        {!showSkeletons && filteredModels.length === 0 && (
          <p className="col-span-full rounded-3xl border border-dashed border-white/20 py-16 text-center text-neutral-500">
            No models match your current filters.
          </p>
        )}
      </div>
      {hasMore && !showSkeletons && (
        <div ref={loadMoreRef} className="h-10 w-full" aria-hidden="true" />
      )}

      {selectedModel ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 md:p-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            ref={modalRef}
            className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950/95 text-white shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 rounded-full border border-black/30 bg-white/90 px-4 py-1 text-xs uppercase tracking-widest text-black transition hover:border-black hover:bg-white sm:right-5 sm:top-5 sm:text-sm"
              onClick={closeModal}
            >
              Close
            </button>

            <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[3fr,2fr]">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-white">
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
                    onLoadingComplete={() => setHeroLoaded(true)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">
                    No Image Available
                  </div>
                )}
                <div className="absolute bottom-6 left-6 right-6 text-black">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-perazzi-red">
                    {selectedModel.use}
                  </p>
                  <h2 className="text-4xl font-semibold leading-tight">{selectedModel.name}</h2>
                  <p className="text-sm text-neutral-300">{selectedModel.version}</p>
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
        </div>
      ) : null}
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-white/5 bg-neutral-900/60">
      <div className="aspect-[16/10] w-full bg-white" />
      <div className="space-y-3 border-t border-white/5 bg-black/30 p-6">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-6 w-2/3 rounded bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-4 rounded bg-white/10" />
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
}: {
  label: string;
  options: Array<{ value: string; count: number }>;
  values: string[];
  onToggle: (value: string) => void;
}) {
  if (!options.length) return null;
  const total = options.reduce((sum, option) => sum + option.count, 0);
  const handleAll = () => {
    onToggle("__reset__");
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm uppercase tracking-[0.3em] text-neutral-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        <FilterChip active={!values.length} label="All" onClick={handleAll} />
        {options.map((option) => (
          <FilterChip
            key={option.value}
            active={values.includes(option.value)}
            label={option.value}
            onClick={() => onToggle(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function humanizeValue(value?: string | null) {
  if (!value) return undefined;
  const mmMatch = value.match(/^(\d+(?:\.\d+)?)\s*mm$/i);
  if (mmMatch) {
    return `${mmMatch[1]}mm`;
  }
  const cleaned = value.replace(/[_-]+/g, " ").trim();
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
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-full px-4 py-1 text-xs uppercase tracking-widest transition",
        active
          ? "bg-white text-black"
          : "border border-white/20 bg-transparent text-white/70 hover:border-white/60",
      )}
    >
      {label}
    </button>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  const display = humanizeValue(value) ?? value;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-perazzi-red">
        {label}
      </p>
      <p className="text-sm text-white">{display || "—"}</p>
    </div>
  );
}

function DetailGrid({ label, value }: { label: string; value?: string }) {
  const display = humanizeValue(value) ?? value;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-perazzi-red">
        {label}
      </p>
      <p className="text-lg text-white">{display || "—"}</p>
    </div>
  );
}

function renderList(list: SpecList) {
  if (!list || !list.length) return undefined;
  const mapped = list
    .map((entry) => humanizeValue(entry) ?? entry)
    .filter(Boolean) as string[];
  if (!mapped.length) return undefined;
  return mapped.join(", ");
}

function highlightText(text: string, needle: string): ReactNode {
  if (!needle.trim()) return text;
  const regex = new RegExp(`(${needle.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")})`, "ig");
  const parts = text.split(regex);
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark key={index} className="bg-transparent text-perazzi-red">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
