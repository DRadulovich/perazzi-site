"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { decodePgptMetadata } from "../../lib/pgpt-insights/metadata";
import type { PgptLogDetailResponse } from "../../lib/pgpt-insights/types";

import { Badge } from "./Badge";
import { ArchetypeStackedBar, computeWinnerAndRunner, type ArchetypeScores } from "./archetype/ArchetypeStackedBar";
import { CopyButton } from "./CopyButton";
import { formatDurationMs, formatScore } from "./format";

type ArchetypeKey = "Loyalist" | "Prestige" | "Analyst" | "Achiever" | "Legacy";
const ARCHETYPE_ORDER: ArchetypeKey[] = ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"];

function cn(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function truncate(text: string, length = 200) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

type ArchetypeScoreInput = ArchetypeScores | Partial<Record<ArchetypeKey, number | string>> | null | undefined;

function normalizeArchetypeScoresForDiag(raw: ArchetypeScoreInput): Record<ArchetypeKey, number> | null {
  if (!raw || typeof raw !== "object") return null;
  const vals = ARCHETYPE_ORDER.map((k) => {
    const v = raw[k as keyof typeof raw];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
  const sum = vals.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum <= 0) return null;
  const out: Record<ArchetypeKey, number> = {
    Loyalist: vals[0] / sum,
    Prestige: vals[1] / sum,
    Analyst: vals[2] / sum,
    Achiever: vals[3] / sum,
    Legacy: vals[4] / sum,
  };
  return out;
}

function toPrettyJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export function LogSummaryPanel({
  detail,
  fallbackMetadata,
}: {
  detail: PgptLogDetailResponse;
  fallbackMetadata?: unknown | null;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const metadata = detail.log.metadata ?? fallbackMetadata ?? null;
  const decoded = useMemo(() => decodePgptMetadata(metadata), [metadata]);
  const archetypeDiag = decoded?.archetype ?? null;
  const rerankDiag = decoded?.rerank ?? null;

  const diagScores = useMemo(() => {
    const src = (archetypeDiag?.scores as ArchetypeScoreInput) ?? (detail.log.archetype_scores as ArchetypeScoreInput);
    return normalizeArchetypeScoresForDiag(src);
  }, [archetypeDiag?.scores, detail]);

  const computedArchetype = useMemo(() => {
    if (!diagScores) return null;
    return computeWinnerAndRunner(diagScores);
  }, [diagScores]);

  const promptTokens = detail.log.prompt_tokens ?? null;
  const completionTokens = detail.log.completion_tokens ?? null;
  const cachedTokens = detail.log.cached_tokens ?? null;
  const reasoningTokens = detail.log.reasoning_tokens ?? null;
  const totalTokens =
    detail.log.total_tokens ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="text-xs font-semibold text-foreground">Signals</div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">maxScore</div>
            <div className="mt-1 font-medium text-foreground">{detail.log.max_score ? detail.log.max_score : "—"}</div>
          </div>

          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">latency</div>
            <div className="mt-1 font-medium text-foreground">{formatDurationMs(detail.log.latency_ms)}</div>
          </div>

          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">guardrail</div>
            <div className="mt-1 font-medium text-foreground">
              {detail.log.guardrail_status ?? "—"}
              {detail.log.guardrail_reason ? ` · ${detail.log.guardrail_reason}` : ""}
            </div>
          </div>

          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">confidence</div>
            <div className="mt-1 font-medium text-foreground">
              {detail.log.low_confidence === true ? "low" : "ok/unknown"}
            </div>
          </div>

          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">tokens</div>
            <div className="mt-1 font-medium text-foreground">
              {promptTokens ?? "—"} prompt · {completionTokens ?? "—"} completion
            </div>
            <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              <div>Cached tokens: {cachedTokens ?? "—"}</div>
              <div>Reasoning tokens: {reasoningTokens ?? "—"}</div>
              <div>Total tokens: {totalTokens ?? "—"}</div>
            </div>
          </div>

          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">model</div>
            <div className="mt-1 font-medium text-foreground">{detail.log.model ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="text-xs font-semibold text-foreground">Context</div>

        <div className="mt-3 flex flex-wrap gap-2">
          {detail.log.env ? <Badge>{detail.log.env}</Badge> : null}
          {detail.log.endpoint ? <Badge tone="blue">{detail.log.endpoint}</Badge> : null}
          {detail.log.archetype ? <Badge>{detail.log.archetype}</Badge> : null}
          {detail.log.used_gateway ? <Badge>gateway</Badge> : null}
        </div>

        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <span>Session:</span>
          {detail.log.session_id ? (
            <>
              <Link
                href={`/admin/pgpt-insights/session/${encodeURIComponent(detail.log.session_id)}`}
                className="text-blue-600 underline"
              >
                {detail.log.session_id}
              </Link>
              <CopyButton value={detail.log.session_id} label="Copy" ariaLabel="Copy session id" />
            </>
          ) : (
            "—"
          )}
        </div>
      </div>

      {detail.log.archetype_scores ? (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-foreground">Archetype</div>
              <div className="text-xs text-muted-foreground">Distribution + winner/runner-up for this interaction.</div>
            </div>

            {typeof detail.log.archetype_confidence === "number" ? (
              <Badge tone="default" title="top1-top2 margin">
                margin +{Math.round(detail.log.archetype_confidence * 100)}pp
              </Badge>
            ) : null}
          </div>

          <div className="mt-3">
            <ArchetypeStackedBar scores={detail.log.archetype_scores as ArchetypeScores} />
          </div>

          {(() => {
            const normalized =
              diagScores ?? normalizeArchetypeScoresForDiag(detail.log.archetype_scores as ArchetypeScoreInput);
            if (!normalized) return null;

            const { winner, runner, margin } = computeWinnerAndRunner(normalized);

            return (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">winner</div>
                  <div className="mt-1 font-medium text-foreground">
                    {winner.k} · {(winner.v * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">runner-up</div>
                  <div className="mt-1 font-medium text-foreground">
                    {runner ? `${runner.k} · ${(runner.v * 100).toFixed(0)}%` : "—"}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">margin</div>
                  <div className="mt-1 font-medium text-foreground">+{Math.round(margin * 100)}pp</div>
                </div>
              </div>
            );
          })()}

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">mode</div>
              <div className="mt-1 font-medium text-foreground">{detail.log.mode ?? "—"}</div>
            </div>

            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">page url</div>
              <div className="mt-1 font-medium text-foreground break-words">
                {detail.log.page_url ? (
                  detail.log.page_url.startsWith("http://") || detail.log.page_url.startsWith("https://") ? (
                    <a href={detail.log.page_url} target="_blank" rel="noreferrer" className="text-blue-600 underline" title={detail.log.page_url}>
                      {truncate(detail.log.page_url, 80)}
                    </a>
                  ) : (
                    <span title={detail.log.page_url}>{truncate(detail.log.page_url, 80)}</span>
                  )
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">user id</div>
              <div className="mt-1 font-medium text-foreground break-words">{detail.log.user_id ?? "—"}</div>
            </div>
          </div>

          {detail.log.archetype_decision ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">show decision metadata</summary>
              <pre className="mt-2 overflow-auto rounded-lg border border-border bg-muted/20 p-3 text-[11px] leading-snug text-foreground">
                {JSON.stringify(detail.log.archetype_decision, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="text-xs font-semibold text-foreground">Archetype</div>
          <div className="mt-1 text-xs text-muted-foreground">Legacy log: no archetype distribution recorded.</div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">mode</div>
              <div className="mt-1 font-medium text-foreground">{detail.log.mode ?? "—"}</div>
            </div>

            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">page url</div>
              <div className="mt-1 font-medium text-foreground break-words">
                {detail.log.page_url ? (
                  detail.log.page_url.startsWith("http://") || detail.log.page_url.startsWith("https://") ? (
                    <a href={detail.log.page_url} target="_blank" rel="noreferrer" className="text-blue-600 underline" title={detail.log.page_url}>
                      {truncate(detail.log.page_url, 80)}
                    </a>
                  ) : (
                    <span title={detail.log.page_url}>{truncate(detail.log.page_url, 80)}</span>
                  )
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">user id</div>
              <div className="mt-1 font-medium text-foreground break-words">{detail.log.user_id ?? "—"}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-foreground">Tuning Diagnostics</div>
            <div className="text-xs text-muted-foreground">Archetype confidence + rerank metadata (safe fallbacks).</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Archetype Confidence</div>
                <div className="text-xs text-muted-foreground">Winner/runner/margin + snapped status.</div>
              </div>
              <button
                type="button"
                disabled={!archetypeDiag && !diagScores}
                onClick={async () => {
                  const payload =
                    archetypeDiag ??
                    (diagScores && computedArchetype
                      ? {
                          winner: computedArchetype.winner?.k,
                          runnerUp: computedArchetype.runner?.k,
                          margin: computedArchetype.margin,
                          scores: diagScores,
                        }
                      : null);
                  if (!payload) return;
                  await copyText(toPrettyJson(payload));
                  setCopiedKey("archetype");
                  window.setTimeout(() => setCopiedKey((prev) => (prev === "archetype" ? null : prev)), 800);
                }}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-1 text-[11px]",
                  archetypeDiag || diagScores
                    ? "border-border bg-background hover:bg-muted/40"
                    : "cursor-not-allowed border-border bg-muted/40 text-muted-foreground",
                )}
              >
                {copiedKey === "archetype" ? "Copied" : "Copy JSON"}
              </button>
            </div>

            {archetypeDiag || diagScores || computedArchetype ? (
              <div className="mt-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-background/60 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">winner</div>
                    <div className="mt-1 font-medium text-foreground">
                      {archetypeDiag?.winner ?? computedArchetype?.winner?.k ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-background/60 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">runner-up</div>
                    <div className="mt-1 font-medium text-foreground">
                      {archetypeDiag?.runnerUp ?? computedArchetype?.runner?.k ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-background/60 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">margin</div>
                    <div className="mt-1 font-medium text-foreground">
                      {typeof (archetypeDiag?.margin ?? computedArchetype?.margin) === "number"
                        ? `+${Math.round(((archetypeDiag?.margin ?? computedArchetype?.margin) ?? 0) * 100)}pp`
                        : "—"}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-background/60 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">status</div>
                    <div className="mt-1 font-medium text-foreground">
                      {archetypeDiag?.snapped === true ? (
                        <Badge tone="blue">snapped</Badge>
                      ) : archetypeDiag?.snapped === false ? (
                        <Badge>mixed</Badge>
                      ) : (
                        <Badge tone="amber">unknown</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {diagScores ? (
                  <div className="space-y-1">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-border bg-muted/30" role="img">
                      {ARCHETYPE_ORDER.map((k) => (
                        <div
                          key={k}
                          className="bg-muted-foreground/60"
                          style={{ width: `${(diagScores[k] ?? 0) * 100}%` }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {ARCHETYPE_ORDER.map((k) => (
                        <span key={k}>
                          {k}: {Math.round((diagScores[k] ?? 0) * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground">Scores not available for this interaction.</div>
                )}
              </div>
            ) : (
              <div className="mt-3 text-[11px] text-muted-foreground">Not available for this interaction (older log).</div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Rerank Dyno</div>
                <div className="text-xs text-muted-foreground">Candidate limit + reranked chunks.</div>
              </div>
              <button
                type="button"
                disabled={!rerankDiag}
                onClick={async () => {
                  if (!rerankDiag) return;
                  await copyText(toPrettyJson(rerankDiag));
                  setCopiedKey("rerank");
                  window.setTimeout(() => setCopiedKey((prev) => (prev === "rerank" ? null : prev)), 800);
                }}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-1 text-[11px]",
                  rerankDiag
                    ? "border-border bg-background hover:bg-muted/40"
                    : "cursor-not-allowed border-border bg-muted/40 text-muted-foreground",
                )}
              >
                {copiedKey === "rerank" ? "Copied" : "Copy JSON"}
              </button>
            </div>

            {rerankDiag ? (
              <div className="mt-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-background/60 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">rerank</div>
                    <div className="mt-1 font-medium text-foreground">{rerankDiag.rerankEnabled ? "enabled" : "disabled / unknown"}</div>
                  </div>
                  <div className="rounded-md border border-border bg-background/60 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">candidate limit</div>
                    <div className="mt-1 font-medium text-foreground">{rerankDiag.candidateLimit ?? "—"}</div>
                  </div>
                </div>

                <div className="rounded-md border border-border bg-background/60 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">top returned chunks</div>
                  {Array.isArray(rerankDiag.topReturnedChunks) && rerankDiag.topReturnedChunks.length > 0 ? (
                    <div className="mt-2 overflow-hidden rounded-md border border-border">
                      <table className="w-full table-fixed border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-muted/40 text-muted-foreground">
                            <th className="px-2 py-1 text-left font-medium">chunkId</th>
                            <th className="px-2 py-1 text-right font-medium">base</th>
                            <th className="px-2 py-1 text-right font-medium">boost</th>
                            <th className="px-2 py-1 text-right font-medium">arch boost</th>
                            <th className="px-2 py-1 text-right font-medium">final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rerankDiag.topReturnedChunks.slice(0, 15).map((c, idx) => (
                            <tr key={`${c.chunkId}-${idx}`} className="border-t border-border/60">
                              <td className="truncate px-2 py-1 font-medium text-foreground" title={c.chunkId}>
                                {c.chunkId}
                              </td>
                              <td className="px-2 py-1 text-right text-muted-foreground">{formatScore(c.baseScore)}</td>
                              <td className="px-2 py-1 text-right text-muted-foreground">{formatScore(c.boost)}</td>
                              <td className="px-2 py-1 text-right text-muted-foreground">{formatScore(c.archetypeBoost)}</td>
                              <td className="px-2 py-1 text-right font-semibold text-foreground">{formatScore(c.finalScore)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-muted-foreground">Not available for this interaction.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-[11px] text-muted-foreground">Not available for this interaction (older log).</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
