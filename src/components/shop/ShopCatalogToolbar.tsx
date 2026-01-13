"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Input, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PRODUCT_SORT_OPTIONS } from "@/lib/bigcommerce/sort";
import type { ProductSortKey } from "@/lib/bigcommerce/types";
import { buildShopQueryString, getSortLabel, type ShopQueryFilters } from "./shopQuery";

type CategoryChip = Readonly<{
  name: string;
  href: string;
}>;

type ShopCatalogToolbarProps = Readonly<{
  basePath: string;
  total: number;
  pageCount: number;
  isFirstPage?: boolean;
  filters: ShopQueryFilters;
  categoryChip?: CategoryChip;
  clearAllHref: string;
  drawerTitle?: string;
  drawerContent?: ReactNode;
}>;

type FilterChip = Readonly<{
  key: string;
  label: string;
  href: string;
}>;

const SORT_DEFAULT: ProductSortKey = "RELEVANCE";

const toBoolean = (value: unknown) => value === "true" || value === "1" || value === true;

export function ShopCatalogToolbar({
  basePath,
  total,
  pageCount,
  isFirstPage = true,
  filters,
  categoryChip,
  clearAllHref,
  drawerTitle = "Filters",
  drawerContent,
}: ShopCatalogToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [drawerOpenLocationKey, setDrawerOpenLocationKey] = useState<string | null>(null);

  const hasDrawer = Boolean(drawerContent);
  const resolvedSort = filters.sort ?? SORT_DEFAULT;
  const formKey = `${filters.searchTerm ?? ""}|${filters.sort ?? ""}|${filters.minPrice ?? ""}|${filters.maxPrice ?? ""}|${filters.inStock ? "1" : "0"}`;
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const drawerOpen = drawerOpenLocationKey === locationKey;

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      setDrawerOpenLocationKey(open ? locationKey : null);
    },
    [locationKey],
  );

  const hiddenInputs = useMemo(() => {
    const inputs: Array<{ name: string; value: string }> = [];
    if (filters.minPrice?.trim()) inputs.push({ name: "minPrice", value: filters.minPrice.trim() });
    if (filters.maxPrice?.trim()) inputs.push({ name: "maxPrice", value: filters.maxPrice.trim() });
    if (filters.inStock) inputs.push({ name: "inStock", value: "true" });
    return inputs;
  }, [filters.inStock, filters.maxPrice, filters.minPrice]);

  const chips: FilterChip[] = useMemo(() => {
    const chipList: FilterChip[] = [];

    if (categoryChip) {
      chipList.push({ key: "category", label: categoryChip.name, href: categoryChip.href });
    }

    if (filters.searchTerm?.trim()) {
      chipList.push({
        key: "search",
        label: `Search: ${filters.searchTerm.trim()}`,
        href: `${basePath}${buildShopQueryString({ ...filters, searchTerm: undefined })}`,
      });
    }

    if (filters.minPrice?.trim() || filters.maxPrice?.trim()) {
      const min = filters.minPrice?.trim() || "0";
      const max = filters.maxPrice?.trim() || "∞";
      chipList.push({
        key: "price",
        label: `Price: ${min}–${max}`,
        href: `${basePath}${buildShopQueryString({ ...filters, minPrice: undefined, maxPrice: undefined })}`,
      });
    }

    if (filters.inStock) {
      chipList.push({
        key: "inStock",
        label: "In stock",
        href: `${basePath}${buildShopQueryString({ ...filters, inStock: undefined })}`,
      });
    }

    if (filters.sort && filters.sort !== SORT_DEFAULT) {
      chipList.push({
        key: "sort",
        label: `Sort: ${getSortLabel(filters.sort) ?? filters.sort}`,
        href: `${basePath}${buildShopQueryString({ ...filters, sort: undefined })}`,
      });
    }

    return chipList;
  }, [basePath, categoryChip, filters]);

  const hasActiveFilters = chips.length > 0;
  const resultsLabel = new Intl.NumberFormat("en-US").format(total);
  const resultsUnit = total === 1 ? "result" : "results";
  const visibleTo = Math.min(total, Math.max(0, pageCount));
  const resultsSummary =
    total > 0 && isFirstPage
      ? `Showing 1–${visibleTo} of ${resultsLabel} ${resultsUnit}`
      : `${resultsLabel} ${resultsUnit}`;

  const submitForm = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const searchTerm = (formData.get("search") as string | null)?.trim() ?? "";
      const sort = (formData.get("sort") as string | null) ?? "";
      const minPrice = (formData.get("minPrice") as string | null)?.trim() ?? "";
      const maxPrice = (formData.get("maxPrice") as string | null)?.trim() ?? "";
      const inStock = toBoolean(formData.get("inStock"));

      const nextFilters: ShopQueryFilters = {
        searchTerm: searchTerm || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        inStock: inStock || undefined,
        sort: sort && sort !== SORT_DEFAULT ? (sort as ProductSortKey) : undefined,
      };

      const query = buildShopQueryString(nextFilters);
      router.push(`${basePath}${query}`);

      if (drawerOpen) {
        setDrawerOpenLocationKey(null);
      }
    },
    [basePath, drawerOpen, router],
  );

  return (
    <div className="sticky top-[calc(var(--site-header-offset-md)+12px)] z-30 -mx-3 rounded-2xl border border-border/70 bg-canvas/85 px-3 py-3 shadow-soft backdrop-blur-md sm:top-[calc(var(--site-header-offset-lg)+12px)] sm:-mx-4 sm:px-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(420px,720px)] sm:items-center">
        <Text size="label-tight" muted>
          {resultsSummary}
        </Text>

        <form
          key={formKey}
          ref={formRef}
          method="get"
          action={basePath}
          onSubmit={handleSubmit}
          className="grid w-full grid-cols-[minmax(0,1fr)_10.5rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
        >
          {hiddenInputs.map((input) => (
            <input key={input.name} type="hidden" name={input.name} value={input.value} />
          ))}

          <label className="relative w-full sm:max-w-none">
            <span className="sr-only">Search</span>
            <Input
              name="search"
              defaultValue={filters.searchTerm}
              placeholder="Search the catalog"
              className="pr-10"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted transition hover:text-ink focus-ring"
              aria-label="Search"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </label>

          <label className="w-full">
            <span className="sr-only">Sort</span>
            <select
              name="sort"
              defaultValue={resolvedSort}
              onChange={submitForm}
              className="w-full rounded-xl border border-border/70 bg-card/80 px-3 py-2 type-body-sm text-ink shadow-soft outline-none backdrop-blur-sm focus:border-ink/40 focus-ring"
            >
              {PRODUCT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {hasDrawer ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="col-span-2 lg:hidden sm:col-span-1"
              onClick={() => setDrawerOpenLocationKey(locationKey)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {drawerTitle}
            </Button>
          ) : null}
        </form>
      </div>

      {hasActiveFilters ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              prefetch={false}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 type-body-sm text-ink shadow-soft transition-colors",
                "hover:border-ink/20 hover:bg-card/90",
                "focus-ring",
              )}
            >
              <span className="text-pretty">{chip.label}</span>
              <X className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
            </Link>
          ))}

          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href={clearAllHref} prefetch={false}>
              Clear all
            </Link>
          </Button>
        </div>
      ) : null}

      {hasDrawer ? (
        <Drawer open={drawerOpen} onOpenChange={handleDrawerOpenChange} title={drawerTitle}>
          {drawerContent}
        </Drawer>
      ) : null}
    </div>
  );
}

function Drawer({
  open,
  onOpenChange,
  title,
  children,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-60 flex w-full max-w-[420px] flex-col border-l border-border/70 bg-card/95 shadow-elevated outline-none data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 transition-transform duration-200">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <Text size="label-tight" className="text-ink">
              {title}
            </Text>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-xl border border-border/70 bg-card/60 px-3 py-2 type-button text-ink shadow-soft transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
