import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminSidebarPortal } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { QaReviewLink } from "@/components/pgpt-insights/QaReviewLink";
import { DEFAULT_DAYS_WINDOW } from "@/lib/pgpt-insights/constants";
import { InsightsFilters, InsightsSidebarFilters } from "./components/InsightsFilters";
import { InsightsOnPageRail } from "./components/InsightsOnPageRail";
import { InsightsSections, type InsightsSearchParams } from "./components/InsightsSections";

export const dynamic = "force-dynamic";

type SearchParams = InsightsSearchParams;

type PgptInsightsPageProps = Readonly<{
  searchParams?: Promise<SearchParams>;
}>;

type DensityConfig = {
  density: "compact" | "comfortable";
  tableDensityClass: string;
  detailsDefaultOpen: boolean;
  truncPrimary: number;
  truncSecondary: number;
};

type FiltersConfig = {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
};

const MAX_QUERY_LENGTH = 500;

function ensurePgptInsightsAccess() {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }
}

function resolveFilters(params: SearchParams, defaultDays: number): FiltersConfig {
  const envFilter = params.env && params.env !== "all" ? params.env : undefined;
  const endpointFilter = params.endpoint && params.endpoint !== "all" ? params.endpoint : undefined;
  const daysParam = params.days;
  const daysFilter = daysParam === "all" ? undefined : Number.parseInt(daysParam ?? String(defaultDays), 10) || defaultDays;

  return { envFilter, endpointFilter, daysFilter };
}

function resolveQuery(params: SearchParams): string {
  const qRaw = (params.q ?? "").trim();
  return qRaw.length > 0 ? qRaw.slice(0, MAX_QUERY_LENGTH) : "";
}

function resolvePage(params: SearchParams): number {
  return Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
}

function resolveDensity(params: SearchParams): DensityConfig {
  const density = params.density === "compact" ? "compact" : "comfortable";
  const isCompact = density === "compact";

  return {
    density,
    tableDensityClass: isCompact ? "[&_td]:!py-1 [&_th]:!py-1" : "[&_td]:!py-2 [&_th]:!py-2",
    detailsDefaultOpen: !isCompact,
    truncPrimary: isCompact ? 120 : 180,
    truncSecondary: isCompact ? 120 : 140,
  };
}

function resolveIsTriageView(params: SearchParams): boolean {
  return params.view === "triage";
}

function buildScopeSummary({ envFilter, endpointFilter, daysFilter }: FiltersConfig): string {
  return [
    envFilter ? `env: ${envFilter}` : "env: all",
    endpointFilter ? `endpoint: ${endpointFilter}` : "endpoint: all",
    daysFilter ? `last ${daysFilter} days` : "all time",
  ].join(" · ");
}

export default async function PgptInsightsPage({ searchParams }: PgptInsightsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  ensurePgptInsightsAccess();

  const { envFilter, endpointFilter, daysFilter } = resolveFilters(resolvedSearchParams, DEFAULT_DAYS_WINDOW);
  const q = resolveQuery(resolvedSearchParams);
  const page = resolvePage(resolvedSearchParams);
  const { density, tableDensityClass, detailsDefaultOpen, truncPrimary, truncSecondary } = resolveDensity(
    resolvedSearchParams,
  );
  const isTriageView = resolveIsTriageView(resolvedSearchParams);
  const scopeSummary = buildScopeSummary({ envFilter, endpointFilter, daysFilter });

  return (
    <div className="space-y-10 pb-10">
      <AdminSidebarPortal>
        <div className="space-y-4">
          <InsightsOnPageRail isTriageView={isTriageView} density={density} />
          <InsightsSidebarFilters defaultDays={DEFAULT_DAYS_WINDOW} />
        </div>
      </AdminSidebarPortal>

      <AdminPageHeader
        breadcrumb="Insights"
        title="PerazziGPT Insights"
        description="Overview, guardrails, retrieval health, and live logs."
        kicker={scopeSummary}
        actions={
          <Suspense fallback={<span className="text-xs text-muted-foreground">QA Review</span>}>
            <QaReviewLink prefix="QA Review" className="text-xs font-medium text-blue-600 underline" />
          </Suspense>
        }
      />

      <InsightsFilters />

      <InsightsSections
        envFilter={envFilter}
        endpointFilter={endpointFilter}
        daysFilter={daysFilter}
        resolvedSearchParams={resolvedSearchParams}
        isTriageView={isTriageView}
        scopeSummary={scopeSummary}
        tableDensityClass={tableDensityClass}
        detailsDefaultOpen={detailsDefaultOpen}
        truncPrimary={truncPrimary}
        truncSecondary={truncSecondary}
        q={q}
        page={page}
        density={density}
      />
    </div>
  );
}
