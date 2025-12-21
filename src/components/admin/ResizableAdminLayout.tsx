"use client";
import { ReactNode, useCallback } from "react";
import { useResizableSidebar } from "@/components/admin/ResizableSidebarContext";
import { cn } from "@/lib/utils";

/**
 * Grid wrapper for admin pages on desktop (lg breakpoint and up).
 * Sidebar width is driven by a CSS variable and can be resized via a drag handle.
 */
export function ResizableAdminLayout({ nav, children, className }: {
  nav: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { width, setWidth } = useResizableSidebar();

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startW = width;

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX;
      setWidth(startW + delta);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [width, setWidth]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setWidth(width - 16);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setWidth(width + 16);
    }
  }, [setWidth, width]);

  return (
    <div
      className={cn("hidden h-[calc(100vh-var(--admin-header-h,0px))] lg:grid", className)}
      style={{ gridTemplateColumns: `${width}px 4px minmax(0,1fr)` }}
    >
      {/* Sidebar */}
      <aside className="h-full overflow-y-auto border-r border-border bg-card">
        {nav}
      </aside>

      {/* Drag handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={handleKey}
        className="group w-1 cursor-col-resize select-none bg-transparent focus:outline-none"
      >
        <div className="h-full w-full bg-transparent group-hover:bg-muted/40" />
      </div>

      {/* Main content */}
      <main className="min-w-0 overflow-y-auto px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}