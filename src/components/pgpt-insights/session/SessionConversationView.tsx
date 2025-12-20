"use client";

import { useRef, useState } from "react";

import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { getLogTextCalloutToneClass, getTextStorageBadges } from "../../../lib/pgpt-insights/logTextStatus";
import type { PerazziLogRow, PgptLogDetailResponse } from "../../../lib/pgpt-insights/types";

import { Badge } from "../Badge";
import { CopyButton } from "../CopyButton";
import { LogSummaryPanel } from "../LogSummaryPanel";
import { MarkdownViewClient } from "../MarkdownViewClient";
import { formatTimestampShort } from "../format";

function cn(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

type DetailStatus = {
  loading: boolean;
  error: string | null;
};

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const PROTOTYPE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function readNestedNumber(obj: unknown, path: string[]): number | null {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== "object" || PROTOTYPE_KEYS.has(key)) return null;
    if (!Object.prototype.hasOwnProperty.call(current, key)) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return toNumberOrNull(current);
}

function getTokenMetrics(source: {
  cached_tokens?: unknown;
  reasoning_tokens?: unknown;
  total_tokens?: unknown;
  prompt_tokens?: unknown;
  completion_tokens?: unknown;
  metadata?: unknown | null;
}) {
  const promptTokens = toNumberOrNull(source.prompt_tokens);
  const completionTokens = toNumberOrNull(source.completion_tokens);
  const metadataObj =
    source.metadata && typeof source.metadata === "object" ? (source.metadata as Record<string, unknown>) : null;
  const responseUsage =
    metadataObj && typeof (metadataObj as { responseUsage?: unknown }).responseUsage === "object"
      ? (metadataObj as { responseUsage: unknown }).responseUsage
      : null;

  const cachedTokens =
    toNumberOrNull(source.cached_tokens) ??
    readNestedNumber(metadataObj, ["cachedTokens"]) ??
    readNestedNumber(responseUsage, ["input_tokens_details", "cached_tokens"]);

  const reasoningTokens =
    toNumberOrNull(source.reasoning_tokens) ??
    readNestedNumber(metadataObj, ["reasoningTokens"]) ??
    readNestedNumber(responseUsage, ["output_tokens_details", "reasoning_tokens"]);

  const totalTokens =
    toNumberOrNull(source.total_tokens) ??
    readNestedNumber(metadataObj, ["totalTokens"]) ??
    readNestedNumber(responseUsage, ["total_tokens"]) ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null);

  return { promptTokens, completionTokens, cachedTokens, reasoningTokens, totalTokens };
}

function SummarySkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3 w-1/2 rounded bg-muted/40" />
      <div className="h-3 w-1/3 rounded bg-muted/30" />
      <div className="h-20 w-full rounded-lg bg-muted/20" />
    </div>
  );
}

export function SessionConversationView({
  logs,
  hasMore,
  sessionId,
}: {
  logs: PerazziLogRow[];
  hasMore: boolean;
  sessionId: string;
}) {
  const detailCache = useRef(new Map<string, PgptLogDetailResponse>());
  const [detailState, setDetailState] = useState<Record<string, DetailStatus>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const hasLogs = logs.length > 0;

  const ensureDetail = async (id: string) => {
    if (detailCache.current.has(id) || detailState[id]?.loading) return;

    setDetailState((prev) => ({ ...prev, [id]: { loading: true, error: null } }));
    try {
      const res = await fetch(`/api/admin/pgpt-insights/log/${encodeURIComponent(id)}`);
      if (!res.ok) {
        throw new Error(`Failed to load interaction (${res.status})`);
      }
      const data = (await res.json()) as PgptLogDetailResponse;
      detailCache.current.set(id, data);
      setDetailState((prev) => ({ ...prev, [id]: { loading: false, error: null } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load interaction";
      setDetailState((prev) => ({ ...prev, [id]: { loading: false, error: msg } }));
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        void ensureDetail(id);
      }
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground">Conversation View</div>
          <div className="text-[11px] text-muted-foreground">
            Full prompt + response for each interaction in order. Expand to see the summary data.
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{hasLogs ? logs.length : 0}</span>
          <span>interactions</span>
          <span>·</span>
          <span className="text-muted-foreground">Session</span>
          <span className="font-medium text-foreground">{sessionId}</span>
        </div>
      </div>

      {!hasLogs ? (
        <div className="p-6 text-sm text-muted-foreground">No interactions match the current filters.</div>
      ) : (
        <>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-4 py-5">
            {logs.map((log, idx) => {
              const detail = detailCache.current.get(log.id) ?? null;
              const status = detailState[log.id];
              const isExpanded = expanded.has(log.id);
              const scoreNum = log.max_score ? Number(log.max_score) : null;
              const isLowScore =
                log.endpoint === "assistant" && scoreNum !== null && Number.isFinite(scoreNum) && scoreNum < LOW_SCORE_THRESHOLD;

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

              const metaBadges = [];
              if (log.archetype) metaBadges.push(<Badge key="arch">{log.archetype}</Badge>);
              if (log.model) metaBadges.push(<Badge key="model" tone="blue">{log.model}</Badge>);
              if (log.guardrail_status === "blocked")
                metaBadges.push(
                  <Badge key="guardrail" tone="red" title={log.guardrail_reason ?? undefined}>
                    blocked{log.guardrail_reason ? `: ${log.guardrail_reason}` : ""}
                  </Badge>,
                );
              if (log.low_confidence === true) metaBadges.push(<Badge key="low-conf" tone="amber">low confidence</Badge>);
              if (log.used_gateway) metaBadges.push(<Badge key="gateway">gateway</Badge>);
              if (scoreNum !== null && Number.isFinite(scoreNum))
                metaBadges.push(
                  <Badge key="score" tone={isLowScore ? "yellow" : "default"}>
                    maxScore {log.max_score}
                  </Badge>,
                );
              if (promptStatus.badge) {
                metaBadges.push(
                  <Badge
                    key="prompt-text"
                    tone={promptStatus.badgeTone ?? "default"}
                    title={promptStatus.callout ?? undefined}
                  >
                    P {promptStatus.badge}
                  </Badge>,
                );
              }
              if (responseStatus.badge) {
                metaBadges.push(
                  <Badge
                    key="response-text"
                    tone={responseStatus.badgeTone ?? "default"}
                    title={responseStatus.callout ?? undefined}
                  >
                    A {responseStatus.badge}
                  </Badge>,
                );
              }

              const previewTokens = getTokenMetrics(log);
              const detailTokens = detail ? getTokenMetrics(detail.log) : null;
              const promptTokens = detailTokens?.promptTokens ?? previewTokens.promptTokens;
              const completionTokens = detailTokens?.completionTokens ?? previewTokens.completionTokens;
              const cachedTokens = detailTokens?.cachedTokens ?? previewTokens.cachedTokens;
              const reasoningTokens = detailTokens?.reasoningTokens ?? previewTokens.reasoningTokens;
              const totalTokens = detailTokens?.totalTokens ?? previewTokens.totalTokens;

              return (
                <div key={log.id} className="space-y-3 rounded-xl border border-border bg-background/80 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">#{idx + 1}</span>
                    <span className="tabular-nums">{formatTimestampShort(String(log.created_at))}</span>
                    {log.env ? (
                      <>
                        <span>·</span>
                        <span>{log.env}</span>
                      </>
                    ) : null}
                    {log.endpoint ? (
                      <>
                        <span>·</span>
                        <span>{log.endpoint}</span>
                      </>
                    ) : null}
                    {log.session_id ? (
                      <>
                        <span>·</span>
                        <span className="break-all">{log.session_id}</span>
                      </>
                    ) : null}
                    <CopyButton value={log.id} label="Copy id" ariaLabel="Copy interaction id" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">{metaBadges}</div>

                  <div className="text-[11px] text-muted-foreground flex flex-wrap gap-3">
                    <span>Prompt: {promptTokens ?? "—"}</span>
                    <span>Completion: {completionTokens ?? "—"}</span>
                    <span>Total tokens: {totalTokens ?? "—"}</span>
                    <span>Cached tokens: {cachedTokens ?? "—"}</span>
                    <span>Reasoning tokens: {reasoningTokens ?? "—"}</span>
                  </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-8 w-8 shrink-0 rounded-full border border-border bg-muted/50 text-[11px] font-semibold text-muted-foreground flex items-center justify-center">
                          User
                        </div>
                        <div className="flex-1 rounded-2xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground shadow-sm">
                          {promptStatus.callout ? (
                            <div
                              className={cn(
                                "mb-2 rounded-md border px-2 py-1 text-[11px] leading-snug",
                                getLogTextCalloutToneClass(promptStatus),
                              )}
                            >
                              {promptStatus.callout}
                            </div>
                          ) : null}
                          <p className="whitespace-pre-wrap">{promptStatus.displayValue}</p>
                        </div>
                      </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 shrink-0 rounded-full border border-border bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-100 flex items-center justify-center">
                        AI
                      </div>
                      <div className="flex-1 rounded-2xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground shadow-sm">
                        {responseStatus.callout ? (
                          <div
                            className={cn(
                              "mb-2 rounded-md border px-2 py-1 text-[11px] leading-snug",
                              getLogTextCalloutToneClass(responseStatus),
                            )}
                          >
                            {responseStatus.callout}
                          </div>
                        ) : null}
                        <MarkdownViewClient markdown={responseStatus.displayValue ?? ""} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/10">
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition-colors",
                        isExpanded ? "bg-muted/40 text-foreground" : "text-foreground hover:bg-muted/20",
                      )}
                      onClick={() => toggleExpanded(log.id)}
                    >
                      <span>Summary</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {status?.loading ? "loading…" : status?.error ? "error" : isExpanded ? "hide" : "show"}
                      </span>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-border px-3 py-3">
                        {status?.loading ? (
                          <SummarySkeleton />
                        ) : status?.error ? (
                          <div className="rounded-md border border-border bg-background/80 p-3 text-[11px] text-red-600 dark:text-red-300">
                            {status.error}
                          </div>
                        ) : detail ? (
                          <LogSummaryPanel detail={detail} />
                        ) : (
                          <div className="text-[11px] text-muted-foreground">No data for this interaction.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore ? (
            <div className="border-t border-border bg-muted/20 px-4 py-3 text-[11px] text-muted-foreground">
              Showing first {logs.length} interactions for this session. Refine filters to load fewer rows.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
