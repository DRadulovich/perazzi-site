import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getLowMarginSessions } from "@/lib/pgpt-insights/cached";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const dynamic = "force-dynamic";

function formatMargin(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export default async function QualityPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{ days?: string; threshold?: string; streak?: string }>;
}>) {
  await withAdminAuth();
  const resolvedSearchParams = (await searchParams) ?? {};

  const daysRaw = Number.parseInt(resolvedSearchParams.days ?? "45", 10);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 120) : 45;

  const thresholdRaw = Number.parseFloat(resolvedSearchParams.threshold ?? "0.05");
  const threshold = Number.isFinite(thresholdRaw) && thresholdRaw > 0 ? thresholdRaw : 0.05;

  const streakRaw = Number.parseInt(resolvedSearchParams.streak ?? "3", 10);
  const minStreak = Number.isFinite(streakRaw) && streakRaw > 0 ? streakRaw : 3;

  // NOTE: We intentionally cap the result set to the most recent 50 sessions for now.
  // This avoids silent truncation at an arbitrary number (was 80) and keeps UI fast.
  // Future improvement: add pagination or total-count display.
  const limit = 50;
  const rows = await getLowMarginSessions(days, threshold, minStreak, limit);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumb="Quality"
        title="Low-Margin Sessions"
        description="Sessions with ≥ consecutive low-margin archetype calls. Useful for drift and A/B regressions."
        kicker={`Margin < ${(threshold * 100).toFixed(1)}% · streak ≥ ${minStreak} · last ${days} days · latest ${limit}`}
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Sessions</div>
          <div className="text-[11px] text-muted-foreground">
            Returns sessions where margin &lt; {(threshold * 100).toFixed(1)}% on ≥ {minStreak} consecutive turns.
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground">No sessions matched the criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 text-left">Session</th>
                  <th className="px-3 py-2 text-right">Longest streak</th>
                  <th className="px-3 py-2 text-right">Low turns</th>
                  <th className="px-3 py-2 text-right">Last margin</th>
                  <th className="px-3 py-2 text-right">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.session_id} className="border-b border-border/50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/pgpt-insights/session/${row.session_id}`}
                        className="text-blue-600 underline"
                      >
                        {row.session_id}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.longest_streak}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.low_turn_count}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMargin(row.last_margin)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {row.last_seen
                        ? new Date(row.last_seen).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
