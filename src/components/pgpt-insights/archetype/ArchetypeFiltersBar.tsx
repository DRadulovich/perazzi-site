"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ArchetypeFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (k: string) => searchParams.get(k) ?? "";

  const winnerChanged = get("winner_changed") || "any";
  const marginLt = get("margin_lt") || "any";
  const scoreArchetype = get("score_archetype") || "any";
  const min = get("min") || "0.40";

  function replaceParams(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    const v = String(value ?? "").trim();

    const anyKeys = new Set(["winner_changed", "margin_lt", "score_archetype"]);
    if (!v) next.delete(key);
    else next.set(key, v);

    if (anyKeys.has(key) && v === "any") next.delete(key);
    if (key === "score_archetype" && v === "any") next.delete("min");

    next.delete("page");
    replaceParams(next);
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">Archetype Diagnostics</h2>
        <p className="text-xs text-muted-foreground">Query archetype behavior via logged distributions.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="text-sm">
          <label htmlFor="arch-winner-changed" className="block text-xs text-muted-foreground">
            Winner changed
          </label>
          <select
            id="arch-winner-changed"
            value={winnerChanged}
            onChange={(e) => setParam("winner_changed", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="true">true</option>
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="arch-margin" className="block text-xs text-muted-foreground">
            Margin &lt;
          </label>
          <select
            id="arch-margin"
            value={marginLt}
            onChange={(e) => setParam("margin_lt", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="0.08">0.08</option>
            <option value="0.12">0.12</option>
            <option value="0.20">0.20</option>
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="arch-score" className="block text-xs text-muted-foreground">
            Archetype score
          </label>
          <select
            id="arch-score"
            value={scoreArchetype}
            onChange={(e) => {
              const v = e.target.value;
              setParam("score_archetype", v);
              if (v === "any") setParam("min", "");
            }}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="Loyalist">Loyalist</option>
            <option value="Prestige">Prestige</option>
            <option value="Analyst">Analyst</option>
            <option value="Achiever">Achiever</option>
            <option value="Legacy">Legacy</option>
          </select>
        </div>

        {scoreArchetype !== "any" ? (
          <div className="text-sm">
            <label htmlFor="arch-min" className="block text-xs text-muted-foreground">
              ≥ min
            </label>
            <select
              id="arch-min"
              value={min}
              onChange={(e) => setParam("min", e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="0.20">0.20</option>
              <option value="0.30">0.30</option>
              <option value="0.40">0.40</option>
              <option value="0.50">0.50</option>
              <option value="0.60">0.60</option>
            </select>
          </div>
        ) : null}
      </div>
    </section>
  );
}
