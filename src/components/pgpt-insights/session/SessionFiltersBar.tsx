"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SessionFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const densityKey = "pgptInsights.density";

  const get = (k: string) => searchParams.get(k) ?? "";

  const density = get("density") || "comfortable";
  const qa = get("qa") || "any";
  const grStatus = get("gr_status") || "any";
  const lowConf = get("low_conf") || "any";
  const score = get("score") || "any";
  const winnerChanged = get("winner_changed") || "any";
  const marginLt = get("margin_lt") || "any";
  const scoreArchetype = get("score_archetype") || "any";
  const min = get("min") || "0.40";
  const qUrl = get("q");

  function replaceParams(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    const v = String(value ?? "").trim();

    const isAnyKey =
      key === "qa" || key === "gr_status" || key === "low_conf" || key === "score" || key === "winner_changed" || key === "margin_lt" || key === "score_archetype";

    if (!v) next.delete(key);
    else next.set(key, v);

    // delete defaults
    if (key === "density" && v === "comfortable") next.delete("density");
    if (isAnyKey && v === "any") next.delete(key);
    if (key === "score_archetype" && v === "any") next.delete("min");

    // (future-proof) reset pagination
    next.delete("page");

    replaceParams(next);
  }

  // Persist density
  useEffect(() => {
    try {
      window.localStorage.setItem(densityKey, density);
    } catch {}
  }, [density]);

  // Hydrate density from localStorage if missing in URL
  const didHydrateRef = useRef(false);
  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    if (searchParams.get("density")) return;

    try {
      const stored = window.localStorage.getItem(densityKey);
      if (stored && stored !== "comfortable") {
        const next = new URLSearchParams(searchParams.toString());
        next.set("density", stored);
        replaceParams(next);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced q
  const [qInput, setQInput] = useState(qUrl);
  useEffect(() => setQInput(qUrl), [qUrl]);

  useEffect(() => {
    if (qInput === qUrl) return;

    const t = window.setTimeout(() => {
      const trimmed = qInput.trim();
      setParam("q", trimmed);
      if (!trimmed) {
        const next = new URLSearchParams(searchParams.toString());
        next.delete("q");
        next.delete("page");
        replaceParams(next);
      }
    }, 350);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput, qUrl]);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">Session Filters</h2>
        <p className="text-xs text-muted-foreground">
          Filters apply only within this session. Search is debounced and updates the URL.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="text-sm">
          <label htmlFor="sess-q" className="block text-xs text-muted-foreground">
            Search (prompt/response)
          </label>
          <input
            id="sess-q"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search within this session…"
            className="h-9 w-[360px] max-w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>

        <div className="text-sm">
          <label htmlFor="sess-qa" className="block text-xs text-muted-foreground">
            QA
          </label>
          <select
            id="sess-qa"
            value={qa}
            onChange={(e) => setParam("qa", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="open">open</option>
            <option value="resolved">resolved</option>
            <option value="none">none</option>
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="sess-gr" className="block text-xs text-muted-foreground">
            Guardrail
          </label>
          <select
            id="sess-gr"
            value={grStatus}
            onChange={(e) => setParam("gr_status", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="blocked">blocked</option>
            <option value="not_blocked">not blocked</option>
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="sess-lowconf" className="block text-xs text-muted-foreground">
            Low confidence
          </label>
          <select
            id="sess-lowconf"
            value={lowConf}
            onChange={(e) => setParam("low_conf", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="sess-score" className="block text-xs text-muted-foreground">
            maxScore
          </label>
          <select
            id="sess-score"
            value={score}
            onChange={(e) => setParam("score", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="lt0.25">&lt; 0.25</option>
            <option value="lt0.5">&lt; 0.5</option>
            <option value="0.25-0.5">0.25–0.5</option>
            <option value="0.5-0.75">0.5–0.75</option>
            <option value="gte0.75">≥ 0.75</option>
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="sess-winner-changed" className="block text-xs text-muted-foreground">
            Winner changed
          </label>
          <select
            id="sess-winner-changed"
            value={winnerChanged}
            onChange={(e) => setParam("winner_changed", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="any">any</option>
            <option value="true">true</option>
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="sess-margin" className="block text-xs text-muted-foreground">
            Margin &lt;
          </label>
          <select
            id="sess-margin"
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
          <label htmlFor="sess-score-arch" className="block text-xs text-muted-foreground">
            Archetype score
          </label>
          <select
            id="sess-score-arch"
            value={scoreArchetype}
            onChange={(e) => {
              const v = e.target.value;
              setParam("score_archetype", v);
              // If turning off archetype score filter, remove min too.
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
            <label htmlFor="sess-arch-min" className="block text-xs text-muted-foreground">
              ≥ min
            </label>
            <select
              id="sess-arch-min"
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

        <div className="text-sm">
          <label htmlFor="sess-density" className="block text-xs text-muted-foreground">
            Density
          </label>
          <select
            id="sess-density"
            value={density}
            onChange={(e) => setParam("density", e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="comfortable">comfortable</option>
            <option value="compact">compact</option>
          </select>
        </div>
      </div>
    </section>
  );
}
