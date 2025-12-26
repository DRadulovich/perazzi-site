"use client";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type SidebarContentCtx = {
  sidebarContent: ReactNode | null;
  setSidebarContent: (content: ReactNode | null) => void;
};

const SidebarContentContext = createContext<SidebarContentCtx | null>(null);

/**
 * Provider that stores arbitrary React nodes to be rendered inside the admin sidebar
 * (e.g. Filters panel, on‐this‐page rail). Pages can push content via <AdminSidebarPortal>.
 */
export function SidebarContentProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);
  const value = useMemo(() => ({ sidebarContent, setSidebarContent }), [sidebarContent]);
  return <SidebarContentContext.Provider value={value}>{children}</SidebarContentContext.Provider>;
}

/**
 * Hook to consume the current sidebar content (read-only).
 */
export function useSidebarContent() {
  const ctx = useContext(SidebarContentContext);
  if (!ctx) throw new Error("useSidebarContent must be used within SidebarContentProvider");
  return ctx.sidebarContent;
}

/**
 * Pages call this component to inject custom widgets into the sidebar. Supply a React node
 * as its children and it will appear/disappear with mount/unmount.
 */
export function AdminSidebarPortal({ children }: { children: ReactNode }) {
  const ctx = useContext(SidebarContentContext);
  if (!ctx) throw new Error("AdminSidebarPortal must be used within SidebarContentProvider");
  const { setSidebarContent } = ctx;
  useEffect(() => {
    setSidebarContent(children);
    return () => setSidebarContent(null);
  }, [children, setSidebarContent]);

  return null;
}
