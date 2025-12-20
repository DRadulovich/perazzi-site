import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = Readonly<{
  title: string;
  description?: string;
  rightMeta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}>;

export function SectionHeader({ title, description, rightMeta, actions, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/80 bg-linear-to-r from-card/90 via-card/80 to-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4",
        className,
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/90">Pgpt insights</div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
        {rightMeta ? (
          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            {rightMeta}
          </div>
        ) : null}
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
