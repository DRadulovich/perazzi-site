"use client";

import { cn } from "@/lib/utils";
import { choreoDistance, dreamyPace } from "@/lib/choreo";
import { ChoreoGroup, Heading, Text } from "@/components/ui";

type BuildStepsExpandedHeaderProps = Readonly<{
  headingId: string;
  heading: string;
  subheading: string;
  instructions: string;
  ctaLabel: string;
  skipTargetId?: string;
  headerThemeReady: boolean;
  enableTitleReveal: boolean;
  onCollapse: () => void;
  collapseLabel?: string;
}>;

export function BuildStepsExpandedHeader({
  headingId,
  heading,
  subheading,
  instructions,
  ctaLabel,
  skipTargetId,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  collapseLabel = "Collapse",
}: BuildStepsExpandedHeaderProps) {
  const headingClass = headerThemeReady ? "text-ink" : "text-white";
  const subheadingClass = headerThemeReady ? "text-ink-muted" : "text-white";
  const instructionsClass = headerThemeReady ? "text-ink-muted" : "text-white/80";

  return (
    <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-3"
      >
        <div className="relative">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className={headingClass}
          >
            {heading}
          </Heading>
        </div>
        <div className="relative">
          <Text
            size="lg"
            className={cn("type-section-subtitle", subheadingClass)}
            leading="relaxed"
          >
            {subheading}
          </Text>
        </div>
        <div className="relative">
          <Text className={cn("type-section-subtitle", instructionsClass)} leading="relaxed">
            {instructions}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ChoreoGroup
            effect="slide"
            axis="x"
            direction="left"
            distance={choreoDistance.base}
            durationMs={dreamyPace.textMs}
            easing={dreamyPace.easing}
            itemAsChild
          >
            <a
              href="#build-steps-sequence"
              className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-ink/60 text-ink hover:border-ink focus-ring"
            >
              <span>{ctaLabel}</span>
              <span aria-hidden="true">↓</span>
            </a>
          </ChoreoGroup>
          {skipTargetId ? (
            <ChoreoGroup
              effect="slide"
              axis="x"
              direction="right"
              distance={choreoDistance.base}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              delayMs={dreamyPace.staggerMs}
              itemAsChild
            >
              <a
                href={`#${skipTargetId}`}
                className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-perazzi-red/60 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                <span>Skip step-by-step</span>
                <span aria-hidden="true">→</span>
              </a>
            </ChoreoGroup>
          ) : null}
        </div>
      </ChoreoGroup>
      {enableTitleReveal ? (
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          delayMs={dreamyPace.staggerMs}
          durationMs={dreamyPace.textMs}
          easing={dreamyPace.easing}
          itemAsChild
        >
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
            onClick={onCollapse}
          >
            {collapseLabel}
          </button>
        </ChoreoGroup>
      ) : null}
    </div>
  );
}
