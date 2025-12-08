import type { CategoryKey, JournalCategoryData } from "@/types/journal";
import { CategoryHeader } from "./CategoryHeader";
import { ArticleFilters } from "./ArticleFilters";
import { ArticleGrid } from "./ArticleGrid";
import { parseCategorySearchParams } from "@/lib/journal/search-params";
import {
  applyCategoryFilters,
  paginateCategoryItems,
  sanitizeCategoryFilters,
} from "@/lib/journal/category";

type CategoryPageLayoutProps = Readonly<{
  data: JournalCategoryData;
  categoryKey: CategoryKey;
  basePath: string;
  searchParams?: Record<string, string | string[] | undefined>;
}>;

export function CategoryPageLayout({
  data,
  categoryKey,
  basePath,
  searchParams,
}: CategoryPageLayoutProps) {
  const { filters: rawFilters, page } = parseCategorySearchParams(searchParams);
  const filters = sanitizeCategoryFilters(data, rawFilters);
  const filteredItems = applyCategoryFilters(data.items, filters);
  const {
    pageItems,
    pageCount,
    safePage,
    startIndex,
    endIndex,
    totalItems,
  } = paginateCategoryItems(filteredItems, page);

  return (
    <div className="space-y-10">
      <CategoryHeader header={data.header} />
      <div className="space-y-8">
        <ArticleFilters
          tags={data.filters.tags}
          authors={data.filters.authors}
          value={filters}
          basePath={basePath}
          categoryKey={categoryKey}
        />
        <ArticleGrid
          items={pageItems}
          pagination={{ page: safePage, pageCount }}
          totalItems={totalItems}
          basePath={basePath}
          filters={filters}
          categoryKey={categoryKey}
          pageStart={startIndex}
          pageEnd={endIndex}
        />
      </div>
    </div>
  );
}
