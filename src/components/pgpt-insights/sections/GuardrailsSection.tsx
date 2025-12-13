/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";

import { CANONICAL_ARCHETYPE_ORDER } from "../../../lib/pgpt-insights/constants";
import { getGuardrailByArchetype, getGuardrailStats, getRecentGuardrailBlocks } from "../../../lib/pgpt-insights/cached";

import { Chevron } from "../Chevron";
import { MiniBar } from "../MiniBar";
import { formatCompactNumber, formatTimestampShort } from "../format";

import { SectionError } from "./SectionError";

function truncate(text: string, length = 200) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function archetypeOrderIndex(archetype: string | null): number {
  if (!archetype) return CANONICAL_ARCHETYPE_ORDER.length;
  const idx = CANONICAL_ARCHETYPE_ORDER.indexOf(archetype as (typeof CANONICAL_ARCHETYPE_ORDER)[number]);
  return idx === -1 ? CANONICAL_ARCHETYPE_ORDER.length : idx;
}

export async function GuardrailsSection({
  envFilter,
  daysFilter,
  tableDensityClass,
  detailsDefaultOpen,
  truncSecondary,
}: {
  envFilter?: string;
  daysFilter?: number;
  tableDensityClass: string;
  detailsDefaultOpen: boolean;
  truncSecondary: number;
}) {
  try {
    const [guardrailStats, guardrailByArchetype, recentGuardrailBlocks] = await Promise.all([
      getGuardrailStats(envFilter, daysFilter),
      getGuardrailByArchetype(envFilter, daysFilter),
      getRecentGuardrailBlocks(envFilter, 20, daysFilter),
    ]);

    const orderedGuardrailByArchetype = [...guardrailByArchetype].sort((a, b) => {
      const ai = archetypeOrderIndex(a.archetype);
      const bi = archetypeOrderIndex(b.archetype);
      if (ai !== bi) return ai - bi;
      if (b.hits !== a.hits) return b.hits - a.hits;
      return String(a.guardrail_reason ?? "").localeCompare(String(b.guardrail_reason ?? ""));
    });

    const guardrailBlockedCount = guardrailStats.reduce((sum, row) => sum + row.hits, 0);

    return (
      <section id="guardrails" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
        <details open className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">Guardrail Analytics (assistant)</h2>
                <p className="text-xs text-muted-foreground">Block reasons, environments, and archetypes.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                  blocked {formatCompactNumber(guardrailBlockedCount)}
                </span>
                <Chevron />
              </div>
            </div>
          </summary>

          <div className="mt-4 space-y-3">
            {guardrailStats.length === 0 &&
            orderedGuardrailByArchetype.length === 0 &&
            recentGuardrailBlocks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No guardrail blocks for the current filters.</p>
            ) : (
              <>
                {guardrailStats.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Guardrail hits by reason and env</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className={`w-full min-w-[720px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                        <colgroup>
                          <col className="w-[420px]" />
                          <col className="w-[140px]" />
                          <col className="w-[140px]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">reason</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">env</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {(() => {
                            const maxHits = Math.max(...guardrailStats.map((r) => r.hits), 1);
                            return guardrailStats.map((row, idx) => (
                              <tr key={`${row.guardrail_reason ?? "none"}-${row.env}-${idx}`}>
                                <td className="px-3 py-2 break-words">{row.guardrail_reason ?? "(none)"}</td>
                                <td className="px-3 py-2">{row.env}</td>
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

                {recentGuardrailBlocks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Recent guardrail blocks</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className={`w-full min-w-[1400px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                        <colgroup>
                          <col className="w-[220px]" />
                          <col className="w-[100px]" />
                          <col className="w-[220px]" />
                          <col className="w-[200px]" />
                          <col className="w-[320px]" />
                          <col className="w-[360px]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                created_at
                              </th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                env
                              </th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                session_id
                              </th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                reason
                              </th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                prompt
                              </th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                response
                              </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {recentGuardrailBlocks.map((log) => (
                              <tr key={`guardrail-${log.id}`} className="border-l-4 border-red-500/50 bg-red-500/5 dark:border-red-500/60 dark:bg-red-500/15">
                              <td className="px-3 py-2 whitespace-normal break-words leading-snug">
                                <span title={String(log.created_at)} className="tabular-nums">
                                  {formatTimestampShort(String(log.created_at))}
                                </span>
                              </td>
                              <td className="px-3 py-2">{log.env}</td>
                              <td className="px-3 py-2">
                                {log.session_id ? (
                                  <Link
                                    href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                                    className="text-blue-600 underline"
                                  >
                                    {log.session_id}
                                  </Link>
                                ) : (
                                  ""
                                )}
                              </td>
                              <td className="px-3 py-2">{log.guardrail_reason ?? "(none)"}</td>
                              <td className="px-3 py-2 align-top">
                                <details className="group" open={detailsDefaultOpen}>
                                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                    <div className="break-words text-xs leading-snug text-foreground">{truncate(log.prompt ?? "", truncSecondary)}</div>
                                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                                  </summary>
                                  <pre className="mt-2 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">{log.prompt ?? ""}</pre>
                                </details>
                              </td>
                              <td className="px-3 py-2 align-top">
                                <details className="group" open={detailsDefaultOpen}>
                                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                    <div className="break-words text-xs leading-snug text-foreground">{truncate(log.response ?? "", truncSecondary)}</div>
                                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                                  </summary>
                                  <pre className="mt-2 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">{log.response ?? ""}</pre>
                                </details>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {orderedGuardrailByArchetype.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Guardrail hits by reason and archetype</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className={`w-full min-w-[820px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                        <colgroup>
                          <col className="w-[420px]" />
                          <col className="w-[220px]" />
                          <col className="w-[140px]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">reason</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">archetype</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {(() => {
                            const maxHits = Math.max(...orderedGuardrailByArchetype.map((r) => r.hits), 1);
                            return orderedGuardrailByArchetype.map((row, idx) => (
                              <tr key={`${row.guardrail_reason ?? "none"}-${row.archetype ?? "unknown"}-${idx}`}>
                                <td className="px-3 py-2 break-words">{row.guardrail_reason ?? "(none)"}</td>
                                <td className="px-3 py-2">{row.archetype ?? "(unknown)"}</td>
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
              </>
            )}
          </div>
        </details>
      </section>
    );
  } catch (error) {
    return <SectionError id="guardrails" title="Guardrail Analytics (assistant)" error={error} />;
  }
}
