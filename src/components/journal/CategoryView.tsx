"use client";

import { useMemo, useState } from "react";
import type { JournalCategoryData } from "@/types/journal";
import { ArticleFilters } from "./ArticleFilters";
import { ArticleGrid } from "./ArticleGrid";

const PAGE_SIZE = 4;

type CategoryViewProps = {
  data: JournalCategoryData;
  categoryKey: string;
};

export function CategoryView({ data, categoryKey }: CategoryViewProps) {
  const [filters, setFilters] = useState({ sort: "latest", tag: "", author: "" });
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    let items = data.items;
    if (filters.tag) {
      items = items.filter((item) => item.tags?.some((tag) => tag.slug === filters.tag));
    }
    if (filters.author) {
      items = items.filter((item) => item.author === filters.author);
    }
    items = [...items].sort((a, b) => {
      if (filters.sort === "reading") {
        return a.readingTimeMins - b.readingTimeMins;
      }
      return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime();
    });
    return items;
  }, [data.items, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8">
      <ArticleFilters
        tags={data.filters.tags}
        authors={data.filters.authors}
        onChange={(next) => {
          console.log(`FilterChanged:${categoryKey}`, next);
          setFilters(next as typeof filters);
          setPage(1);
        }}
      />
      <ArticleGrid
        items={pagedItems}
        pagination={{ page, pageCount: totalPages }}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          console.log(`CategoryTabClick:${categoryKey}-page-${nextPage}`);
        }}
      />
    </div>
  );
}
