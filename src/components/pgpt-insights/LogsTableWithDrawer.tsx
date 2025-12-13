"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { LOW_SCORE_THRESHOLD } from "../../lib/pgpt-insights/constants";
import type { PerazziLogPreviewRow, PgptLogDetailResponse } from "../../lib/pgpt-insights/types";

import { formatCompactNumber, formatDurationMs, formatScore, formatTimestampShort } from "./format";
import { MarkdownViewClient } from "./MarkdownViewClient";

type TabKey = "summary" | "prompt" | "response" | "retrieval" | "qa";

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
  // Priority:
  // 1) guardrail blocked
  // 2) low confidence
  // 3) low maxScore (assistant)
  if (log.guardrail_status === "blocked") return "border-l-4 border-red-500/50 bg-red-500/5";
  if (log.low_confidence === true) return "border-l-4 border-amber-500/50 bg-amber-500/5";

  const s = parseScore(log.max_score);
  if (log.endpoint === "assistant" && s !== null && s < LOW_SCORE_THRESHOLD) {
    return "border-l-4 border-yellow-500/50 bg-yellow-500/5";
  }

  return "border-l-4 border-transparent";
}

function Badge({
  children,
  tone = "default",
  title,
}: {
  children: ReactNode;
  tone?: "default" | "red" | "amber" | "yellow" | "blue" | "purple";
  title?: string;
}) {
  const toneClass =
    tone === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-700"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
        : tone === "yellow"
          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-700"
          : tone === "blue"
            ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
            : tone === "purple"
              ? "border-purple-500/30 bg-purple-500/10 text-purple-700"
              : "border-border bg-background text-muted-foreground";

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide tabular-nums",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground"
    >
      {copied ? "Copied" : label}
    </button>
  );
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

export function LogsTableWithDrawer({
  logs,
  tableDensityClass,
  truncPrimary,
  isCompact,
}: {
  logs: PerazziLogPreviewRow[];
  tableDensityClass: string;
  truncPrimary: number;
  isCompact: boolean;
}) {
  const cacheRef = useRef(new Map<string, PgptLogDetailResponse>());

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [responseMode, setResponseMode] = useState<"rendered" | "raw">("rendered");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PgptLogDetailResponse | null>(null);

  const selectedPreview = useMemo(() => {
    if (!selectedId) return null;
    return logs.find((l) => l.id === selectedId) ?? null;
  }, [logs, selectedId]);

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

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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

    fetch(`/api/admin/pgpt-insights/log/${encodeURIComponent(selectedId)}`, {
      method: "GET",
      signal: controller.signal,
    })
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
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                created_at
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                env
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                endpoint
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                session_id
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                triage (click row to inspect)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {logs.map((log) => {
              const tone = rowToneClass(log);
              const hover = "hover:bg-muted/30";
              const rowClassName = cn(tone, hover, "cursor-pointer");

              const scoreNum = parseScore(log.max_score);
              const isLowScore = log.endpoint === "assistant" && scoreNum !== null && scoreNum < LOW_SCORE_THRESHOLD;
              const isBlocked = log.guardrail_status === "blocked";
              const isLowConfidence = log.low_confidence === true;

              const intentCount = log.intents?.length ?? 0;
              const topicCount = log.topics?.length ?? 0;

              const p1 = oneLine(log.prompt_preview ?? "");
              const a1 = oneLine(log.response_preview ?? "");

              const promptTruncated = (log.prompt_len ?? 0) > (log.prompt_preview?.length ?? 0);
              const responseTruncated = (log.response_len ?? 0) > (log.response_preview?.length ?? 0);

              return (
                <tr
                  key={log.id}
                  className={rowClassName}
                  onClick={(e) => {
                    const target = e.target as HTMLElement | null;
                    if (target?.closest("a,button,input,select,textarea")) return;
                    openDrawer(log.id);
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
                    <div className={cn("space-y-2", isCompact ? "py-0" : "py-0")}>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">P:</span>{" "}
                          <span className="break-words">{truncate(p1, truncPrimary)}</span>
                          {promptTruncated ? (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">truncated</span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">A:</span>{" "}
                          <span className="break-words">{truncate(a1, truncPrimary)}</span>
                          {responseTruncated ? (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">truncated</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {log.archetype ? <Badge>{log.archetype}</Badge> : null}
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
                          <Badge tone={log.qa_flag_status === "open" ? "purple" : "default"}>
                            QA {log.qa_flag_status}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Inspect →
                      </div>
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

          <div className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col border-l border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Interaction</div>
                <div className="text-sm font-semibold text-foreground">
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
                {selectedId ? <CopyButton value={selectedId} label="Copy id" /> : null}
                <button
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
                <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
                  {error}
                </div>
              ) : null}

              {!loading && !error && detail ? (
                <>
                  {activeTab === "summary" ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="text-xs font-semibold text-foreground">Signals</div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="text-xs">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">maxScore</div>
                            <div className="mt-1 font-medium text-foreground">
                              {detail.log.max_score ? detail.log.max_score : "—"}
                            </div>
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
                              {detail.log.prompt_tokens ?? "—"} prompt · {detail.log.completion_tokens ?? "—"} completion
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

                        <div className="mt-3 text-xs text-muted-foreground">
                          Session:{" "}
                          {detail.log.session_id ? (
                            <Link
                              href={`/admin/pgpt-insights/session/${encodeURIComponent(detail.log.session_id)}`}
                              className="text-blue-600 underline"
                            >
                              {detail.log.session_id}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </div>

                        {(detail.log.intents?.length ?? 0) > 0 ? (
                          <div className="mt-3">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">intents</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(detail.log.intents ?? []).slice(0, 12).map((x) => (
                                <Badge key={`intent-${x}`}>{x}</Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {(detail.log.topics?.length ?? 0) > 0 ? (
                          <div className="mt-3">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">topics</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(detail.log.topics ?? []).slice(0, 12).map((x) => (
                                <Badge key={`topic-${x}`}>{x}</Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === "prompt" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-foreground">Prompt</div>
                        <CopyButton value={detail.log.prompt ?? ""} label="Copy prompt" />
                      </div>
                      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs leading-snug text-foreground">
                        {detail.log.prompt ?? ""}
                      </pre>
                    </div>
                  ) : null}

                  {activeTab === "response" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-foreground">Response</div>
                        <CopyButton value={detail.log.response ?? ""} label="Copy response" />
                      </div>

                      {responseMode === "raw" ? (
                        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs leading-snug text-foreground">
                          {detail.log.response ?? ""}
                        </pre>
                      ) : (
                        <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background p-3">
                          <MarkdownViewClient markdown={detail.log.response ?? ""} />
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
                          {(detail.log.retrieved_chunks ?? []).map((rawUnknown, idx: number) => {
                            const raw = rawUnknown && typeof rawUnknown === "object" ? (rawUnknown as Record<string, unknown>) : null;
                            const chunkIdRaw =
                              raw?.chunkId ?? raw?.chunk_id ?? raw?.id ?? null;
                            const chunkId =
                              typeof chunkIdRaw === "string" || typeof chunkIdRaw === "number" ? chunkIdRaw : null;

                            const scoreRaw = raw?.score ?? raw?.similarity ?? raw?.maxScore ?? null;
                            const score =
                              typeof scoreRaw === "string" || typeof scoreRaw === "number" ? scoreRaw : null;

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
                                    {JSON.stringify(rawUnknown, null, 2)}
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
                                <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                                  {detail.qa_latest.notes}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div className="text-xs text-muted-foreground">No flags for this interaction.</div>
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

                                  <Link href={`/admin/pgpt-insights/qa#flag-${f.id}`} className="ml-auto text-xs text-blue-600 underline">
                                    view →
                                  </Link>
                                </div>
                                {f.notes ? (
                                  <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{f.notes}</div>
                                ) : null}
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
