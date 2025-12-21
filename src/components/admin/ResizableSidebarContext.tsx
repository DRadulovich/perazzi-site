"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

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

export function ResizableSidebarProvider({ children }: { children: ReactNode }) {
  const [width, _setWidth] = useState<number>(DEFAULT_W);

  // hydrate from localStorage once in browser
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored) {
        const num = Number(stored);
        if (!Number.isNaN(num)) _setWidth(clamp(num));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setWidth = useCallback((w: number) => {
    const next = clamp(w);
    _setWidth(next);
    try {
      window.localStorage.setItem(LS_KEY, String(next));
    } catch {}
  }, []);

  const reset = useCallback(() => setWidth(DEFAULT_W), [setWidth]);

  return <Ctx.Provider value={{ width, setWidth, reset }}>{children}</Ctx.Provider>;
}

export function useResizableSidebar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useResizableSidebar must be inside ResizableSidebarProvider");
  return ctx;
}

function clamp(n: number) {
  return Math.min(MAX_W, Math.max(MIN_W, n));
}
