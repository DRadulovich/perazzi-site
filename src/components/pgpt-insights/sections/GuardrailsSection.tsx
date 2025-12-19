/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";

import { CANONICAL_ARCHETYPE_ORDER } from "../../../lib/pgpt-insights/constants";
import { getGuardrailByArchetype, getGuardrailStats, getRecentGuardrailBlocks } from "../../../lib/pgpt-insights/cached";
import { getLogTextCalloutToneClass, getTextStorageBadges } from "../../../lib/pgpt-insights/logTextStatus";

import { Badge } from "../Badge";
import { MiniBar } from "../MiniBar";
import { formatCompactNumber, formatTimestampShort } from "../format";
import { DataTable } from "../table/DataTable";
import { MonoCell } from "../table/MonoCell";
import { StatusBadge } from "../table/StatusBadge";
import { TableShell } from "../table/TableShell";
import { TruncateCell } from "../table/TruncateCell";

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
      <TableShell
        id="guardrails"
        title="Guardrail Analytics (assistant)"
        description="Block reasons, environments, and archetypes."
        collapsible
        defaultOpen
        actions={
          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
            blocked {formatCompactNumber(guardrailBlockedCount)}
          </span>
        }
        contentClassName="space-y-3"
      >
        {guardrailStats.length === 0 && orderedGuardrailByArchetype.length === 0 && recentGuardrailBlocks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No guardrail blocks for the current filters.</p>
        ) : (
          <>
            {guardrailStats.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Guardrail hits by reason and env</h3>
                <DataTable
                  headers={[
                    { key: "reason", label: "reason" },
                    { key: "env", label: "env" },
                    { key: "hits", label: "hits", align: "right" },
                  ]}
                  colgroup={
                    <colgroup>
                      <col className="w-[420px]" />
                      <col className="w-[140px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                  }
                  minWidth="min-w-[720px]"
                  tableDensityClass={tableDensityClass}
                >
                  {(() => {
                    const maxHits = Math.max(...guardrailStats.map((r) => r.hits), 1);
                    return guardrailStats.map((row, idx) => (
                      <tr key={`${row.guardrail_reason ?? "none"}-${row.env}-${idx}`}>
                        <td className="break-words">{row.guardrail_reason ?? "(none)"}</td>
                        <td>
                          <StatusBadge type="env" value={row.env} />
                        </td>
                        <td>
                          <MiniBar value={row.hits} max={maxHits} />
                        </td>
                      </tr>
                    ));
                  })()}
                </DataTable>
              </div>
            )}

            {recentGuardrailBlocks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Recent guardrail blocks</h3>
                <DataTable
                  headers={[
                    { key: "created_at", label: "created_at" },
                    { key: "env", label: "env" },
                    { key: "session_id", label: "session_id" },
                    { key: "reason", label: "reason" },
                    { key: "prompt", label: "prompt" },
                    { key: "response", label: "response" },
                  ]}
                  colgroup={
                    <colgroup>
                      <col className="w-[220px]" />
                      <col className="w-[100px]" />
                      <col className="w-[220px]" />
                      <col className="w-[200px]" />
                      <col className="w-[320px]" />
                      <col className="w-[360px]" />
                    </colgroup>
                  }
                  minWidth="min-w-[1400px]"
                  tableDensityClass={tableDensityClass}
                >
                  {recentGuardrailBlocks.map((log) => {
                    const textStatus = getTextStorageBadges({
                      promptText: log.prompt,
                      responseText: log.response,
                      metadata: log.metadata,
                      logTextMode: log.log_text_mode,
                      logTextMaxChars: log.log_text_max_chars,
                      promptTextOmitted: log.prompt_text_omitted,
                      responseTextOmitted: log.response_text_omitted,
                      promptTextTruncated: log.prompt_text_truncated,
                      responseTextTruncated: log.response_text_truncated,
                    });

                    const promptStatus = textStatus.prompt;
                    const responseStatus = textStatus.response;

                    return (
                      <tr
                        key={`guardrail-${log.id}`}
                        className="border-l-4 border-red-500/50 bg-red-500/5 dark:border-red-500/60 dark:bg-red-500/15"
                      >
                        <td className="whitespace-normal break-words leading-snug">
                          <span title={String(log.created_at)} className="tabular-nums">
                            {formatTimestampShort(String(log.created_at))}
                          </span>
                        </td>
                        <td>
                          <StatusBadge type="env" value={log.env} />
                        </td>
                        <td>
                          {log.session_id ? (
                            <Link
                              href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                              className="text-blue-600 underline"
                            >
                              <MonoCell>{log.session_id}</MonoCell>
                            </Link>
                          ) : (
                            ""
                          )}
                        </td>
                        <td>{log.guardrail_reason ?? "(none)"}</td>
                        <td className="align-top">
                          <TruncateCell
                            text={promptStatus.displayValue ?? ""}
                            previewChars={truncSecondary}
                            defaultOpen={detailsDefaultOpen}
                            summaryContent={
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="break-words text-xs leading-snug text-foreground">
                                  {truncate(promptStatus.displayValue ?? "", truncSecondary)}
                                </div>
                                {promptStatus.badge ? (
                                  <Badge tone={promptStatus.badgeTone ?? "default"} title={promptStatus.callout ?? undefined}>
                                    {promptStatus.badge}
                                  </Badge>
                                ) : null}
                              </div>
                            }
                          >
                            {promptStatus.callout ? (
                              <div
                                className={`mb-2 rounded-md border px-2 py-1 text-[11px] leading-snug ${getLogTextCalloutToneClass(promptStatus)}`}
                              >
                                {promptStatus.callout}
                              </div>
                            ) : null}
                            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                              {promptStatus.displayValue ?? ""}
                            </pre>
                          </TruncateCell>
                        </td>
                        <td className="align-top">
                          <TruncateCell
                            text={responseStatus.displayValue ?? ""}
                            previewChars={truncSecondary}
                            defaultOpen={detailsDefaultOpen}
                            summaryContent={
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="break-words text-xs leading-snug text-foreground">
                                  {truncate(responseStatus.displayValue ?? "", truncSecondary)}
                                </div>
                                {responseStatus.badge ? (
                                  <Badge
                                    tone={responseStatus.badgeTone ?? "default"}
                                    title={responseStatus.callout ?? undefined}
                                  >
                                    {responseStatus.badge}
                                  </Badge>
                                ) : null}
                              </div>
                            }
                          >
                            {responseStatus.callout ? (
                              <div
                                className={`mb-2 rounded-md border px-2 py-1 text-[11px] leading-snug ${getLogTextCalloutToneClass(responseStatus)}`}
                              >
                                {responseStatus.callout}
                              </div>
                            ) : null}
                            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                              {responseStatus.displayValue ?? ""}
                            </pre>
                          </TruncateCell>
                        </td>
                      </tr>
                    );
                  })}
                </DataTable>
              </div>
            )}

            {orderedGuardrailByArchetype.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Guardrail hits by reason and archetype</h3>
                <DataTable
                  headers={[
                    { key: "reason", label: "reason" },
                    { key: "archetype", label: "archetype" },
                    { key: "hits", label: "hits", align: "right" },
                  ]}
                  colgroup={
                    <colgroup>
                      <col className="w-[420px]" />
                      <col className="w-[220px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                  }
                  minWidth="min-w-[820px]"
                  tableDensityClass={tableDensityClass}
                >
                  {(() => {
                    const maxHits = Math.max(...orderedGuardrailByArchetype.map((r) => r.hits), 1);
                    return orderedGuardrailByArchetype.map((row, idx) => (
                      <tr key={`${row.guardrail_reason ?? "none"}-${row.archetype ?? "unknown"}-${idx}`}>
                        <td className="break-words">{row.guardrail_reason ?? "(none)"}</td>
                        <td>{row.archetype ?? "(unknown)"}</td>
                        <td>
                          <MiniBar value={row.hits} max={maxHits} />
                        </td>
                      </tr>
                    ));
                  })()}
                </DataTable>
              </div>
            )}
          </>
        )}
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="guardrails" title="Guardrail Analytics (assistant)" error={error} />;
  }
}
