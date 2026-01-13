"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Category, ProductSortKey } from "@/lib/bigcommerce/types";
import { PriceRangeInputs } from "./PriceRangeInputs";
import { buildShopQueryString, type ShopQueryFilters } from "./shopQuery";

type FiltersPanelProps = Readonly<{
  categories: readonly Category[];
  selectedCategorySlug?: string;
  basePath: string;
  filters: ShopQueryFilters;
  variant?: "sidebar" | "drawer";
}>;

const depthClasses = ["pl-0", "pl-3", "pl-6", "pl-9", "pl-12"] as const;

const shouldOpenGroup = (category: Category, slug?: string): boolean => {
  if (!slug) {
    return false;
  }
  if (category.slug === slug) {
    return true;
  }
  return category.children.some((child) => shouldOpenGroup(child, slug));
};

const coerceSort = (sort?: ShopQueryFilters["sort"]): ProductSortKey | undefined => sort;

export function FiltersPanel({
  categories,
  selectedCategorySlug,
  basePath,
  filters,
  variant = "sidebar",
}: FiltersPanelProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const isAllSelected = selectedCategorySlug === undefined || selectedCategorySlug === "";
  const sort = coerceSort(filters.sort);

  const query = useMemo(
    () =>
      buildShopQueryString({
        searchTerm: filters.searchTerm,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock,
        sort,
      }),
    [filters.inStock, filters.maxPrice, filters.minPrice, filters.searchTerm, sort],
  );

  const allProductsHref = `/shop${query}`;

  const submitFilters = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const wrapperClassName =
    variant === "drawer"
      ? "space-y-6"
      : "space-y-6 rounded-3xl border border-border/70 bg-card/70 p-5 shadow-soft lg:sticky lg:top-[calc(var(--site-header-offset-lg)+16px)] lg:self-start";

  const linkBase =
    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 type-body-sm transition-colors focus-ring";
  const selectedLink =
    "border border-perazzi-red/30 bg-perazzi-red/10 text-perazzi-red shadow-soft";
  const idleLink =
    "border border-transparent text-ink-muted hover:border-border/70 hover:bg-card/90 hover:text-ink";

  return (
    <aside className={wrapperClassName}>
      <div className="space-y-3">
        <Text size="label-tight" muted>
          Categories
        </Text>

        <nav className="space-y-1">
          <Link
            href={allProductsHref}
            prefetch={false}
            className={cn(linkBase, isAllSelected ? selectedLink : idleLink)}
          >
            <span>All products</span>
          </Link>

          {categories
            .filter((category) => Boolean(category.slug))
            .map((category) => {
              const hasChildren = category.children.some((child) => Boolean(child.slug));
              const openByDefault = hasChildren && shouldOpenGroup(category, selectedCategorySlug);
              const href = `/shop/category/${category.slug}${query}`;
              const selected = category.slug === selectedCategorySlug;

              return (
                <Collapsible key={category.id} defaultOpen={openByDefault}>
                  <div className="flex items-center gap-2">
                    <Link
                      href={href}
                      prefetch={false}
                      className={cn(linkBase, "flex-1", selected ? selectedLink : idleLink)}
                    >
                      <span>{category.name}</span>
                    </Link>
                    {hasChildren ? (
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-ink-muted transition-colors duration-200 data-[state=open]:rotate-180",
                            "hover:border-border/70 hover:bg-card/90 hover:text-ink focus-ring",
                          )}
                          aria-label={`Toggle ${category.name} categories`}
                        >
                          <ChevronDown className="h-4 w-4 transition-transform" aria-hidden="true" />
                        </button>
                      </CollapsibleTrigger>
                    ) : null}
                  </div>

                  {hasChildren ? (
                    <CollapsibleContent className="pl-3">
                      <div className="mt-1 space-y-1 border-l border-border/70 pl-3">
                        <CategoryChildren
                          categories={category.children}
                          selectedCategorySlug={selectedCategorySlug}
                          query={query}
                          linkBase={linkBase}
                          selectedLink={selectedLink}
                          idleLink={idleLink}
                          depth={1}
                        />
                      </div>
                    </CollapsibleContent>
                  ) : null}
                </Collapsible>
              );
            })}
        </nav>
      </div>

      <div className="space-y-3">
        <Text size="label-tight" muted>
          Filters
        </Text>

        <form ref={formRef} method="get" action={basePath} className="space-y-4">
          {filters.searchTerm?.trim() ? (
            <input type="hidden" name="search" value={filters.searchTerm.trim()} />
          ) : null}
          {sort ? <input type="hidden" name="sort" value={sort} /> : null}

          <PriceRangeInputs minValue={filters.minPrice} maxValue={filters.maxPrice} />

          <label className="flex items-center gap-2 text-ink type-label-tight">
            <input
              type="checkbox"
              name="inStock"
              value="true"
              defaultChecked={filters.inStock}
              onChange={submitFilters}
              className="h-4 w-4 rounded border border-border/70 text-perazzi-red focus-ring"
            />
            <span>In stock only</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              Apply
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={basePath} prefetch={false}>
                Reset
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </aside>
  );
}

type CategoryChildrenProps = Readonly<{
  categories: readonly Category[];
  selectedCategorySlug?: string;
  query: string;
  linkBase: string;
  selectedLink: string;
  idleLink: string;
  depth: number;
}>;

function CategoryChildren({
  categories,
  selectedCategorySlug,
  query,
  linkBase,
  selectedLink,
  idleLink,
  depth,
}: CategoryChildrenProps) {
  return (
    <>
      {categories
        .filter((category) => Boolean(category.slug))
        .map((category) => {
          const selected = category.slug === selectedCategorySlug;
          const href = `/shop/category/${category.slug}${query}`;
          const depthClass = depthClasses[Math.min(depth, depthClasses.length - 1)];
          const hasVisibleChildren = category.children.some((child) => Boolean(child.slug));

          return (
            <div key={category.id} className={depthClass}>
              <Link
                href={href}
                prefetch={false}
                className={cn(linkBase, selected ? selectedLink : idleLink)}
              >
                <span>{category.name}</span>
              </Link>
              {hasVisibleChildren ? (
                <div className="mt-1 space-y-1 border-l border-border/70 pl-3">
                  <CategoryChildren
                    categories={category.children}
                    selectedCategorySlug={selectedCategorySlug}
                    query={query}
                    linkBase={linkBase}
                    selectedLink={selectedLink}
                    idleLink={idleLink}
                    depth={depth + 1}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
    </>
  );
}
