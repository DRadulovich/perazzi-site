"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { DisciplineSummary } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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
      <Collapsible
        open={resolvedOpen}
        onOpenChange={(next) => {
          setManualOpen(next);
          logAnalytics(`SetupRecipeToggle:${next ? "open" : "closed"}`);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Heading id="setup-recipe-heading" level={2} size="lg" className="text-ink">
            Editorial guidance
          </Heading>
          <CollapsibleTrigger
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring md:hidden"
            aria-controls="setup-recipe-content"
          >
            {resolvedOpen ? "Hide recipe" : "Show recipe"}
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent
          id="setup-recipe-content"
          className="mt-4 overflow-hidden transition-all duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        >
          <dl className="grid gap-4 md:grid-cols-3">
            <div>
              <Text asChild size="xs" className="font-semibold text-ink-muted" leading="normal">
                <dt>POI range</dt>
              </Text>
              <Text asChild size="md" className="mt-2 text-ink" leading="relaxed">
                <dd>{poiRange}</dd>
              </Text>
            </div>
            <div>
              <Text asChild size="xs" className="font-semibold text-ink-muted" leading="normal">
                <dt>Barrel lengths</dt>
              </Text>
              <Text asChild size="md" className="mt-2 text-ink" leading="relaxed">
                <dd>{barrelLengths}</dd>
              </Text>
            </div>
            <div>
              <Text asChild size="xs" className="font-semibold text-ink-muted" leading="normal">
                <dt>Rib notes</dt>
              </Text>
              <Text asChild size="md" className="mt-2 text-ink" leading="relaxed">
                <dd>{ribNotes}</dd>
              </Text>
            </div>
          </dl>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
