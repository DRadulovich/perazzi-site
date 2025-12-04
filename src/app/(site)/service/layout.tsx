import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export default function ServiceLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell mainClassName="flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-12">
      {children}
    </SiteShell>
  );
}
