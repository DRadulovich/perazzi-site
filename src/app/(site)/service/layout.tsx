import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export default function ServiceLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell mainClassName="flex-1 py-10 sm:py-12">
      {children}
    </SiteShell>
  );
}
