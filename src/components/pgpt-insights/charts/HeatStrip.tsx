"use client";

import { cn } from "@/lib/utils";

type HeatStripProps = Readonly<{
  title: string;
  data: ReadonlyArray<{ label: string; value: number | null }>;
  valueSuffix?: string;
  subtitle?: string;
  className?: string;
  emptyLabel?: string;
  invertColors?: boolean;
}>;

function colorForValue(v: number | null, invert?: boolean) {
  if (v === null || Number.isNaN(v)) return "bg-muted";
  if (invert) {
    if (v <= 5) return "bg-emerald-500/60";
    if (v <= 15) return "bg-emerald-500/30";
    if (v <= 30) return "bg-amber-400/50";
    return "bg-rose-400/60";
  }

  if (v >= 75) return "bg-emerald-500/60";
  if (v >= 50) return "bg-emerald-500/30";
  if (v >= 25) return "bg-amber-400/50";
  return "bg-rose-400/60";
}

export function HeatStrip({
  title,
  data,
  valueSuffix,
  subtitle,
  className,
  emptyLabel = "No data",
  invertColors,
}: HeatStripProps) {
  if (!data.length) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground", className)}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm p-4 space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-foreground">{title}</div>
          {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="text-[11px] text-muted-foreground">Last {data.length} days</div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {data.map((d) => {
          const valueLabel = d.value === null ? "n/a" : `${d.value.toFixed(1)}${valueSuffix ?? ""}`;

          return (
            <span
              key={`${title}-${d.label}`}
              className={cn(
                "group relative inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium text-background/90 ring-1 ring-border/40",
                colorForValue(d.value, invertColors),
              )}
              title={`${d.label}: ${valueLabel}`}
            >
              <span className="sr-only">
                {d.label} {valueLabel}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
