import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BarChart } from "@/components/pgpt-insights/charts/BarChart";
import { formatCompactNumber } from "@/components/pgpt-insights/format";
import { getTriggerTermWeeks, getTriggerTermsForWeek } from "@/lib/pgpt-insights/cached";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const dynamic = "force-dynamic";

export default async function TriggerTermsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{ week?: string }>;
}>) {
  await withAdminAuth();
  const resolvedSearchParams = (await searchParams) ?? {};

  const weeks = await getTriggerTermWeeks(16);
  const selectedWeek =
    weeks.find((w) => w === resolvedSearchParams.week) ??
    weeks[0] ??
    null;

  const tokens = selectedWeek ? await getTriggerTermsForWeek(selectedWeek, 20) : [];

  const barData = tokens.map((t) => ({
    label: t.token,
    value: t.hits,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumb="Triggers"
        title="Trigger Terms"
        description="Weekly signals driving archetype selection. Powered by vw_trigger_terms_weekly."
        kicker={selectedWeek ? `Week of ${new Date(selectedWeek).toLocaleDateString()}` : "No week selected"}
      />

      <div className="flex flex-wrap items-center gap-2">
        {weeks.length === 0 ? (
          <span className="text-xs text-muted-foreground">No weeks found.</span>
        ) : (
          weeks.map((week) => {
            const isActive = week === selectedWeek;
            return (
              <Link
                key={week}
                href={`/admin/pgpt-insights/triggers?week=${week}`}
                className={`inline-flex items-center rounded-lg border px-3 py-1 text-[11px] font-semibold transition ${
                  isActive
                    ? "border-blue-500/60 bg-blue-500/10 text-blue-700"
                    : "border-border bg-muted/40 text-foreground hover:bg-muted/60"
                }`}
              >
                {new Date(week).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Link>
            );
          })
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <BarChart
          title="Top trigger terms"
          subtitle={selectedWeek ? `Top 20 tokens · week of ${new Date(selectedWeek).toLocaleDateString()}` : "No data"}
          data={barData}
        />

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border/60 px-4 py-3">
            <div className="text-sm font-semibold text-foreground">Token table</div>
            <div className="text-[11px] text-muted-foreground">Direct rows from vw_trigger_terms_weekly</div>
          </div>
          {tokens.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">No trigger terms for this week.</div>
          ) : (
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
                      <td className="px-3 py-2">{row.token}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCompactNumber(row.hits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
