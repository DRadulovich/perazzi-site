"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { LOW_SCORE_THRESHOLD } from "../../lib/pgpt-insights/constants";
import { getLogTextCalloutToneClass, getTextStorageBadges } from "../../lib/pgpt-insights/logTextStatus";
import type { PerazziLogPreviewRow, PgptLogDetailResponse } from "../../lib/pgpt-insights/types";

import { Badge } from "./Badge";
import { CopyButton } from "./CopyButton";
import { formatCompactNumber, formatScore, formatTimestampShort } from "./format";
import { LogSummaryPanel } from "./LogSummaryPanel";
import { MarkdownViewClient } from "./MarkdownViewClient";

type TabKey = "summary" | "prompt" | "response" | "retrieval" | "qa";

const QA_REASON_OPTIONS = [
  "hallucination",
  "bad_tone",
  "wrong_retrieval",
  "guardrail_false_positive",
  "guardrail_false_negative",
  "other",
] as const;

function cn(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function truncate(text: string, length = 200) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function oneLine(text: string): string {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseScore(score: string | null | undefined): number | null {
  if (!score) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

function rowToneClass(log: PerazziLogPreviewRow): string {
  if (log.guardrail_status === "blocked")
    return "border-l-4 border-red-500/50 bg-red-500/5 dark:border-red-500/60 dark:bg-red-500/15";
  if (log.low_confidence === true)
    return "border-l-4 border-amber-500/50 bg-amber-500/5 dark:border-amber-500/60 dark:bg-amber-500/15";

  const s = parseScore(log.max_score);
  if (log.endpoint === "assistant" && s !== null && s < LOW_SCORE_THRESHOLD)
    return "border-l-4 border-yellow-500/50 bg-yellow-500/5 dark:border-yellow-500/60 dark:bg-yellow-500/15";

  return "border-l-4 border-transparent";
}

function DrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-muted/40" />
      <div className="h-4 w-2/3 rounded bg-muted/40" />
      <div className="h-24 w-full rounded bg-muted/30" />
      <div className="h-24 w-full rounded bg-muted/30" />
    </div>
  );
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return Array.from(container.querySelectorAll(selectors)).filter((el): el is HTMLElement => el instanceof HTMLElement);
}

export function LogsTableWithDrawer({
  logs,
  tableDensityClass,
  truncPrimary,
}: {
  logs: PerazziLogPreviewRow[];
  tableDensityClass: string;
  truncPrimary: number;
}) {
  const cacheRef = useRef(new Map<string, PgptLogDetailResponse>());

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [responseMode, setResponseMode] = useState<"rendered" | "raw">("rendered");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PgptLogDetailResponse | null>(null);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const selectedPreview = useMemo(() => {
    if (!selectedId) return null;
    return logs.find((l) => l.id === selectedId) ?? null;
  }, [logs, selectedId]);

  const fallbackMetadata = selectedPreview?.metadata;

  const qaReturnTo = useMemo(() => {
    if (!open) return "";
    if (typeof window === "undefined") return "";
    try {
      const base = window.location.href.split("#")[0];
      return `${base}#logs`;
    } catch {
      return "";
    }
  }, [open]);

  const detailTextStatus = useMemo(() => {
    if (!detail?.log) return null;
    return getTextStorageBadges({
      promptText: detail.log.prompt,
      responseText: detail.log.response,
      metadata: detail.log.metadata ?? fallbackMetadata,
      logTextMode: detail.log.log_text_mode,
      logTextMaxChars: detail.log.log_text_max_chars,
      promptTextOmitted: detail.log.prompt_text_omitted,
      responseTextOmitted: detail.log.response_text_omitted,
      promptTextTruncated: detail.log.prompt_text_truncated,
      responseTextTruncated: detail.log.response_text_truncated,
    });
  }, [detail, fallbackMetadata]);

  function closeDrawer() {
    setOpen(false);
  }

  function openDrawer(id: string) {
    setSelectedId(id);
    setActiveTab("summary");
    setResponseMode("rendered");
    setOpen(true);
  }

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus capture + restore
  useEffect(() => {
    if (!open) return;

    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      lastFocusRef.current?.focus?.();
    };
  }, [open]);

  // Escape to close (global)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Focus trap (inside drawer)
  useEffect(() => {
    if (!open) return;
    const el = drawerRef.current;
    if (!el) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusables = getFocusable(el);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Fetch detail on-demand with in-component cache
  useEffect(() => {
    if (!open || !selectedId) return;

    const cached = cacheRef.current.get(selectedId);
    if (cached) {
      setDetail(cached);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);
    setDetail(null);

    fetch(`/api/admin/pgpt-insights/log/${encodeURIComponent(selectedId)}`, { method: "GET", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load interaction (${res.status})`);
        return (await res.json()) as PgptLogDetailResponse;
      })
      .then((data) => {
        if (cancelled) return;
        cacheRef.current.set(selectedId, data);
        setDetail(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load interaction";
        setError(msg);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, selectedId]);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className={cn("w-full min-w-[1400px] table-fixed border-collapse text-xs", tableDensityClass)}>
          <colgroup>
            <col className="w-[200px]" />
            <col className="w-[100px]" />
            <col className="w-[130px]" />
            <col className="w-[220px]" />
            <col className="w-[900px]" />
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
                endpoint
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                session_id
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                triage (Enter/Space to inspect)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {logs.map((log) => {
              const tone = rowToneClass(log);
              const rowClassName = cn(
                tone,
                "hover:bg-muted/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/40",
              );

              const scoreNum = parseScore(log.max_score);
              const isLowScore = log.endpoint === "assistant" && scoreNum !== null && scoreNum < LOW_SCORE_THRESHOLD;
              const isBlocked = log.guardrail_status === "blocked";
              const isLowConfidence = log.low_confidence === true;

              const intentCount = log.intents?.length ?? 0;
              const topicCount = log.topics?.length ?? 0;

              const textStatus = getTextStorageBadges({
                promptText: log.prompt_preview,
                responseText: log.response_preview,
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

              const promptPreview = truncate(oneLine(promptStatus.displayValue), truncPrimary);
              const responsePreview = truncate(oneLine(responseStatus.displayValue), truncPrimary);

              const promptPreviewTruncated =
                !promptStatus.isOmitted && (log.prompt_len ?? 0) > (log.prompt_preview?.length ?? 0);
              const responsePreviewTruncated =
                !responseStatus.isOmitted && (log.response_len ?? 0) > (log.response_preview?.length ?? 0);

              return (
                <tr
                  key={log.id}
                  className={rowClassName}
                  tabIndex={0}
                  role="button"
                  aria-label="Open interaction inspector"
                  onClick={(e) => {
                    const target = e.target as HTMLElement | null;
                    if (target?.closest("a,button,input,select,textarea")) return;
                    openDrawer(log.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDrawer(log.id);
                    }
                  }}
                >
                  <td className="px-3 py-2 whitespace-normal break-words leading-snug">
                    <span title={String(log.created_at)} className="tabular-nums">
                      {formatTimestampShort(String(log.created_at))}
                    </span>
                  </td>
                  <td className="px-3 py-2">{log.env}</td>
                  <td className="px-3 py-2">{log.endpoint}</td>
                  <td className="px-3 py-2">
                    {log.session_id ? (
                      <Link
                        href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                        className="text-blue-600 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {log.session_id}
                      </Link>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">P:</span>{" "}
                          <span
                            className={cn("break-words", promptStatus.isOmitted ? "text-muted-foreground" : undefined)}
                          >
                            {promptStatus.isOmitted ? "[omitted]" : promptPreview}
                          </span>
                          {promptStatus.badge ? (
                            <span className="ml-2 inline-flex">
                              <Badge tone={promptStatus.badgeTone ?? "default"} title={promptStatus.callout}>
                                {promptStatus.badge}
                              </Badge>
                            </span>
                          ) : null}
                          {promptPreviewTruncated ? (
                            <span className="ml-2 inline-flex">
                              <Badge tone="default" title="Preview shortened for table">
                                preview
                              </Badge>
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">A:</span>{" "}
                          <span
                            className={cn("break-words", responseStatus.isOmitted ? "text-muted-foreground" : undefined)}
                          >
                            {responseStatus.isOmitted ? "[omitted]" : responsePreview}
                          </span>
                          {responseStatus.badge ? (
                            <span className="ml-2 inline-flex">
                              <Badge tone={responseStatus.badgeTone ?? "default"} title={responseStatus.callout}>
                                {responseStatus.badge}
                              </Badge>
                            </span>
                          ) : null}
                          {responsePreviewTruncated ? (
                            <span className="ml-2 inline-flex">
                              <Badge tone="default" title="Preview shortened for table">
                                preview
                              </Badge>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {log.archetype ? (
                          <Badge
                            title={
                              log.archetype_confidence !== null && log.archetype_confidence !== undefined
                                ? `margin ${(log.archetype_confidence * 100).toFixed(0)}pp`
                                : undefined
                            }
                          >
                            {log.archetype}
                            {typeof log.archetype_confidence === "number" ? (
                              <> · +{Math.round(log.archetype_confidence * 100)}pp</>
                            ) : null}
                          </Badge>
                        ) : null}
                        {log.model ? <Badge tone="blue">{log.model}</Badge> : null}
                        {log.used_gateway ? <Badge>gateway</Badge> : null}

                        {scoreNum !== null ? (
                          <Badge tone={isLowScore ? "yellow" : "default"} title="assistant maxScore">
                            maxScore {formatScore(scoreNum)}
                          </Badge>
                        ) : null}

                        {isBlocked ? (
                          <Badge tone="red" title={log.guardrail_reason ?? undefined}>
                            blocked{log.guardrail_reason ? `: ${log.guardrail_reason}` : ""}
                          </Badge>
                        ) : null}

                        {isLowConfidence ? <Badge tone="amber">low confidence</Badge> : null}

                        {intentCount > 0 ? <Badge>intents {formatCompactNumber(intentCount)}</Badge> : null}
                        {topicCount > 0 ? <Badge>topics {formatCompactNumber(topicCount)}</Badge> : null}

                        {log.qa_flag_status ? (
                          <Badge tone={log.qa_flag_status === "open" ? "purple" : "default"}>QA {log.qa_flag_status}</Badge>
                        ) : null}
                      </div>

                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Inspect →</div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeDrawer} aria-hidden="true" />

          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pgpt-drawer-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col border-l border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Interaction</div>
                <div id="pgpt-drawer-title" className="text-sm font-semibold text-foreground">
                  {detail?.log?.session_id ? detail.log.session_id : selectedId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {detail?.log
                    ? `${formatTimestampShort(detail.log.created_at)} · ${detail.log.env} · ${detail.log.endpoint}`
                    : selectedPreview
                      ? `${formatTimestampShort(selectedPreview.created_at)} · ${selectedPreview.env} · ${selectedPreview.endpoint}`
                      : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedId ? <CopyButton value={selectedId} label="Copy id" ariaLabel="Copy interaction id" /> : null}
                {detail?.log?.session_id ? (
                  <CopyButton value={detail.log.session_id} label="Copy session" ariaLabel="Copy session id" />
                ) : null}
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
              {(
                [
                  ["summary", "Summary"],
                  ["prompt", "Prompt"],
                  ["response", "Response"],
                  ["retrieval", "Retrieval"],
                  ["qa", "QA"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "rounded-md border px-3 py-1 text-xs",
                    activeTab === key
                      ? "border-border bg-background text-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}

              {activeTab === "response" ? (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Mode</span>
                  <button
                    type="button"
                    onClick={() => setResponseMode("rendered")}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs",
                      responseMode === "rendered"
                        ? "border-border bg-background text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                    )}
                  >
                    Rendered
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseMode("raw")}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs",
                      responseMode === "raw"
                        ? "border-border bg-background text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                    )}
                  >
                    Raw
                  </button>
                </div>
              ) : null}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? <DrawerSkeleton /> : null}

              {!loading && error ? (
                <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">{error}</div>
              ) : null}

              {!loading && !error && detail ? (
                <>
                  {activeTab === "summary" ? (
                    <LogSummaryPanel detail={detail} fallbackMetadata={fallbackMetadata} />
                  ) : null}

                  {activeTab === "prompt" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-foreground">Prompt</div>
                        <CopyButton
                          value={detail.log.prompt ?? ""}
                          label={detailTextStatus?.prompt.copyLabel ?? "Copy prompt"}
                          disabled={detailTextStatus ? !detailTextStatus.prompt.copyAllowed : false}
                          title={detailTextStatus?.prompt.callout}
                        />
                      </div>
                      {detailTextStatus?.prompt.callout ? (
                        <div
                          className={cn(
                            "rounded-lg border px-3 py-2 text-[11px] leading-snug",
                            getLogTextCalloutToneClass(detailTextStatus.prompt),
                          )}
                        >
                          {detailTextStatus.prompt.callout}
                        </div>
                      ) : null}
                      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs leading-snug text-foreground">
                        {detailTextStatus?.prompt.displayValue ?? detail.log.prompt ?? ""}
                      </pre>
                    </div>
                  ) : null}

                  {activeTab === "response" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-foreground">Response</div>
                        <CopyButton
                          value={detail.log.response ?? ""}
                          label={detailTextStatus?.response.copyLabel ?? "Copy response"}
                          disabled={detailTextStatus ? !detailTextStatus.response.copyAllowed : false}
                          title={detailTextStatus?.response.callout}
                        />
                      </div>

                      {detailTextStatus?.response.callout ? (
                        <div
                          className={cn(
                            "rounded-lg border px-3 py-2 text-[11px] leading-snug",
                            getLogTextCalloutToneClass(detailTextStatus.response),
                          )}
                        >
                          {detailTextStatus.response.callout}
                        </div>
                      ) : null}

                      {responseMode === "raw" ? (
                        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs leading-snug text-foreground">
                          {detailTextStatus?.response.displayValue ?? detail.log.response ?? ""}
                        </pre>
                      ) : (
                        <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background p-3">
                          <MarkdownViewClient
                            markdown={detailTextStatus?.response.displayValue ?? detail.log.response ?? ""}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}

                  {activeTab === "retrieval" ? (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-foreground">Retrieved Chunks</div>

                      {(detail.log.retrieved_chunks?.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
                          No retrievedChunks metadata for this interaction.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(Array.isArray(detail.log.retrieved_chunks) ? detail.log.retrieved_chunks : []).map((raw, idx: number) => {
                            const chunk = (raw ?? {}) as Record<string, unknown>;
                            const chunkIdRaw = (chunk.chunkId ?? chunk.chunk_id ?? chunk.id) as string | number | undefined;
                            const chunkId = typeof chunkIdRaw === "string" || typeof chunkIdRaw === "number" ? chunkIdRaw : null;
                            const scoreRaw = (chunk.score ?? chunk.similarity ?? chunk.maxScore) as string | number | undefined;
                            const score = typeof scoreRaw === "string" || typeof scoreRaw === "number" ? scoreRaw : null;

                            return (
                              <div key={`chunk-${idx}`} className="rounded-xl border border-border bg-background p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="text-xs font-semibold text-foreground">
                                      {chunkId ? `chunk ${idx + 1}: ${chunkId}` : `chunk ${idx + 1}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {score !== null && score !== undefined ? `score: ${String(score)}` : "score: —"}
                                    </div>
                                  </div>

                                  {chunkId ? <CopyButton value={String(chunkId)} label="Copy chunk id" /> : null}
                                </div>

                                <details className="mt-3">
                                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                    show raw metadata
                                  </summary>
                                  <pre className="mt-2 overflow-auto rounded-lg border border-border bg-muted/20 p-3 text-[11px] leading-snug text-foreground">
                                    {JSON.stringify(chunk, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {activeTab === "qa" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-foreground">QA Flags</div>
                        <Link href="/admin/pgpt-insights/qa" className="text-xs text-blue-600 underline">
                          Open QA Review →
                        </Link>
                      </div>

                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">latest</div>

                        <div className="mt-2 text-xs text-foreground">
                          {detail.qa_latest ? (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={detail.qa_latest.status === "open" ? "purple" : "default"}>
                                  {detail.qa_latest.status}
                                </Badge>
                                {detail.qa_latest.reason ? <Badge>{detail.qa_latest.reason}</Badge> : null}
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestampShort(detail.qa_latest.created_at)}
                                </span>
                              </div>

                              {detail.qa_latest.notes ? (
                                <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{detail.qa_latest.notes}</div>
                              ) : null}
                            </>
                          ) : (
                            <div className="text-xs text-muted-foreground">No flags for this interaction.</div>
                          )}
                        </div>

                        <div className="mt-4 border-t border-border pt-3">
                          {detail.qa_latest?.status === "open" ? (
                            <form method="POST" action="/admin/pgpt-insights/qa/resolve" className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <input type="hidden" name="flagId" value={detail.qa_latest.id} />
                              <input type="hidden" name="returnTo" value={qaReturnTo} />

                              <input
                                name="notes"
                                aria-label="Resolution notes"
                                placeholder="resolution notes…"
                                maxLength={200}
                                className="h-9 w-[320px] max-w-full rounded-md border bg-background px-3 text-xs"
                              />

                              <button
                                type="submit"
                                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-xs hover:bg-muted"
                              >
                                Resolve
                              </button>
                            </form>
                          ) : (
                            <form method="POST" action="/admin/pgpt-insights/qa/flag" className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <input type="hidden" name="interactionId" value={selectedId ?? ""} />
                              <input type="hidden" name="returnTo" value={qaReturnTo} />

                              <select
                                name="reason"
                                aria-label="QA reason"
                                defaultValue="hallucination"
                                className="h-9 rounded-md border bg-background px-2 text-xs"
                              >
                                {QA_REASON_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>

                              <input
                                name="notes"
                                aria-label="QA notes"
                                placeholder="notes…"
                                maxLength={200}
                                className="h-9 w-[320px] max-w-full rounded-md border bg-background px-3 text-xs"
                              />

                              <button
                                type="submit"
                                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-xs hover:bg-muted"
                              >
                                {detail.qa_latest ? "Flag again" : "Flag"}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">history</div>

                        {(detail.qa_history?.length ?? 0) === 0 ? (
                          <div className="mt-2 text-xs text-muted-foreground">—</div>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {(detail.qa_history ?? []).map((f) => (
                              <div key={f.id} className="rounded-lg border border-border bg-background p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge tone={f.status === "open" ? "purple" : "default"}>{f.status}</Badge>
                                  {f.reason ? <Badge>{f.reason}</Badge> : null}
                                  <span className="text-xs text-muted-foreground">{formatTimestampShort(f.created_at)}</span>

                                  <Link
                                    href={`/admin/pgpt-insights/qa#flag-${f.id}`}
                                    className="ml-auto text-xs text-blue-600 underline"
                                  >
                                    view →
                                  </Link>
                                </div>
                                {f.notes ? <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{f.notes}</div> : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
