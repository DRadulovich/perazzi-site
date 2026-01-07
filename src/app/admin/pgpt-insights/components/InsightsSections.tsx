import { Suspense } from "react";

import { ArchetypesSection } from "@/components/pgpt-insights/sections/ArchetypesSection";
import { DataHealthSection } from "@/components/pgpt-insights/sections/DataHealthSection";
import { GuardrailsSection } from "@/components/pgpt-insights/sections/GuardrailsSection";
import { LogsSection } from "@/components/pgpt-insights/sections/LogsSection";
import { MetricsSection } from "@/components/pgpt-insights/sections/MetricsSection";
import { OverviewSection } from "@/components/pgpt-insights/sections/OverviewSection";
import { RagSection } from "@/components/pgpt-insights/sections/RagSection";
import { SectionSkeleton } from "@/components/pgpt-insights/sections/SectionError";
import { TopIssuesSection } from "@/components/pgpt-insights/sections/TopIssuesSection";
import { TrendsSection } from "@/components/pgpt-insights/sections/TrendsSection";

export type InsightsSearchParams = {
  env?: string;
  endpoint?: string;
  days?: string;
  q?: string;
  page?: string;
  density?: string;
  view?: string;

  gr_status?: string;
  gr_reason?: string;
  low_conf?: string;
  score?: string;
  archetype?: string;
  model?: string;
  gateway?: string;
  qa?: string;
  winner_changed?: string;
  margin_lt?: string;
  score_archetype?: string;
  min?: string;
  rerank?: string;
  snapped?: string;
};

type InsightsSectionsProps = {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  resolvedSearchParams: InsightsSearchParams;
  isTriageView: boolean;
  scopeSummary: string;
  tableDensityClass: string;
  detailsDefaultOpen: boolean;
  truncPrimary: number;
  truncSecondary: number;
  q: string;
  page: number;
  density: string;
};

export function InsightsSections({
  envFilter,
  endpointFilter,
  daysFilter,
  resolvedSearchParams,
  isTriageView,
  scopeSummary,
  tableDensityClass,
  detailsDefaultOpen,
  truncPrimary,
  truncSecondary,
  q,
  page,
  density,
}: Readonly<InsightsSectionsProps>) {
  return (
    <div className="space-y-12 lg:space-y-14">
      <Suspense fallback={<SectionSkeleton id="data-health" title="Data Health" lines={4} />}>
        <DataHealthSection envFilter={envFilter} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton id="overview" title="Overview" />}>
        <OverviewSection envFilter={envFilter} daysFilter={daysFilter} scopeSummary={scopeSummary} />
      </Suspense>

      {isTriageView ? null : (
        <Suspense fallback={<SectionSkeleton id="trends" title="Trends" lines={8} />}>
          <TrendsSection
            envFilter={envFilter}
            endpointFilter={endpointFilter}
            daysFilter={daysFilter}
            rerankFilter={resolvedSearchParams.rerank}
            snappedFilter={resolvedSearchParams.snapped}
            marginLt={resolvedSearchParams.margin_lt}
            tableDensityClass={tableDensityClass}
          />
        </Suspense>
      )}

      {isTriageView ? null : (
        <Suspense fallback={<SectionSkeleton id="top-issues" title="Top Issues" />}>
          <TopIssuesSection envFilter={envFilter} daysFilter={daysFilter} resolvedSearchParams={resolvedSearchParams} />
        </Suspense>
      )}

      {isTriageView ? null : (
        <Suspense fallback={<SectionSkeleton id="rag" title="RAG Health (assistant)" lines={6} />}>
          <RagSection
            envFilter={envFilter}
            daysFilter={daysFilter}
            tableDensityClass={tableDensityClass}
            detailsDefaultOpen={detailsDefaultOpen}
            truncSecondary={truncSecondary}
          />
        </Suspense>
      )}

      <Suspense fallback={<SectionSkeleton id="guardrails" title="Guardrail Analytics (assistant)" lines={6} />}>
        <GuardrailsSection
          envFilter={envFilter}
          daysFilter={daysFilter}
          tableDensityClass={tableDensityClass}
          detailsDefaultOpen={detailsDefaultOpen}
          truncSecondary={truncSecondary}
        />
      </Suspense>

      {isTriageView ? null : (
        <Suspense fallback={<SectionSkeleton id="archetypes" title="Archetype & Intent Analytics" lines={6} />}>
          <ArchetypesSection
            envFilter={envFilter}
            daysFilter={daysFilter}
            tableDensityClass={tableDensityClass}
            density={density === "compact" ? "compact" : "comfortable"}
          />
        </Suspense>
      )}

      {isTriageView ? null : (
        <Suspense fallback={<SectionSkeleton id="metrics" title="Metrics (Tokens & Latency)" lines={6} />}>
          <MetricsSection
            envFilter={envFilter}
            daysFilter={daysFilter}
            tableDensityClass={tableDensityClass}
            rerankFilter={resolvedSearchParams.rerank}
            snappedFilter={resolvedSearchParams.snapped}
            marginLt={resolvedSearchParams.margin_lt}
          />
        </Suspense>
      )}

      <Suspense fallback={<SectionSkeleton id="logs" title="Recent Interactions" lines={6} />}>
        <LogsSection
          envFilter={envFilter}
          endpointFilter={endpointFilter}
          daysFilter={daysFilter}
          q={q}
          page={page}
          resolvedSearchParams={resolvedSearchParams}
          tableDensityClass={tableDensityClass}
          truncPrimary={truncPrimary}
        />
      </Suspense>
    </div>
  );
}
