import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export default function ShotgunsLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      // Remove top padding so the full-bleed hero sits flush under the nav; keep lateral padding for the rest of the page.
      mainClassName="flex-1 px-4 pb-10 pt-0 sm:px-6 sm:pb-12 lg:px-12"
    >
      {children}
    </SiteShell>
  );
}
