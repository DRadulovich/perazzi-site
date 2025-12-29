"use client";

import { useState } from "react";
import type { TagRef } from "@/types/journal";
import { logAnalytics } from "@/lib/analytics";

type TagChipsProps = Readonly<{
  tags: TagRef[];
  onChange?: (selected: string[]) => void;
}>;

export function TagChips({ tags, onChange }: TagChipsProps) {
  const [selected, setSelected] = useState<string[]>([]);

  if (!tags.length) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id];
      onChange?.(next);
      logAnalytics(`CategoryTabClick:${id}`);
      return next;
    });
  };

  return (
    <section aria-label="Explore by topic" className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          aria-pressed={selected.includes(tag.id)}
          className={`type-label-tight rounded-full border px-4 py-2 focus-ring ${
            selected.includes(tag.id)
              ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
              : "border-border bg-card text-ink"
          }`}
          onClick={() => { toggle(tag.id); }}
        >
          {tag.label}
        </button>
      ))}
    </section>
  );
}
