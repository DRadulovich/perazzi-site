"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JournalCategoryData } from "@/types/journal";
import type { JournalFilterState } from "@/lib/journal/filters";
import { logAnalytics } from "@/lib/analytics";

type ArticleGridProps = {
  items: JournalCategoryData["items"];
  pagination: { page: number; pageCount: number };
  totalItems: number;
  basePath: string;
  filters: JournalFilterState;
  categoryKey: string;
  pageStart: number;
  pageEnd: number;
};

const buildQuery = (filters: JournalFilterState, page: number) => {
  const params = new URLSearchParams();
  if (filters.sort !== "latest") params.set("sort", filters.sort);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.author) params.set("author", filters.author);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
};

export function ArticleGrid({
  items,
  pagination,
  totalItems,
  basePath,
  filters,
  categoryKey,
  pageStart,
  pageEnd,
}: ArticleGridProps) {
  const router = useRouter();
  const pages = useMemo(
    () => Array.from({ length: pagination.pageCount }, (_, i) => i + 1),
    [pagination.pageCount],
  );

  useEffect(() => {
    if (pagination.page < pagination.pageCount) {
      const nextQuery = buildQuery(filters, pagination.page + 1);
      router.prefetch(`${basePath}${nextQuery}`);
    }
  }, [router, basePath, filters, pagination.page, pagination.pageCount]);

  const handlePageChange = (page: number) => {
    const query = buildQuery(filters, page);
    router.push(`${basePath}${query}`, { scroll: false });
    logAnalytics(`CategoryTabClick:${categoryKey}-page-${page}`);
  };

  return (
    <div className="space-y-6">
      <div aria-live="polite" className="text-xs text-ink-muted">
        {totalItems === 0
          ? "No stories match the current filters."
          : `Showing ${pageStart}-${pageEnd} of ${totalItems} stories`}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.slug} className="rounded-3xl border border-border/70 bg-card">
            <Link
              href={`/journal/${item.slug}`}
              className="flex h-full flex-col rounded-3xl focus-ring"
              onClick={() => logAnalytics(`ArticleImpression:${item.slug}`)}
            >
              <div
                className="card-media relative"
                style={{ aspectRatio: item.hero.aspectRatio ?? 16 / 9 }}
              >
                <Image
                  src={item.hero.url}
                  alt={item.hero.alt}
                  fill
                  sizes="(min-width: 1024px) 500px, 100vw"
                  className="object-cover"
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
      {pagination.pageCount > 1 ? (
        <nav aria-label="Pagination" className="flex flex-wrap gap-2">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={`rounded-full border px-3 py-1 text-sm focus-ring ${
                page === pagination.page ? "border-perazzi-red text-perazzi-red" : "border-border text-ink"
              }`}
              aria-current={page === pagination.page ? "page" : undefined}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
