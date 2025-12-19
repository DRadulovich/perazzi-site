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
    <div className="space-y-8">
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
