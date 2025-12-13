import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { fetchSessionSummary } from "../../../lib/pgpt-insights/queries";

import { formatCompactNumber, formatTimestampShort } from "../format";

function pct(rate: number | null) {
  if (rate === null || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function formatDurationMs(ms: number | null) {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM ? `${h}h ${remM}m` : `${h}h`;
}

export async function SessionSummarySection({ sessionId }: { sessionId: string }) {
  try {
    const s = await fetchSessionSummary(sessionId, LOW_SCORE_THRESHOLD);

    const started = s.started_at ? new Date(s.started_at).getTime() : null;
    const ended = s.ended_at ? new Date(s.ended_at).getTime() : null;
    const durationMs = started !== null && ended !== null ? ended - started : null;

    const blockedRate = s.assistant_count > 0 ? s.blocked_count / s.assistant_count : null;
    const lowScoreRate = s.scored_count > 0 ? s.low_score_count / s.scored_count : null;

    return (
      <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Session Summary</h2>
          <p className="text-xs text-muted-foreground">High-level metrics for this session (independent of filters).</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Interactions</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(s.interaction_count)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              assistant: {formatCompactNumber(s.assistant_count)}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Duration</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatDurationMs(durationMs)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {s.started_at && s.ended_at ? (
                <>
                  {formatTimestampShort(s.started_at)} → {formatTimestampShort(s.ended_at)}
                </>
              ) : (
                "—"
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Guardrail blocks</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(s.blocked_count)}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(blockedRate)} of assistant</div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Low-score</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(s.low_score_count)}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(lowScoreRate)} of scored</div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">QA open</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(s.open_qa_count)}</div>
            <div className="mt-1 text-xs text-muted-foreground">latest flags</div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Top tags</div>
            <div className="mt-1 text-xs text-muted-foreground">
              <div>
                <span className="text-[10px] uppercase tracking-wide">archetype</span>{" "}
                <span className="font-medium text-foreground">{s.top_archetype ?? "—"}</span>
              </div>
              <div className="mt-1">
                <span className="text-[10px] uppercase tracking-wide">model</span>{" "}
                <span className="font-medium text-foreground">{s.top_model ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  } catch (err) {
    return (
      <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
        <div className="text-sm font-semibold tracking-wide text-foreground">Session Summary</div>
        <p className="mt-2 text-xs text-muted-foreground">Failed to load session summary.</p>
      </section>
    );
  }
}
