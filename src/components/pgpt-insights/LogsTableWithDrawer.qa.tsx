"use client";

import Link from "next/link";

import type { PgptLogDetailResponse } from "../../lib/pgpt-insights/types";

import { Badge } from "./Badge";
import { formatTimestampShort } from "./format";

const QA_REASON_OPTIONS = [
  "hallucination",
  "bad_tone",
  "wrong_retrieval",
  "guardrail_false_positive",
  "guardrail_false_negative",
  "other",
] as const;

type QATabProps = Readonly<{
  detail: PgptLogDetailResponse;
  selectedId: string | null;
  qaReturnTo: string;
}>;

type QALatest = PgptLogDetailResponse["qa_latest"];
type QAHistory = PgptLogDetailResponse["qa_history"];

function LatestSummary({ latest }: Readonly<{ latest: QALatest }>) {
  if (!latest) return <div className="text-xs text-muted-foreground">No flags for this interaction.</div>;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={latest.status === "open" ? "purple" : "default"}>{latest.status}</Badge>
        {latest.reason ? <Badge>{latest.reason}</Badge> : null}
        <span className="text-xs text-muted-foreground">{formatTimestampShort(latest.created_at)}</span>
      </div>

      {latest.notes ? <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{latest.notes}</div> : null}
    </>
  );
}

function ResolveForm({ flagId, qaReturnTo }: Readonly<{ flagId: string; qaReturnTo: string }>) {
  return (
    <form method="POST" action="/admin/pgpt-insights/qa/resolve" className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="flagId" value={flagId} />
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
  );
}

function FlagForm({
  selectedId,
  qaReturnTo,
  submitLabel,
}: Readonly<{
  selectedId: string | null;
  qaReturnTo: string;
  submitLabel: string;
}>) {
  return (
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
        {submitLabel}
      </button>
    </form>
  );
}

function LatestActions({ latest, selectedId, qaReturnTo }: Readonly<{ latest: QALatest; selectedId: string | null; qaReturnTo: string }>) {
  if (latest?.status === "open") return <ResolveForm flagId={latest.id} qaReturnTo={qaReturnTo} />;
  return <FlagForm selectedId={selectedId} qaReturnTo={qaReturnTo} submitLabel={latest ? "Flag again" : "Flag"} />;
}

function HistoryPanel({ history }: Readonly<{ history: QAHistory }>) {
  if ((history?.length ?? 0) === 0) return <div className="mt-2 text-xs text-muted-foreground">—</div>;

  return (
    <div className="mt-3 space-y-3">
      {(history ?? []).map((f) => (
        <div key={f.id} className="rounded-lg border border-border bg-background p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={f.status === "open" ? "purple" : "default"}>{f.status}</Badge>
            {f.reason ? <Badge>{f.reason}</Badge> : null}
            <span className="text-xs text-muted-foreground">{formatTimestampShort(f.created_at)}</span>

            <Link href={`/admin/pgpt-insights/qa#flag-${f.id}`} className="ml-auto text-xs text-blue-600 underline">
              view →
            </Link>
          </div>
          {f.notes ? <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{f.notes}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function QATab({
  detail,
  selectedId,
  qaReturnTo,
}: QATabProps) {
  const latest = detail.qa_latest;

  return (
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
          <LatestSummary latest={latest} />
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <LatestActions latest={latest} selectedId={selectedId} qaReturnTo={qaReturnTo} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">history</div>
        <HistoryPanel history={detail.qa_history} />
      </div>
    </div>
  );
}
