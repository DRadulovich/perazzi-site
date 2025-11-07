"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { JournalCategoryData } from "@/types/journal";

type ArticleGridProps = {
  items: JournalCategoryData["items"];
  pagination: JournalCategoryData["pagination"];
  onPageChange?: (page: number) => void;
};

export function ArticleGrid({ items, pagination, onPageChange }: ArticleGridProps) {
  const pages = useMemo(() => Array.from({ length: pagination.pageCount }, (_, i) => i + 1), [pagination.pageCount]);

  return (
    <div className="space-y-6" aria-live="polite">
      <p className="text-xs text-ink-muted">Showing {items.length} stories</p>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.slug} className="rounded-3xl border border-border/70 bg-card">
            <Link
              href={`/journal/${item.slug}`}
              className="flex h-full flex-col focus-ring"
              onClick={() => console.log(`ArticleImpression:${item.slug}`)}
            >
              <div className="relative" style={{ aspectRatio: item.hero.aspectRatio ?? 16 / 9 }}>
                <Image
                  src={item.hero.url}
                  alt={item.hero.alt}
                  fill
                  sizes="(min-width: 1024px) 500px, 100vw"
                  className="rounded-t-3xl object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-2 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {item.author} · {new Date(item.dateISO).toLocaleDateString()} · {item.readingTimeMins} min
                </p>
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                {item.excerptHtml ? (
                  <div
                    className="prose prose-sm text-ink-muted"
                    dangerouslySetInnerHTML={{ __html: item.excerptHtml }}
                  />
                ) : null}
              </div>
            </Link>
          </article>
        ))}
      </div>
      <nav aria-label="Pagination" className="flex flex-wrap gap-2">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`rounded-full border px-3 py-1 text-sm focus-ring ${
              page === pagination.page ? "border-perazzi-red text-perazzi-red" : "border-border text-ink"
            }`}
            onClick={() => onPageChange?.(page)}
          >
            {page}
          </button>
        ))}
      </nav>
    </div>
  );
}
