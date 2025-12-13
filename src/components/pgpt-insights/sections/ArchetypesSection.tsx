/* eslint-disable react-hooks/error-boundaries */
import { CANONICAL_ARCHETYPE_ORDER } from "../../../lib/pgpt-insights/constants";
import { getArchetypeIntentStats, getArchetypeSummary } from "../../../lib/pgpt-insights/cached";

import { Chevron } from "../Chevron";
import { MiniBar } from "../MiniBar";
import { formatRate, formatScore } from "../format";

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
      <section id="archetypes" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
        <details open className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">Archetype &amp; Intent Analytics</h2>
                <p className="text-xs text-muted-foreground">Volume by archetype/intent plus summary health.</p>
              </div>
              <Chevron />
            </div>
          </summary>

          <div className="mt-4 space-y-3">
            {orderedArchetypeIntentStats.length === 0 ? (
              <p className="text-xs text-muted-foreground">No archetype/intent data for the current filters.</p>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Interactions by archetype and intent</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className={`w-full min-w-[760px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                    <colgroup>
                      <col className="w-[220px]" />
                      <col className="w-[400px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                    <thead>
                      <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">archetype</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">intent</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(() => {
                        const maxHits = Math.max(...orderedArchetypeIntentStats.map((r) => r.hits), 1);
                        return orderedArchetypeIntentStats.map((row, idx) => (
                          <tr key={`${row.archetype ?? "unknown"}-${row.intent ?? "none"}-${idx}`}>
                            <td className="px-3 py-2">{row.archetype ?? "(unknown)"}</td>
                            <td className="px-3 py-2 break-words">{row.intent ?? "(none)"}</td>
                            <td className="px-3 py-2">
                              <MiniBar value={row.hits} max={maxHits} />
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {orderedArchetypeSummaries.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Archetype summary metrics</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className={`w-full min-w-[980px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                    <colgroup>
                      <col className="w-[220px]" />
                      <col className="w-[160px]" />
                      <col className="w-[220px]" />
                      <col className="w-[220px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                    <thead>
                      <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">archetype</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg maxScore</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">guardrail block rate</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">low-confidence rate</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {orderedArchetypeSummaries.map((row, idx) => (
                        <tr key={`${row.archetype ?? "unknown"}-${idx}`}>
                          <td className="px-3 py-2">{row.archetype ?? "(unknown)"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatScore(row.avg_max_score)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatRate(row.guardrail_block_rate)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatRate(row.low_confidence_rate)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </details>
      </section>
    );
  } catch (error) {
    return <SectionError id="archetypes" title="Archetype & Intent Analytics" error={error} />;
  }
}
