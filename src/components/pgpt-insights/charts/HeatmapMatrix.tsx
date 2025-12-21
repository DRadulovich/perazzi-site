"use client";

import { useMemo, useState, type FocusEvent, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

import { formatCompactNumber } from "../format";

type HeatmapColumn = {
  key: string;
  label: string;
  tooltip?: string;
};

type HeatmapRow = {
  archetype: string;
  total: number;
  cells: Array<{ key: string; hits: number }>;
};

type HeatmapMatrixProps = {
  title: string;
  subtitle?: string;
  columns: HeatmapColumn[];
  rows: HeatmapRow[];
  density?: "comfortable" | "compact";
  className?: string;
};

type HoverState = {
  archetype: string;
  intent: string;
  hits: number;
  pct: number;
  clientX: number;
  clientY: number;
};

function colorFor(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return "rgba(59, 130, 246, 0.06)";
  const t = Math.max(0, Math.min(1, value / max));
  const alpha = 0.1 + t * 0.6;
  return `rgba(59, 130, 246, ${alpha.toFixed(3)})`;
}

function pctLabel(pct: number) {
  if (!Number.isFinite(pct) || pct <= 0) return "—";
  return `${Math.round(pct * 100)}%`;
}

export function HeatmapMatrix({
  title,
  subtitle,
  columns,
  rows,
  density = "comfortable",
  className,
}: Readonly<HeatmapMatrixProps>) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const columnLabels = useMemo(() => new Map(columns.map((c) => [c.key, c.label])), [columns]);
  const preparedRows = useMemo(
    () => rows.map((row) => ({ ...row, cellMap: new Map(row.cells.map((cell) => [cell.key, cell.hits])) })),
    [rows],
  );

  const maxCellValue = useMemo(() => {
    const values = rows.flatMap((row) => row.cells.map((cell) => cell.hits));
    return values.length ? Math.max(...values, 1) : 1;
  }, [rows]);

  const colMin = density === "compact" ? 72 : 88;
  const rowLabelMin = density === "compact" ? 110 : 128;
  const rowHeight = density === "compact" ? "h-[52px]" : "h-[68px]";
  const labelClass = density === "compact" ? "text-[11px]" : "text-xs";

  function showHover(
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    row: { archetype: string; total: number },
    key: string,
    hits: number,
  ) {
    const pct = row.total > 0 ? hits / row.total : 0;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setHover({
      archetype: row.archetype,
      intent: columnLabels.get(key) ?? key,
      hits,
      pct,
      clientX: "clientX" in event ? event.clientX : rect.left + rect.width / 2,
      clientY: "clientY" in event ? event.clientY : rect.top + rect.height / 2,
    });
  }

  function hideHover() {
    setHover(null);
  }

  const TOOLTIP_HEIGHT = 120; // px – estimated fixed height of tooltip
  const tooltipStyle =
    hover && globalThis.window !== undefined
      ? {
          left: `${Math.min(globalThis.window.innerWidth - 220, hover.clientX + 12)}px`,
          top: `${Math.min(hover.clientY + 14, globalThis.window.innerHeight - TOOLTIP_HEIGHT - 16)}px`,
        }
      : undefined;

  const hasData = columns.length > 0 && rows.some((row) => row.total > 0);

  return (
    <div className={cn("relative flex h-full flex-col rounded-2xl border border-border bg-card/90 p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold leading-tight text-foreground">{title}</div>
          {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        {columns.length ? (
          <div className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
            {columns.length} intents
          </div>
        ) : null}
      </div>

      {hasData ? (
        <div className={cn("mt-3 overflow-x-auto", density === "compact" ? "-mx-2 px-2" : "-mx-1 px-1")}>
          <div
            className={cn("grid min-w-full items-stretch gap-px text-[12px] text-foreground", labelClass)}
            style={{ gridTemplateColumns: `minmax(${rowLabelMin}px,1fr) repeat(${columns.length}, minmax(${colMin}px,1fr))` }}
          >
            <div className="h-10 border-b border-border/60 pr-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Archetype
            </div>
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex h-10 items-center justify-center border-b border-border/60 bg-muted/30 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <span className="truncate" title={col.tooltip ?? String(col.label)}>
                  {col.label}
                </span>
              </div>
            ))}

            {preparedRows.map((row) => (
              <div key={row.archetype} className="contents">
                <div
                  className={cn(
                    "flex items-center justify-between border-r border-border/60 bg-card/70 px-3 font-semibold text-foreground",
                    labelClass,
                  )}
                >
                  <span className="truncate" title={row.archetype}>
                    {row.archetype}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{formatCompactNumber(row.total)}</span>
                </div>

                {columns.map((col) => {
                  const hits = row.cellMap.get(col.key) ?? 0;
                  const pct = row.total > 0 ? hits / row.total : 0;
                  const label = pctLabel(pct);
                  const isDark = maxCellValue > 0 && hits / maxCellValue > 0.5;

                  return (
                    <button
                      key={`${row.archetype}-${col.key}`}
                      type="button"
                      onMouseEnter={(e) => showHover(e, row, col.key, hits)}
                      onMouseMove={(e) => showHover(e, row, col.key, hits)}
                      onMouseLeave={hideHover}
                      onFocus={(e) => showHover(e, row, col.key, hits)}
                      onBlur={hideHover}
                      className={cn(
                        "group relative flex items-center justify-center overflow-hidden rounded-[10px] border border-border/60 bg-muted/20 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        rowHeight,
                      )}
                      title={`${row.archetype} · ${columnLabels.get(col.key) ?? col.key}: ${hits} (${label})`}
                    >
                      <div
                        className="absolute inset-0 bg-linear-to-br from-blue-500/60 to-blue-500/40"
                        style={{
                          backgroundColor: colorFor(hits, maxCellValue),
                          opacity: hits === 0 ? 0.08 : Math.min(0.88, (hits / maxCellValue) * 0.9),
                        }}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.14),transparent_52%)] mix-blend-soft-light"
                        aria-hidden="true"
                      />
                      <div className={cn("relative flex flex-col items-center justify-center gap-0.5 px-2 drop-shadow-sm", isDark ? "text-white" : "text-foreground")}>
                        <span className="text-sm font-semibold tabular-nums">{hits > 0 ? formatCompactNumber(hits) : "—"}</span>
                        <span className={cn("text-[11px]", isDark ? "text-white/80" : "text-foreground/80")}>{label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-xs text-muted-foreground">
          No archetype/intent data for the current filters.
        </div>
      )}

      {hover ? (
        <div
          className="pointer-events-none fixed z-50 w-[220px] rounded-xl border border-border/80 bg-card/95 p-3 text-xs shadow-xl backdrop-blur"
          style={tooltipStyle}
        >
          <div className="font-semibold text-foreground">
            {hover.archetype} · {hover.intent}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted-foreground">Hits</span>
            <span className="tabular-nums text-foreground">{hover.hits}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Share of archetype</span>
            <span className="tabular-nums text-foreground">{pctLabel(hover.pct)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
