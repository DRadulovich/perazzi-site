import React from "react";

function cn(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function Badge({
  children,
  tone = "default",
  title,
}: {
  children: React.ReactNode;
  tone?: "default" | "red" | "amber" | "yellow" | "blue" | "purple";
  title?: string;
}) {
  const toneClass =
    tone === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : tone === "yellow"
          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
          : tone === "blue"
            ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
            : tone === "purple"
              ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
              : "border-border bg-background text-muted-foreground";

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide tabular-nums",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}
