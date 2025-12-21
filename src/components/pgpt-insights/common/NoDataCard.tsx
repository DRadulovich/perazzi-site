import { cn } from "@/lib/utils";

export function NoDataCard({ title, hint, className }: { title?: string; hint?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
      <p className="text-xs text-muted-foreground">{hint ?? "No data available for the current filters."}</p>
    </div>
  );
}
