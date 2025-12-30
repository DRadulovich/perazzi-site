'use client';

import clsx from "clsx";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { getSanityImageUrl } from "@/lib/sanityImage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Button, Heading, Input, Text } from "@/components/ui";

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
  "space-y-4 rounded-3xl border border-white/15 bg-[linear-gradient(135deg,var(--perazzi-black),color-mix(in srgb,var(--perazzi-black) 85%, black))]/95 px-4 py-5 shadow-elevated sm:px-6 sm:py-6";
const CARD_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-perazzi-black/80 text-left shadow-medium transition hover:-translate-y-1 hover:border-perazzi-red/70 focus-within:outline focus-within:outline-2 focus-within:outline-perazzi-red sm:rounded-3xl sm:shadow-elevated";
const SPEC_PANEL_CLASS =
  "grid gap-4 border-t border-white/10 bg-black/40 px-4 py-4 text-neutral-200 sm:grid-cols-2 sm:px-6 sm:py-5";

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
          <label className="flex w-full items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 type-body-sm text-neutral-300 focus-within:border-white">
            <span className="text-neutral-500">Search</span>
            <Input
              type="search"
              placeholder="Search engraving ID or grade…"
              value={query}
              onChange={(event) => { handleQueryChange(event.target.value); }}
              className="w-full border-0 bg-transparent px-0 py-0 type-body-sm text-white placeholder:text-neutral-600 shadow-none focus:border-0"
            />
          </label>
          <Text asChild size="caption" className="text-neutral-400" leading="normal">
            <p aria-live="polite" aria-atomic="true">
              Showing <span className="text-white">{filteredEngravings.length}</span>{" "}
              of <span className="text-white">{engravings.length}</span>
            </p>
          </Text>
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
      <Text size="label-tight" className="text-perazzi-red">
        {label}
      </Text>
      <Text size="sm" className="text-white">
        {value || "—"}
      </Text>
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
      <Text
        asChild
        size="label-tight"
        className={clsx(
          tone === "dark" ? "text-neutral-500" : "text-ink-muted",
        )}
      >
        <span>{label}</span>
      </Text>
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
      className={clsx("type-label-tight pill transition", chipStateClass)}
    >
      {label}
    </button>
  );
}

function CardSkeleton() {
  const skeletonRows = ["first", "second", "third", "fourth"];
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/5 bg-perazzi-black/60 sm:rounded-3xl">
      <div className="aspect-4/3 w-full bg-white/10" />
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
        <Text size="caption" className="text-neutral-400">
          Favorites ({favorites.length}/6)
        </Text>
        <Button
          type="button"
          disabled={favorites.length < 2}
          onClick={onCompare}
          variant="ghost"
          size="sm"
          className={clsx(
            "rounded-full border border-white/40 text-white hover:border-white hover:text-white hover:bg-white/5",
            favorites.length < 2 && "border-white/20 text-white/40",
          )}
        >
          Compare
        </Button>
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
                  <span className="type-caption text-black">No Image</span>
                )}
              </button>
              <Heading level={4} size="sm" className="mt-2 text-white">
                #{fav.engravingId}
              </Heading>
              <button
                type="button"
                className="type-label-tight text-white/60 hover:text-white"
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
        <Text
          asChild
          className="col-span-full rounded-2xl border border-dashed border-white/20 py-16 text-center text-neutral-500 sm:rounded-3xl"
          leading="normal"
        >
          <p>No engravings match your current filters.</p>
        </Text>
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
      <div className="card-media relative aspect-4/3 w-full bg-white">
        {cardImageUrl ? (
          <Image
            src={cardImageUrl}
            alt={engraving.imageAlt || `Engraving ${engraving.engravingId}`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className={clsx(
              "object-contain bg-white transition-transform duration-500 group-hover:scale-105",
              engraving.engravingSide === "Under" ? "object-right" : "object-center",
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-600">
            No Image Available
          </div>
        )}
        {cardImageUrl ? (
          <div className="pointer-events-none absolute inset-0 radial-vignette" />
        ) : null}
        <div
          className={clsx(
            "absolute inset-x-0 bottom-0 flex flex-col p-5 text-black",
            engraving.engravingSide === "Right" ? "items-end text-right" : "items-start text-left",
          )}
        >
          <Text size="label-tight" className="text-perazzi-red">
            {engraving.gradeName}
          </Text>
          <Heading level={3} size="lg" className="text-black">
            {highlightText(`Engraving ${engraving.engravingId}`, query)}
          </Heading>
          <Text size="sm" className="text-black/70">
            {highlightText(engraving.engravingSide, query)}
          </Text>
        </div>
      </div>

      <div className={SPEC_PANEL_CLASS}>
        <Spec label="Grade" value={engraving.gradeName} />
        <Spec label="Engraving ID" value={engraving.engravingId} />
        <Spec label="Side" value={engraving.engravingSide} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/5 bg-black/50 px-6 py-4">
        <Button
          type="button"
          onClick={() => { onToggleFavorite(engraving); }}
          variant="ghost"
          size="sm"
          className={clsx(
            "rounded-full border px-5 text-white hover:border-white hover:text-white hover:bg-white/5",
            isFavorite
              ? "border-perazzi-red bg-perazzi-red/80 text-white hover:bg-perazzi-red/90"
              : "border-white/30",
          )}
        >
          {isFavorite ? "Saved" : "Save"}
        </Button>
        <Button
          ref={(node) => {
            onRegisterDetailButton(engraving._id, node);
          }}
          onClick={() => { onSelect(engraving); }}
          variant="ghost"
          size="sm"
          className="rounded-full border border-white/30 px-5 text-white hover:border-white hover:text-white hover:bg-white/5"
        >
          View details
        </Button>
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
  const [heroLoaded, setHeroLoaded] = useState(false);

  if (!selected) return null;
  const modalImageUrl = getSanityImageUrl(selected.image, { width: 3000, quality: 95 });
  return (
    <Dialog.Root
      open={Boolean(selected)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
        <Dialog.Content className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 md:p-6 outline-none">
          <div className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-perazzi-black/95 text-white shadow-elevated">
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-4 top-4 z-10 rounded-full border border-black/30 bg-white/90 px-4 text-black hover:border-black hover:bg-white sm:right-5 sm:top-5"
              >
                Close
              </Button>
            </Dialog.Close>

            <div className="grid flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-white">
                {modalImageUrl ? (
                  <Image
                    src={modalImageUrl}
                    alt={selected.imageAlt || `Engraving ${selected.engravingId}`}
                    fill
                    sizes="(min-width: 1024px) 70vw, 100vw"
                    className={clsx(
                      "object-contain bg-white transition-opacity duration-700",
                      selected.engravingSide === "Under" ? "object-right" : "object-center",
                      heroLoaded ? "opacity-100" : "opacity-0",
                    )}
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
                  <Text size="label-tight" className="text-perazzi-red">
                    {selected.gradeName}
                  </Text>
                  <Heading level={2} size="xl" className="text-black">
                    Engraving {selected.engravingId}
                  </Heading>
                  <Text size="sm" className="text-black/70">
                    {selected.engravingSide}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
  if (!open) return null;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 outline-none">
          <div className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-perazzi-black/95 text-white shadow-elevated">
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-4 top-4 z-10 rounded-full border border-black/30 bg-white/90 px-4 text-black hover:border-black hover:bg-white sm:right-5 sm:top-5"
              >
                Close
              </Button>
            </Dialog.Close>
            <div className="space-y-4 border-b border-white/10 p-6 text-center">
              <Text size="label-tight" className="text-white/70">
                Compare Engravings
              </Text>
              <Heading level={2} size="xl" className="text-white">
                Side-by-side favorites
              </Heading>
            </div>
            <div className="grid gap-6 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((fav) => {
                const compareImage = getSanityImageUrl(fav.image, { width: 2400, quality: 95 });
                return (
                  <article key={fav._id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-white">
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
                        <div className="pointer-events-none absolute inset-0 radial-vignette" />
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-1 text-white">
                      <Text size="label-tight" className="text-perazzi-red">
                        {fav.gradeName}
                      </Text>
                      <Heading level={3} size="lg" className="text-white">
                        Engraving {fav.engravingId}
                      </Heading>
                      <Text size="sm" className="text-white/80">
                        {fav.engravingSide}
                      </Text>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
