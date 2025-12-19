import { cn } from "@/lib/utils";

import { formatCompactNumber } from "../format";

type IntentDatum = {
  intent: string;
  hits: number;
};

type IntentTreemapProps = {
  title?: string;
  subtitle?: string;
  data: IntentDatum[];
  density?: "comfortable" | "compact";
  className?: string;
};

function buildTiers(data: IntentDatum[], maxItems: number) {
  const sorted = [...data].sort((a, b) => b.hits - a.hits || a.intent.localeCompare(b.intent));
  const top = sorted.slice(0, maxItems);
  const tail = sorted.slice(maxItems);
  const tailTotal = tail.reduce((acc, item) => acc + item.hits, 0);
  if (tailTotal > 0) {
    top.push({ intent: tail.length === 1 ? "Other intent" : `Other (${tail.length})`, hits: tailTotal });
  }
  return top;
}

export function IntentTreemap({
  title = "Intent distribution",
  subtitle = "Top intents by share of volume",
  data,
  density = "comfortable",
  className,
}: IntentTreemapProps) {
  const maxItems = density === "compact" ? 8 : 10;
  const tiers = buildTiers(data, maxItems);
  const total = tiers.reduce((acc, item) => acc + item.hits, 0);

  const showBars = tiers.length <= 4;
  const baseRow = density === "compact" ? "auto-rows-[72px]" : "auto-rows-[88px]";

  if (!total) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card/80 p-4 shadow-sm", className)}>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <p className="mt-2 text-xs text-muted-foreground">No intent distribution available for the current filters.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card/80 p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold leading-tight text-foreground">{title}</div>
          {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
          Top {tiers.length} intents
        </div>
      </div>

      {showBars ? (
        <div className="mt-3 space-y-2.5">
          {tiers.map((item, idx) => {
            const pct = total > 0 ? (item.hits / total) * 100 : 0;
            const hue = 210 + idx * 6;
            return (
              <div key={item.intent} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-foreground">
                  <span className="truncate font-semibold" title={item.intent}>
                    {item.intent}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${pct.toFixed(1)}%`,
                      background: `linear-gradient(90deg, hsla(${hue},65%,60%,0.65), hsla(${hue + 8},65%,55%,0.55))`,
                    }}
                    aria-hidden="true"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {formatCompactNumber(item.hits)} hits
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn("mt-3 grid grid-cols-12 gap-2", baseRow)}>
          {tiers.map((item, idx) => {
            const pct = total > 0 ? item.hits / total : 0;
            const colSpan = Math.min(12, Math.max(3, Math.round(pct * 12) + 1));
            const minHeight = density === "compact" ? 76 : 92;
            const height = minHeight + Math.round(pct * 70);
            const hue = 215 + idx * 4;
            return (
              <div
                key={item.intent}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/70"
                style={{ gridColumn: `span ${colSpan}`, minHeight: `${height}px` }}
                title={`${item.intent}: ${formatCompactNumber(item.hits)} (${(pct * 100).toFixed(0)}%)`}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/70 via-blue-500/50 to-blue-500/30"
                  style={{ opacity: 0.16 + pct * 0.6, filter: `hue-rotate(${hue}deg)` }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_30%,rgba(255,255,255,0.14),transparent_46%)] mix-blend-soft-light" />
                <div className="relative flex h-full flex-col justify-between p-3 text-xs text-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{item.intent}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{(pct * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="text-sm font-semibold text-foreground">{formatCompactNumber(item.hits)}</span>
                    <span className="truncate">{pct < 0.01 ? "<1% share" : `${(pct * 100).toFixed(1)}% share`}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
