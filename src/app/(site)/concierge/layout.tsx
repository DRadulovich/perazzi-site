import type { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";

export default function ConciergeLayout({ children }: { children: ReactNode }) {
  return <SiteShell showChatWidget={false}>{children}</SiteShell>;
}
