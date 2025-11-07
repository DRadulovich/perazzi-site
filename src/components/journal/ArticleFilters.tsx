"use client";

import { useState } from "react";
import type { TagRef } from "@/types/journal";

type ArticleFiltersProps = {
  tags: TagRef[];
  authors: string[];
  onChange?: (filters: { sort: string; tag?: string; author?: string }) => void;
};

const sorts = [
  { value: "latest", label: "Latest" },
  { value: "reading", label: "Reading time" },
];

export function ArticleFilters({ tags, authors, onChange }: ArticleFiltersProps) {
  const [filters, setFilters] = useState({ sort: "latest", tag: "", author: "" });

  const update = (next: Partial<typeof filters>) => {
    setFilters((prev) => {
      const merged = { ...prev, ...next };
      onChange?.(merged);
      console.log("FilterChanged:category", merged);
      return merged;
    });
  };

  return (
    <section aria-label="Filters" className="grid gap-3 rounded-3xl border border-border/70 bg-card/70 p-4 md:grid-cols-3">
      <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
        Sort by
        <select
          className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
          value={filters.sort}
          onChange={(event) => update({ sort: event.target.value })}
        >
          {sorts.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
        Filter tags
        <select
          className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
          value={filters.tag}
          onChange={(event) => update({ tag: event.target.value })}
        >
          <option value="">All</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {tag.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
        Author
        <select
          className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
          value={filters.author}
          onChange={(event) => update({ author: event.target.value })}
        >
          <option value="">All</option>
          {authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
