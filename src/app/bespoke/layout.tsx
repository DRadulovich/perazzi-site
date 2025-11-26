import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export default function BespokeLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      // Drop top padding so the full-bleed hero sits flush under the nav; keep standard lateral padding for the rest.
      mainClassName="flex-1 px-4 pb-12 pt-0 sm:px-8 lg:px-12"
    >
      {children}
    </SiteShell>
  );
}
