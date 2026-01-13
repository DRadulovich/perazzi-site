"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Input, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProductOption, ProductVariant } from "@/lib/bigcommerce/types";
import { formatMoney } from "@/components/shop/utils";

type PurchaseVariant = Pick<ProductVariant, "id" | "availableForSale" | "price" | "selectedOptions">;
type PurchaseOption = Pick<ProductOption, "id" | "name" | "values">;

type ProductPurchasePanelProps = Readonly<{
  action: (formData: FormData) => void | Promise<void>;
  productId: string;
  basePriceLabel: string;
  variants: readonly PurchaseVariant[];
  options: readonly PurchaseOption[];
  initialVariantId?: string;
  productAvailableForSale: boolean;
  sku?: string;
  viewCartHref?: string;
}>;

type VariantWithMap = PurchaseVariant & {
  optionMap: Record<string, string>;
  optionLabel: string;
};

const getStockLabel = (isOutOfStock: boolean, isUnavailable: boolean) => {
  if (isOutOfStock) {
    return "Out of stock";
  }
  if (isUnavailable) {
    return "Unavailable";
  }
  return "In stock";
};

type VariantSelectionProps = {
  options: readonly PurchaseOption[];
  normalizedVariants: readonly VariantWithMap[];
  selectedVariantId: string;
  getSelectedOptionValue: (name: string) => string;
  handleOptionChange: (optionName: string, optionValue: string) => void;
  isOptionValueAvailable: (optionName: string, optionValue: string) => boolean;
  onVariantChange: (variantId: string) => void;
};

const renderVariantSelection = ({
  options,
  normalizedVariants,
  selectedVariantId,
  getSelectedOptionValue,
  handleOptionChange,
  isOptionValueAvailable,
  onVariantChange,
}: VariantSelectionProps): ReactNode => {
  if (options.length) {
    return (
      <div className="grid gap-3">
        {options
          .filter((option) => option.values.length)
          .map((option) => {
            const current = getSelectedOptionValue(option.name);
            return (
              <label key={option.id} className="flex flex-col gap-1 text-ink type-label-tight">
                <Text size="label-tight" muted>
                  {option.name}
                </Text>
                <select
                  value={current}
                  onChange={(event) => handleOptionChange(option.name, event.target.value)}
                  className="rounded-xl border border-border/70 bg-card/80 px-3 py-2 type-body-sm text-ink shadow-soft outline-none backdrop-blur-sm focus:border-ink/40 focus-ring"
                  aria-label={`Select ${option.name}`}
                >
                  {option.values.map((value) => {
                    const isUnavailable = !isOptionValueAvailable(option.name, value);
                    return (
                      <option key={value} value={value} disabled={isUnavailable}>
                        {value}
                        {isUnavailable ? " (unavailable)" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>
            );
          })}
      </div>
    );
  }

  if (normalizedVariants.length > 1) {
    return (
      <label className="flex flex-col gap-1 text-ink type-label-tight">
        <Text size="label-tight" muted>
          Configuration
        </Text>
        <select
          value={selectedVariantId}
          onChange={(event) => onVariantChange(event.target.value)}
          className="rounded-xl border border-border/70 bg-card/80 px-3 py-2 type-body-sm text-ink shadow-soft outline-none backdrop-blur-sm focus:border-ink/40 focus-ring"
        >
          {normalizedVariants.map((variant) => {
            const isUnavailable = !variant.availableForSale;
            return (
              <option
                key={variant.id}
                value={variant.id}
                disabled={isUnavailable}
              >
                {variant.optionLabel}
                {isUnavailable ? " (unavailable)" : ""}
              </option>
            );
          })}
        </select>
      </label>
    );
  }

  return null;
};

const getOptionMap = (variant: PurchaseVariant) =>
  Object.fromEntries(
    variant.selectedOptions
      .filter((entry) => entry.name && entry.value)
      .map((entry) => [entry.name, entry.value]),
  );

const getVariantLabel = (variant: PurchaseVariant, fallback: string) => {
  const entries = variant.selectedOptions
    .filter((entry) => entry.name && entry.value)
    .map((entry) => `${entry.name}: ${entry.value}`);
  return entries.length ? entries.join(" · ") : fallback;
};

export function ProductPurchasePanel({
  action,
  productId,
  basePriceLabel,
  variants,
  options,
  initialVariantId,
  productAvailableForSale,
  sku,
  viewCartHref = "/shop/cart",
}: ProductPurchasePanelProps) {
  const normalizedVariants = useMemo<VariantWithMap[]>(() => (
    variants.map((variant, index) => {
      const fallback = `Variant ${index + 1}`;
      return {
        ...variant,
        optionMap: getOptionMap(variant),
        optionLabel: getVariantLabel(variant, fallback),
      };
    })
  ), [variants]);

  const availableVariants = useMemo(
    () => normalizedVariants.filter((variant) => variant.availableForSale),
    [normalizedVariants],
  );

  const initialVariant = useMemo(() => {
    const preferred = initialVariantId
      ? normalizedVariants.find((variant) => variant.id === initialVariantId)
      : undefined;
    if (preferred?.availableForSale) {
      return preferred;
    }
    return availableVariants[0] ?? preferred ?? normalizedVariants[0] ?? null;
  }, [availableVariants, initialVariantId, normalizedVariants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(initialVariant?.id ?? "");
  const selectedVariant = useMemo(
    () =>
      normalizedVariants.find((variant) => variant.id === selectedVariantId) ??
      initialVariant,
    [initialVariant, normalizedVariants, selectedVariantId],
  );

  const optionNames = useMemo(
    () => options.filter((option) => option.values.length).map((option) => option.name),
    [options],
  );

  const getSelectedOptionValue = useCallback(
    (name: string) => (selectedVariant?.optionMap[name] ?? ""),
    [selectedVariant],
  );

  const matchesCurrentSelection = useCallback(
    (variant: VariantWithMap, override?: { name: string; value: string }) => {
      for (const name of optionNames) {
        const desired = override?.name === name
          ? override.value
          : getSelectedOptionValue(name);
        if (!desired) {
          continue;
        }
        if (variant.optionMap[name] !== desired) {
          return false;
        }
      }
      return true;
    },
    [getSelectedOptionValue, optionNames],
  );

  const isOptionValueAvailable = useCallback(
    (optionName: string, optionValue: string) =>
      availableVariants.some((variant) =>
        matchesCurrentSelection(variant, { name: optionName, value: optionValue }),
      ),
    [availableVariants, matchesCurrentSelection],
  );

  const handleOptionChange = useCallback(
    (optionName: string, optionValue: string) => {
      if (!optionValue) {
        return;
      }

      const exact = availableVariants.find((variant) =>
        matchesCurrentSelection(variant, { name: optionName, value: optionValue }),
      );
      if (exact) {
        setSelectedVariantId(exact.id);
        return;
      }

      const relaxed = availableVariants.find((variant) => variant.optionMap[optionName] === optionValue);
      if (relaxed) {
        setSelectedVariantId(relaxed.id);
      }
    },
    [availableVariants, matchesCurrentSelection],
  );

  const hasVariants = normalizedVariants.length > 0;
  const hasPurchasableVariant = availableVariants.length > 0;
  const variantSelected = Boolean(selectedVariant?.id);
  const isOutOfStock =
    !productAvailableForSale || (hasVariants && !hasPurchasableVariant);
  const isUnavailable = !isOutOfStock && !variantSelected;
  const canAddToCart =
    !isOutOfStock && variantSelected && Boolean(selectedVariant?.availableForSale);
  const isAddToCartDisabled = !canAddToCart;

  const priceLabel =
    selectedVariant?.price?.currencyCode || selectedVariant?.price?.value
      ? formatMoney(selectedVariant.price)
      : basePriceLabel;

  const stockLabel = getStockLabel(isOutOfStock, isUnavailable);

  const variantSelection = renderVariantSelection({
    options,
    normalizedVariants,
    selectedVariantId,
    getSelectedOptionValue,
    handleOptionChange,
    isOptionValueAvailable,
    onVariantChange: setSelectedVariantId,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text size="lg" className="text-ink">
          {priceLabel}
        </Text>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 type-caption shadow-soft",
            canAddToCart
              ? "border-border/70 bg-card/70 text-ink"
              : "border-border/70 bg-canvas/70 text-ink-muted",
          )}
        >
          {stockLabel}
        </span>
      </div>

      {sku ? (
        <Text size="caption" muted>
          SKU: {sku}
        </Text>
      ) : null}

      {variantSelection}

      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="variantId" value={selectedVariant?.id ?? ""} />

        <label className="flex flex-col gap-1 text-ink type-label-tight">
          <Text size="label-tight" muted>
            Quantity
          </Text>
          <Input
            name="quantity"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            defaultValue={1}
            disabled={isAddToCartDisabled}
          />
        </label>

        <Button type="submit" size="md" disabled={isAddToCartDisabled} className="w-full">
          Add to cart
        </Button>
      </form>

      {canAddToCart ? (
        <Text size="caption" muted>
          Taxes and shipping calculated at checkout.
        </Text>
      ) : (
        <Text size="caption" muted>
          {isOutOfStock
            ? "This item is out of stock right now."
            : "Select an in-stock configuration to add this item to your cart."}
        </Text>
      )}

      <Button asChild variant="ghost" size="sm" className="w-full justify-center">
        <Link href={viewCartHref} prefetch={false}>
          View cart
        </Link>
      </Button>
    </div>
  );
}
