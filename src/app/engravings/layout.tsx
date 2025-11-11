import type { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";

export default function EngravingsLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
