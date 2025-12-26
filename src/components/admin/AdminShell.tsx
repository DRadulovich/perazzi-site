"use client";

import { type ReactNode } from "react";
import { useAdminDrawer } from "@/components/admin/AdminDrawerContext";

export { AdminSidebarPortal } from "@/components/admin/AdminSidebarContext";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: Readonly<AdminShellProps>) {
  const { toggle, open } = useAdminDrawer();

  return (
      <div className="bg-canvas text-ink">
        <div className="border-b border-border/70 bg-card/80 backdrop-blur-md">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-ink-muted">Admin Console</p>
                <p className="text-sm text-ink-muted">
                  PerazziGPT observability, QA review, and session debugging.
                </p>
              </div>
              <button
                type="button"
                onClick={toggle}
                className="inline-flex h-9 items-center rounded-full border border-border/70 bg-card/60 px-3 text-xs font-semibold text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
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
