import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function truncate(text: string, length: number) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

type TruncateCellProps = {
  text?: string | null;
  previewChars?: number;
  defaultOpen?: boolean;
  summaryContent?: ReactNode;
  children?: ReactNode;
  className?: string;
  expandLabel?: string;
};

export function TruncateCell({
  text,
  previewChars = 180,
  defaultOpen = false,
  summaryContent,
  children,
  className,
  expandLabel = "expand",
}: Readonly<TruncateCellProps>) {
  const preview = truncate(String(text ?? ""), previewChars);

  return (
    <details className={cn("group", className)} open={defaultOpen}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="wrap-break-word text-xs leading-snug text-foreground">{summaryContent ?? (preview || "—")}</div>
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">{expandLabel}</div>
      </summary>
      <div className="mt-2 space-y-2">
        {children ?? (
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
            {text ?? ""}
          </pre>
        )}
      </div>
    </details>
  );
}
