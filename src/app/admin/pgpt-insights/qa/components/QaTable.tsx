import Link from "next/link";

import { Badge } from "@/components/pgpt-insights/Badge";
import { MonoCell } from "@/components/pgpt-insights/table/MonoCell";
import { DataTable } from "@/components/pgpt-insights/table/DataTable";
import { StatusBadge } from "@/components/pgpt-insights/table/StatusBadge";
import { TableEmpty } from "@/components/pgpt-insights/table/TableEmpty";
import { TableShell } from "@/components/pgpt-insights/table/TableShell";
import { TruncateCell } from "@/components/pgpt-insights/table/TruncateCell";
import { MarkdownView } from "@/components/pgpt-insights/MarkdownView";

export type QaRow = {
  flag_id: string;
  flag_created_at: string;
  flag_status: string;
  flag_reason: string | null;
  flag_notes: string | null;
  interaction_id: string;

  interaction_created_at: string;
  env: string;
  endpoint: string;
  archetype: string | null;
  session_id: string | null;
  prompt: string;
  response: string;

  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;
  low_confidence: boolean | null;
};

function parseScore(score: string | null): number | null {
  if (!score) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

export function QaTable({ rows, currentHref }: { rows: QaRow[]; currentHref: string }) {
  return (
    <TableShell
      title="QA Flags"
      description="Flagged interactions with reason + notes."
      contentClassName="space-y-3"
    >
      <DataTable
        headers={[
          { key: "flagged_at", label: "flagged_at" },
          { key: "status", label: "status" },
          { key: "reason", label: "reason" },
          { key: "notes", label: "notes" },
          { key: "env", label: "env" },
          { key: "endpoint", label: "endpoint" },
          { key: "session", label: "session" },
          { key: "prompt", label: "prompt" },
          { key: "response", label: "response" },
          { key: "signals", label: "signals" },
          { key: "actions", label: "actions" },
        ]}
        colgroup={
          <colgroup>
            <col className="w-[200px]" />
            <col className="w-[90px]" />
            <col className="w-[150px]" />
            <col className="w-[200px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[210px]" />
            <col className="w-[320px]" />
            <col className="w-[360px]" />
            <col className="w-[200px]" />
            <col className="w-[140px]" />
          </colgroup>
        }
        minWidth="min-w-[1280px]"
      >
        {rows.map((row) => {
          const score = parseScore(row.max_score);
          const isOpen = row.flag_status === "open";
          const rowTone = isOpen
            ? "border-l-4 border-red-500/50 bg-red-500/5"
            : row.flag_status === "resolved"
              ? "border-l-4 border-emerald-500/30"
              : "border-l-4 border-transparent";
          const anchorId = `flag-${row.flag_id}`;

          return (
            <tr key={row.flag_id} id={anchorId} className={`${rowTone} scroll-mt-24`}>
              <td className="whitespace-normal break-words leading-snug">
                <span className="tabular-nums">{String(row.flag_created_at)}</span>
              </td>
              <td>
                {isOpen ? (
                  <Badge tone="red">open</Badge>
                ) : (
                  <Badge tone="purple">resolved</Badge>
                )}
              </td>
              <td>{row.flag_reason ?? "(none)"}</td>
              <td className="break-words">
                {row.flag_notes ? (
                  <TruncateCell text={row.flag_notes} previewChars={140}>
                    <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                      {row.flag_notes}
                    </pre>
                  </TruncateCell>
                ) : (
                  ""
                )}
              </td>
              <td>
                <StatusBadge type="env" value={row.env} />
              </td>
              <td>
                <StatusBadge type="endpoint" value={row.endpoint} />
              </td>
              <td>
                {row.session_id ? (
                  <Link
                    href={`/admin/pgpt-insights/session/${encodeURIComponent(row.session_id)}#interaction-${encodeURIComponent(row.interaction_id)}`}
                    className="text-blue-600 underline"
                  >
                    <MonoCell>{row.session_id}</MonoCell>
                  </Link>
                ) : (
                  ""
                )}
              </td>
              <td className="align-top">
                <TruncateCell text={row.prompt ?? ""} previewChars={180}>
                  <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                    {row.prompt ?? ""}
                  </pre>
                </TruncateCell>
              </td>
              <td className="align-top">
                <TruncateCell text={row.response ?? ""} previewChars={180}>
                  <div className="max-h-[480px] overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground">
                    <MarkdownView markdown={row.response ?? ""} />
                  </div>
                </TruncateCell>
              </td>
              <td>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <StatusBadge type="score" value={score} />
                  <StatusBadge type="guardrail" status={row.guardrail_status ?? undefined} reason={row.guardrail_reason ?? undefined} />
                  {row.low_confidence === true ? <StatusBadge type="low_confidence" value /> : null}
                  {row.archetype ? <Badge>{row.archetype}</Badge> : null}
                </div>
              </td>
              <td>
                {isOpen ? (
                  <form method="POST" action="/admin/pgpt-insights/qa/resolve" className="inline-flex">
                    <input type="hidden" name="flagId" value={row.flag_id} />
                    <input type="hidden" name="returnTo" value={currentHref} />
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                    >
                      Resolve
                    </button>
                  </form>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          );
        })}

        {rows.length === 0 ? <TableEmpty colSpan={11} message="No QA flags for the current filter." /> : null}
      </DataTable>
    </TableShell>
  );
}
