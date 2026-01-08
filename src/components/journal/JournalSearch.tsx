"use client";

import { useEffect, useState } from "react";
import { logAnalytics } from "@/lib/analytics";
import { Button, Input } from "@/components/ui";
import { useSiteSettings } from "@/components/site-settings-context";

export function JournalSearch() {
  const [term, setTerm] = useState("");
  const { journalUi } = useSiteSettings();
  const searchUi = journalUi?.search;
  const label = searchUi?.label ?? "Search the journal";
  const placeholder = searchUi?.placeholder ?? "Stories, interviews, news…";
  const buttonLabel = searchUi?.buttonLabel ?? "Search";

  useEffect(() => {
    if (!term) return;
    const preview = setTimeout(() => {
      logAnalytics("SearchPreview");
    }, 300);
    return () => { clearTimeout(preview); };
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
      <label className="flex w-full flex-col type-label-tight text-ink">
        <span>{label}</span>
        <Input
          type="search"
          value={term}
          onChange={(event) => { setTerm(event.target.value); }}
          className="mt-1"
          placeholder={placeholder}
        />
      </label>
      <Button type="submit" size="sm">
        {buttonLabel}
      </Button>
    </form>
  );
}
