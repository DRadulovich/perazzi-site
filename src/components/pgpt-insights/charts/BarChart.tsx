import { cn } from "@/lib/utils";
import { formatCompactNumber } from "../format";

export type BarDatum = {
  label: string;
  value: number;
  secondary?: string | null;
};

type BarChartProps = {
  title?: string;
  subtitle?: string;
  data: BarDatum[];
  className?: string;
  maxBars?: number;
};

export function BarChart({ title, subtitle, data, className, maxBars }: BarChartProps) {
  const rows = maxBars ? data.slice(0, maxBars) : data;
  const maxVal = Math.max(...rows.map((d) => d.value), 1);

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm p-4", className)}>
      <div className="space-y-1">
        {title ? <div className="text-sm font-semibold text-foreground">{title}</div> : null}
        {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">No data available.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((row) => {
            const pct = Math.max(2, Math.min(100, (row.value / maxVal) * 100));
            return (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground" title={row.label}>
                    {row.label}
                  </span>
                  <span className="whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatCompactNumber(row.value)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full border border-border/70 bg-muted/30">
                  <div
                    className="h-full rounded-full bg-blue-500/80"
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                </div>
                {row.secondary ? <div className="text-[11px] text-muted-foreground">{row.secondary}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
