"use client";

import type { FittingStage } from "@/types/build";
import { buildChoreoPresenceVars, choreoDistance, dreamyPace } from "@/lib/choreo";
import { ChoreoGroup, ChoreoPresence } from "@/components/ui";

type BuildStepsRailNavProps = Readonly<{
  steps: readonly FittingStage[];
  activeStepId?: string;
  onRailClick: (index: number) => void;
}>;

export function BuildStepsRailNav({ steps, activeStepId, onRailClick }: BuildStepsRailNavProps) {
  const indicatorVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterScale: 0.98,
    exitScale: 0.98,
    enterY: 0,
    exitY: 0,
  });

  return (
    <nav className="absolute inset-x-3 top-3 z-20 hidden lg:block sm:inset-x-4 lg:inset-x-6 lg:top-4">
      <ChoreoGroup
        effect="slide"
        axis="x"
        direction="left"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="grid grid-flow-col auto-cols-fr items-center gap-2 rounded-2xl border border-border/75 bg-card/75 px-4 py-3 type-label-tight text-ink-muted shadow-soft backdrop-blur-md"
        itemAsChild
      >
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId;
          const stepNumber = index + 1;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => { onRailClick(index); }}
              aria-label={`Go to step ${stepNumber}: ${step.title}`}
              aria-current={isActive ? "step" : undefined}
              className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-transparent px-3 py-1.5 focus-ring ${
                isActive
                  ? "text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {isActive ? (
                <ChoreoPresence
                  state="enter"
                  style={indicatorVars}
                  asChild
                >
                  <span
                    className="absolute inset-0 rounded-full bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                    aria-hidden="true"
                  />
                </ChoreoPresence>
              ) : null}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full border ${
                    isActive ? "border-white/40 bg-white/85" : "border-border bg-card"
                  }`}
                  aria-hidden="true"
                />
                <span>{`Step ${stepNumber}`}</span>
              </span>
            </button>
          );
        })}
      </ChoreoGroup>
    </nav>
  );
}
