import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export default function BespokeLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
