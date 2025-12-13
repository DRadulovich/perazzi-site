"use client";

import { useMemo, useState } from "react";
import type { PgptSessionTimelineRow } from "../../../lib/pgpt-insights/types";
import { ArchetypeStackedBar, computeWinnerAndRunner } from "../archetype/ArchetypeStackedBar";
import { formatTimestampShort } from "../format";

type Mode = "instant" | "rolling5";
type EndpointFilter = "all" | "assistant" | "user";

function isRecord(v: unknown): v is Record<string, number> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalize(scores: Record<string, number> | null) {
  if (!scores) return null;
  const keys = ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"] as const;
  const arr = keys.map((k) => clamp01(Number(scores[k] ?? 0)));
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  return {
    Loyalist: arr[0] / sum,
    Prestige: arr[1] / sum,
    Analyst: arr[2] / sum,
    Achiever: arr[3] / sum,
    Legacy: arr[4] / sum,
  } as const;
}

export function SessionArchetypeTimeline({ rows }: { rows: PgptSessionTimelineRow[] }) {
  const [mode, setMode] = useState<Mode>("instant");
  const [endpointFilter, setEndpointFilter] = useState<EndpointFilter>("all");

  const filtered = useMemo(() => {
    if (endpointFilter === "all") return rows;
    return rows.filter((r) => r.endpoint === endpointFilter);
  }, [rows, endpointFilter]);

  const computed = useMemo(() => {
    if (mode === "instant") return filtered;

    // rolling5 smoothing over scores; leaves rows w/out scores as-is
    const window = 5;
    const out: PgptSessionTimelineRow[] = [];

    for (let i = 0; i < filtered.length; i++) {
      const slice = filtered.slice(Math.max(0, i - window + 1), i + 1);

      const agg: Record<string, number> = { Loyalist: 0, Prestige: 0, Analyst: 0, Achiever: 0, Legacy: 0 };
      let n = 0;

      for (const r of slice) {
        if (!isRecord(r.archetype_scores)) continue;
        const norm = normalize(r.archetype_scores);
        if (!norm) continue;
        agg.Loyalist += norm.Loyalist;
        agg.Prestige += norm.Prestige;
        agg.Analyst += norm.Analyst;
        agg.Achiever += norm.Achiever;
        agg.Legacy += norm.Legacy;
        n += 1;
      }

      if (n > 0) {
        agg.Loyalist /= n;
        agg.Prestige /= n;
        agg.Analyst /= n;
        agg.Achiever /= n;
        agg.Legacy /= n;
      }

      const normAgg = n > 0 ? normalize(agg) : null;

      out.push({
        ...filtered[i],
        archetype_scores: normAgg ? (normAgg as any) : filtered[i].archetype_scores,
      });
    }

    return out;
  }, [filtered, mode]);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Archetype Adaptation</h2>
          <p className="text-xs text-muted-foreground">
            One row per interaction. Stacked bars show the archetype distribution (if logged).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs">
            <label htmlFor="arch-mode" className="mr-2 text-muted-foreground">
              Mode
            </label>
            <select
              id="arch-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="h-9 rounded-md border bg-background px-2 text-xs"
            >
              <option value="instant">instant</option>
              <option value="rolling5">rolling (5)</option>
            </select>
          </div>

          <div className="text-xs">
            <label htmlFor="arch-endpoint" className="mr-2 text-muted-foreground">
              Endpoint
            </label>
            <select
              id="arch-endpoint"
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value as EndpointFilter)}
              className="h-9 rounded-md border bg-background px-2 text-xs"
            >
              <option value="all">all</option>
              <option value="assistant">assistant</option>
              <option value="user">user</option>
            </select>
          </div>
        </div>
      </div>

      {computed.length === 0 ? (
        <div className="text-xs text-muted-foreground">No rows.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[980px] table-fixed text-xs">
            <colgroup>
              <col className="w-[180px]" />
              <col className="w-[110px]" />
              <col className="w-[520px]" />
              <col className="w-[170px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2 text-left text-muted-foreground font-medium">
                  time
                </th>
                <th scope="col" className="px-3 py-2 text-left text-muted-foreground font-medium">
                  endpoint
                </th>
                <th scope="col" className="px-3 py-2 text-left text-muted-foreground font-medium">
                  distribution
                </th>
                <th scope="col" className="px-3 py-2 text-left text-muted-foreground font-medium">
                  winner
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {computed.map((r, idx) => {
                const scores = (r.archetype_scores ?? null) as any;
                const norm = scores && typeof scores === "object" ? scores : null;

                let winnerText = r.archetype ?? "—";
                let marginPp: number | null = typeof r.archetype_confidence === "number" ? Math.round(r.archetype_confidence * 100) : null;

                if (norm) {
                  const { winner, runner, margin } = computeWinnerAndRunner(norm);
                  winnerText = winner.k;
                  marginPp = Math.round(margin * 100);
                }

                const prevWinner = idx > 0 ? (computed[idx - 1].archetype ?? null) : null;
                const changed = prevWinner && winnerText !== "—" && prevWinner !== winnerText;

                return (
                  <tr key={r.id} className={changed ? "bg-muted/15" : undefined}>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatTimestampShort(r.created_at)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.endpoint}</td>
                    <td className="px-3 py-2">
                      <ArchetypeStackedBar scores={norm} heightClass="h-2.5" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-foreground">
                        {winnerText}
                        {marginPp !== null ? <span className="text-muted-foreground"> · +{marginPp}pp</span> : null}
                        {changed ? <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">flip</span> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
