"use client";

import { MiniTrend } from "./MiniTrend";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  deltaLabel?: string | null;
  trend: Array<number | null | undefined>;
  subtitle?: string;
  tone?: "default" | "positive" | "negative";
  density?: "comfortable" | "compact";
};

function toneClass(tone?: KpiCardProps["tone"]) {
  if (tone === "positive") return "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";
  if (tone === "negative") return "text-amber-600 bg-amber-500/10 border-amber-500/30";
  return "text-muted-foreground border-border/60 bg-background";
}

export function KpiCard({ title, value, deltaLabel, trend, subtitle, tone = "default", density = "comfortable" }: KpiCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground">{title}</div>
          <div className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{value}</div>
          {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        {deltaLabel ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-wide",
              toneClass(tone),
            )}
          >
            {deltaLabel}
          </span>
        ) : null}
      </div>

      <div className={cn("mt-auto text-muted-foreground", density === "compact" ? "pt-1" : "pt-2")}>
        <MiniTrend values={trend} title={`${title} trend`} />
      </div>
    </div>
  );
}
