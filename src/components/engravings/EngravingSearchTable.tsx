'use client';

import clsx from "clsx";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { getSanityImageUrl } from "@/lib/sanityImage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type EngravingRow = {
  _id: string;
  engravingId: string;
  engravingSide: string;
  gradeName: string;
  image?: SanityImageSource | null;
  imageAlt?: string;
};

type EngravingSearchProps = Readonly<{
  engravings: EngravingRow[];
}>;

const PAGE_SIZE = 12;
const PREFERRED_GRADE_ORDER = [
  "Extra Super",
  "Extra Gold",
  "Extra",
  "SCO Gold Sideplates",
  "SCO Sideplates",
  "SCO Gold",
  "SCO",
  "SC3 Sideplates",
  "SC3",
];
const PREFERRED_SIDE_ORDER = ["Left", "Under", "Right"];
const FILTER_PANEL_CLASS =
  "space-y-4 rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,#070707,#101010)]/95 px-4 py-5 shadow-[0_35px_120px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6";
const CARD_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 text-left shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-perazzi-red/70 focus-within:outline focus-within:outline-2 focus-within:outline-perazzi-red sm:rounded-3xl sm:shadow-2xl";
const SPEC_PANEL_CLASS =
  "grid gap-4 border-t border-white/10 bg-black/40 px-4 py-4 text-[11px] sm:text-sm text-neutral-200 sm:grid-cols-2 sm:px-6 sm:py-5";
const FOCUSABLE_SELECTORS = [
  "a[href]",
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
] as const;

function trapFocus(container: HTMLElement | null) {
  if (!container) return undefined;
  const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS.join(",")));
  focusables.at(0)?.focus();

  const handleTrap = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || focusables.length === 0) return;
    const first = focusables.at(0);
    const last = focusables.at(-1);
    if (!first || !last) return;
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

  container.addEventListener("keydown", handleTrap);
  return () => { container.removeEventListener("keydown", handleTrap); };
}

function filterByQuery(engravings: EngravingRow[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return engravings;
  return engravings.filter((engraving) => {
    const haystack = [engraving.engravingId, engraving.engravingSide, engraving.gradeName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

function countOptions(engravings: EngravingRow[]) {
  const grade: Record<string, number> = {};
  const side: Record<string, number> = {};
  for (const engraving of engravings) {
    grade[engraving.gradeName] = (grade[engraving.gradeName] || 0) + 1;
    side[engraving.engravingSide] = (side[engraving.engravingSide] || 0) + 1;
  }
  return { grade, side };
}

function sortGradeOptions(optionCounts: Record<string, number>) {
  const dynamicOptions = Object.entries(optionCounts).map(([value, count]) => ({ value, count }));
  return [...dynamicOptions].sort((a, b) => {
    const indexA = PREFERRED_GRADE_ORDER.indexOf(a.value);
    const indexB = PREFERRED_GRADE_ORDER.indexOf(b.value);
    if (indexA === -1 && indexB === -1) return a.value.localeCompare(b.value);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

function sortSideOptions(optionCounts: Record<string, number>) {
  const options = Object.entries(optionCounts).map(([value, count]) => ({ value, count }));
  return [...options].sort((a, b) => {
    const indexA = PREFERRED_SIDE_ORDER.indexOf(a.value);
    const indexB = PREFERRED_SIDE_ORDER.indexOf(b.value);
    if (indexA === -1 && indexB === -1) return a.value.localeCompare(b.value);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

function filterBySelections(engravings: EngravingRow[], gradeFilters: string[], sideFilters: string[]) {
  return engravings.filter((engraving) => {
    const matchesGrade = !gradeFilters.length || gradeFilters.includes(engraving.gradeName);
    const matchesSide = !sideFilters.length || sideFilters.includes(engraving.engravingSide);
    return matchesGrade && matchesSide;
  });
}

function observeLoadMore(
  node: HTMLDivElement | null,
  filteredLength: number,
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>,
) {
  if (!node) return undefined;
  const updateVisibleCount = () => {
    setVisibleCount((prev) => {
      if (prev >= filteredLength) return prev;
      return prev + PAGE_SIZE;
    });
  };
  const observer = new IntersectionObserver(
    (entries) => entries.some((entry) => entry.isIntersecting) && updateVisibleCount(),
    { threshold: 0.25 },
  );
  observer.observe(node);
  return () => { observer.disconnect(); };
}

export function EngravingSearchTable({ engravings }: Readonly<EngravingSearchProps>) {
  const [query, setQuery] = useState("");
  const [gradeFilters, setGradeFilters] = useState<string[]>([]);
  const [sideFilters, setSideFilters] = useState<string[]>([]);
  const [selected, setSelected] = useState<EngravingRow | null>(null);
  const [favorites, setFavorites] = useState<EngravingRow[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isPending, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const detailButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lastFocusedId, setLastFocusedId] = useState<string | null>(null);
  const analyticsRef = useAnalyticsObserver<HTMLElement>("EngravingSearchTableSeen");

  const closeModal = useCallback(() => { setSelected(null); }, []);
  const openDetails = useCallback((engraving: EngravingRow) => {
    setSelected(engraving);
    setLastFocusedId(engraving._id);
  }, []);
  const registerDetailButton = useCallback((id: string, node: HTMLButtonElement | null) => {
    detailButtonRefs.current[id] = node;
  }, []);

  const toggleFavorite = useCallback((engraving: EngravingRow) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav._id === engraving._id);
      if (exists) {
        return prev.filter((fav) => fav._id !== engraving._id);
      }
      if (prev.length >= 6) {
        globalThis.alert("You can only favorite up to 6 engravings.");
        return prev;
      }
      return [...prev, engraving];
    });
  }, []);

  useEffect(() => {
    if (!selected && !compareOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selected) closeModal();
        if (compareOpen) setCompareOpen(false);
      }
    };
    globalThis.addEventListener("keydown", handleKey);
    return () => { globalThis.removeEventListener?.("keydown", handleKey); };
  }, [selected, compareOpen, closeModal]);

  useEffect(() => {
    if (selected || !lastFocusedId) return;
    const button = detailButtonRefs.current[lastFocusedId];
    button?.focus();
  }, [selected, lastFocusedId]);

  const searchFiltered = useMemo(() => filterByQuery(engravings, query), [engravings, query]);
  const optionCounts = useMemo(() => countOptions(searchFiltered), [searchFiltered]);
  const gradeOptions = useMemo(() => sortGradeOptions(optionCounts.grade), [optionCounts.grade]);
  const sideOptions = useMemo(() => sortSideOptions(optionCounts.side), [optionCounts.side]);
  const filteredEngravings = useMemo(
    () => filterBySelections(searchFiltered, gradeFilters, sideFilters),
    [searchFiltered, gradeFilters, sideFilters],
  );

  useEffect(() => {
    const cleanup = observeLoadMore(loadMoreRef.current, filteredEngravings.length, setVisibleCount);
    return cleanup;
  }, [filteredEngravings.length]);

  const handleQueryChange = (value: string) => {
    startTransition(() => {
      setQuery(value);
      setVisibleCount(PAGE_SIZE);
    });
  };

  const toggleMultiFilter = useCallback((current: string[], setter: (value: string[]) => void, value: string) => {
    startTransition(() => {
      if (value === "__reset__") {
        setter([]);
      } else {
        const nextValues = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
        setter(nextValues);
      }
      setVisibleCount(PAGE_SIZE);
    });
  }, []);

  const clearFilters = () => {
    startTransition(() => {
      setGradeFilters([]);
      setSideFilters([]);
      setVisibleCount(PAGE_SIZE);
    });
  };

  const display = filteredEngravings.slice(0, visibleCount);
  const showSkeletons = isPending && engravings.length > 0;
  const renderItems = useMemo(
    () =>
      showSkeletons
        ? Array.from({ length: Math.min(PAGE_SIZE, engravings.length || PAGE_SIZE) }, (_, idx) => ({
            key: `skeleton-${idx}`,
            engraving: null,
          }))
        : display.map((engraving) => ({ key: engraving._id, engraving })),
    [display, engravings.length, showSkeletons],
  );

  const hasMore = visibleCount < filteredEngravings.length;
  const hasFilters = gradeFilters.length > 0 || sideFilters.length > 0;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="EngravingSearchTableSeen"
      className="mt-10 space-y-8"
    >
      <div className={FILTER_PANEL_CLASS}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex w-full items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-neutral-300 focus-within:border-white">
            <span className="text-neutral-500">Search</span>
            <input
              type="search"
              placeholder="Search engraving ID or grade…"
              value={query}
              onChange={(event) => { handleQueryChange(event.target.value); }}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </label>
          <p className="text-sm text-neutral-400" aria-live="polite" aria-atomic="true">
            Showing <span className="font-semibold text-white">{filteredEngravings.length}</span>{" "}
            of <span className="font-semibold text-white">{engravings.length}</span>
          </p>
        </div>

        <FavoritesPanel favorites={favorites} onCompare={() => { setCompareOpen(true); }} onToggle={toggleFavorite} onSelect={openDetails} />

        <div className="flex flex-wrap gap-4">
          <FilterGroup
            label="Grade"
            options={gradeOptions}
            values={gradeFilters}
            onToggle={(value) => { toggleMultiFilter(gradeFilters, setGradeFilters, value); }}
          />
          <FilterGroup
            label="Side"
            options={sideOptions}
            values={sideFilters}
            onToggle={(value) => { toggleMultiFilter(sideFilters, setSideFilters, value); }}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-white/30 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-widest text-white/80 transition hover:border-white hover:text-white focus-ring"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      <EngravingCardsGrid
        items={renderItems}
        favorites={favorites}
        query={query}
        toggleFavorite={toggleFavorite}
        onSelect={openDetails}
        onRegisterDetailButton={registerDetailButton}
        showSkeletons={showSkeletons}
        filteredLength={filteredEngravings.length}
      />
      {hasMore && !showSkeletons && <div ref={loadMoreRef} className="h-10 w-full" aria-hidden="true" />}

      <EngravingDetailDialog selected={selected} onClose={closeModal} />

      <EngravingCompareDialog
        open={compareOpen}
        favorites={favorites}
        onClose={() => { setCompareOpen(false); }}
      />
    </section>
  );
}

function Spec({ label, value }: Readonly<{ label: string; value?: string }>) {
  return (
    <div>
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
        {label}
      </p>
      <p className="text-sm text-white">{value || "—"}</p>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  values,
  onToggle,
  tone = "dark",
}: Readonly<{
  label: string;
  options: Array<{ value: string; count: number }>;
  values: string[];
  onToggle: (value: string) => void;
  tone?: "light" | "dark";
}>) {
  if (!options.length) return null;
  const total = options.reduce((sum, option) => sum + option.count, 0);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={clsx(
          "text-[11px] sm:text-xs uppercase tracking-[0.3em]",
          tone === "dark" ? "text-neutral-500" : "text-ink-muted",
        )}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        <FilterChip active={!values.length} label={`All (${total})`} onClick={() => { onToggle("__reset__"); }} />
        {options.map((option) => (
          <FilterChip
            key={option.value}
            active={values.includes(option.value)}
            label={`${option.value} (${option.count})`}
            onClick={() => { onToggle(option.value); }}
            tone={tone}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  tone = "dark",
}: Readonly<{
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "light" | "dark";
}>) {
  const toneClasses =
    tone === "dark"
      ? {
          active: "bg-white text-black",
          inactive: "border border-white/20 bg-transparent text-white/70 hover:border-white/60",
        }
      : {
          active: "bg-ink text-white",
          inactive: "border border-border bg-transparent text-ink/70 hover:border-ink",
        };
  const chipStateClass = active ? toneClasses.active : toneClasses.inactive;
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx("rounded-full px-4 py-2 text-[11px] sm:text-xs uppercase tracking-widest transition", chipStateClass)}
    >
      {label}
    </button>
  );
}

function CardSkeleton() {
  const skeletonRows = ["first", "second", "third", "fourth"];
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/5 bg-neutral-900/60 sm:rounded-3xl">
      <div className="aspect-[4/3] w-full bg-white/10" />
      <div className="space-y-3 border-t border-white/5 bg-black/30 p-4 sm:p-6">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-6 w-2/3 rounded bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          {skeletonRows.map((rowKey) => (
            <div key={rowKey} className="h-4 rounded bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FavoritesPanel({
  favorites,
  onCompare,
  onToggle,
  onSelect,
}: Readonly<{
  favorites: EngravingRow[];
  onCompare: () => void;
  onToggle: (engraving: EngravingRow) => void;
  onSelect: (engraving: EngravingRow) => void;
}>) {
  if (!favorites.length) return null;
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
          Favorites ({favorites.length}/6)
        </p>
        <button
          type="button"
          disabled={favorites.length < 2}
          onClick={onCompare}
          className={clsx(
            "rounded-full px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.3em] focus-ring",
            favorites.length < 2
              ? "border border-white/20 text-white/40"
              : "border border-white/40 text-white hover:border-white hover:text-white",
          )}
        >
          Compare
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {favorites.map((fav) => {
          const previewUrl = getSanityImageUrl(fav.image, { width: 200, quality: 70 });
          return (
            <div key={fav._id} className="flex flex-col items-center text-center text-white">
              <button
                type="button"
                className="relative h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-white"
                onClick={() => { onSelect(fav); }}
              >
                {previewUrl ? (
                  <Image src={previewUrl} alt={fav.imageAlt || fav.engravingId} fill className="object-cover" />
                ) : (
                  <span className="text-xs text-black">No Image</span>
                )}
              </button>
              <p className="mt-2 text-xs font-semibold">#{fav.engravingId}</p>
              <button
                type="button"
                className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
                onClick={() => { onToggle(fav); }}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type GridItem = { key: string; engraving: EngravingRow | null };

function EngravingCardsGrid({
  items,
  favorites,
  query,
  toggleFavorite,
  onSelect,
  onRegisterDetailButton,
  showSkeletons,
  filteredLength,
}: Readonly<{
  items: GridItem[];
  favorites: EngravingRow[];
  query: string;
  toggleFavorite: (engraving: EngravingRow) => void;
  onSelect: (engraving: EngravingRow) => void;
  onRegisterDetailButton: (id: string, node: HTMLButtonElement | null) => void;
  showSkeletons: boolean;
  filteredLength: number;
}>) {
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ engraving, key }) =>
        engraving ? (
          <EngravingCard
            key={key}
            engraving={engraving}
            isFavorite={favorites.some((fav) => fav._id === engraving._id)}
            query={query}
            onToggleFavorite={toggleFavorite}
            onSelect={onSelect}
            onRegisterDetailButton={onRegisterDetailButton}
          />
        ) : (
          <CardSkeleton key={key} />
        ),
      )}
      {!showSkeletons && filteredLength === 0 && (
        <p className="col-span-full rounded-2xl border border-dashed border-white/20 py-16 text-center text-neutral-500 sm:rounded-3xl">
          No engravings match your current filters.
        </p>
      )}
    </div>
  );
}

function EngravingCard({
  engraving,
  isFavorite,
  query,
  onToggleFavorite,
  onSelect,
  onRegisterDetailButton,
}: Readonly<{
  engraving: EngravingRow;
  isFavorite: boolean;
  query: string;
  onToggleFavorite: (engraving: EngravingRow) => void;
  onSelect: (engraving: EngravingRow) => void;
  onRegisterDetailButton: (id: string, node: HTMLButtonElement | null) => void;
}>) {
  const cardImageUrl = getSanityImageUrl(engraving.image, { width: 2000, quality: 90 });
  return (
    <article className={CARD_CLASS}>
      <div className="card-media relative aspect-[4/3] w-full bg-white">
        {cardImageUrl ? (
          <Image
            src={cardImageUrl}
            alt={engraving.imageAlt || `Engraving ${engraving.engravingId}`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-contain bg-white transition-transform duration-500 group-hover:scale-105"
            style={{
              objectPosition: engraving.engravingSide === "Under" ? "right center" : "center",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-600">
            No Image Available
          </div>
        )}
        {cardImageUrl ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.4) 85%)",
            }}
          />
        ) : null}
        <div
          className={clsx(
            "absolute inset-x-0 bottom-0 flex flex-col p-5 text-black",
            engraving.engravingSide === "Right" ? "items-end text-right" : "items-start text-left",
          )}
        >
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
            {engraving.gradeName}
          </p>
          <h3 className="text-xl sm:text-2xl font-semibold leading-tight">
            {highlightText(`Engraving ${engraving.engravingId}`, query)}
          </h3>
          <p className="text-sm text-black/70">
            {highlightText(engraving.engravingSide, query)}
          </p>
        </div>
      </div>

      <div className={SPEC_PANEL_CLASS}>
        <Spec label="Grade" value={engraving.gradeName} />
        <Spec label="Engraving ID" value={engraving.engravingId} />
        <Spec label="Side" value={engraving.engravingSide} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/5 bg-black/50 px-6 py-4">
        <button
          type="button"
          onClick={() => { onToggleFavorite(engraving); }}
          className={clsx(
            "rounded-full border px-5 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-widest transition focus-ring",
            isFavorite
              ? "border-perazzi-red bg-perazzi-red/80 text-white"
              : "border-white/30 text-white hover:border-white hover:text-white",
          )}
        >
          {isFavorite ? "Saved" : "Save"}
        </button>
        <button
          ref={(node) => {
            onRegisterDetailButton(engraving._id, node);
          }}
          onClick={() => { onSelect(engraving); }}
          className="rounded-full border border-white/30 px-5 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white hover:text-white focus-ring"
        >
          View details
        </button>
      </div>
    </article>
  );
}

function EngravingDetailDialog({
  selected,
  onClose,
}: Readonly<{
  selected: EngravingRow | null;
  onClose: () => void;
}>) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  useEffect(() => trapFocus(modalRef.current), []);

  if (!selected) return null;
  const modalImageUrl = getSanityImageUrl(selected.image, { width: 3000, quality: 95 });
  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/80 p-3 sm:p-4 md:p-6 backdrop-blur relative"
      aria-modal="true"
      onCancel={onClose}
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        aria-label="Close engraving details dialog"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950/95 text-white shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-10 rounded-full border border-black/30 bg-white/90 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-widest text-black transition hover:border-black hover:bg-white focus-ring sm:right-5 sm:top-5"
          onClick={onClose}
        >
          Close
        </button>

        <div className="grid flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-white">
            {modalImageUrl ? (
              <Image
                src={modalImageUrl}
                alt={selected.imageAlt || `Engraving ${selected.engravingId}`}
                fill
                sizes="(min-width: 1024px) 70vw, 100vw"
                className={clsx(
                  "object-contain bg-white transition-opacity duration-700",
                  heroLoaded ? "opacity-100" : "opacity-0",
                )}
                style={{
                  objectPosition: selected.engravingSide === "Under" ? "right center" : "center",
                }}
                priority
                onLoadingComplete={() => { setHeroLoaded(true); }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-600">No Image Available</div>
            )}
            <div
              className={clsx(
                "absolute inset-x-0 bottom-0 flex flex-col p-8 text-black",
                selected.engravingSide === "Right" ? "items-end text-right" : "items-start text-left",
              )}
            >
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
                {selected.gradeName}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">
                Engraving {selected.engravingId}
              </h2>
              <p className="text-sm sm:text-base text-black/70">
                {selected.engravingSide}
              </p>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function EngravingCompareDialog({
  open,
  favorites,
  onClose,
}: Readonly<{
  open: boolean;
  favorites: EngravingRow[];
  onClose: () => void;
}>) {
  const compareModalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => trapFocus(compareModalRef.current), []);
  if (!open) return null;
  return (
    <dialog
      open
      className="fixed inset-0 z-40 m-0 flex items-center justify-center bg-black/80 p-3 sm:p-4 md:p-6 backdrop-blur relative"
      aria-modal="true"
      onCancel={onClose}
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        aria-label="Close engraving comparison dialog"
        onClick={onClose}
      />
      <div
        ref={compareModalRef}
        className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950/95 text-white shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-10 rounded-full border border-black/30 bg-white/90 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-widest text-black transition hover:border-black hover:bg-white focus-ring sm:right-5 sm:top-5"
          onClick={onClose}
        >
          Close
        </button>
        <div className="space-y-4 border-b border-white/10 p-6 text-center">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.4em] text-white/70">
            Compare Engravings
          </p>
          <h2 className="text-3xl font-semibold">Side-by-side favorites</h2>
        </div>
        <div className="grid gap-6 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const compareImage = getSanityImageUrl(fav.image, { width: 2400, quality: 95 });
            return (
              <article key={fav._id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white">
                  {compareImage ? (
                    <Image
                      src={compareImage}
                      alt={fav.imageAlt || `Engraving ${fav.engravingId}`}
                      fill
                      className="object-contain bg-white"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-600">No Image</div>
                  )}
                  {compareImage ? (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.4) 85%)",
                      }}
                    />
                  ) : null}
                </div>
                <div className="mt-4 space-y-1 text-white">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.35em] text-perazzi-red">
                    {fav.gradeName}
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-white">
                    Engraving {fav.engravingId}
                  </p>
                  <p className="text-sm text-white/80">{fav.engravingSide}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}

function highlightText(text: string, needle: string): ReactNode {
  if (!needle.trim()) return text;
  const escapePattern = /[.*+?^${}()|[\]\\]/g;
  const escapedNeedle = needle.replaceAll(escapePattern, String.raw`\$&`);
  const regex = new RegExp(String.raw`(${escapedNeedle})`, "ig");
  const occurrences = new Map<string, number>();

  return text.split(regex).map((part) => {
    const occurrenceIndex = (occurrences.get(part) ?? 0) + 1;
    occurrences.set(part, occurrenceIndex);
    const key = `${part}-${occurrenceIndex}`;
    return part.toLowerCase() === needle.toLowerCase() ? (
      <mark key={key} className="bg-transparent text-perazzi-red">
        {part}
      </mark>
    ) : (
      <span key={key}>{part}</span>
    );
  });
}
