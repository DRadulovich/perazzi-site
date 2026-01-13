import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      // Remove top padding so the full-bleed hero sits flush under the nav.
      mainClassName="flex-1 pb-10 pt-0 sm:pb-12"
      contentClassName="flex flex-col gap-0"
    >
      {children}
    </SiteShell>
  );
}
