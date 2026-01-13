import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiltersPanel } from "@/components/shop/FiltersPanel";
import { ShopCatalogToolbar } from "@/components/shop/ShopCatalogToolbar";
import { ShopCatalogField } from "@/components/shop/ShopCatalogField";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopConciergePanel } from "@/components/shop/ShopConciergePanel";
import { ShopHero } from "@/components/shop/ShopHero";
import { Button } from "@/components/ui";
import listPageStrip from "@/../docs/BIGCOMMERCE/Background-Images/list-page-cinestrip.jpg";
import conciergeStrip from "@/../docs/BIGCOMMERCE/Background-Images/concierge-image.jpg";
import { shopHero } from "@/content/shop/hero";
import { getCategoryTree, searchProducts } from "@/lib/bigcommerce";
import { PRODUCT_SORT_KEYS } from "@/lib/bigcommerce/sort";
import type { Category, ProductSearchFilters, ProductSortKey } from "@/lib/bigcommerce/types";
import { buildShopQueryString } from "@/components/shop/shopQuery";

type AsyncProp<T> = T | Promise<T>;

type CategoryPageProps = {
  params: AsyncProp<{ slug: string }>;
  searchParams?: AsyncProp<Record<string, string | string[] | undefined>>;
};

const SHOP_PAGE_SIZE = 24;

const CONCIERGE_STRIP_CATEGORY_SLUGS = new Set([
  "parts",
  "platform",
  "mx-ht",
  "12-ga",
  "20-ga",
  "28-ga",
  "410-ga",
  "tm",
  "trigger-type",
  "non-removable",
  "removable",
]);

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const categories = await getCategoryTree();
  const category = findCategoryBySlug(categories, resolvedParams.slug);

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
  const resolvedParams = await params;
  const paramsValue = (await searchParams) ?? {};
  const categoryTree = await getCategoryTree();
  const category = findCategoryBySlug(categoryTree, resolvedParams.slug);

  if (!category) {
    notFound();
  }

  const showConciergeStrip = CONCIERGE_STRIP_CATEGORY_SLUGS.has(category.slug);

  const searchTerm = getParam(paramsValue.search)?.trim() ?? "";
  const minPriceValue = getParam(paramsValue.minPrice)?.trim() ?? "";
  const maxPriceValue = getParam(paramsValue.maxPrice)?.trim() ?? "";
  const inStockValue = getParam(paramsValue.inStock);
  const inStock = inStockValue === "true" || inStockValue === "1";
  const sort = parseSort(getParam(paramsValue.sort));
  const after = getParam(paramsValue.after)?.trim() || undefined;

  const searchFilters: ProductSearchFilters = {
    categoryEntityId: category.id,
    searchTerm: searchTerm || undefined,
    minPrice: parseNumber(minPriceValue),
    maxPrice: parseNumber(maxPriceValue),
    inStock: inStock || undefined,
    sort,
    after,
    limit: SHOP_PAGE_SIZE,
  };

  const searchResult = await searchProducts(searchFilters);
  const pageInfo = searchResult.pageInfo;
  const nextCursor =
    pageInfo?.hasNextPage && pageInfo.endCursor ? pageInfo.endCursor : undefined;
  const nextHref = nextCursor
    ? `/shop/category/${category.slug}${buildShopQueryString(
        {
          searchTerm,
          minPrice: minPriceValue,
          maxPrice: maxPriceValue,
          inStock,
          sort,
          after: nextCursor,
        },
        { includeAfter: true },
      )}`
    : null;

  const categoryHero = {
    ...shopHero,
    eyebrow: "Shop category",
    title: category.name,
    subtitle: `Browse ${category.name} with concierge guidance on fit, availability, and delivery windows.`,
    secondaryCta: { label: "All products", href: "/shop" },
  };

  return (
    <div className="space-y-0">
      <ShopHero
        hero={categoryHero}
        cartHref="/shop/cart"
        conciergeHref={showConciergeStrip ? "#parts-concierge" : undefined}
      />

      {showConciergeStrip ? (
        <ShopCatalogField
          id="parts-concierge"
          backgroundSrc={conciergeStrip.src}
          backgroundAlt="Concierge workshop bench in warm light"
          className="py-8 sm:py-10"
          panelClassName="p-6 sm:p-7"
        >
          <ShopConciergePanel
            eyebrow={shopHero.conciergePanel.eyebrow}
            heading={shopHero.conciergePanel.heading}
            body={shopHero.conciergePanel.body}
            steps={shopHero.conciergePanel.steps}
            primaryCta={shopHero.conciergePanel.primaryCta}
            secondaryCta={shopHero.conciergePanel.secondaryCta}
            variant="strip"
            primaryCtaBehavior="chat"
          />
        </ShopCatalogField>
      ) : null}

      <ShopCatalogField
        id="shop-catalog"
        backgroundSrc={listPageStrip.src}
        backgroundAlt="Cinematic detail of Perazzi craftsmanship in low light"
      >
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <FiltersPanel
              categories={categoryTree}
              selectedCategorySlug={category.slug}
              basePath={`/shop/category/${category.slug}`}
              variant="sidebar"
              filters={{
                searchTerm,
                minPrice: minPriceValue,
                maxPrice: maxPriceValue,
                inStock,
                sort,
              }}
            />
          </div>

          <div className="space-y-5">
            <ShopCatalogToolbar
              basePath={`/shop/category/${category.slug}`}
              total={searchResult.total}
              pageCount={searchResult.items.length}
              isFirstPage={!after}
              filters={{
                searchTerm,
                minPrice: minPriceValue,
                maxPrice: maxPriceValue,
                inStock,
                sort,
              }}
              clearAllHref={`/shop/category/${category.slug}`}
              drawerTitle="Filters"
              drawerContent={
                <FiltersPanel
                  categories={categoryTree}
                  selectedCategorySlug={category.slug}
                  basePath={`/shop/category/${category.slug}`}
                  variant="drawer"
                  filters={{
                    searchTerm,
                    minPrice: minPriceValue,
                    maxPrice: maxPriceValue,
                    inStock,
                    sort,
                  }}
                />
              }
            />
            <ProductGrid
              products={searchResult.items}
              showQuickView
              resetHref={`/shop/category/${category.slug}`}
            />
            {nextHref ? (
              <div className="flex justify-center pt-2">
                <Button asChild variant="secondary" size="md">
                  <Link href={nextHref} prefetch={false}>
                    Load more
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </ShopCatalogField>
    </div>
  );
}
