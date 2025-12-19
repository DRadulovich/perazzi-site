"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  href: string;
  description?: string;
  isActive?: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "insights",
    label: "Insights",
    href: "/admin/pgpt-insights",
    description: "Overview, trends, guardrails, logs",
    isActive: (pathname) =>
      pathname === "/admin/pgpt-insights" || pathname === "/admin/pgpt-insights/",
  },
  {
    key: "qa",
    label: "QA Review",
    href: "/admin/pgpt-insights/qa",
    description: "Flags, notes, adjudication",
    isActive: (pathname) => pathname.startsWith("/admin/pgpt-insights/qa"),
  },
  {
    key: "sessions",
    label: "Sessions",
    href: "/admin/pgpt-insights?view=triage#logs",
    description: "Per-session explorer & timelines",
    isActive: (pathname) => pathname.startsWith("/admin/pgpt-insights/session"),
  },
];

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

function AdminSidebar({
  activeKey,
  onNavigate,
  extraContent,
}: {
  activeKey: string;
  onNavigate?: () => void;
  extraContent?: ReactNode;
}) {
  return (
    <aside>
      <nav
        aria-label="Admin"
        className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-3 max-h-[75vh] overflow-y-auto lg:max-h-[calc(100vh-7.5rem)] lg:pr-1"
      >
        <div className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground">Navigation</div>

        <div className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group block rounded-xl border px-3 py-2 transition",
                  "border-border/60 hover:border-border hover:bg-muted/30",
                  isActive && "border-foreground/40 bg-foreground/[0.04] shadow-sm",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wide transition",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {isActive ? "active" : "go"}
                  </span>
                </div>
                {item.description ? (
                  <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
                ) : null}
              </Link>
            );
          })}
        </div>

        {extraContent ? <div className="border-t border-border pt-4">{extraContent}</div> : null}
      </nav>
    </aside>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);
  const sidebarContextValue = useMemo(() => ({ setSidebarContent }), [setSidebarContent]);

  const activeKey = useMemo(() => {
    const active =
      NAV_ITEMS.find((item) => item.isActive?.(pathname)) ??
      NAV_ITEMS.find((item) => item.href === pathname);
    return active?.key ?? "insights";
  }, [pathname]);

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
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            <div className="lg:hidden">
              {navOpen ? (
                <div id="admin-mobile-nav" className="mb-2">
                  <AdminSidebar
                    activeKey={activeKey}
                    onNavigate={() => setNavOpen(false)}
                    extraContent={sidebarContent}
                  />
                </div>
              ) : null}
            </div>

            <div className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
              <AdminSidebar activeKey={activeKey} extraContent={sidebarContent} />
            </div>

            <main className="min-w-0 space-y-8">{children}</main>
          </div>
        </div>
      </div>
    </SidebarContentContext.Provider>
  );
}
