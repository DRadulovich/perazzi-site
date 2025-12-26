"use client";
import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";

interface DrawerCtx {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const Ctx = createContext<DrawerCtx | null>(null);

export function AdminDrawerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminDrawer must be inside AdminDrawerProvider");
  return ctx;
}
