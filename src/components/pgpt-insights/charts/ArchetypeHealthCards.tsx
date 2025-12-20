import { cn } from "@/lib/utils";

import { Badge } from "../Badge";
import { formatCompactNumber, formatRate, formatScore } from "../format";

type ArchetypeHealth = {
  archetype: string;
  avg_max_score: number | null;
  guardrail_block_rate: number | null;
  low_confidence_rate: number | null;
  total: number;
};

type ArchetypeHealthCardsProps = Readonly<{
  data: ArchetypeHealth[];
  density?: "comfortable" | "compact";
  className?: string;
}>;

function toneForRate(value: number | null) {
  if (value === null || Number.isNaN(value)) return "default";
  if (value >= 0.15) return "red";
  if (value >= 0.08) return "amber";
  if (value >= 0.04) return "yellow";
  return "default";
}

export function ArchetypeHealthCards({ data, density = "comfortable", className }: ArchetypeHealthCardsProps) {
  const maxTotal = Math.max(...data.map((d) => d.total ?? 0), 1);
  const barHeight = density === "compact" ? "h-1.5" : "h-2";
  const labelClass = density === "compact" ? "text-[11px]" : "text-xs";

  if (!data.length) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card/80 p-4 shadow-sm", className)}>
        <div className="text-sm font-semibold text-foreground">Archetype health</div>
        <p className="mt-2 text-xs text-muted-foreground">No archetype summary metrics for the current filters.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card/80 p-4 shadow-sm min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold leading-tight text-foreground">Archetype health</div>
          <div className="text-[11px] text-muted-foreground">Quality and guardrail posture by archetype</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((row) => {
          const pct = Math.max(0, Math.min(1, row.total / maxTotal));
          const guardrailTone = toneForRate(row.guardrail_block_rate);
          const lowTone = toneForRate(row.low_confidence_rate);

          return (
            <div
              key={row.archetype}
              className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className={cn("font-semibold text-foreground", labelClass)}>{row.archetype}</div>
                  <div className="text-[11px] text-muted-foreground">Avg maxScore</div>
                  <div className="text-base font-semibold leading-tight text-foreground">
                    {formatScore(row.avg_max_score)}
                  </div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <div className="tabular-nums">{formatCompactNumber(row.total)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">total</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={guardrailTone} title="Guardrail block rate">
                  GR: {formatRate(row.guardrail_block_rate)}
                </Badge>
                <Badge tone={lowTone} title="Low-confidence rate">
                  Low: {formatRate(row.low_confidence_rate)}
                </Badge>
              </div>

              <div className={cn("relative overflow-hidden rounded-full bg-muted/40", barHeight)} title="Volume vs peers">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-blue-500/70 to-blue-500/40"
                  style={{ width: `${(pct * 100).toFixed(1)}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
