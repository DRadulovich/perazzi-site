/* eslint-disable react-hooks/error-boundaries */
import { CANONICAL_ARCHETYPE_ORDER } from "../../../lib/pgpt-insights/constants";
import { getArchetypeIntentStats, getArchetypeSummary } from "../../../lib/pgpt-insights/cached";

import { ArchetypeBars } from "../charts/ArchetypeBars";
import { ArchetypeHealthCards } from "../charts/ArchetypeHealthCards";
import { HeatmapMatrix } from "../charts/HeatmapMatrix";
import { IntentTreemap } from "../charts/IntentTreemap";
import { MiniBar } from "../MiniBar";
import { formatRate, formatScore } from "../format";
import { DataTable } from "../table/DataTable";
import { RowLimiter } from "../table/RowLimiter";
import { TableShell } from "../table/TableShell";

import { Chevron } from "../Chevron";
import { SectionError } from "./SectionError";
import { NoDataCard } from "@/components/pgpt-insights/common/NoDataCard";

const CANONICAL_MAP = new Map(CANONICAL_ARCHETYPE_ORDER.map((name) => [name.toLowerCase(), name]));

function normalizeArchetypeLabel(archetype: string | null) {
  const label = (archetype ?? "").trim();
  if (!label) return "(unknown)";
  const canonical = CANONICAL_MAP.get(label.toLowerCase());
  return canonical ?? label;
}

function normalizeIntentLabel(intent: string | null) {
  const label = (intent ?? "").trim();
  return label || "(none)";
}

function archetypeOrderIndex(archetype: string | null): number {
  const normalized = normalizeArchetypeLabel(archetype);
  const idx = CANONICAL_ARCHETYPE_ORDER.indexOf(normalized as (typeof CANONICAL_ARCHETYPE_ORDER)[number]);
  return idx === -1 ? CANONICAL_ARCHETYPE_ORDER.length : idx;
}

type HeatmapRow = {
  archetype: string;
  intent: string;
  hits: number;
};

type HeatmapDataset = {
  columns: Array<{ key: string; label: string }>;
  rows: Array<{ archetype: string; total: number; cells: Array<{ key: string; hits: number }> }>;
  omittedIntentCount: number;
};

function buildHeatmapDataset(stats: HeatmapRow[], maxColumns: number): HeatmapDataset {
  if (!stats.length) {
    return { columns: [], rows: [], omittedIntentCount: 0 };
  }

  const cellMap = new Map<string, number>();
  const intentTotals = new Map<string, number>();
  const archetypeTotals = new Map<string, number>();

  stats.forEach((row) => {
    const key = `${row.archetype}||${row.intent}`;
    cellMap.set(key, (cellMap.get(key) ?? 0) + row.hits);
    intentTotals.set(row.intent, (intentTotals.get(row.intent) ?? 0) + row.hits);
    archetypeTotals.set(row.archetype, (archetypeTotals.get(row.archetype) ?? 0) + row.hits);
  });

  const sortedIntents = [...intentTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const capped = sortedIntents.slice(0, Math.max(1, maxColumns));
  const omitted = sortedIntents.slice(Math.max(1, maxColumns));

  const columns = capped.map(([intent]) => ({ key: intent, label: intent }));
  const omittedIntentCount = omitted.length;
  if (omittedIntentCount > 0) {
    columns.push({
      key: "__other__",
      label: omittedIntentCount === 1 ? "Other intent" : `Other (${omittedIntentCount})`,
    });
  }

  const canonicalList: string[] = Array.from(CANONICAL_ARCHETYPE_ORDER);
  const extras = [...archetypeTotals.keys()].filter((a) => !canonicalList.includes(a));
  extras.sort((a, b) => {
    const diff = (archetypeTotals.get(b) ?? 0) - (archetypeTotals.get(a) ?? 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const archetypeList = [...canonicalList, ...extras];

  const rows = archetypeList.map((archetype) => {
    const baseCells = capped.map(([intent]) => ({
      key: intent,
      hits: cellMap.get(`${archetype}||${intent}`) ?? 0,
    }));

    const otherHits =
      omittedIntentCount > 0
        ? omitted.reduce((acc, [intent]) => acc + (cellMap.get(`${archetype}||${intent}`) ?? 0), 0)
        : 0;

    const cells = omittedIntentCount > 0 ? [...baseCells, { key: "__other__", hits: otherHits }] : baseCells;
    const total = cells.reduce((sum, cell) => sum + cell.hits, 0);
    return { archetype, total, cells };
  });

  return { columns, rows, omittedIntentCount };
}

export async function ArchetypesSection({
  envFilter,
  daysFilter,
  tableDensityClass,
  density = "comfortable",
}: Readonly<{
  envFilter?: string;
  daysFilter?: number;
  tableDensityClass: string;
  density?: "comfortable" | "compact";
}>) {
  try {
    const [archetypeIntentStats, archetypeSummaries] = await Promise.all([
      getArchetypeIntentStats(envFilter, daysFilter),
      getArchetypeSummary(envFilter, daysFilter),
    ]);

    const orderedArchetypeSummaries = [...archetypeSummaries].sort((a, b) => {
      const ai = archetypeOrderIndex(a.archetype);
      const bi = archetypeOrderIndex(b.archetype);
      if (ai !== bi) return ai - bi;
      return (b.total ?? 0) - (a.total ?? 0);
    });

    const orderedArchetypeIntentStats = [...archetypeIntentStats].sort((a, b) => {
      const ai = archetypeOrderIndex(a.archetype);
      const bi = archetypeOrderIndex(b.archetype);
      if (ai !== bi) return ai - bi;
      return b.hits - a.hits;
    });

    const normalizedIntentStats = orderedArchetypeIntentStats.map((row) => ({
      archetype: normalizeArchetypeLabel(row.archetype),
      intent: normalizeIntentLabel(row.intent),
      hits: row.hits,
    }));

    const normalizedSummaries = orderedArchetypeSummaries.map((row) => ({
      ...row,
      archetype: normalizeArchetypeLabel(row.archetype),
    }));

    const densityMode = density === "compact" ? "compact" : "comfortable";
    const maxIntentColumns = densityMode === "compact" ? 8 : 12;
    const heatmapDataset = buildHeatmapDataset(normalizedIntentStats, maxIntentColumns);

    const archetypeVolume = normalizedSummaries.map((row) => ({
      archetype: row.archetype,
      total: row.total ?? 0,
      avgMaxScore: row.avg_max_score ?? null,
    }));

    const intentTotals = new Map<string, number>();
    normalizedIntentStats.forEach((row) => {
      intentTotals.set(row.intent, (intentTotals.get(row.intent) ?? 0) + row.hits);
    });
    const intentDistribution = [...intentTotals.entries()]
      .map(([intent, hits]) => ({ intent, hits }))
      .sort((a, b) => b.hits - a.hits || a.intent.localeCompare(b.intent));

    const healthCardsData = normalizedSummaries.map((row) => ({
      archetype: row.archetype,
      avg_max_score: row.avg_max_score,
      guardrail_block_rate: row.guardrail_block_rate,
      low_confidence_rate: row.low_confidence_rate,
      total: row.total ?? 0,
    }));

    const hasAnyChartData = normalizedIntentStats.length > 0 || normalizedSummaries.length > 0;
    const maxHits = Math.max(...orderedArchetypeIntentStats.map((r) => r.hits), 1);

    if (!hasAnyChartData) {
      return (
        <NoDataCard title="Archetype & Intent Analytics" hint="Adjust filters to see data." />
      );
    }

    return (
      <TableShell
        id="archetypes"
        title="Archetype & Intent Analytics"
        description="Heatmap + volume bars for archetypes/intents, with health badges. Raw tables live in Details."
        collapsible
        defaultOpen
        contentClassName="space-y-5 sm:space-y-6"
      >
        {hasAnyChartData ? (
          <>
            <HeatmapMatrix
              title="Archetype × intent heatmap"
              subtitle={
                heatmapDataset.omittedIntentCount > 0
                  ? `Top ${heatmapDataset.columns.length - 1} intents · ${heatmapDataset.omittedIntentCount} grouped into Other`
                  : `Top ${heatmapDataset.columns.length} intents by hits`
              }
              columns={heatmapDataset.columns}
              rows={heatmapDataset.rows}
              density={densityMode}
              className="min-w-0"
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ArchetypeBars data={archetypeVolume} density={densityMode} className="min-w-0" />
              <IntentTreemap data={intentDistribution} density={densityMode} className="min-w-0" />
            </div>

            <ArchetypeHealthCards data={healthCardsData} density={densityMode} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No archetype/intent data for the current filters.</p>
        )}

        <details className="group rounded-xl border border-border/70 bg-card/80" open={false}>
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <span>Details</span>
              <span className="text-[11px] font-normal text-muted-foreground">Raw tables for auditability</span>
            </span>
            <Chevron />
          </summary>
          <div className="border-t border-border/70 bg-card/90">
            <div className="space-y-3 px-3 py-3 sm:px-5 sm:py-4">
              {orderedArchetypeIntentStats.length === 0 && orderedArchetypeSummaries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rows available for the current filters.</p>
              ) : null}

              {orderedArchetypeIntentStats.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold">Interactions by archetype and intent</h3>
                  <DataTable
                    headers={[
                      { key: "archetype", label: "archetype" },
                      { key: "intent", label: "intent" },
                      { key: "hits", label: "hits", align: "right" },
                    ]}
                    colgroup={
                      <colgroup>
                        <col className="w-[220px]" />
                        <col className="w-[400px]" />
                        <col className="w-[140px]" />
                      </colgroup>
                    }
                    minWidth="min-w-[760px]"
                    tableDensityClass={tableDensityClass}
                  >
                    <RowLimiter colSpan={3} defaultVisible={10} label="intents">
                      {orderedArchetypeIntentStats.map((row, idx) => (
                        <tr key={`${row.archetype ?? "unknown"}-${row.intent ?? "none"}-${idx}`}>
                          <td>{normalizeArchetypeLabel(row.archetype)}</td>
                          <td className="wrap-break-word">{normalizeIntentLabel(row.intent)}</td>
                          <td>
                            <MiniBar value={row.hits} max={maxHits} />
                          </td>
                        </tr>
                      ))}
                    </RowLimiter>
                  </DataTable>
                </div>
              ) : null}

              {orderedArchetypeSummaries.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold">Archetype summary metrics</h3>
                  <DataTable
                    headers={[
                      { key: "archetype", label: "archetype" },
                      { key: "avg", label: "avg maxScore", align: "right" },
                      { key: "guardrail", label: "guardrail block rate", align: "right" },
                      { key: "low", label: "low-confidence rate", align: "right" },
                      { key: "total", label: "total", align: "right" },
                    ]}
                    colgroup={
                      <colgroup>
                        <col className="w-[220px]" />
                        <col className="w-40" />
                        <col className="w-[220px]" />
                        <col className="w-[220px]" />
                        <col className="w-[140px]" />
                      </colgroup>
                    }
                    minWidth="min-w-[980px]"
                    tableDensityClass={tableDensityClass}
                  >
                    <RowLimiter colSpan={5} defaultVisible={12} label="archetypes">
                      {orderedArchetypeSummaries.map((row, idx) => (
                        <tr key={`${row.archetype ?? "unknown"}-${idx}`}>
                          <td>{normalizeArchetypeLabel(row.archetype)}</td>
                          <td className="text-right tabular-nums">{formatScore(row.avg_max_score)}</td>
                          <td className="text-right tabular-nums">{formatRate(row.guardrail_block_rate)}</td>
                          <td className="text-right tabular-nums">{formatRate(row.low_confidence_rate)}</td>
                          <td className="text-right tabular-nums">{row.total}</td>
                        </tr>
                      ))}
                    </RowLimiter>
                  </DataTable>
                </div>
              ) : null}
            </div>
          </div>
        </details>
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="archetypes" title="Archetype & Intent Analytics" error={error} />;
  }
}
