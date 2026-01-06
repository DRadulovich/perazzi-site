"use client";

import { useRef, useState, type ReactNode } from "react";

import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { getLogTextCalloutToneClass, getTextStorageBadges, type TextFieldStatus } from "../../../lib/pgpt-insights/logTextStatus";
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

type TokenMetrics = {
  promptTokens: number | null;
  completionTokens: number | null;
  cachedTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
};

type SessionConversationViewProps = Readonly<{
  logs: PerazziLogRow[];
  hasMore: boolean;
  sessionId: string;
}>;

type SessionConversationRowProps = Readonly<{
  log: PerazziLogRow;
  index: number;
  detail: PgptLogDetailResponse | null;
  status?: DetailStatus;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}>;

type MessageBubbleProps = Readonly<{
  label: string;
  avatarClassName: string;
  callout?: string;
  calloutToneClass: string;
  children: ReactNode;
}>;

type SummarySectionProps = Readonly<{
  isExpanded: boolean;
  status?: DetailStatus;
  detail: PgptLogDetailResponse | null;
  onToggle: () => void;
}>;

type LogHeaderProps = Readonly<{
  log: PerazziLogRow;
  index: number;
}>;

type TokenMetricsRowProps = Readonly<{
  metrics: TokenMetrics;
}>;

type HeaderItem = {
  key: string;
  label: string;
  className?: string;
};

type MetaBadgeArgs = {
  log: PerazziLogRow;
  promptStatus: TextFieldStatus;
  responseStatus: TextFieldStatus;
  scoreNum: number | null;
  isLowScore: boolean;
};

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function getRecordValue(record: Record<string, unknown> | null, key: string): unknown {
  if (!record || !Object.prototype.hasOwnProperty.call(record, key)) return undefined;
  return record[key];
}

function getRecordNumber(record: Record<string, unknown> | null, key: string): number | null {
  return toNumberOrNull(getRecordValue(record, key));
}

function getTokenMetrics(source: {
  cached_tokens?: unknown;
  reasoning_tokens?: unknown;
  total_tokens?: unknown;
  prompt_tokens?: unknown;
  completion_tokens?: unknown;
  metadata?: unknown;
}): TokenMetrics {
  const promptTokens = toNumberOrNull(source.prompt_tokens);
  const completionTokens = toNumberOrNull(source.completion_tokens);
  const metadataObj = asRecord(source.metadata);
  const responseUsage = asRecord(getRecordValue(metadataObj, "responseUsage"));
  const inputTokensDetails = asRecord(getRecordValue(responseUsage, "input_tokens_details"));
  const outputTokensDetails = asRecord(getRecordValue(responseUsage, "output_tokens_details"));

  const cachedTokens =
    toNumberOrNull(source.cached_tokens) ??
    getRecordNumber(metadataObj, "cachedTokens") ??
    getRecordNumber(inputTokensDetails, "cached_tokens");

  const reasoningTokens =
    toNumberOrNull(source.reasoning_tokens) ??
    getRecordNumber(metadataObj, "reasoningTokens") ??
    getRecordNumber(outputTokensDetails, "reasoning_tokens");

  const totalTokens =
    toNumberOrNull(source.total_tokens) ??
    getRecordNumber(metadataObj, "totalTokens") ??
    getRecordNumber(responseUsage, "total_tokens") ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null);

  return { promptTokens, completionTokens, cachedTokens, reasoningTokens, totalTokens };
}

function mergeTokenMetrics(preview: TokenMetrics, detail: TokenMetrics | null): TokenMetrics {
  if (!detail) return preview;

  return {
    promptTokens: detail.promptTokens ?? preview.promptTokens,
    completionTokens: detail.completionTokens ?? preview.completionTokens,
    cachedTokens: detail.cachedTokens ?? preview.cachedTokens,
    reasoningTokens: detail.reasoningTokens ?? preview.reasoningTokens,
    totalTokens: detail.totalTokens ?? preview.totalTokens,
  };
}

function getLogTokenMetrics(log: PerazziLogRow, detail: PgptLogDetailResponse | null): TokenMetrics {
  const preview = getTokenMetrics(log);
  const detailMetrics = detail ? getTokenMetrics(detail.log) : null;
  return mergeTokenMetrics(preview, detailMetrics);
}

function getHeaderItems(log: PerazziLogRow): HeaderItem[] {
  const items: HeaderItem[] = [];
  if (log.env) items.push({ key: "env", label: log.env });
  if (log.endpoint) items.push({ key: "endpoint", label: log.endpoint });
  if (log.session_id) items.push({ key: "session", label: log.session_id, className: "break-all" });
  return items;
}

function buildMetaBadges({ log, promptStatus, responseStatus, scoreNum, isLowScore }: MetaBadgeArgs): ReactNode[] {
  const metaBadges: ReactNode[] = [];

  if (log.archetype) metaBadges.push(<Badge key="arch">{log.archetype}</Badge>);
  if (log.model) metaBadges.push(<Badge key="model" tone="blue">{log.model}</Badge>);
  if (log.guardrail_status === "blocked") {
    const reason = log.guardrail_reason ?? undefined;
    metaBadges.push(
      <Badge key="guardrail" tone="red" title={reason}>
        blocked{reason ? `: ${reason}` : ""}
      </Badge>,
    );
  }
  if (log.low_confidence === true) metaBadges.push(<Badge key="low-conf" tone="amber">low confidence</Badge>);
  if (log.used_gateway) metaBadges.push(<Badge key="gateway">gateway</Badge>);
  if (scoreNum !== null && Number.isFinite(scoreNum)) {
    metaBadges.push(
      <Badge key="score" tone={isLowScore ? "yellow" : "default"}>
        maxScore {log.max_score}
      </Badge>,
    );
  }
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

  return metaBadges;
}

function getSummaryLabel(status: DetailStatus | undefined, isExpanded: boolean): string {
  if (status?.loading) return "loading…";
  if (status?.error) return "error";
  return isExpanded ? "hide" : "show";
}

function getSummaryContent(status: DetailStatus | undefined, detail: PgptLogDetailResponse | null): ReactNode {
  if (status?.loading) {
    return <SummarySkeleton />;
  }
  if (status?.error) {
    return (
      <div className="rounded-md border border-border bg-background/80 p-3 text-[11px] text-red-600 dark:text-red-300">
        {status.error}
      </div>
    );
  }
  if (detail) {
    return <LogSummaryPanel detail={detail} />;
  }

  return <div className="text-[11px] text-muted-foreground">No data for this interaction.</div>;
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

function MessageBubble({ label, avatarClassName, callout, calloutToneClass, children }: MessageBubbleProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-1 h-8 w-8 shrink-0 rounded-full border border-border text-[11px] font-semibold flex items-center justify-center",
          avatarClassName,
        )}
      >
        {label}
      </div>
      <div className="flex-1 rounded-2xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground shadow-sm">
        {callout ? (
          <div className={cn("mb-2 rounded-md border px-2 py-1 text-[11px] leading-snug", calloutToneClass)}>
            {callout}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function TokenMetricsRow({ metrics }: TokenMetricsRowProps) {
  return (
    <div className="text-[11px] text-muted-foreground flex flex-wrap gap-3">
      <span>Prompt: {metrics.promptTokens ?? "—"}</span>
      <span>Completion: {metrics.completionTokens ?? "—"}</span>
      <span>Total tokens: {metrics.totalTokens ?? "—"}</span>
      <span>Cached tokens: {metrics.cachedTokens ?? "—"}</span>
      <span>Reasoning tokens: {metrics.reasoningTokens ?? "—"}</span>
    </div>
  );
}

function LogHeader({ log, index }: LogHeaderProps) {
  const items = getHeaderItems(log);

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span className="font-semibold text-foreground">#{index + 1}</span>
      <span className="tabular-nums">{formatTimestampShort(String(log.created_at))}</span>
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-2">
          <span>·</span>
          <span className={item.className}>{item.label}</span>
        </span>
      ))}
      <CopyButton value={log.id} label="Copy id" ariaLabel="Copy interaction id" />
    </div>
  );
}

function SummarySection({ isExpanded, status, detail, onToggle }: SummarySectionProps) {
  const label = getSummaryLabel(status, isExpanded);

  return (
    <div className="rounded-lg border border-border bg-muted/10">
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition-colors",
          isExpanded ? "bg-muted/40 text-foreground" : "text-foreground hover:bg-muted/20",
        )}
        onClick={onToggle}
      >
        <span>Summary</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </button>

      {isExpanded ? (
        <div className="border-t border-border px-3 py-3">{getSummaryContent(status, detail)}</div>
      ) : null}
    </div>
  );
}

function SessionConversationRow({
  log,
  index,
  detail,
  status,
  isExpanded,
  onToggle,
}: SessionConversationRowProps) {
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

  const scoreNum = log.max_score ? Number(log.max_score) : null;
  const isLowScore =
    log.endpoint === "assistant" && scoreNum !== null && Number.isFinite(scoreNum) && scoreNum < LOW_SCORE_THRESHOLD;

  const metaBadges = buildMetaBadges({
    log,
    promptStatus,
    responseStatus,
    scoreNum,
    isLowScore,
  });
  const tokenMetrics = getLogTokenMetrics(log, detail);
  const promptCalloutTone = getLogTextCalloutToneClass(promptStatus);
  const responseCalloutTone = getLogTextCalloutToneClass(responseStatus);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/80 p-4">
      <LogHeader log={log} index={index} />
      <div className="flex flex-wrap items-center gap-2">{metaBadges}</div>
      <TokenMetricsRow metrics={tokenMetrics} />

      <div className="space-y-3">
        <MessageBubble
          label="User"
          avatarClassName="bg-muted/50 text-muted-foreground"
          callout={promptStatus.callout}
          calloutToneClass={promptCalloutTone}
        >
          <p className="whitespace-pre-wrap">{promptStatus.displayValue}</p>
        </MessageBubble>

        <MessageBubble
          label="AI"
          avatarClassName="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100"
          callout={responseStatus.callout}
          calloutToneClass={responseCalloutTone}
        >
          <MarkdownViewClient markdown={responseStatus.displayValue ?? ""} />
        </MessageBubble>
      </div>

      <SummarySection
        isExpanded={isExpanded}
        status={status}
        detail={detail}
        onToggle={() => onToggle(log.id)}
      />
    </div>
  );
}

export function SessionConversationView({ logs, hasMore, sessionId }: SessionConversationViewProps) {
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

      {hasLogs ? (
        <>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-4 py-5">
            {logs.map((log, idx) => (
              <SessionConversationRow
                key={log.id}
                log={log}
                index={idx}
                detail={detailCache.current.get(log.id) ?? null}
                status={detailState[log.id]}
                isExpanded={expanded.has(log.id)}
                onToggle={toggleExpanded}
              />
            ))}
          </div>

          {hasMore ? (
            <div className="border-t border-border bg-muted/20 px-4 py-3 text-[11px] text-muted-foreground">
              Showing first {logs.length} interactions for this session. Refine filters to load fewer rows.
            </div>
          ) : null}
        </>
      ) : (
        <div className="p-6 text-sm text-muted-foreground">No interactions match the current filters.</div>
      )}
    </div>
  );
}
