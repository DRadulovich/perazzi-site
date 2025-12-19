"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/pgpt-insights/Badge";
import { cn } from "@/lib/utils";

type AdminSidebarNavMatcher =
  | { type: "path"; path: string }
  | { type: "startsWith"; prefix: string }
  | { type: "searchParam"; key: string; value: string; path?: string };

export type AdminSidebarNavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  badgeCount?: number;
  matchers?: AdminSidebarNavMatcher[];
};

type AdminSidebarNavProps = {
  items: AdminSidebarNavItem[];
  extraContent?: ReactNode;
  onNavigate?: () => void;
};

export function AdminSidebarNav({ items, extraContent, onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent) => setIsCompactViewport(event.matches);
    setIsCompactViewport(mq.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isCompactViewport) {
      setMobileExpanded(false);
    }
  }, [isCompactViewport]);

  const collapsed = isCompactViewport && !mobileExpanded;

  return (
    <nav
      aria-label="Admin navigation"
      data-collapsed={collapsed ? "true" : undefined}
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 shadow-sm backdrop-blur",
        "p-3 sm:p-4",
        "max-h-[70vh] overflow-y-auto lg:sticky lg:top-28 lg:max-h-[calc(100vh-7.5rem)]",
      )}
    >
      <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Navigation</p>
          <p className="text-sm font-semibold text-foreground">PGPT Insights</p>
        </div>

        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className={cn(
            "inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm transition hover:bg-muted/60",
            "sm:hidden",
          )}
          aria-pressed={!collapsed}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const hrefPath = item.href.split("#")[0]?.split("?")[0] ?? item.href;
          const matcherActive =
            item.matchers?.some((matcher) => {
              if (matcher.type === "path") {
                return pathname === matcher.path || pathname === `${matcher.path}/`;
              }
              if (matcher.type === "startsWith") {
                return pathname.startsWith(matcher.prefix);
              }
              if (matcher.type === "searchParam") {
                const matchesPath =
                  !matcher.path || pathname === matcher.path || pathname === `${matcher.path}/`;
                return matchesPath && searchParams?.get(matcher.key) === matcher.value;
              }
              return false;
            }) ?? false;

          const isActive = matcherActive || pathname === hrefPath || pathname === `${hrefPath}/`;

          const badge =
            typeof item.badgeCount === "number"
              ? item.badgeCount.toLocaleString("en-US")
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center rounded-xl border transition",
                collapsed ? "justify-center gap-0 px-2 py-2" : "gap-3 px-2 py-2 sm:px-3 sm:py-2.5",
                "border-border/60 bg-background/70 hover:-translate-y-[1px] hover:border-border hover:bg-muted/40 hover:shadow-sm",
                isActive
                  ? "border-blue-500/60 bg-blue-500/5 shadow-sm ring-1 ring-blue-500/20"
                  : "ring-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg text-foreground/80 transition",
                  isActive ? "bg-blue-500/10 text-blue-600 dark:text-blue-300" : "bg-muted/60",
                )}
                aria-hidden="true"
              >
                {item.icon ?? <span className="text-lg leading-none">•</span>}
              </div>

              <div
                className={cn(
                  "min-w-0 flex-1 space-y-0.5 sm:block",
                  collapsed ? "hidden" : "block",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{item.label}</span>
                </div>
                {item.description ? (
                  <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                ) : null}
              </div>

              {badge !== null ? (
                <div className={cn("ml-auto", collapsed ? "hidden" : "block")}>
                  <Badge tone={isActive ? "blue" : "default"} title={`${item.label} count`}>
                    {badge}
                  </Badge>
                </div>
              ) : null}

              {collapsed ? (
                <div className="pointer-events-none absolute left-full top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-lg transition group-focus-visible:flex group-hover:flex">
                  <div className="text-sm font-semibold leading-tight">{item.label}</div>
                  {item.description ? (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</div>
                  ) : null}
                  {badge !== null ? (
                    <div className="mt-1">
                      <Badge tone={isActive ? "blue" : "default"}>{badge}</Badge>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>

      {extraContent && !collapsed ? <div className="mt-3">{extraContent}</div> : null}
    </nav>
  );
}
