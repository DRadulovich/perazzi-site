"use client";

import { useEffect, useState } from "react";
import { logAnalytics } from "@/lib/analytics";

export function JournalSearch() {
  const [term, setTerm] = useState("");
  useEffect(() => {
    if (!term) return;
    const preview = setTimeout(() => {
      logAnalytics("SearchPreview");
    }, 300);
    return () => clearTimeout(preview);
  }, [term]);

  return (
    <form
      role="search"
      className="flex flex-col gap-2 rounded-3xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        logAnalytics("SearchSubmitted");
      }}
    >
      <label className="flex w-full flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
        <span>Search the journal</span>
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
          placeholder="Stories, interviews, news…"
        />
      </label>
      <button
        type="submit"
        className="rounded-2xl bg-perazzi-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white focus-ring"
      >
        Search
      </button>
    </form>
  );
}
