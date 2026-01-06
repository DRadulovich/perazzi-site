"use client";

import { cn } from "@/lib/utils";

type HistogramProps = {
  title: string;
  values: number[];
  bins: number[];
  className?: string;
  subtitle?: string;
  formatType?: "percent" | "ms" | "number";
};

function formatValue(n: number, formatType?: HistogramProps["formatType"]) {
  if (formatType === "percent") return `${n}%`;
  if (formatType === "ms") return `${n} ms`;
  return `${n}`;
}

export function Histogram({ title, values, bins, className, subtitle, formatType = "number" }: Readonly<HistogramProps>) {
  if (!values.length) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground", className)}>
        No data available.
      </div>
    );
  }

  const counts = bins.map((edge, idx) => {
    const next = bins[idx + 1] ?? Infinity;
    const bucketValues = values.filter((v) => v >= edge && v < next);
    return { edge, next, count: bucketValues.length };
  });

  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm p-4 space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-foreground">{title}</div>
          {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="text-[11px] text-muted-foreground">{values.length} points</div>
      </div>

      <div className="space-y-2">
        {counts.map((bucket) => {
          const width = (bucket.count / maxCount) * 100;
          const label =
            bucket.next === Infinity
              ? `${formatValue(bucket.edge, formatType)}+`
              : `${formatValue(bucket.edge, formatType)} – ${formatValue(bucket.next, formatType)}`;

          return (
            <div key={`${bucket.edge}-${bucket.next}`} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{label}</span>
                <span className="tabular-nums">{bucket.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-foreground/50" style={{ width: `${width}%` }} aria-hidden />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
