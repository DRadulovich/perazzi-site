"use client";

import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { LOW_SCORE_THRESHOLD } from "../../lib/pgpt-insights/constants";
import { getLogTextCalloutToneClass, getTextStorageBadges } from "../../lib/pgpt-insights/logTextStatus";
import type { PerazziLogPreviewRow, PgptLogDetailResponse } from "../../lib/pgpt-insights/types";

import { Badge } from "./Badge";
import { CopyButton } from "./CopyButton";
import { formatCompactNumber, formatScore, formatTimestampShort } from "./format";
import { LogSummaryPanel } from "./LogSummaryPanel";
import { MarkdownViewClient } from "./MarkdownViewClient";
import { DataTable } from "./table/DataTable";
import { MonoCell } from "./table/MonoCell";
import { StatusBadge } from "./table/StatusBadge";

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

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const POLLUTION_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function readNestedNumber(obj: unknown, path: string[]): number | null {
  let current: unknown = obj;
  for (const key of path) {
    if (POLLUTION_KEYS.has(key)) return null;
    if (!current || typeof current !== "object") return null;
    const descriptor = Object.getOwnPropertyDescriptor(current as object, key);
    if (!descriptor) return null;
    current = descriptor.value as unknown;
  }
  return toNumberOrNull(current);
}

function getTokenMetrics(log: PerazziLogPreviewRow) {
  const promptTokens = toNumberOrNull((log as { prompt_tokens?: unknown }).prompt_tokens);
  const completionTokens = toNumberOrNull((log as { completion_tokens?: unknown }).completion_tokens);
  const metadataObj =
    log.metadata && typeof log.metadata === "object" ? (log.metadata as Record<string, unknown>) : null;
  const responseUsage =
    metadataObj && typeof (metadataObj as { responseUsage?: unknown }).responseUsage === "object"
      ? (metadataObj as { responseUsage: unknown }).responseUsage
      : null;

  const cachedTokens =
    toNumberOrNull((log as { cached_tokens?: unknown }).cached_tokens) ??
    readNestedNumber(metadataObj, ["cachedTokens"]) ??
    readNestedNumber(responseUsage, ["input_tokens_details", "cached_tokens"]);

  const reasoningTokens =
    toNumberOrNull((log as { reasoning_tokens?: unknown }).reasoning_tokens) ??
    readNestedNumber(metadataObj, ["reasoningTokens"]) ??
    readNestedNumber(responseUsage, ["output_tokens_details", "reasoning_tokens"]);

  const totalTokens =
    toNumberOrNull((log as { total_tokens?: unknown }).total_tokens) ??
    readNestedNumber(metadataObj, ["totalTokens"]) ??
    readNestedNumber(responseUsage, ["total_tokens"]) ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null);

  return { promptTokens, completionTokens, cachedTokens, reasoningTokens, totalTokens };
}

function rowToneClass(log: PerazziLogPreviewRow): string {
  if (log.guardrail_status === "blocked")
    return "border-l-[5px] border-red-500/70";
  if (log.low_confidence === true)
    return "border-l-[5px] border-amber-500/70";

  const s = parseScore(log.max_score);
  if (log.endpoint === "assistant" && s !== null && s < LOW_SCORE_THRESHOLD)
    return "border-l-[5px] border-yellow-500/70";

  return "border-l-[5px] border-transparent";
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

type LogsTableWithDrawerProps = Readonly<{
  logs: ReadonlyArray<PerazziLogPreviewRow>;
  tableDensityClass: string;
  truncPrimary: number;
}>;

export function LogsTableWithDrawer({
  logs,
  tableDensityClass,
  truncPrimary,
}: LogsTableWithDrawerProps) {
  const cacheRef = useRef(new Map<string, PgptLogDetailResponse>());

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [responseMode, setResponseMode] = useState<"rendered" | "raw">("rendered");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PgptLogDetailResponse | null>(null);

  const drawerRef = useRef<HTMLDialogElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const selectedPreview = useMemo(() => {
    if (!selectedId) return null;
    return logs.find((l) => l.id === selectedId) ?? null;
  }, [logs, selectedId]);

  const fallbackMetadata = selectedPreview?.metadata;

  const qaReturnTo = useMemo(() => {
    if (!open) return "";
    if (typeof globalThis.window === "undefined") return "";
    try {
      const base = globalThis.window.location.href.split("#")[0];
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

  let interactionSummary = "";
  if (detail?.log) {
    interactionSummary = `${formatTimestampShort(detail.log.created_at)} · ${detail.log.env} · ${detail.log.endpoint}`;
  } else if (selectedPreview) {
    interactionSummary = `${formatTimestampShort(selectedPreview.created_at)} · ${selectedPreview.env} · ${selectedPreview.endpoint}`;
  }

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

    const win = typeof globalThis.window === "undefined" ? null : globalThis.window;
    if (!win) return;

    const t = win.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    return () => {
      win.clearTimeout(t);
      lastFocusRef.current?.focus?.();
    };
  }, [open]);

  // Headless UI Dialog handles Escape key and focus trapping.

  /* focus trap now provided by Headless UI Dialog */

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
      <DataTable
        headers={[
          { key: "created_at", label: "created_at" },
          { key: "env", label: "env" },
          { key: "endpoint", label: "endpoint" },
          { key: "session", label: "session_id" },
          { key: "triage", label: "triage (Enter/Space to inspect)" },
        ]}
        colgroup={
          <colgroup>
            <col className="w-[200px]" />
            <col className="w-[100px]" />
            <col className="w-[130px]" />
            <col className="w-[220px]" />
            <col className="w-[900px]" />
          </colgroup>
        }
        minWidth="min-w-[1400px]"
        tableDensityClass={tableDensityClass}
      >
        {logs.map((log) => {
          const tone = rowToneClass(log);
          const rowClassName = cn(
            tone,
            "group relative cursor-pointer overflow-hidden transition-colors hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring/40",
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

          const tokenMetrics = getTokenMetrics(log);
          const { cachedTokens, reasoningTokens, totalTokens } = tokenMetrics;

          return (
            <tr
              key={log.id}
              className={rowClassName}
              tabIndex={0}
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
              <td className="whitespace-normal wrap-break-word leading-snug">
                <span title={String(log.created_at)} className="tabular-nums">
                  {formatTimestampShort(String(log.created_at))}
                </span>
              </td>
              <td>
                <StatusBadge type="env" value={log.env} />
              </td>
              <td>
                <StatusBadge type="endpoint" value={log.endpoint} />
              </td>
              <td>
                {log.session_id ? (
                  <Link
                    href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                    className="text-blue-600 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MonoCell>{log.session_id}</MonoCell>
                  </Link>
                ) : (
                  ""
                )}
              </td>
              <td className="align-top">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">P:</span>{" "}
                        <span className={cn("wrap-break-word", promptStatus.isOmitted ? "text-muted-foreground" : undefined)}>
                          {promptStatus.isOmitted ? "[omitted]" : promptPreview}
                        </span>
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground/90 opacity-0 transition group-hover:opacity-100">
                        Inspect →
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">A:</span>{" "}
                      <span className={cn("wrap-break-word", responseStatus.isOmitted ? "text-muted-foreground" : undefined)}>
                        {responseStatus.isOmitted ? "[omitted]" : responsePreview}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {promptStatus.badge ? (
                      <span className="inline-flex">
                        <Badge tone={promptStatus.badgeTone ?? "default"} title={promptStatus.callout}>
                          {promptStatus.badge}
                        </Badge>
                      </span>
                    ) : null}
                    {responseStatus.badge ? (
                      <span className="inline-flex">
                        <Badge tone={responseStatus.badgeTone ?? "default"} title={responseStatus.callout}>
                          {responseStatus.badge}
                        </Badge>
                      </span>
                    ) : null}
                    {promptPreviewTruncated ? (
                      <span className="inline-flex">
                        <Badge tone="default" title="Preview shortened for table">
                          prompt preview
                        </Badge>
                      </span>
                    ) : null}
                    {responsePreviewTruncated ? (
                      <span className="inline-flex">
                        <Badge tone="default" title="Preview shortened for table">
                          response preview
                        </Badge>
                      </span>
                    ) : null}
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

                  <div className="text-[11px] text-muted-foreground flex flex-wrap gap-3">
                    <span>Total tokens: {totalTokens ?? "—"}</span>
                    <span>Cached tokens: {cachedTokens ?? "—"}</span>
                    <span>Reasoning tokens: {reasoningTokens ?? "—"}</span>
                  </div>

                  <div className="flex justify-end text-[11px] uppercase tracking-wide text-muted-foreground transition group-hover:text-foreground">
                    Inspect →
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50" onClose={closeDrawer} initialFocus={closeBtnRef}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 flex w-full max-w-[760px] flex-col outline-none">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="translate-x-full" enterTo="translate-x-0" leave="ease-in duration-150" leaveFrom="translate-x-0" leaveTo="translate-x-full">
              <Dialog.Panel ref={drawerRef} className="flex h-full flex-col border-l border-border bg-card shadow-2xl outline-none">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Interaction</div>
                <div id="pgpt-drawer-title" className="text-sm font-semibold text-foreground">
                  {detail?.log?.session_id ? detail.log.session_id : selectedId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {interactionSummary}
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
                            const chunkKey =
                              chunkId !== null ? String(chunkId) : JSON.stringify(chunk) ?? `chunk-${String(score ?? "unknown")}`;

                            return (
                              <div key={chunkKey} className="rounded-xl border border-border bg-background p-4">
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
                                className="h-9 w-80 max-w-full rounded-md border bg-background px-3 text-xs"
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
                                className="h-9 w-80 max-w-full rounded-md border bg-background px-3 text-xs"
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
                        </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
