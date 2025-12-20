import React from "react";

function cn(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

type BadgeProps = {
  readonly children: React.ReactNode;
  readonly tone?: "default" | "red" | "amber" | "yellow" | "blue" | "purple";
  readonly title?: string;
};

export function Badge({ children, tone = "default", title }: BadgeProps) {
  let toneClass = "";
  if (tone === "red") {
    toneClass = "border-red-500/30 bg-red-500/8 text-red-700 dark:text-red-300";
  } else if (tone === "amber") {
    toneClass = "border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-300";
  } else if (tone === "yellow") {
    toneClass = "border-yellow-500/30 bg-yellow-500/8 text-yellow-700 dark:text-yellow-300";
  } else if (tone === "blue") {
    toneClass = "border-blue-500/30 bg-blue-500/8 text-blue-700 dark:text-blue-300";
  } else if (tone === "purple") {
    toneClass = "border-purple-500/30 bg-purple-500/8 text-purple-700 dark:text-purple-300";
  } else {
    toneClass = "border-border bg-background text-muted-foreground";
  }

  return (
    <span
      title={title}
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide tabular-nums shadow-[0_1px_1px_rgba(0,0,0,0.04)]", toneClass)}
    >
      {children}
    </span>
  );
}
