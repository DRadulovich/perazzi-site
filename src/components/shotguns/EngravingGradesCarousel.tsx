"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { GradeSeries } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";

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
  const [activeTab, setActiveTab] = useState(0);

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

  const activeGrades =
    groupedGrades[activeTab]?.length ? groupedGrades[activeTab] : grades;

  const tabPanelId = "engraving-grades-panel";

  return (
    <section
      className="relative w-screen overflow-hidden py-32 sm:py-40"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="engraving-grades-heading"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
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
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 80%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 80%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-4xl font-bold italic uppercase tracking-[0.35em] text-ink">
              Engraving Grades
            </p>
            <h2 id="engraving-grades-heading" className="max-w-4xl text-xl font-semibold italic text-ink-muted mb-15">
              Commission tiers &amp; engraving houses
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
              onClick={() =>
                setActiveTab((index) =>
                  index === 0 ? GRADE_TABS.length - 1 : index - 1,
                )
              }
              aria-label="Previous grade group"
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring"
              onClick={() =>
                setActiveTab((index) => (index + 1) % GRADE_TABS.length)
              }
              aria-label="Next grade group"
            >
              Next
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Engraving grade categories"
          className="flex flex-wrap gap-2"
        >
          {GRADE_TABS.map((tab, index) => {
            const isActive = index === activeTab;
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={tabPanelId}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition ${
                  isActive
                    ? "border-perazzi-red bg-[color:var(--color-canvas)]/40 text-perazzi-red backdrop-blur-sm shadow-elevated"
                    : "border-border/70 bg-transparent text-ink-muted hover:border-ink/60"
                }`}
                onClick={() => setActiveTab(index)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          id={tabPanelId}
          role="tabpanel"
          aria-labelledby={`engraving-grades-heading`}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {activeGrades.map((grade) => (
            <GradeCard key={grade.id} grade={grade} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GradeCard({ grade }: { grade: GradeSeries }) {
  const heroAsset = grade.gallery?.[0];
  const ratio = heroAsset?.aspectRatio ?? 4 / 3;
  const gradeAnchor = getGradeAnchorId(grade);

  return (
    <article className="flex h-full flex-col rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/45 p-5 shadow-elevated backdrop-blur-sm">
      <div
        className="relative overflow-hidden rounded-2xl bg-[color:var(--surface-elevated)]"
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
        {heroAsset ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/60 via-transparent to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <h3 className="text-lg font-semibold text-ink">{grade.name}</h3>
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
