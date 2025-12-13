function messageFromError(error: unknown): string {
  if (!error) return "Unknown error.";
  if (error instanceof Error) return error.message || "Unknown error.";
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function SectionError({
  id,
  title,
  error,
}: {
  id?: string;
  title: string;
  error: unknown;
}) {
  const msg = messageFromError(error);

  return (
    <section id={id} className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">Failed to load this section.</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          error
        </span>
      </div>

      <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground whitespace-pre-wrap">
        {msg}
      </div>
    </section>
  );
}

export function SectionSkeleton({
  id,
  title,
  lines = 4,
}: {
  id?: string;
  title: string;
  lines?: number;
}) {
  return (
    <section id={id} className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">Loading…</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          …
        </span>
      </div>

      <div className="animate-pulse space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-muted/30" />
        ))}
        <div className="h-24 w-full rounded bg-muted/20" />
      </div>
    </section>
  );
}
