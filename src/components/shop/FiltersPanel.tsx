import Link from "next/link";
import { Button, Input, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProductSortKey } from "@/lib/bigcommerce/types";
import { PriceRangeInputs } from "./PriceRangeInputs";
import { SortSelect } from "./SortSelect";

export type CategoryOption = Readonly<{
  id: string;
  name: string;
  slug: string;
  depth: number;
}>;

type FiltersPanelProps = Readonly<{
  categories: readonly CategoryOption[];
  selectedCategorySlug?: string;
  basePath: string;
  showSearch?: boolean;
  filters: Readonly<{
    searchTerm?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: boolean;
    sort?: ProductSortKey;
  }>;
}>;

const depthClasses = ["pl-0", "pl-3", "pl-6", "pl-9", "pl-12"] as const;

const buildQueryString = (
  filters: FiltersPanelProps["filters"],
  includeSearch: boolean,
) => {
  const params = new URLSearchParams();
  if (includeSearch && filters.searchTerm?.trim()) {
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

  const query = params.toString();
  return query ? `?${query}` : "";
};

export function FiltersPanel({
  categories,
  selectedCategorySlug,
  basePath,
  showSearch = true,
  filters,
}: FiltersPanelProps) {
  const query = buildQueryString(filters, false);
  const allProductsHref = `/shop${query}`;
  const isAllSelected = selectedCategorySlug === undefined || selectedCategorySlug === "";

  return (
    <aside className="space-y-6 rounded-3xl border border-border/70 bg-card/70 p-5 shadow-soft">
      <div className="space-y-3">
        <Text size="label-tight" muted>
          Categories
        </Text>
        <nav className="space-y-1">
          <Link
            href={allProductsHref}
            prefetch={false}
            className={cn(
              "flex items-center rounded-full px-2 py-1 text-sm transition-colors",
              isAllSelected
                ? "text-perazzi-red"
                : "text-ink-muted hover:text-ink",
            )}
          >
            All products
          </Link>
          {categories.map((category) => {
            const depthClass = depthClasses[Math.min(category.depth, depthClasses.length - 1)];
            const selected = category.slug === selectedCategorySlug;
            const href = `/shop/category/${category.slug}${query}`;

            return (
              <Link
                key={category.id}
                href={href}
                prefetch={false}
                className={cn(
                  "flex items-center rounded-full px-2 py-1 text-sm transition-colors",
                  depthClass,
                  selected ? "text-perazzi-red" : "text-ink-muted hover:text-ink",
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <form method="get" action={basePath} className="space-y-4">
        {showSearch ? (
          <label className="flex flex-col gap-1 text-ink type-label-tight">
            <Text size="label-tight" muted>
              Search
            </Text>
            <Input
              name="search"
              placeholder="Search the catalog"
              defaultValue={filters.searchTerm}
            />
          </label>
        ) : null}

        <PriceRangeInputs
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
        />

        <label className="flex items-center gap-2 text-ink type-label-tight">
          <input
            type="checkbox"
            name="inStock"
            value="true"
            defaultChecked={filters.inStock}
            className="h-4 w-4 rounded border border-border/70 text-perazzi-red focus-ring"
          />
          <span>In stock only</span>
        </label>

        <SortSelect value={filters.sort} />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={basePath} prefetch={false}>
              Reset
            </Link>
          </Button>
        </div>
      </form>
    </aside>
  );
}
