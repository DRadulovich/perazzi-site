import type { JournalCategoryData } from "@/types/journal";
import type { JournalFilterState } from "./filters";
import { JOURNAL_CATEGORY_PAGE_SIZE } from "./filters";

export const sanitizeCategoryFilters = (
  data: JournalCategoryData,
  filters: JournalFilterState,
): JournalFilterState => {
  const validTags = new Set(data.filters.tags.map((tag) => tag.slug));
  const validAuthors = new Set(data.filters.authors);

  return {
    sort: filters.sort,
    tag: filters.tag && validTags.has(filters.tag) ? filters.tag : "",
    author: filters.author && validAuthors.has(filters.author) ? filters.author : "",
  };
};

export const applyCategoryFilters = (
  items: JournalCategoryData["items"],
  filters: JournalFilterState,
) => {
  const tagged = filters.tag
    ? items.filter((item) => item.tags?.some((tag) => tag.slug === filters.tag))
    : items;
  const authored = filters.author
    ? tagged.filter((item) => item.author === filters.author)
    : tagged;

  const sorted = [...authored].sort((a, b) => {
    if (filters.sort === "reading") {
      return a.readingTimeMins - b.readingTimeMins;
    }
    return (
      new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
    );
  });

  return sorted;
};

export const paginateCategoryItems = <T,>(
  items: T[],
  page: number,
  pageSize = JOURNAL_CATEGORY_PAGE_SIZE,
) => {
  const totalItems = items.length;
  const rawPageCount = Math.ceil(totalItems / pageSize);
  const pageCount = Math.max(1, rawPageCount);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const sliceStart = (safePage - 1) * pageSize;
  const pageItems = items.slice(sliceStart, sliceStart + pageSize);

  const startIndex =
    totalItems === 0 ? 0 : sliceStart + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(totalItems, sliceStart + pageSize);

  return {
    pageItems,
    pageCount,
    safePage,
    startIndex,
    endIndex,
    totalItems,
  };
};
