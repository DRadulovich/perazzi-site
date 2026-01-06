import { Badge } from "../Badge";
import { formatCompactNumber, formatDurationMs, formatTimestampShort } from "../format";
import { TableShell } from "../table/TableShell";
import { getDataHealth } from "@/lib/pgpt-insights/cached";
import { getInsightsErrors } from "@/lib/pgpt-insights/insights-errors";

function truncate(text: string, length = 180) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

export async function DataHealthSection({ envFilter }: Readonly<{ envFilter?: string }>) {
  const health = await getDataHealth(envFilter);
  const errors = getInsightsErrors(6);

  const statusBadge = health.ok ? <Badge tone="blue">db ok</Badge> : <Badge tone="red">db error</Badge>;
  const latencyBadge =
    health.latency_ms == null ? null : <Badge>latency {formatDurationMs(health.latency_ms)}</Badge>;
  const envBadge = <Badge>env {envFilter ?? "all"}</Badge>;

  return (
    <TableShell
      id="data-health"
      title="Data Health"
      description="Connectivity + ingest freshness for Pgpt insights."
      actions={
        <>
          {statusBadge}
          {latencyBadge}
          {envBadge}
        </>
      }
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">DB status</div>
          <div className="mt-1 text-base font-semibold tabular-nums">
            {health.ok ? "Connected" : "Error"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {health.error ? truncate(health.error, 120) : "pg pool check"}
          </div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last log</div>
          <div className="mt-1 text-sm font-semibold tabular-nums">
            {health.last_log_at ? formatTimestampShort(health.last_log_at) : "n/a"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">latest created_at</div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last hour</div>
          <div className="mt-1 text-base font-semibold tabular-nums">
            {formatCompactNumber(health.last_hour)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">ingest count</div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last 24h</div>
          <div className="mt-1 text-base font-semibold tabular-nums">
            {formatCompactNumber(health.last_24h)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">ingest count</div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last 7d</div>
          <div className="mt-1 text-base font-semibold tabular-nums">
            {formatCompactNumber(health.last_7d)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">ingest count</div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total logs</div>
          <div className="mt-1 text-base font-semibold tabular-nums">
            {formatCompactNumber(health.total)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">perazzi_conversation_logs</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold">Recent query errors</div>
        {errors.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent section errors recorded.</p>
        ) : (
          <div className="space-y-2">
            {errors.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span className="uppercase tracking-wide">{formatTimestampShort(entry.at)}</span>
                  <span className="text-foreground">{entry.sectionTitle}</span>
                  {entry.sectionId ? <span>#{entry.sectionId}</span> : null}
                </div>
                <div className="mt-1 text-muted-foreground">{truncate(entry.message)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TableShell>
  );
}
