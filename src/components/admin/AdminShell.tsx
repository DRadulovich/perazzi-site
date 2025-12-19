"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminSidebarNav, type AdminSidebarNavItem } from "@/components/pgpt-insights/nav/AdminSidebarNav";

type SidebarContextValue = {
  setSidebarContent: (content: ReactNode | null) => void;
};

const SidebarContentContext = createContext<SidebarContextValue | null>(null);

export function AdminSidebarPortal({ children }: { children: ReactNode }) {
  const ctx = useContext(SidebarContentContext);

  useEffect(() => {
    if (!ctx) return undefined;
    ctx.setSidebarContent(children);
    return () => ctx.setSidebarContent(null);
  }, [children, ctx]);

  return null;
}

type AdminShellProps = {
  children: ReactNode;
  navItems: AdminSidebarNavItem[];
};

export function AdminShell({ children, navItems }: AdminShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);
  const sidebarContextValue = useMemo(() => ({ setSidebarContent }), [setSidebarContent]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return (
    <SidebarContentContext.Provider value={sidebarContextValue}>
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
                onClick={() => setNavOpen((v) => !v)}
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted/50 lg:hidden"
                aria-expanded={navOpen}
                aria-controls="admin-mobile-nav"
              >
                {navOpen ? "Hide menu" : "Show menu"}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
            <div className="lg:hidden">
              {navOpen ? (
                <div id="admin-mobile-nav" className="mb-2">
                  <AdminSidebarNav
                    items={navItems}
                    extraContent={sidebarContent}
                    onNavigate={() => setNavOpen(false)}
                  />
                </div>
              ) : null}
            </div>

            <div className="hidden lg:block lg:self-start lg:sticky lg:top-24">
              <AdminSidebarNav items={navItems} extraContent={sidebarContent} />
            </div>

            <main className="min-w-0 space-y-8">{children}</main>
          </div>
        </div>
      </div>
    </SidebarContentContext.Provider>
  );
}
