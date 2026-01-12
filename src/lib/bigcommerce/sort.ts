import type { ProductSortKey } from "./types";

type SortOption = {
  value: ProductSortKey;
  label: string;
};

export const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { value: "RELEVANCE", label: "Relevance" },
  { value: "BEST_SELLING", label: "Best selling" },
  { value: "NEWEST", label: "Newest" },
  { value: "HIGHEST_PRICE", label: "Highest price" },
  { value: "LOWEST_PRICE", label: "Lowest price" },
  { value: "A_TO_Z", label: "Name A-Z" },
  { value: "Z_TO_A", label: "Name Z-A" },
];

export const PRODUCT_SORT_KEYS = new Set(
  PRODUCT_SORT_OPTIONS.map((option) => option.value),
);
