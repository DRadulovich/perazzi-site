import type { Money, Product } from "@/lib/bigcommerce/types";

export const formatMoney = (money?: Money): string => {
  if (!money) {
    return "";
  }

  if (!money.currencyCode) {
    return money.value.toFixed(2);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: money.currencyCode,
    }).format(money.value);
  } catch {
    return `${money.value.toFixed(2)} ${money.currencyCode}`.trim();
  }
};

export const formatProductPrice = (product: Product): string => {
  if (product.priceRange) {
    const min = formatMoney(product.priceRange.min);
    const max = formatMoney(product.priceRange.max);
    if (min && max && min !== max) {
      return `${min} - ${max}`;
    }
  }

  return formatMoney(product.price);
};

export const getProductSlug = (path: string, name: string): string => {
  const segments = path.split("/").filter(Boolean);
  const slug = segments.at(-1);
  if (slug) {
    return slug;
  }

  const normalized = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-+|-+$)/g, "");

  return normalized || "product";
};
