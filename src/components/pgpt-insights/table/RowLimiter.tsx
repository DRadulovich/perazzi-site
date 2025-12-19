"use client";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type RowLimiterProps = {
  children: ReactNode;
  colSpan: number;
  defaultVisible?: number;
  label?: string;
  className?: string;
};

export function RowLimiter({ children, colSpan, defaultVisible = 10, label = "rows", className }: RowLimiterProps) {
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => Children.toArray(children), [children]);
  const rowsWithChrome = useMemo(() => {
    return rows.map((row, idx) => {
      if (!isValidElement(row)) return row;
      const element = row as ReactElement<{ className?: string; ["data-no-zebra"]?: boolean }>;
      const elementType = typeof element.type === "string" ? element.type : null;
      if (elementType !== "tr") return row;

      const existing = element.props.className;
      const noZebra = Boolean(element.props["data-no-zebra"]);
      const baseRowClass = cn(
        !noZebra && idx % 2 === 1 ? "bg-muted/20" : null,
        "transition-colors hover:bg-muted/40",
        existing,
      );
      return cloneElement(element, { className: baseRowClass });
    });
  }, [rows]);

  const hiddenCount = Math.max(rows.length - defaultVisible, 0);
  const visibleRows = expanded ? rowsWithChrome : rowsWithChrome.slice(0, defaultVisible);

  if (rows.length === 0) return null;

  return (
    <>
      {visibleRows}
      {hiddenCount > 0 ? (
        <tr data-no-zebra className={cn("bg-card/60", className)}>
          <td colSpan={colSpan} className="px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {expanded ? "showing all" : `showing ${defaultVisible}`} / {rows.length} {label}
              </div>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm transition hover:-translate-y-[1px] hover:bg-muted/40"
              >
                {expanded ? "Show less" : `Show more (${hiddenCount})`}
                <span className="text-[11px] text-muted-foreground">{expanded ? "Collapse" : "View all"}</span>
              </button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
