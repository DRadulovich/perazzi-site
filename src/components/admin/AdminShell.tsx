"use client";

import { type ReactNode } from "react";
import { useAdminDrawer } from "@/components/admin/AdminDrawerContext";

export { AdminSidebarPortal } from "@/components/admin/AdminSidebarContext";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const { toggle, open } = useAdminDrawer();

  return (
      <div className="bg-canvas text-ink">
        <div className="border-b border-border/70 bg-card/70 backdrop-blur">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Admin Console</p>
                <p className="text-sm text-muted-foreground">
                  PerazziGPT observability, QA review, and session debugging.
                </p>
              </div>
              <button
                type="button"
                onClick={toggle}
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted/50"
                aria-expanded={open}
              >
                {open ? "Hide menu" : "Show menu"}
              </button>
            </div>
          </div>
        </div>

        {children}
      </div>
  );
}
