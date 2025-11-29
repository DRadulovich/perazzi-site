"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { GradeSeries } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { cn } from "@/lib/utils";

type EngravingGradesCarouselProps = {
  grades: GradeSeries[];
};

const GRADE_TABS = [
  {
    label: "The Benchmark",
    order: ["standard", "lusso", "sc2"],
  },
  {
    label: "SC3 Grade",
    order: ["sc3", "sc3 sideplates"],
  },
  {
    label: "SCO Grade",
    order: ["sco", "sco gold", "sco sideplates", "sco gold sideplates"],
  },
  {
    label: "Extra Grade",
    order: ["extra", "extra gold", "extra super"],
  },
] as const;

const normalize = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

export function EngravingGradesCarousel({ grades }: EngravingGradesCarouselProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(GRADE_TABS[0]?.label ?? null);
  const [activeGradeId, setActiveGradeId] = useState<string | null>(null);

  const gradeLookup = useMemo(() => {
    const map = new Map<string, GradeSeries>();
    grades.forEach((grade) => {
      map.set(normalize(grade.name), grade);
      map.set(normalize(grade.id), grade);
    });
    return map;
  }, [grades]);

  const groupedGrades = useMemo(() => {
    return GRADE_TABS.map((tab) =>
      tab.order
        .map((name) => gradeLookup.get(normalize(name)))
        .filter((grade): grade is GradeSeries => Boolean(grade)),
    );
  }, [gradeLookup]);

  const categories = useMemo(() => {
    return GRADE_TABS.map((tab, index) => {
      const resolved = groupedGrades[index] ?? [];
      return { label: tab.label, grades: resolved };
    }).filter((category) => category.grades.length);
  }, [groupedGrades]);

  useEffect(() => {
    const firstCategory = categories[0];
    if (!activeGradeId && firstCategory?.grades[0]) {
      setActiveGradeId(firstCategory.grades[0].id);
      setOpenCategory(firstCategory.label);
    }
  }, [categories, activeGradeId]);

  const selectedGrade =
    grades.find((grade) => grade.id === activeGradeId) ??
    categories[0]?.grades[0] ??
    grades[0] ??
    null;

  return (
    <section
      className="relative isolate w-screen overflow-hidden py-32 sm:py-40"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="engraving-grades-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg"
          alt="Perazzi engraving workshop background"
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
        <div className="space-y-6 rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-10">
          <div className="space-y-3">
            <p className="text-4xl font-black italic uppercase tracking-[0.35em] text-ink">
              Engraving Grades
            </p>
            <h2
              id="engraving-grades-heading"
              className="max-w-4xl text-xl font-light italic text-ink-muted"
            >
              Commission tiers &amp; engraving houses
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
            <div className="space-y-3 rounded-3xl bg-transparent p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Grade categories
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
                            {category.grades.map((grade) => {
                              const isActive = grade.id === activeGradeId;
                              return (
                                <li key={grade.id}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveGradeId(grade.id)}
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
                <GradeCard grade={selectedGrade} />
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

function GradeCard({ grade }: { grade: GradeSeries }) {
  const heroAsset = grade.gallery?.[0];
  const ratio = heroAsset?.aspectRatio ?? 3 / 2;
  const gradeAnchor = getGradeAnchorId(grade);

  return (
    <article className="flex h-full flex-col rounded-3xl border border-border/70 bg-card/75 p-5 md:p-6 lg:p-7">
      <div className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]" style={{ aspectRatio: 16 / 9 }}>
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
          <h3 className="text-xl font-semibold uppercase tracking-[0.25em] text-black">
            {grade.name}
          </h3>
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <p className="text-sm text-ink-muted">{grade.description}</p>
        <div className="mt-auto pt-2">
          <Link
            href={`/engravings?grade=${gradeAnchor}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
          >
            View engraving
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
