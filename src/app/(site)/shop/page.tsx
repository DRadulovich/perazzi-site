import type { Metadata } from "next";
import Link from "next/link";
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
import type { ProductSearchFilters, ProductSortKey } from "@/lib/bigcommerce/types";
import { buildShopQueryString } from "@/components/shop/shopQuery";

type AsyncProp<T> = T | Promise<T>;

type ShopPageProps = {
  searchParams?: AsyncProp<Record<string, string | string[] | undefined>>;
};

const SHOP_PAGE_SIZE = 24;

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

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = (await searchParams) ?? {};
  const searchTerm = getParam(params.search)?.trim() ?? "";
  const minPriceValue = getParam(params.minPrice)?.trim() ?? "";
  const maxPriceValue = getParam(params.maxPrice)?.trim() ?? "";
  const inStockValue = getParam(params.inStock);
  const inStock = inStockValue === "true" || inStockValue === "1";
  const sort = parseSort(getParam(params.sort));
  const after = getParam(params.after)?.trim() || undefined;

  const searchFilters: ProductSearchFilters = {
    searchTerm: searchTerm || undefined,
    minPrice: parseNumber(minPriceValue),
    maxPrice: parseNumber(maxPriceValue),
    inStock: inStock || undefined,
    sort,
    after,
    limit: SHOP_PAGE_SIZE,
  };

  const [categoryTree, searchResult] = await Promise.all([
    getCategoryTree(),
    searchProducts(searchFilters),
  ]);

  const pageInfo = searchResult.pageInfo;
  const nextCursor =
    pageInfo?.hasNextPage && pageInfo.endCursor ? pageInfo.endCursor : undefined;
  const nextHref = nextCursor
    ? `/shop${buildShopQueryString(
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

  return (
    <div className="space-y-0">
      <ShopHero hero={shopHero} cartHref="/shop/cart" conciergeHref="#parts-concierge" />

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

      <ShopCatalogField
        id="shop-catalog"
        backgroundSrc={listPageStrip.src}
        backgroundAlt="Cinematic detail of Perazzi craftsmanship in low light"
      >
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <FiltersPanel
              categories={categoryTree}
              basePath="/shop"
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
              basePath="/shop"
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
              clearAllHref="/shop"
              drawerTitle="Filters"
              drawerContent={
                <FiltersPanel
                  categories={categoryTree}
                  basePath="/shop"
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
            <ProductGrid products={searchResult.items} showQuickView />
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
