import { WeekNav } from "./WeekNav";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BarChart } from "@/components/pgpt-insights/charts/BarChart";
import { formatCompactNumber } from "@/components/pgpt-insights/format";
import { getTriggerTermWeeks, getTriggerTermsForWeek } from "@/lib/pgpt-insights/cached";
import type { TriggerTermRow } from "@/lib/pgpt-insights/types";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const dynamic = "force-dynamic";

const WEEK_LIMIT = 16;
const TOKEN_LIMIT = 20;

function formatWeekLabel(week: string): string {
  return new Date(week).toLocaleDateString();
}

function getSelectedWeek(weeks: string[], requestedWeek?: string): string | null {
  return weeks.find((week) => week === requestedWeek) ?? weeks[0] ?? null;
}

async function getTokensForWeek(selectedWeek: string | null): Promise<TriggerTermRow[]> {
  if (!selectedWeek) return [];
  return getTriggerTermsForWeek(selectedWeek, TOKEN_LIMIT);
}

function buildBarData(tokens: TriggerTermRow[]) {
  return tokens.map((token) => ({
    label: token.token,
    value: token.hits,
  }));
}

function getWeekHeaderLabel(selectedWeek: string | null): string {
  if (!selectedWeek) return "No week selected";
  return `Week of ${formatWeekLabel(selectedWeek)}`;
}

function getChartSubtitle(selectedWeek: string | null): string {
  if (!selectedWeek) return "No data";
  return `Top ${TOKEN_LIMIT} tokens · week of ${formatWeekLabel(selectedWeek)}`;
}

function TriggerTermsEmptyState() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumb="Triggers"
        title="Trigger Terms"
        description="Weekly signals driving archetype selection."
        kicker="No data"
      />
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-xs text-muted-foreground">
        No trigger-term weeks found. The underlying view may be disabled.
      </div>
    </div>
  );
}

function TokenTable({ tokens }: Readonly<{ tokens: TriggerTermRow[] }>) {
  if (tokens.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground">No trigger terms for this week.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border/60 text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left">Token</th>
            <th className="px-3 py-2 text-right">Hits</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((row) => (
            <tr key={row.token} className="border-b border-border/50">
              <td className="px-3 py-2 max-w-40 truncate" title={row.token}>
                {row.token}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCompactNumber(row.hits)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function TriggerTermsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{ week?: string }>;
}>) {
  await withAdminAuth();
  const resolvedSearchParams = (await searchParams) ?? {};

  const weeks = await getTriggerTermWeeks(WEEK_LIMIT);

  // Graceful early exit when the materialized view returns no weeks
  if (weeks.length === 0) {
    return <TriggerTermsEmptyState />;
  }

  const selectedWeek = getSelectedWeek(weeks, resolvedSearchParams.week);

  const tokens = await getTokensForWeek(selectedWeek);
  const barData = buildBarData(tokens);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumb="Triggers"
        title="Trigger Terms"
        description="Weekly signals driving archetype selection. Powered by vw_trigger_terms_weekly."
        kicker={getWeekHeaderLabel(selectedWeek)}
      />

      <WeekNav weeks={weeks} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <BarChart
          title="Top trigger terms"
          subtitle={getChartSubtitle(selectedWeek)}
          data={barData}
        />

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border/60 px-4 py-3">
            <div className="text-sm font-semibold text-foreground">Token table</div>
            <div className="text-[11px] text-muted-foreground">Direct rows from vw_trigger_terms_weekly</div>
          </div>
          <TokenTable tokens={tokens} />
        </div>
      </div>
    </div>
  );
}
