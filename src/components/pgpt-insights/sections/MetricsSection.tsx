/* eslint-disable react-hooks/error-boundaries */
import { getAvgMetrics, getDailyTokenUsage } from "../../../lib/pgpt-insights/cached";

import { Chevron } from "../Chevron";
import { formatCompactNumber, formatDurationMs } from "../format";

import { SectionError } from "./SectionError";

export async function MetricsSection({
  envFilter,
  daysFilter,
  tableDensityClass,
}: {
  envFilter?: string;
  daysFilter?: number;
  tableDensityClass: string;
}) {
  try {
    const [dailyTokenUsage, avgMetrics] = await Promise.all([
      getDailyTokenUsage(envFilter, daysFilter),
      getAvgMetrics(envFilter, daysFilter),
    ]);

    const totalPromptTokens = dailyTokenUsage.reduce((sum, row) => sum + row.total_prompt_tokens, 0);
    const totalCompletionTokens = dailyTokenUsage.reduce((sum, row) => sum + row.total_completion_tokens, 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;

    const latencyRollup = avgMetrics.reduce(
      (acc, row) => {
        if (row.avg_latency_ms === null || Number.isNaN(row.avg_latency_ms) || row.request_count <= 0) return acc;
        acc.numerator += row.avg_latency_ms * row.request_count;
        acc.denominator += row.request_count;
        return acc;
      },
      { numerator: 0, denominator: 0 },
    );
    const avgLatencyMs = latencyRollup.denominator > 0 ? latencyRollup.numerator / latencyRollup.denominator : null;

    return (
      <section id="metrics" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
        <details open className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">Metrics (Tokens &amp; Latency)</h2>
                <p className="text-xs text-muted-foreground">Cost and responsiveness signals.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                  latency {formatDurationMs(avgLatencyMs)}
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                  tokens {formatCompactNumber(totalTokens)}
                </span>
                <Chevron />
              </div>
            </div>
          </summary>

          <div className="mt-4 space-y-3">
            {dailyTokenUsage.length === 0 ? (
              <p className="text-xs text-muted-foreground">No token usage data for the current filters.</p>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Daily token usage</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className={`w-full min-w-[1120px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                    <colgroup>
                      <col className="w-[160px]" />
                      <col className="w-[110px]" />
                      <col className="w-[160px]" />
                      <col className="w-[260px]" />
                      <col className="w-[170px]" />
                      <col className="w-[190px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                    <thead>
                      <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">day</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">env</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">endpoint</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">model</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">prompt tokens</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">completion tokens</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">requests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {dailyTokenUsage.map((row, idx) => (
                        <tr key={`${row.day}-${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                          <td className="px-3 py-2">{String(row.day)}</td>
                          <td className="px-3 py-2">{row.env}</td>
                          <td className="px-3 py-2">{row.endpoint}</td>
                          <td className="px-3 py-2">{row.model ?? "(unknown)"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.total_prompt_tokens}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.total_completion_tokens}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.request_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {avgMetrics.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Average tokens &amp; latency per request</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className={`w-full min-w-[1120px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                    <colgroup>
                      <col className="w-[110px]" />
                      <col className="w-[160px]" />
                      <col className="w-[260px]" />
                      <col className="w-[190px]" />
                      <col className="w-[210px]" />
                      <col className="w-[190px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                    <thead>
                      <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">env</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">endpoint</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">model</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg prompt tokens</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg completion tokens</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg latency (ms)</th>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">requests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {avgMetrics.map((row, idx) => (
                        <tr key={`${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                          <td className="px-3 py-2">{row.env}</td>
                          <td className="px-3 py-2">{row.endpoint}</td>
                          <td className="px-3 py-2">{row.model ?? "(unknown)"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {row.avg_prompt_tokens === null ? "—" : row.avg_prompt_tokens.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {row.avg_completion_tokens === null ? "—" : row.avg_completion_tokens.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {row.avg_latency_ms === null ? "—" : Math.round(row.avg_latency_ms)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.request_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </details>
      </section>
    );
  } catch (error) {
    return <SectionError id="metrics" title="Metrics (Tokens & Latency)" error={error} />;
  }
}
