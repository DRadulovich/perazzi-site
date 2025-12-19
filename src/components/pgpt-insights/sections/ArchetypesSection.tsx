/* eslint-disable react-hooks/error-boundaries */
import { CANONICAL_ARCHETYPE_ORDER } from "../../../lib/pgpt-insights/constants";
import { getArchetypeIntentStats, getArchetypeSummary } from "../../../lib/pgpt-insights/cached";

import { MiniBar } from "../MiniBar";
import { formatRate, formatScore } from "../format";
import { DataTable } from "../table/DataTable";
import { TableShell } from "../table/TableShell";

import { SectionError } from "./SectionError";

function archetypeOrderIndex(archetype: string | null): number {
  if (!archetype) return CANONICAL_ARCHETYPE_ORDER.length;
  const idx = CANONICAL_ARCHETYPE_ORDER.indexOf(archetype as (typeof CANONICAL_ARCHETYPE_ORDER)[number]);
  return idx === -1 ? CANONICAL_ARCHETYPE_ORDER.length : idx;
}

export async function ArchetypesSection({
  envFilter,
  daysFilter,
  tableDensityClass,
}: {
  envFilter?: string;
  daysFilter?: number;
  tableDensityClass: string;
}) {
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

    return (
      <TableShell
        id="archetypes"
        title="Archetype & Intent Analytics"
        description="Volume by archetype/intent plus summary health."
        collapsible
        defaultOpen
        contentClassName="space-y-3"
      >
        {orderedArchetypeIntentStats.length === 0 ? (
          <p className="text-xs text-muted-foreground">No archetype/intent data for the current filters.</p>
        ) : (
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
              {(() => {
                const maxHits = Math.max(...orderedArchetypeIntentStats.map((r) => r.hits), 1);
                return orderedArchetypeIntentStats.map((row, idx) => (
                  <tr key={`${row.archetype ?? "unknown"}-${row.intent ?? "none"}-${idx}`}>
                    <td>{row.archetype ?? "(unknown)"}</td>
                    <td className="break-words">{row.intent ?? "(none)"}</td>
                    <td>
                      <MiniBar value={row.hits} max={maxHits} />
                    </td>
                  </tr>
                ));
              })()}
            </DataTable>
          </div>
        )}

        {orderedArchetypeSummaries.length > 0 && (
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
                  <col className="w-[160px]" />
                  <col className="w-[220px]" />
                  <col className="w-[220px]" />
                  <col className="w-[140px]" />
                </colgroup>
              }
              minWidth="min-w-[980px]"
              tableDensityClass={tableDensityClass}
            >
              {orderedArchetypeSummaries.map((row, idx) => (
                <tr key={`${row.archetype ?? "unknown"}-${idx}`}>
                  <td>{row.archetype ?? "(unknown)"}</td>
                  <td className="text-right tabular-nums">{formatScore(row.avg_max_score)}</td>
                  <td className="text-right tabular-nums">{formatRate(row.guardrail_block_rate)}</td>
                  <td className="text-right tabular-nums">{formatRate(row.low_confidence_rate)}</td>
                  <td className="text-right tabular-nums">{row.total}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="archetypes" title="Archetype & Intent Analytics" error={error} />;
  }
}
