import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DEFAULT_DAYS_WINDOW, LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";

import { QaReviewLink } from "../../../components/pgpt-insights/QaReviewLink";
import { FiltersBar } from "../../../components/pgpt-insights/FiltersBar";
import { ArchetypeFiltersBar } from "../../../components/pgpt-insights/archetype/ArchetypeFiltersBar";
import { SectionSkeleton } from "../../../components/pgpt-insights/sections/SectionError";

import { OverviewSection } from "../../../components/pgpt-insights/sections/OverviewSection";
import { TopIssuesSection } from "../../../components/pgpt-insights/sections/TopIssuesSection";
import { RagSection } from "../../../components/pgpt-insights/sections/RagSection";
import { GuardrailsSection } from "../../../components/pgpt-insights/sections/GuardrailsSection";
import { ArchetypesSection } from "../../../components/pgpt-insights/sections/ArchetypesSection";
import { MetricsSection } from "../../../components/pgpt-insights/sections/MetricsSection";
import { LogsSection } from "../../../components/pgpt-insights/sections/LogsSection";
import { TrendsSection } from "../../../components/pgpt-insights/sections/TrendsSection";

export const dynamic = "force-dynamic";

type SearchParams = {
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
};

export default async function PgptInsightsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  const envFilter =
    resolvedSearchParams.env && resolvedSearchParams.env !== "all" ? resolvedSearchParams.env : undefined;

  const endpointFilter =
    resolvedSearchParams.endpoint && resolvedSearchParams.endpoint !== "all"
      ? resolvedSearchParams.endpoint
      : undefined;

  const daysParam = resolvedSearchParams.days;
  const daysFilter =
    daysParam === "all"
      ? undefined
      : Number.parseInt(daysParam ?? String(DEFAULT_DAYS_WINDOW), 10) || DEFAULT_DAYS_WINDOW;

  const qRaw = (resolvedSearchParams.q ?? "").trim();
  const q = qRaw.length > 0 ? qRaw.slice(0, 500) : "";

  const page = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1);

  const densityParam = resolvedSearchParams.density;
  const density = densityParam === "compact" ? "compact" : "comfortable";
  const isCompact = density === "compact";

  const tableDensityClass = isCompact ? "[&_td]:!py-1 [&_th]:!py-1" : "[&_td]:!py-2 [&_th]:!py-2";
  const detailsDefaultOpen = !isCompact;

  const truncPrimary = isCompact ? 120 : 180;
  const truncSecondary = isCompact ? 120 : 140;

  const viewParam = resolvedSearchParams.view;
  const view = viewParam === "triage" ? "triage" : "full";
  const isTriageView = view === "triage";

  const scopeSummary = [
    envFilter ? `env: ${envFilter}` : "env: all",
    endpointFilter ? `endpoint: ${endpointFilter}` : "endpoint: all",
    daysFilter ? `last ${daysFilter} days` : "all time",
  ].join(" · ");

  return (
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden">
      <main className="mx-auto w-full max-w-6xl min-w-0 px-6 py-12 md:py-14 space-y-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Perazzi · Workshop</p>
            <h1 className="text-2xl font-semibold tracking-tight">PerazziGPT Insights</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase text-muted-foreground">Internal</span>
            <Suspense fallback={<span className="text-xs text-blue-600 underline">QA Review</span>}>
              <QaReviewLink prefix="QA Review" className="text-xs text-blue-600 underline" />
            </Suspense>
          </div>
        </header>

        <FiltersBar defaultDays={DEFAULT_DAYS_WINDOW} />
        <ArchetypeFiltersBar />

        <Suspense fallback={<SectionSkeleton id="overview" title="Overview" />}>
          <OverviewSection envFilter={envFilter} daysFilter={daysFilter} scopeSummary={scopeSummary} />
        </Suspense>

        {!isTriageView ? (
          <Suspense fallback={<SectionSkeleton id="trends" title="Trends" lines={8} />}>
            <TrendsSection envFilter={envFilter} endpointFilter={endpointFilter} daysFilter={daysFilter} />
          </Suspense>
        ) : null}

        {!isTriageView ? (
          <Suspense fallback={<SectionSkeleton id="top-issues" title="Top Issues" />}>
            <TopIssuesSection envFilter={envFilter} daysFilter={daysFilter} resolvedSearchParams={resolvedSearchParams} />
          </Suspense>
        ) : null}

        {/* ✅ Key layout fix: minmax(0,1fr) + min-w-0 to allow wide tables to scroll INSIDE their wrappers */}
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start min-w-0">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-2xl border border-border bg-card shadow-sm p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Sections</div>

              <div className="mt-3 flex flex-col gap-1 text-xs">
                {isTriageView ? (
                  <>
                    <a href="#overview" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Overview
                    </a>
                    <a href="#guardrails" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Guardrails
                    </a>
                    <a href="#logs" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Logs
                    </a>
                    <div className="my-2 border-t border-border" />
                    <QaReviewLink prefix="QA" className="rounded-md px-2 py-1 hover:bg-muted/30" />
                  </>
                ) : (
                  <>
                    <a href="#top-issues" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Top Issues
                    </a>
                    <a href="#rag" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      RAG
                    </a>
                    <a href="#guardrails" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Guardrails
                    </a>
                    <a href="#archetypes" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Archetypes
                    </a>
                    <a href="#metrics" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Metrics
                    </a>
                    <a href="#logs" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Logs
                    </a>
                    <div className="my-2 border-t border-border" />
                    <QaReviewLink prefix="QA" className="rounded-md px-2 py-1 hover:bg-muted/30" />
                  </>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Legend</div>

                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500/70" aria-hidden="true" />
                    <span>Guardrail blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500/70" aria-hidden="true" />
                    <span>Low confidence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500/70" aria-hidden="true" />
                    <span>Low maxScore (&lt; {LOW_SCORE_THRESHOLD})</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                Density: <span className="font-medium text-foreground">{density}</span>
              </div>
            </div>
          </aside>

          {/* ✅ Key layout fix: min-w-0 on the content column so it can shrink and allow inner overflow-x-auto areas to work */}
          <div className="space-y-10 min-w-0">
            {/* Mobile nav + legend */}
            <div className="space-y-3 lg:hidden">
              <nav className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {isTriageView ? (
                  <>
                    <a href="#overview" className="underline underline-offset-4 hover:text-foreground">
                      Overview
                    </a>
                    <a href="#guardrails" className="underline underline-offset-4 hover:text-foreground">
                      Guardrails
                    </a>
                    <a href="#logs" className="underline underline-offset-4 hover:text-foreground">
                      Logs
                    </a>
                    <Suspense fallback={<span className="underline underline-offset-4">QA</span>}>
                      <QaReviewLink prefix="QA" className="underline underline-offset-4 hover:text-foreground" />
                    </Suspense>
                  </>
                ) : (
                  <>
                    <a href="#top-issues" className="underline underline-offset-4 hover:text-foreground">
                      Top Issues
                    </a>
                    <a href="#rag" className="underline underline-offset-4 hover:text-foreground">
                      RAG
                    </a>
                    <a href="#guardrails" className="underline underline-offset-4 hover:text-foreground">
                      Guardrails
                    </a>
                    <a href="#archetypes" className="underline underline-offset-4 hover:text-foreground">
                      Archetypes
                    </a>
                    <a href="#metrics" className="underline underline-offset-4 hover:text-foreground">
                      Metrics
                    </a>
                    <a href="#logs" className="underline underline-offset-4 hover:text-foreground">
                      Logs
                    </a>
                    <Suspense fallback={<span className="underline underline-offset-4">QA</span>}>
                      <QaReviewLink prefix="QA" className="underline underline-offset-4 hover:text-foreground" />
                    </Suspense>
                  </>
                )}
              </nav>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500/70" aria-hidden="true" />
                  <span>Red = guardrail blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500/70" aria-hidden="true" />
                  <span>Amber = low confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500/70" aria-hidden="true" />
                  <span>Yellow = low maxScore (&lt; {LOW_SCORE_THRESHOLD})</span>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  Density: <span className="font-medium text-foreground">{density}</span>
                </div>
              </div>
            </div>

            {!isTriageView ? (
              <Suspense fallback={<SectionSkeleton id="rag" title="RAG Health (assistant)" lines={6} />}>
                <RagSection
                  envFilter={envFilter}
                  daysFilter={daysFilter}
                  tableDensityClass={tableDensityClass}
                  detailsDefaultOpen={detailsDefaultOpen}
                  truncSecondary={truncSecondary}
                />
              </Suspense>
            ) : null}

            <Suspense fallback={<SectionSkeleton id="guardrails" title="Guardrail Analytics (assistant)" lines={6} />}>
              <GuardrailsSection
                envFilter={envFilter}
                daysFilter={daysFilter}
                tableDensityClass={tableDensityClass}
                detailsDefaultOpen={detailsDefaultOpen}
                truncSecondary={truncSecondary}
              />
            </Suspense>

            {!isTriageView ? (
              <Suspense fallback={<SectionSkeleton id="archetypes" title="Archetype & Intent Analytics" lines={6} />}>
                <ArchetypesSection envFilter={envFilter} daysFilter={daysFilter} tableDensityClass={tableDensityClass} />
              </Suspense>
            ) : null}

            {!isTriageView ? (
              <Suspense fallback={<SectionSkeleton id="metrics" title="Metrics (Tokens & Latency)" lines={6} />}>
                <MetricsSection envFilter={envFilter} daysFilter={daysFilter} tableDensityClass={tableDensityClass} />
              </Suspense>
            ) : null}

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
                isCompact={isCompact}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
