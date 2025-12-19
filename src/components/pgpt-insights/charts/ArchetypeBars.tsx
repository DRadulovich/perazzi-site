import { cn } from "@/lib/utils";

import { formatCompactNumber, formatScore } from "../format";

type ArchetypeBarDatum = Readonly<{
  archetype: string;
  total: number;
  avgMaxScore: number | null;
}>;

type ArchetypeBarsProps = Readonly<{
  title?: string;
  subtitle?: string;
  data: readonly ArchetypeBarDatum[];
  density?: "comfortable" | "compact";
  className?: string;
}>;

function scoreMarkerPosition(value: number | null) {
  if (value === null || Number.isNaN(value)) return null;
  const clamped = Math.max(0, Math.min(1, value));
  return `${(clamped * 100).toFixed(0)}%`;
}

export function ArchetypeBars({
  title = "Archetype volume",
  subtitle = "Total interactions with avg maxScore",
  data,
  density = "comfortable",
  className,
}: ArchetypeBarsProps) {
  const maxTotal = Math.max(...data.map((d) => d.total ?? 0), 1);
  const barHeight = density === "compact" ? "h-6" : "h-7";
  const labelClass = density === "compact" ? "text-[11px]" : "text-xs";

  if (data.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card/80 p-4 shadow-sm", className)}>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <p className="mt-2 text-xs text-muted-foreground">No archetype volume data for the current filters.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card/80 p-4 shadow-sm min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold leading-tight text-foreground">{title}</div>
          {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
          Dot = avg maxScore
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {data.map((row) => {
          const widthPct = Math.max(0, Math.min(100, (row.total / maxTotal) * 100));
          const marker = scoreMarkerPosition(row.avgMaxScore);
          return (
            <div key={row.archetype} className="space-y-1.5">
              <div className={cn("flex items-center justify-between gap-3 text-xs text-foreground", labelClass)}>
                <span className="truncate font-semibold" title={row.archetype}>
                  {row.archetype}
                </span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="tabular-nums">{formatCompactNumber(row.total)}</span>
                  {row.avgMaxScore == null ? null : (
                    <span className="text-[11px] tabular-nums" title="Avg maxScore">
                      {formatScore(row.avgMaxScore)}
                    </span>
                  )}
                </div>
              </div>

              <div className={cn("relative overflow-hidden rounded-xl border border-border/70 bg-muted/30", barHeight)}>
                <div
                  className="absolute inset-y-0 left-0 bg-linear-to-r from-blue-500/70 via-blue-500/50 to-blue-500/30"
                  style={{ width: `${widthPct.toFixed(1)}%` }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(255,255,255,0.12),transparent_45%)]" aria-hidden="true" />

                {marker ? (
                  <div
                    className="absolute inset-y-1 flex items-center"
                    style={{ left: marker }}
                    aria-hidden="true"
                  >
                    <span className="h-3 w-3 -translate-x-1/2 rounded-full border border-blue-500/40 bg-background shadow-[0_0_0_2px_rgba(59,130,246,0.25)]" />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
