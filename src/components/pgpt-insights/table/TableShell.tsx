import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Chevron } from "../Chevron";

type TableShellProps = {
  id?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function TableShell({
  id,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  collapsible = false,
  defaultOpen = true,
}: TableShellProps) {
  const header = (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">{actions}</div> : null}
    </div>
  );

  const content = <div className={cn("space-y-3 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3", contentClassName)}>{children}</div>;

  if (collapsible) {
    return (
      <section
        id={id}
        className={cn("rounded-2xl border border-border bg-card shadow-sm", className)}
      >
        <details open={defaultOpen} className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center justify-between gap-3">
              {header}
              <div className="pr-4 sm:pr-6">
                <Chevron />
              </div>
            </div>
          </summary>
          <div className="border-t border-border/80 bg-card/60 backdrop-blur-sm">{content}</div>
        </details>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={cn("rounded-2xl border border-border bg-card shadow-sm", className)}
    >
      {header}
      <div className="border-t border-border/80 bg-card/60 backdrop-blur-sm">{content}</div>
    </section>
  );
}
