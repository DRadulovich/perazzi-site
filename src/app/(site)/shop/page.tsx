import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { FiltersPanel, type CategoryOption } from "@/components/shop/FiltersPanel";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Button, Text } from "@/components/ui";
import { getCategoryTree, searchProducts } from "@/lib/bigcommerce";
import { PRODUCT_SORT_KEYS } from "@/lib/bigcommerce/sort";
import type { Category, ProductSearchFilters, ProductSortKey } from "@/lib/bigcommerce/types";

type ShopPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shop | Perazzi",
    description: "Explore the Perazzi catalog and filter by category, price, and availability.",
  };
}

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const parseNumber = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSort = (value?: string): ProductSortKey | undefined => {
  if (!value) {
    return undefined;
  }
  return PRODUCT_SORT_KEYS.has(value as ProductSortKey)
    ? (value as ProductSortKey)
    : undefined;
};

const flattenCategories = (
  categories: Category[],
  depth = 0,
): CategoryOption[] =>
  categories.flatMap((category) => {
    const entries: CategoryOption[] = [];
    if (category.slug) {
      entries.push({
        id: category.id,
        name: category.name,
        slug: category.slug,
        depth,
      });
    }
    if (category.children?.length) {
      entries.push(...flattenCategories(category.children, depth + 1));
    }
    return entries;
  });

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = searchParams ?? {};
  const searchTerm = getParam(params.search)?.trim() ?? "";
  const minPriceValue = getParam(params.minPrice)?.trim() ?? "";
  const maxPriceValue = getParam(params.maxPrice)?.trim() ?? "";
  const inStockValue = getParam(params.inStock);
  const inStock = inStockValue === "true" || inStockValue === "1";
  const sort = parseSort(getParam(params.sort));

  const searchFilters: ProductSearchFilters = {
    searchTerm: searchTerm || undefined,
    minPrice: parseNumber(minPriceValue),
    maxPrice: parseNumber(maxPriceValue),
    inStock: inStock || undefined,
    sort,
  };

  const [categoryTree, searchResult] = await Promise.all([
    getCategoryTree(),
    searchProducts(searchFilters),
  ]);

  const categories = flattenCategories(categoryTree);
  const totalLabel = new Intl.NumberFormat("en-US").format(searchResult.total);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Shop"
          description="Browse the Perazzi collection and filter by category, price, and availability."
        />
        <Button asChild variant="ghost" size="sm">
          <Link href="/shop/cart" prefetch={false}>
            View cart
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <FiltersPanel
          categories={categories}
          basePath="/shop"
          showSearch
          filters={{
            searchTerm,
            minPrice: minPriceValue,
            maxPrice: maxPriceValue,
            inStock,
            sort,
          }}
        />

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text size="label-tight" muted>
              {totalLabel} {searchResult.total === 1 ? "result" : "results"}
            </Text>
            {searchTerm ? (
              <Text size="label-tight" muted>
                Search: {searchTerm}
              </Text>
            ) : null}
          </div>
          <ProductGrid products={searchResult.items} />
        </div>
      </div>
    </div>
  );
}
