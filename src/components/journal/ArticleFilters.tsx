"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TagRef } from "@/types/journal";
import type { JournalFilterState } from "@/lib/journal/filters";
import { JOURNAL_SORTS } from "@/lib/journal/filters";
import { logAnalytics } from "@/lib/analytics";

type ArticleFiltersProps = {
  tags: TagRef[];
  authors: string[];
  value: JournalFilterState;
  basePath: string;
  categoryKey: string;
};

export function ArticleFilters({
  tags,
  authors,
  value,
  basePath,
  categoryKey,
}: ArticleFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const update = (next: Partial<JournalFilterState>) => {
    const merged: JournalFilterState = {
      sort: next.sort ?? value.sort,
      tag: next.tag ?? value.tag,
      author: next.author ?? value.author,
    };
    const params = new URLSearchParams();
    if (merged.sort !== "latest") params.set("sort", merged.sort);
    if (merged.tag) params.set("tag", merged.tag);
    if (merged.author) params.set("author", merged.author);

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    });
    logAnalytics(`FilterChanged:${categoryKey}`);
  };

  return (
    <section
      aria-label="Filters"
      aria-busy={isPending}
      className="grid gap-3 rounded-3xl border border-border/70 bg-card/70 p-4 md:grid-cols-3"
    >
      <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
        Sort by
        <select
          className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
          value={value.sort}
          onChange={(event) => update({ sort: event.target.value as JournalFilterState["sort"] })}
        >
          {JOURNAL_SORTS.map((sort) => (
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
          value={value.tag}
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
          value={value.author}
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
