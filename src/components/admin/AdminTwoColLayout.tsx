import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminTwoColLayout({
  sidebar,
  children,
  className,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen", className)}>
      <aside className="fixed inset-y-0 left-0 w-64 overflow-y-auto border-r border-border bg-card p-4 shadow-sm">
        {sidebar}
      </aside>
      <main className="ml-64 flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
    </div>
  );
}
