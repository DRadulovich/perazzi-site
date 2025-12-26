"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const MIN_W = 200;
const MAX_W = 480;
const LS_KEY = "adminNavWidth";
const DEFAULT_W = 260;

interface ResizableCtx {
  width: number;                // current px width
  setWidth: (w: number) => void; // programmatic set (clamped + persisted)
  reset: () => void;            // restore default
}

const Ctx = createContext<ResizableCtx | null>(null);

export function ResizableSidebarProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Initialise width from localStorage (client-side) once, using lazy initializer to
  // avoid a redundant render after mount.
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const win = globalThis as typeof globalThis & { window?: Window; localStorage?: Storage };
    if (win.window === undefined) return DEFAULT_W;
    try {
      const stored = win.localStorage?.getItem(LS_KEY);
      if (stored) {
        const num = Number(stored);
        if (!Number.isNaN(num)) return clamp(num);
      }
    } catch {
      // ignore
    }
    return DEFAULT_W;
  });

  // Listen for width updates from other tabs / windows.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LS_KEY || event.newValue == null) return;
      const num = Number(event.newValue);
      if (!Number.isNaN(num)) setSidebarWidth(clamp(num));
    };
    globalThis.addEventListener("storage", handleStorage);
    return () => {
      globalThis.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setWidth = useCallback((w: number) => {
    const next = clamp(w);
    setSidebarWidth(next);
    try {
      globalThis.localStorage.setItem(LS_KEY, String(next));
    } catch {}
  }, []);

  const reset = useCallback(() => setWidth(DEFAULT_W), [setWidth]);

  const value = useMemo(() => ({ width: sidebarWidth, setWidth, reset }), [sidebarWidth, setWidth, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useResizableSidebar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useResizableSidebar must be inside ResizableSidebarProvider");
  return ctx;
}

function clamp(n: number) {
  return Math.min(MAX_W, Math.max(MIN_W, n));
}
