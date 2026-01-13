import { PRODUCT_SORT_OPTIONS } from "@/lib/bigcommerce/sort";
import type { ProductSortKey } from "@/lib/bigcommerce/types";

export type ShopQueryFilters = Readonly<{
  searchTerm?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  sort?: ProductSortKey;
}>;

export const buildShopQueryString = (
  filters: ShopQueryFilters & { after?: string },
  options: { includeAfter?: boolean } = {},
) => {
  const params = new URLSearchParams();

  if (filters.searchTerm?.trim()) {
    params.set("search", filters.searchTerm.trim());
  }
  if (filters.minPrice?.trim()) {
    params.set("minPrice", filters.minPrice.trim());
  }
  if (filters.maxPrice?.trim()) {
    params.set("maxPrice", filters.maxPrice.trim());
  }
  if (filters.inStock) {
    params.set("inStock", "true");
  }
  if (filters.sort) {
    params.set("sort", filters.sort);
  }
  if (options.includeAfter && filters.after) {
    params.set("after", filters.after);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const getSortLabel = (sort?: ProductSortKey) => {
  if (!sort) {
    return undefined;
  }
  return PRODUCT_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? sort;
};

