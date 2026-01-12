import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { FiltersPanel, type CategoryOption } from "@/components/shop/FiltersPanel";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Text } from "@/components/ui";
import { getCategoryTree, searchProducts } from "@/lib/bigcommerce";
import { PRODUCT_SORT_KEYS } from "@/lib/bigcommerce/sort";
import type { Category, ProductSearchFilters, ProductSortKey } from "@/lib/bigcommerce/types";

type CategoryPageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categories = await getCategoryTree();
  const category = findCategoryBySlug(categories, params.slug);

  if (!category) {
    return { title: "Shop | Perazzi" };
  }

  return {
    title: `${category.name} | Perazzi Shop`,
    description: `Browse ${category.name} products in the Perazzi catalog.`,
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

const findCategoryBySlug = (
  categories: Category[],
  slug: string,
): Category | null => {
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }
    if (category.children?.length) {
      const match = findCategoryBySlug(category.children, slug);
      if (match) {
        return match;
      }
    }
  }
  return null;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const categoryTree = await getCategoryTree();
  const category = findCategoryBySlug(categoryTree, params.slug);

  if (!category) {
    notFound();
  }

  const paramsValue = searchParams ?? {};
  const minPriceValue = getParam(paramsValue.minPrice)?.trim() ?? "";
  const maxPriceValue = getParam(paramsValue.maxPrice)?.trim() ?? "";
  const inStockValue = getParam(paramsValue.inStock);
  const inStock = inStockValue === "true" || inStockValue === "1";
  const sort = parseSort(getParam(paramsValue.sort));

  const searchFilters: ProductSearchFilters = {
    categoryEntityId: category.id,
    minPrice: parseNumber(minPriceValue),
    maxPrice: parseNumber(maxPriceValue),
    inStock: inStock || undefined,
    sort,
  };

  const searchResult = await searchProducts(searchFilters);
  const flattenedCategories = flattenCategories(categoryTree);
  const totalLabel = new Intl.NumberFormat("en-US").format(searchResult.total);

  return (
    <div className="space-y-8">
      <PageHeading
        title={category.name}
        kicker="Shop category"
        description={`Browse ${category.name} and refine by price or availability.`}
      />

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <FiltersPanel
          categories={flattenedCategories}
          selectedCategorySlug={category.slug}
          basePath={`/shop/category/${category.slug}`}
          showSearch={false}
          filters={{
            minPrice: minPriceValue,
            maxPrice: maxPriceValue,
            inStock,
            sort,
          }}
        />

        <div className="space-y-5">
          <Text size="label-tight" muted>
            {totalLabel} {searchResult.total === 1 ? "result" : "results"}
          </Text>
          <ProductGrid products={searchResult.items} />
        </div>
      </div>
    </div>
  );
}
