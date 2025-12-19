import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MonoCell({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[11px] leading-relaxed tracking-tight text-foreground tabular-nums", className)}>{children}</span>;
}
