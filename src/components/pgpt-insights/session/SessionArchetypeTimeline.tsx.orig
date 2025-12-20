"use client";

import { useMemo, useState } from "react";
import type { PgptSessionTimelineRow } from "../../../lib/pgpt-insights/types";
import { ArchetypeStackedBar, computeWinnerAndRunner } from "../archetype/ArchetypeStackedBar";
import { formatTimestampShort } from "../format";

type Mode = "instant" | "rolling5";
type EndpointFilter = "all" | "assistant" | "user";
const archetypeKeys = ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"] as const;
type ArchetypeKey = (typeof archetypeKeys)[number];
type ArchetypeScoreMap = Record<ArchetypeKey, number>;
type ArchetypeScoreInput = Partial<Record<ArchetypeKey, number>> | Record<string, number> | null;

function StatusBadge({ state }: { state: "snapped" | "mixed" | "unknown" }) {
  const cls =
    state === "snapped"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      : state === "mixed"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-border bg-background text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide tabular-nums ${cls}`}
    >
      {state}
    </span>
  );
}

function isRecord(v: unknown): v is Record<string, number> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalize(scores: ArchetypeScoreInput): ArchetypeScoreMap | null {
  if (!scores) return null;
  const arr = archetypeKeys.map((k) => clamp01(Number(scores[k] ?? 0)));
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  return {
    Loyalist: arr[0] / sum,
    Prestige: arr[1] / sum,
    Analyst: arr[2] / sum,
    Achiever: arr[3] / sum,
    Legacy: arr[4] / sum,
  };
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

      const agg: ArchetypeScoreMap = { Loyalist: 0, Prestige: 0, Analyst: 0, Achiever: 0, Legacy: 0 };
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
        archetype_scores: (normAgg ?? filtered[i].archetype_scores) as PgptSessionTimelineRow["archetype_scores"],
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
            One row per interaction. Stacked bars show the archetype distribution (if logged). Rolling (5) smooths the bars; snapped/mixed reflects the logged per-turn decision.
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
                const snappedRaw = r.archetype_snapped;
                const state: "snapped" | "mixed" | "unknown" =
                  snappedRaw === true ? "snapped" : snappedRaw === false ? "mixed" : "unknown";

                const scores = isRecord(r.archetype_scores) ? r.archetype_scores : null;
                const norm = normalize(scores);

                let winnerText = r.archetype ?? "—";
                let runnerText: string | null = null;
                let computedMargin: number | null = null;
                let winnerPct: number | null = null;
                let runnerPct: number | null = null;

                if (norm) {
                  const { winner, runner, margin } = computeWinnerAndRunner(norm);
                  winnerText = winner.k;
                  runnerText = runner?.k ?? null;
                  computedMargin = margin;
                  winnerPct = winner.v;
                  runnerPct = runner?.v ?? null;
                }

                const rowMargin =
                  typeof r.archetype_confidence_margin === "number"
                    ? r.archetype_confidence_margin
                    : null;

                const marginToShow = rowMargin ?? computedMargin;
                const marginPp = typeof marginToShow === "number" ? Math.round(marginToShow * 100) : null;

                const legacyConf = typeof r.archetype_confidence === "number" ? r.archetype_confidence : null;
                const legacyConfPct = legacyConf !== null ? Math.round(legacyConf * 100) : null;

                let prevWinnerText: string | null = null;
                if (idx > 0) {
                  const prev = computed[idx - 1];
                  const prevScores = isRecord(prev.archetype_scores) ? prev.archetype_scores : null;
                  const prevNorm = normalize(prevScores);
                  if (prevNorm) {
                    prevWinnerText = computeWinnerAndRunner(prevNorm).winner.k;
                  } else if (prev.archetype) {
                    prevWinnerText = prev.archetype;
                  }
                }

                const changed = prevWinnerText && winnerText !== "—" && prevWinnerText !== winnerText;

                const hoverTitle = [
                  `endpoint: ${r.endpoint}`,
                  `state: ${state}`,
                  `winner: ${winnerText}${winnerPct !== null ? ` (${Math.round(winnerPct * 100)}%)` : ""}`,
                  runnerText
                    ? `runner-up: ${runnerText}${runnerPct !== null ? ` (${Math.round(runnerPct * 100)}%)` : ""}`
                    : null,
                  marginPp !== null ? `margin: +${marginPp}pp` : null,
                  marginPp === null && legacyConfPct !== null ? `conf: ${legacyConfPct}%` : null,
                ]
                  .filter(Boolean)
                  .join("\n");

                return (
                  <tr key={r.id} className={changed ? "bg-muted/15" : undefined}>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatTimestampShort(r.created_at)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.endpoint}</td>
                    <td className="px-3 py-2">
                      <ArchetypeStackedBar scores={norm} heightClass="h-2.5" />
                    </td>
                    <td className="px-3 py-2" title={hoverTitle}>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <span>{winnerText}</span>
                        <StatusBadge state={state} />
                        {changed ? <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">flip</span> : null}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                        {marginPp !== null ? (
                          <>margin +{marginPp}pp</>
                        ) : legacyConfPct !== null ? (
                          <>conf {legacyConfPct}%</>
                        ) : (
                          <>—</>
                        )}
                        {runnerText ? <> · runner-up {runnerText}</> : null}
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
