"use client";
import { ReactNode, useCallback } from "react";
import { useResizableSidebar } from "@/components/admin/ResizableSidebarContext";
import { cn } from "@/lib/utils";

/**
 * Grid wrapper for admin pages on desktop (lg breakpoint and up).
 * Sidebar width is driven by a CSS variable and can be resized via a drag handle.
 */
export function ResizableAdminLayout({ nav, children, className }: Readonly<{
  nav: ReactNode;
  children: ReactNode;
  className?: string;
}>) {
  const { width, setWidth } = useResizableSidebar();

  const startDrag = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const startX = e.clientX;
    const startW = width;

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX;
      setWidth(startW + delta);
    };
    const onUp = () => {
      globalThis.removeEventListener("pointermove", onMove);
      globalThis.removeEventListener("pointerup", onUp);
    };

    globalThis.addEventListener("pointermove", onMove);
    globalThis.addEventListener("pointerup", onUp);
  }, [width, setWidth]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
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
      className={cn(
        "grid h-[calc(100vh-var(--admin-header-h,0px))] grid-cols-[minmax(0,1fr)] lg:grid-cols-[var(--admin-sidebar-width)_4px_minmax(0,1fr)]",
        className
      )}
      style={{ "--admin-sidebar-width": `${width}px` } as React.CSSProperties}
    >
      {/* Sidebar */}
      <aside id="admin-sidebar" className="hidden h-full overflow-y-auto border-r border-border bg-card/90 shadow-sm backdrop-blur-xl lg:block">
        {nav}
      </aside>

      {/* Drag handle */}
      <button
        type="button"
        aria-label="Resize sidebar"
        aria-controls="admin-sidebar"
        onPointerDown={startDrag}
        onKeyDown={handleKey}
        className="group hidden w-1 cursor-col-resize select-none bg-transparent focus-ring lg:block"
      >
        <div className="h-full w-full bg-transparent group-hover:bg-ink/10" aria-hidden="true" />
      </button>

      {/* Main content */}
      <main className="min-w-0 overflow-y-auto px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
