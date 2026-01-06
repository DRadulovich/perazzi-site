"use client";

import Link from "next/link";

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
import { cn, getTokenMetrics, oneLine, parseScore, rowToneClass, safeJsonStringify, truncate } from "./LogsTableWithDrawer.helpers";

export function DrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-muted/40" />
      <div className="h-4 w-2/3 rounded bg-muted/40" />
      <div className="h-24 w-full rounded bg-muted/30" />
      <div className="h-24 w-full rounded bg-muted/30" />
    </div>
  );
}

type RetrievalDebugRow = {
  rank: number;
  documentPath: string | null;
  headingPath: string | null;
  baseScore: number;
  boost: number;
  archetypeBoost: number;
  finalScore: number;
  chunkId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toNumberOrZero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function decodeRetrievalDebugRows(metadata: unknown): RetrievalDebugRow[] {
  if (!isRecord(metadata)) return [];
  const retrievalDebug = metadata.retrievalDebug;
  if (!isRecord(retrievalDebug)) return [];
  const rawChunks = retrievalDebug.chunks;
  if (!Array.isArray(rawChunks)) return [];

  const rows: RetrievalDebugRow[] = [];
  rawChunks.forEach((raw, idx) => {
    if (!isRecord(raw)) return;
    const chunkIdRaw = raw.chunkId ?? raw.chunk_id ?? raw.id;
    const chunkId =
      typeof chunkIdRaw === "string" || typeof chunkIdRaw === "number" ? String(chunkIdRaw) : null;
    const documentPath = toStringOrNull(
      raw.documentPath ?? raw.document_path ?? raw.sourcePath ?? raw.source_path,
    );
    const headingPath = toStringOrNull(raw.headingPath ?? raw.heading_path);
    const baseScore = toNumberOrZero(raw.baseScore);
    const boost = toNumberOrZero(raw.boost);
    const archetypeBoost = toNumberOrZero(raw.archetypeBoost);
    const finalScore = toNumberOrZero(raw.finalScore);
    const rankRaw = toNumberOrZero(raw.rank);
    const rank = rankRaw > 0 ? Math.max(1, Math.floor(rankRaw)) : idx + 1;

    rows.push({
      rank,
      documentPath,
      headingPath,
      baseScore,
      boost,
      archetypeBoost,
      finalScore,
      chunkId,
    });
  });

  return rows;
}

function isInteractiveElement(target: HTMLElement | null): boolean {
  return !!target?.closest("a,button,input,select,textarea");
}

function shouldInspectOnKeyDown(key: string): boolean {
  return key === "Enter" || key === " ";
}

function SessionCell({ sessionId }: Readonly<{ sessionId: string | null }>) {
  if (!sessionId) return null;

  return (
    <Link
      href={`/admin/pgpt-insights/session/${encodeURIComponent(sessionId)}`}
      className="text-blue-600 underline"
      onClick={(e) => e.stopPropagation()}
    >
      <MonoCell>{sessionId}</MonoCell>
    </Link>
  );
}

function ScoreBadge({ scoreNum, isLowScore }: Readonly<{ scoreNum: number | null; isLowScore: boolean }>) {
  if (scoreNum === null) return null;
  return (
    <Badge tone={isLowScore ? "yellow" : "default"} title="assistant maxScore">
      maxScore {formatScore(scoreNum)}
    </Badge>
  );
}

function BlockedBadge({
  guardrailReason,
  isBlocked,
}: Readonly<{
  guardrailReason: string | null;
  isBlocked: boolean;
}>) {
  if (!isBlocked) return null;
  return (
    <Badge tone="red" title={guardrailReason ?? undefined}>
      blocked{guardrailReason ? `: ${guardrailReason}` : ""}
    </Badge>
  );
}

function ArchetypeBadge({ log }: Readonly<{ log: PerazziLogPreviewRow }>) {
  if (!log.archetype) return null;

  const title =
    log.archetype_confidence !== null && log.archetype_confidence !== undefined
      ? `margin ${(log.archetype_confidence * 100).toFixed(0)}pp`
      : undefined;

  return (
    <Badge title={title}>
      {log.archetype}
      {typeof log.archetype_confidence === "number" ? <> · +{Math.round(log.archetype_confidence * 100)}pp</> : null}
    </Badge>
  );
}

function CountBadge({ label, count }: Readonly<{ label: string; count: number }>) {
  if (count <= 0) return null;
  return <Badge>{label} {formatCompactNumber(count)}</Badge>;
}

function QaFlagBadge({ status }: Readonly<{ status: string | null | undefined }>) {
  if (!status) return null;
  return <Badge tone={status === "open" ? "purple" : "default"}>QA {status}</Badge>;
}

function StorageBadgesRow({
  promptStatus,
  responseStatus,
  promptPreviewTruncated,
  responsePreviewTruncated,
}: Readonly<{
  promptStatus: ReturnType<typeof getTextStorageBadges>["prompt"];
  responseStatus: ReturnType<typeof getTextStorageBadges>["response"];
  promptPreviewTruncated: boolean;
  responsePreviewTruncated: boolean;
}>) {
  return (
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
  );
}

function PromptResponsePreview({
  promptStatus,
  responseStatus,
  promptPreview,
  responsePreview,
}: Readonly<{
  promptStatus: ReturnType<typeof getTextStorageBadges>["prompt"];
  responseStatus: ReturnType<typeof getTextStorageBadges>["response"];
  promptPreview: string;
  responsePreview: string;
}>) {
  return (
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
  );
}

function MetaBadgesRow({
  log,
  scoreNum,
  isLowScore,
  isBlocked,
  isLowConfidence,
  intentCount,
  topicCount,
}: Readonly<{
  log: PerazziLogPreviewRow;
  scoreNum: number | null;
  isLowScore: boolean;
  isBlocked: boolean;
  isLowConfidence: boolean;
  intentCount: number;
  topicCount: number;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ArchetypeBadge log={log} />
      {log.model ? <Badge tone="blue">{log.model}</Badge> : null}
      {log.used_gateway ? <Badge>gateway</Badge> : null}

      <ScoreBadge scoreNum={scoreNum} isLowScore={isLowScore} />
      <BlockedBadge guardrailReason={log.guardrail_reason} isBlocked={isBlocked} />
      {isLowConfidence ? <Badge tone="amber">low confidence</Badge> : null}

      <CountBadge label="intents" count={intentCount} />
      <CountBadge label="topics" count={topicCount} />
      <QaFlagBadge status={log.qa_flag_status} />
    </div>
  );
}

function LogRow({
  log,
  truncPrimary,
  onInspect,
}: Readonly<{
  log: PerazziLogPreviewRow;
  truncPrimary: number;
  onInspect: (id: string) => void;
}>) {
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

  const promptPreviewTruncated = promptStatus.isOmitted
    ? false
    : (log.prompt_len ?? 0) > (log.prompt_preview?.length ?? 0);
  const responsePreviewTruncated = responseStatus.isOmitted
    ? false
    : (log.response_len ?? 0) > (log.response_preview?.length ?? 0);

  const { cachedTokens, reasoningTokens, totalTokens } = getTokenMetrics(log);

  return (
    <tr
      className={rowClassName}
      tabIndex={0}
      aria-label="Open interaction inspector"
      onClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (isInteractiveElement(target)) return;
        onInspect(log.id);
      }}
      onKeyDown={(e) => {
        if (!shouldInspectOnKeyDown(e.key)) return;
        e.preventDefault();
        onInspect(log.id);
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
        <SessionCell sessionId={log.session_id} />
      </td>
      <td className="align-top">
        <div className="space-y-2">
          <PromptResponsePreview
            promptStatus={promptStatus}
            responseStatus={responseStatus}
            promptPreview={promptPreview}
            responsePreview={responsePreview}
          />

          <StorageBadgesRow
            promptStatus={promptStatus}
            responseStatus={responseStatus}
            promptPreviewTruncated={promptPreviewTruncated}
            responsePreviewTruncated={responsePreviewTruncated}
          />

          <MetaBadgesRow
            log={log}
            scoreNum={scoreNum}
            isLowScore={isLowScore}
            isBlocked={isBlocked}
            isLowConfidence={isLowConfidence}
            intentCount={intentCount}
            topicCount={topicCount}
          />

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
}

export function LogsTable({
  logs,
  tableDensityClass,
  truncPrimary,
  onInspect,
}: Readonly<{
  logs: ReadonlyArray<PerazziLogPreviewRow>;
  tableDensityClass: string;
  truncPrimary: number;
  onInspect: (id: string) => void;
}>) {
  return (
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
      {logs.map((log) => (
        <LogRow key={log.id} log={log} truncPrimary={truncPrimary} onInspect={onInspect} />
      ))}
    </DataTable>
  );
}

export function SummaryTab({ detail, fallbackMetadata }: Readonly<{ detail: PgptLogDetailResponse; fallbackMetadata: unknown }>) {
  return <LogSummaryPanel detail={detail} fallbackMetadata={fallbackMetadata} />;
}

function TextCallout({ callout, toneClass }: Readonly<{ callout: string | null | undefined; toneClass: string }>) {
  if (!callout) return null;
  return <div className={cn("rounded-lg border px-3 py-2 text-[11px] leading-snug", toneClass)}>{callout}</div>;
}

export function PromptTab({
  detail,
  detailTextStatus,
}: Readonly<{
  detail: PgptLogDetailResponse;
  detailTextStatus: ReturnType<typeof getTextStorageBadges> | null;
}>) {
  return (
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
      <TextCallout
        callout={detailTextStatus?.prompt.callout}
        toneClass={detailTextStatus ? getLogTextCalloutToneClass(detailTextStatus.prompt) : ""}
      />
      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs leading-snug text-foreground">
        {detailTextStatus?.prompt.displayValue ?? detail.log.prompt ?? ""}
      </pre>
    </div>
  );
}

export function ResponseTab({
  detail,
  detailTextStatus,
  responseMode,
}: Readonly<{
  detail: PgptLogDetailResponse;
  detailTextStatus: ReturnType<typeof getTextStorageBadges> | null;
  responseMode: "rendered" | "raw";
}>) {
  const displayValue = detailTextStatus?.response.displayValue ?? detail.log.response ?? "";

  return (
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

      <TextCallout
        callout={detailTextStatus?.response.callout}
        toneClass={detailTextStatus ? getLogTextCalloutToneClass(detailTextStatus.response) : ""}
      />

      {responseMode === "raw" ? (
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs leading-snug text-foreground">
          {displayValue}
        </pre>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background p-3">
          <MarkdownViewClient markdown={displayValue} />
        </div>
      )}
    </div>
  );
}

export function RetrievalTab({ detail }: Readonly<{ detail: PgptLogDetailResponse }>) {
  const retrievedChunks = Array.isArray(detail.log.retrieved_chunks) ? detail.log.retrieved_chunks : [];
  const retrievalDebugRows = decodeRetrievalDebugRows(detail.log.metadata).slice(0, 15);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-foreground">Retrieved Chunks</div>

      {(detail.log.retrieved_chunks?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
          No retrievedChunks metadata for this interaction.
        </div>
      ) : (
        <div className="space-y-3">
          {retrievedChunks.map((raw, idx: number) => {
            const chunk = (raw ?? {}) as Record<string, unknown>;
            const chunkIdRaw = (chunk.chunkId ?? chunk.chunk_id ?? chunk.id) as string | number | undefined;
            const chunkId = typeof chunkIdRaw === "string" || typeof chunkIdRaw === "number" ? chunkIdRaw : null;
            const scoreRaw = (chunk.score ?? chunk.similarity ?? chunk.maxScore) as string | number | undefined;
            const score = typeof scoreRaw === "string" || typeof scoreRaw === "number" ? scoreRaw : null;

            const jsonKey = safeJsonStringify(chunk);
            const fallbackKey = jsonKey ?? `chunk-${idx}-${String(score ?? "unknown")}`;
            const chunkKey = chunkId === null ? fallbackKey : String(chunkId);

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

      <div className="text-xs font-semibold text-foreground">Retrieval Debug</div>

      {retrievalDebugRows.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
          Not available for this interaction.
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-border bg-background">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-[11px]">
            <colgroup>
              <col className="w-[60px]" />
              <col className="w-60" />
              <col className="w-60" />
              <col className="w-[90px]" />
              <col className="w-20" />
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead>
              <tr className="bg-muted/40 text-muted-foreground">
                <th className="px-2 py-1 text-left font-medium">rank</th>
                <th className="px-2 py-1 text-left font-medium">documentPath</th>
                <th className="px-2 py-1 text-left font-medium">headingPath</th>
                <th className="px-2 py-1 text-right font-medium">baseScore</th>
                <th className="px-2 py-1 text-right font-medium">boost</th>
                <th className="px-2 py-1 text-right font-medium">archBoost</th>
                <th className="px-2 py-1 text-right font-medium">finalScore</th>
                <th className="px-2 py-1 text-left font-medium">chunkId</th>
              </tr>
            </thead>
            <tbody>
              {retrievalDebugRows.map((row, idx) => {
                const chunkIdKey = row.chunkId ?? "unknown";
                return (
                  <tr key={`${chunkIdKey}-${idx}`} className="border-t border-border/60">
                    <td className="px-2 py-1 text-left text-muted-foreground">{row.rank}</td>
                    <td className="px-2 py-1 text-left text-muted-foreground">
                      <div className="truncate" title={row.documentPath ?? undefined}>
                        {row.documentPath ?? "—"}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-left text-muted-foreground">
                      <div className="truncate" title={row.headingPath ?? undefined}>
                        {row.headingPath ?? "—"}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{formatScore(row.baseScore)}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{formatScore(row.boost)}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{formatScore(row.archetypeBoost)}</td>
                    <td className="px-2 py-1 text-right font-semibold text-foreground">{formatScore(row.finalScore)}</td>
                    <td className="px-2 py-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground" title={row.chunkId ?? undefined}>
                          {row.chunkId ?? "—"}
                        </span>
                        {row.chunkId ? <CopyButton value={row.chunkId} label="Copy chunk id" /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
