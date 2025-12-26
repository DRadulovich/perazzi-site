import type { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";

export default function BuildJourneyLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      mainClassName="flex-1 py-0"
      contentClassName="flex flex-col gap-0 max-w-none px-0"
    >
      {children}
    </SiteShell>
  );
}
