'use client';

import clsx from "clsx";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { getSanityImageUrl } from "@/lib/sanityImage";

type EngravingRow = {
  _id: string;
  engravingId: string;
  engravingSide: string;
  gradeName: string;
  image?: SanityImageSource | null;
  imageAlt?: string;
};

type EngravingSearchProps = {
  engravings: EngravingRow[];
};

const PAGE_SIZE = 12;
const FILTER_PANEL_CLASS =
  "space-y-4 rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,#070707,#101010)]/95 px-4 py-5 shadow-[0_35px_120px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6";
const CARD_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/80 text-left shadow-2xl shadow-black/40 transition hover:-translate-y-1 hover:border-perazzi-red/70 focus-within:outline focus-within:outline-2 focus-within:outline-perazzi-red";
const SPEC_PANEL_CLASS =
  "grid gap-4 border-t border-white/10 bg-black/40 px-6 py-5 text-sm text-neutral-200 sm:grid-cols-2";

export function EngravingSearchTable({ engravings }: EngravingSearchProps) {
  const [query, setQuery] = useState("");
  const [gradeFilters, setGradeFilters] = useState<string[]>([]);
  const [sideFilters, setSideFilters] = useState<string[]>([]);
  const [selected, setSelected] = useState<EngravingRow | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isPending, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const detailButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lastFocusedId, setLastFocusedId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const closeModal = useCallback(() => {
    setSelected(null);
    setHeroLoaded(false);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, closeModal]);

  useEffect(() => {
    if (!selected) return;
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
  }, [selected]);

  useEffect(() => {
    if (selected || !lastFocusedId) return;
    const button = detailButtonRefs.current[lastFocusedId];
    button?.focus();
  }, [selected, lastFocusedId]);

  const searchFiltered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return engravings;
    return engravings.filter((engraving) => {
      const haystack = [
        engraving.engravingId,
        engraving.engravingSide,
        engraving.gradeName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [engravings, query]);

  const optionCounts = useMemo(() => {
    const grade: Record<string, number> = {};
    const side: Record<string, number> = {};
    for (const engraving of searchFiltered) {
      grade[engraving.gradeName] = (grade[engraving.gradeName] || 0) + 1;
      side[engraving.engravingSide] = (side[engraving.engravingSide] || 0) + 1;
    }
    return { grade, side };
  }, [searchFiltered]);

  const gradeOptions = useMemo(() => {
    const preferredGradeOrder = [
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
    const dynamicOptions = Object.entries(optionCounts.grade).map(([value, count]) => ({ value, count }));
    const sorted = dynamicOptions.sort((a, b) => {
      const indexA = preferredGradeOrder.indexOf(a.value);
      const indexB = preferredGradeOrder.indexOf(b.value);
      if (indexA === -1 && indexB === -1) return a.value.localeCompare(b.value);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return sorted;
  }, [optionCounts.grade]);
  const sideOptions = useMemo(() => {
    const preferredSideOrder = ["Left", "Under", "Right"];
    const options = Object.entries(optionCounts.side).map(([value, count]) => ({ value, count }));
    return options.sort((a, b) => {
      const indexA = preferredSideOrder.indexOf(a.value);
      const indexB = preferredSideOrder.indexOf(b.value);
      if (indexA === -1 && indexB === -1) return a.value.localeCompare(b.value);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [optionCounts.side]);

  const filteredEngravings = useMemo(() => {
    return searchFiltered.filter((engraving) => {
      const matchesGrade =
        !gradeFilters.length || gradeFilters.includes(engraving.gradeName);
      const matchesSide =
        !sideFilters.length || sideFilters.includes(engraving.engravingSide);
      return matchesGrade && matchesSide;
    });
  }, [searchFiltered, gradeFilters, sideFilters]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => {
              if (prev >= filteredEngravings.length) return prev;
              return prev + PAGE_SIZE;
            });
          }
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredEngravings.length]);

  const handleQueryChange = (value: string) => {
    startTransition(() => {
      setQuery(value);
      setVisibleCount(PAGE_SIZE);
    });
  };

  const handleMultiFilter =
    (current: string[], setter: (value: string[]) => void) =>
    (value: string) => {
      startTransition(() => {
        if (value === "__reset__") {
          setter([]);
        } else if (current.includes(value)) {
          setter(current.filter((item) => item !== value));
        } else {
          setter([...current, value]);
        }
        setVisibleCount(PAGE_SIZE);
      });
    };

  const clearFilters = () => {
    startTransition(() => {
      setGradeFilters([]);
      setSideFilters([]);
      setVisibleCount(PAGE_SIZE);
    });
  };

  const display = filteredEngravings.slice(0, visibleCount);
  const showSkeletons = isPending && engravings.length > 0;
  const renderItems: (EngravingRow | null)[] = showSkeletons
    ? Array.from({ length: Math.min(PAGE_SIZE, engravings.length || PAGE_SIZE) }, () => null)
    : display;

  const hasMore = visibleCount < filteredEngravings.length;
  const modalImageUrl = selected
    ? getSanityImageUrl(selected.image, { width: 3000, quality: 95 })
    : null;

  return (
    <section className="mt-10 space-y-8">
      <div className={FILTER_PANEL_CLASS}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex w-full items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-neutral-300 focus-within:border-white">
            <span className="text-neutral-500">Search</span>
            <input
              type="search"
              placeholder="Search engraving ID or grade…"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              className="w-full bg-transparent text-base text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </label>
          <p className="text-sm text-neutral-400" aria-live="polite" aria-atomic="true">
            Showing <span className="font-semibold text-white">{filteredEngravings.length}</span> of
            <span className="font-semibold text-white"> {engravings.length}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <FilterGroup
            label="Grade"
            options={gradeOptions}
            values={gradeFilters}
            onToggle={handleMultiFilter(gradeFilters, setGradeFilters)}
          />
          <FilterGroup
            label="Side"
            options={sideOptions}
            values={sideFilters}
            onToggle={handleMultiFilter(sideFilters, setSideFilters)}
          />
          {(gradeFilters.length || sideFilters.length) && (
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
        {renderItems.map((engraving, index) => {
          if (!engraving) {
            return <CardSkeleton key={`skeleton-${index}`} />;
          }
          const cardImageUrl = getSanityImageUrl(engraving.image, { width: 2000, quality: 90 });
          return (
            <article key={engraving._id} className={CARD_CLASS}>
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
                <div
                  className={clsx(
                    "absolute inset-x-0 bottom-0 flex flex-col p-5 text-black",
                    engraving.engravingSide === "Right"
                      ? "items-end text-right"
                      : "items-start text-left",
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
                    {engraving.gradeName}
                  </p>
                  <h3 className="text-2xl font-semibold leading-tight">
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

              <div className="border-t border-white/5 bg-black/50 px-6 py-4 text-right">
                <button
                  ref={(node) => {
                    detailButtonRefs.current[engraving._id] = node;
                  }}
                  onClick={() => {
                    setSelected(engraving);
                    setLastFocusedId(engraving._id);
                  }}
                  className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-perazzi-red"
                >
                  View details
                </button>
              </div>
            </article>
          );
        })}
        {!showSkeletons && filteredEngravings.length === 0 && (
          <p className="col-span-full rounded-3xl border border-dashed border-white/20 py-16 text-center text-neutral-500">
            No engravings match your current filters.
          </p>
        )}
      </div>
      {hasMore && !showSkeletons && <div ref={loadMoreRef} className="h-10 w-full" aria-hidden="true" />}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 md:p-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            ref={modalRef}
            className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950/95 text-white shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
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
                    onLoadingComplete={() => setHeroLoaded(true)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">No Image Available</div>
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-6">
                <Detail label="Grade" value={selected.gradeName} />
                <Detail label="Engraving ID" value={selected.engravingId} />
                <Detail label="Side" value={selected.engravingSide} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-perazzi-red">{label}</p>
      <p className="text-sm text-white">{value || "—"}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-perazzi-red">{label}</p>
      <p className="text-lg text-white">{value || "—"}</p>
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
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm uppercase tracking-[0.3em] text-neutral-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        <FilterChip active={!values.length} label={`All (${total})`} onClick={() => onToggle("__reset__")} />
        {options.map((option) => (
          <FilterChip
            key={option.value}
            active={values.includes(option.value)}
            label={`${option.value} (${option.count})`}
            onClick={() => onToggle(option.value)}
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

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-white/5 bg-neutral-900/60">
      <div className="aspect-[4/3] w-full bg-white/10" />
      <div className="space-y-3 border-t border-white/5 bg-black/30 p-6">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-6 w-2/3 rounded bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-4 rounded bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
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
