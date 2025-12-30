"use client";

import { useEffect, useMemo } from "react";
import SafeHtml from "@/components/SafeHtml";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JournalCategoryData } from "@/types/journal";
import type { JournalFilterState } from "@/lib/journal/filters";
import { logAnalytics } from "@/lib/analytics";
import { Heading, Text } from "@/components/ui";

type ArticleGridProps = {
  readonly items: JournalCategoryData["items"];
  readonly pagination: Readonly<{ page: number; pageCount: number }>;
  readonly totalItems: number;
  readonly basePath: string;
  readonly filters: Readonly<JournalFilterState>;
  readonly categoryKey: string;
  readonly pageStart: number;
  readonly pageEnd: number;
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
      <div aria-live="polite" className="type-caption text-ink-muted">
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
                className="card-media relative aspect-dynamic"
                style={{ "--aspect-ratio": item.hero.aspectRatio ?? 16 / 9 }}
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
                <Text size="caption" muted>
                  {item.author} · {new Date(item.dateISO).toLocaleDateString()} · {item.readingTimeMins} min
                </Text>
                <Heading level={3} size="md" className="text-ink">
                  {item.title}
                </Heading>
                {item.excerptHtml ? (
                  <SafeHtml
                    className="prose prose-sm text-ink-muted"
                    html={item.excerptHtml}
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
              className={`rounded-full border px-3 py-1 type-body-sm focus-ring ${
                page === pagination.page ? "border-perazzi-red text-perazzi-red" : "border-border text-ink"
              }`}
              aria-current={page === pagination.page ? "page" : undefined}
              onClick={() => { handlePageChange(page); }}
            >
              {page}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
