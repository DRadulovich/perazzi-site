type QaFiltersProps = Readonly<{
  status: string;
  q: string;
}>;

export function QaFilters({ status, q }: QaFiltersProps) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">Filters</h2>
        <p className="text-xs text-muted-foreground">Scope flagged interactions by status or fuzzy search.</p>
      </div>

      <form method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <label className="text-sm">
          <span>Status:</span>
          <select name="status" defaultValue={status} className="ml-2 h-9 rounded-md border bg-background px-2 text-sm">
            <option value="open">open</option>
            <option value="resolved">resolved</option>
            <option value="all">all</option>
          </select>
        </label>

        <label className="text-sm">
          <span>Search:</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Reason, notes, prompt, response…"
            className="ml-2 h-9 w-[360px] max-w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-xs font-medium text-background transition hover:opacity-90"
        >
          Apply
        </button>
      </form>
    </section>
  );
}
