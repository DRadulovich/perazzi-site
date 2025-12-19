import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Chevron } from "../Chevron";
import { SectionHeader } from "../SectionHeader";

type TableShellProps = {
  id?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  rightMeta?: ReactNode;
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
  rightMeta,
  children,
  className,
  contentClassName,
  collapsible = false,
  defaultOpen = true,
}: TableShellProps) {
  const header = <SectionHeader title={title} description={description} rightMeta={actions} actions={rightMeta} />;

  const content = (
    <div className={cn("space-y-3 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-4", contentClassName)}>{children}</div>
  );

  if (collapsible) {
    return (
      <section
        id={id}
        className={cn(
          "rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/80 to-muted/20 shadow-lg",
          className,
        )}
      >
        <details open={defaultOpen} className="group rounded-2xl">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center justify-between gap-3">
              {header}
              <div className="pr-4 sm:pr-6">
                <Chevron />
              </div>
            </div>
          </summary>
          <div className="border-t border-border/80 bg-card/70 backdrop-blur-sm">{content}</div>
        </details>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/80 to-muted/20 shadow-lg",
        className,
      )}
    >
      {header}
      <div className="border-t border-border/80 bg-card/70 backdrop-blur-sm">{content}</div>
    </section>
  );
}
