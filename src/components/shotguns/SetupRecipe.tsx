"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { DisciplineSummary } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";

type SetupRecipeProps = DisciplineSummary["recipe"] & {
  defaultExpanded?: boolean;
};

export function SetupRecipe({
  poiRange,
  barrelLengths,
  ribNotes,
  defaultExpanded = false,
}: SetupRecipeProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [manualOpen, setManualOpen] = useState(defaultExpanded);
  const resolvedOpen = isDesktop ? true : manualOpen;

  return (
    <section
      className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10"
      aria-labelledby="setup-recipe-heading"
    >
      <Collapsible.Root
        open={resolvedOpen}
        onOpenChange={(next) => {
          setManualOpen(next);
          logAnalytics(`SetupRecipeToggle:${next ? "open" : "closed"}`);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="setup-recipe-heading"
            className="text-xl sm:text-2xl font-semibold text-ink"
          >
            Editorial guidance
          </h2>
          <Collapsible.Trigger
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring md:hidden"
            aria-controls="setup-recipe-content"
          >
            {resolvedOpen ? "Hide recipe" : "Show recipe"}
          </Collapsible.Trigger>
        </div>

        <Collapsible.Content
          id="setup-recipe-content"
          className="mt-4 overflow-hidden transition-all duration-300 data-[state=closed]:h-0 data-[state=closed]:opacity-0 data-[state=open]:h-auto data-[state=open]:opacity-100"
        >
          <dl className="grid gap-4 md:grid-cols-3">
            <div>
              <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                POI range
              </dt>
              <dd className="mt-2 text-sm sm:text-base leading-relaxed text-ink">
                {poiRange}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Barrel lengths
              </dt>
              <dd className="mt-2 text-sm sm:text-base leading-relaxed text-ink">
                {barrelLengths}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Rib notes
              </dt>
              <dd className="mt-2 text-sm sm:text-base leading-relaxed text-ink">
                {ribNotes}
              </dd>
            </div>
          </dl>
        </Collapsible.Content>
      </Collapsible.Root>
    </section>
  );
}
