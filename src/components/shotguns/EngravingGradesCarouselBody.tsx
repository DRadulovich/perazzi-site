"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { GradeSeries } from "@/types/catalog";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { cn } from "@/lib/utils";
import {
  buildChoreoPresenceVars,
  choreoDistance,
  choreoDurations,
  choreoStagger,
  dreamyPace,
  prefersReducedMotion,
  type ChoreoPresenceState,
} from "@/lib/choreo";
import {
  ChoreoGroup,
  ChoreoPresence,
  Heading,
  Text,
} from "@/components/ui";

import type { EngravingCategory } from "./EngravingGradesCarouselData";

type EngravingGradesBodyProps = Readonly<{
  categories: EngravingCategory[];
  resolvedOpenCategory: string | null;
  activeGradeId: string | null;
  setOpenCategory: Dispatch<SetStateAction<string | null>>;
  setActiveGradeId: Dispatch<SetStateAction<string | null>>;
  selectedGrade: GradeSeries | null;
  ctaLabel: string;
}>;

export function EngravingGradesCarouselBody({
  categories,
  resolvedOpenCategory,
  activeGradeId,
  setOpenCategory,
  setActiveGradeId,
  selectedGrade,
  ctaLabel,
}: EngravingGradesBodyProps) {
  const reduceMotion = prefersReducedMotion();
  const [displayGrade, setDisplayGrade] = useState<GradeSeries | null>(selectedGrade);
  const [presenceState, setPresenceState] = useState<ChoreoPresenceState>("enter");
  const presenceTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const presenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterY: choreoDistance.tight,
    exitY: choreoDistance.tight,
    enterScale: 0.98,
    exitScale: 0.98,
    enterBlur: 2,
    exitBlur: 2,
  });
  const underlayVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterScale: 0.96,
    exitScale: 0.96,
    enterY: 0,
    exitY: 0,
  });

  useEffect(() => (
    () => {
      if (presenceTimeoutRef.current) {
        globalThis.clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = null;
      }
      if (exitTimeoutRef.current) {
        globalThis.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
  ), []);

  useEffect(() => {
    if (!selectedGrade) return;
    if (presenceTimeoutRef.current) {
      globalThis.clearTimeout(presenceTimeoutRef.current);
      presenceTimeoutRef.current = null;
    }
    if (exitTimeoutRef.current) {
      globalThis.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (reduceMotion || selectedGrade.id === displayGrade?.id) {
      exitTimeoutRef.current = globalThis.setTimeout(() => {
        setDisplayGrade(selectedGrade);
        setPresenceState("enter");
        exitTimeoutRef.current = null;
      }, 0);
      return;
    }

    exitTimeoutRef.current = globalThis.setTimeout(() => {
      setPresenceState("exit");
      exitTimeoutRef.current = null;
    }, 0);
    presenceTimeoutRef.current = globalThis.setTimeout(() => {
      setDisplayGrade(selectedGrade);
      setPresenceState("enter");
      presenceTimeoutRef.current = null;
    }, dreamyPace.staggerMs);
  }, [displayGrade?.id, reduceMotion, selectedGrade]);

  return (
    <div id="engraving-grades-body" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
        <div className="space-y-3 rounded-2xl bg-transparent p-4 sm:rounded-3xl sm:p-5">
          <ChoreoGroup
            effect="fade-lift"
            distance={choreoDistance.tight}
            durationMs={choreoDurations.base}
            staggerMs={choreoStagger.tight}
            itemAsChild
          >
            <Text size="label-tight" className="type-label-tight text-ink-muted" leading="normal">
              Grade categories
            </Text>
          </ChoreoGroup>
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
              const isOpen = resolvedOpenCategory === category.label;
              return (
                <div
                  key={category.label}
                  className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm sm:bg-card/75"
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
                        "overflow-hidden transition-[max-height] duration-300 ease-out",
                        isOpen ? "max-h-80" : "max-h-0",
                      )}
                      aria-hidden={!isOpen}
                    >
                      <div className="p-3">
                        {isOpen ? (
                          <ChoreoGroup
                            effect="fade-lift"
                            distance={choreoDistance.tight}
                            durationMs={choreoDurations.base}
                            staggerMs={choreoStagger.tight}
                            className="space-y-1"
                            itemAsChild
                          >
                            {category.grades.map((grade) => {
                              const isActive = grade.id === activeGradeId;
                              return (
                                <div key={grade.id}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveGradeId(grade.id)}
                                    className={cn(
                                      "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left focus-ring",
                                      isActive
                                        ? "text-white"
                                        : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
                                    )}
                                    aria-pressed={isActive}
                                  >
                                    {isActive ? (
                                      <ChoreoPresence
                                        state="enter"
                                        style={underlayVars}
                                        asChild
                                      >
                                        <span
                                          className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                          aria-hidden="true"
                                        />
                                      </ChoreoPresence>
                                    ) : null}
                                    <span
                                      className={cn(
                                        "relative z-10 block type-body-title text-base uppercase",
                                        isActive ? "text-white" : "text-ink-muted",
                                      )}
                                    >
                                      {grade.name}
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </ChoreoGroup>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </ChoreoGroup>
        </div>

        <div className="min-h-104">
          {displayGrade ? (
            <ChoreoPresence
              state={presenceState}
              style={presenceVars}
              className="h-full"
            >
              <GradeCard grade={displayGrade} ctaLabel={ctaLabel} />
            </ChoreoPresence>
          ) : (
            <Text className="text-ink-muted" leading="normal">
              Select a grade to view details.
            </Text>
          )}
        </div>
      </div>
    </div>
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
    <article className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-5 sm:shadow-elevated lg:p-6">
      <ChoreoGroup
        effect="scale-parallax"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        scaleFrom={1.02}
        itemAsChild
      >
        <div
          className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
          style={{ "--aspect-ratio": ratio }}
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
            <Text
              asChild
              className="flex h-full items-center justify-center text-ink-muted"
              leading="normal"
            >
              <div>Imagery coming soon</div>
            </Text>
          )}
        </div>
      </ChoreoGroup>
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.tight}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="mt-4 flex flex-1 flex-col gap-3"
        itemAsChild
      >
        <Text size="label-tight" className="type-card-title text-perazzi-red" leading="normal">
          Engraving Grade
        </Text>
        <Heading
          level={3}
          size="md"
          className="type-body-title text-ink text-xl sm:text-2xl lg:text-3xl uppercase not-italic"
        >
          {grade.name}
        </Heading>
        <Text className="type-body text-ink-muted" leading="normal">
          {grade.description}
        </Text>
        <div className="mt-auto pt-2">
          <Link
            href={`/engravings?grade=${gradeAnchor}`}
            className="engraving-cta-link type-button inline-flex items-center justify-center gap-2 rounded-sm border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
          >
            <span className="relative">
              {ctaLabel}
              <span className="engraving-cta-underline" aria-hidden="true" />
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </ChoreoGroup>
    </article>
  );
}
