"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type EngravingGradesCarouselProps = Readonly<{
  grades: readonly GradeSeries[];
  ui?: ShotgunsLandingData["engravingCarouselUi"];
}>;

const GRADE_TABS = [
  {
    label: "The Benchmark",
    order: ["Standard", "Lusso", "SC2"],
  },
  {
    label: "SC3",
    order: ["SC3", "SC3 Sideplates"],
  },
  {
    label: "SCO",
    order: ["SCO", "SCO Gold", "SCO Sideplates", "SCO Gold Sideplates"],
  },
  {
    label: "Extra",
    order: ["Extra", "Extra Gold", "Extra Super"],
  },
] as const;

const normalize = (value?: string | null) =>
  value
    ?.trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "") ?? "";

export function EngravingGradesCarousel({ grades, ui }: EngravingGradesCarouselProps) {
  const resolvedTabLabels =
    ui?.categoryLabels?.length === GRADE_TABS.length
      ? ui.categoryLabels
      : GRADE_TABS.map((tab) => tab.label);
  const tabs = GRADE_TABS.map((tab, index) => ({
    ...tab,
    label: resolvedTabLabels[index] ?? tab.label,
  }));

  const [openCategory, setOpenCategory] = useState<string | null>(tabs[0]?.label ?? null);
  const [activeGradeId, setActiveGradeId] = useState<string | null>(null);

  const analyticsRef = useAnalyticsObserver<HTMLElement>("EngravingGradesCarouselSeen");

  const heading = ui?.heading ?? "Engraving Grades";
  const subheading = ui?.subheading ?? "Commission tiers & engraving houses";
  const background = ui?.background ?? {
    id: "engraving-carousel-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg",
    alt: "Perazzi engraving workshop background",
  };
  const ctaLabel = ui?.ctaLabel ?? "View engraving";

  const gradeLookup = useMemo(() => {
    const map = new Map<string, GradeSeries>();
    grades.forEach((grade) => {
      map.set(normalize(grade.name), grade);
      map.set(normalize(grade.id), grade);
    });
    return map;
  }, [grades]);

  const groupedGrades = useMemo<GradeSeries[][]>(() => {
    return tabs.map((tab) =>
      tab
        .order
        .map((name) => gradeLookup.get(normalize(name)))
        .filter(Boolean) as GradeSeries[],
    );
  }, [gradeLookup, tabs]);

  const categories = useMemo(() => {
    return tabs.map((tab, index) => {
      const resolved = groupedGrades[index] ?? [];
      return { label: tab.label, grades: resolved };
    }).filter((category) => category.grades.length);
  }, [groupedGrades, tabs]);

  const resolvedOpenCategory = useMemo(() => {
    if (!openCategory) return null;
    if (categories.some((category) => category.label === openCategory)) {
      return openCategory;
    }
    return categories[0]?.label ?? null;
  }, [categories, openCategory]);

  const resolvedActiveGradeId = useMemo(() => {
    if (activeGradeId) {
      const inCategories = categories.some((category) =>
        category.grades.some((grade) => grade.id === activeGradeId),
      );
      if (inCategories) return activeGradeId;
    }
    return categories[0]?.grades[0]?.id ?? null;
  }, [activeGradeId, categories]);

  const selectedGrade =
    grades.find((grade) => grade.id === resolvedActiveGradeId) ??
    categories[0]?.grades[0] ??
    grades[0] ??
    null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="EngravingGradesCarouselSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="engraving-grades-heading"
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
        <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 80%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 80%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-6 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm backdrop-blur-md sm:rounded-3xl sm:bg-card/25 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10">
          <div className="space-y-3">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-[0.35em] text-ink">
              {heading}
            </p>
            <h2
              id="engraving-grades-heading"
              className="max-w-4xl text-sm sm:text-base font-light italic text-ink-muted"
            >
              {subheading}
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
            <div className="space-y-3 rounded-2xl bg-transparent p-4 sm:rounded-3xl sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Grade categories
              </p>
              <div className="space-y-3">
                {categories.map((category) => {
                  const isOpen = resolvedOpenCategory === category.label;
                  return (
                    <div
                      key={category.label}
                      className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm sm:bg-card/75"
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
                        <div className="border-t border-border/70">
                          <ul className="space-y-1 p-3">
                            {category.grades.map((grade) => {
                              const isActive = grade.id === resolvedActiveGradeId;
                              return (
                                <li key={grade.id}>
                                  <button
                                    type="button"
                                    onClick={() => { setActiveGradeId(grade.id); }}
                                    className={cn(
                                      "group w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors focus-ring",
                                      isActive
                                        ? "bg-ink text-card"
                                        : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
                                    )}
                                    aria-pressed={isActive}
                                  >
                                    <span className="block text-sm font-semibold tracking-wide">
                                      {grade.name}
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
              {selectedGrade ? (
                <GradeCard grade={selectedGrade} ctaLabel={ctaLabel} />
              ) : (
                <p className="text-sm text-ink-muted">Select a grade to view details.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type GradeCardProps = Readonly<{
  grade: GradeSeries;
  ctaLabel: string;
}>;

function GradeCard({ grade, ctaLabel }: GradeCardProps) {
  const heroAsset = grade.gallery?.[0];
  const ratio = heroAsset?.aspectRatio ?? 3 / 2;
  const gradeAnchor = getGradeAnchorId(grade);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-5 sm:shadow-elevated lg:p-6">
      <div
        className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
        style={{ aspectRatio: ratio }}
      >
        {heroAsset ? (
          <Image
            src={heroAsset.url}
            alt={heroAsset.alt}
            fill
            sizes="(min-width: 1024px) 380px, 100vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            Imagery coming soon
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-black">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-perazzi-red">
            Engraving Grade
          </p>
          <h3 className="text-lg sm:text-xl font-semibold uppercase tracking-[0.25em] text-black">
            {grade.name}
          </h3>
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <p className="text-sm text-ink-muted">{grade.description}</p>
        <div className="mt-auto pt-2">
          <Link
            href={`/engravings?grade=${gradeAnchor}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
          >
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
