import type {
  Cart,
  CartLineItem,
  Category,
  Image,
  Money,
  Product,
  ProductOption,
  ProductVariant,
  RouteEntity,
} from "./types";

export type BigCommerceMoney = {
  value: number;
  currencyCode: string;
};

type BigCommerceImage = {
  url: string;
  altText?: string | null;
};

export type BigCommerceCategoryTreeItem = {
  entityId: number;
  name: string;
  path: string;
  children?: BigCommerceCategoryTreeItem[] | null;
};

export type BigCommerceRouteNode = {
  __typename?: string | null;
  entityId?: number | null;
};

type BigCommerceProductOption = {
  entityId: number;
  displayName: string;
  values?: { edges: Array<{ node: { label: string } }> } | null;
};

type BigCommerceVariantOption = {
  displayName?: string | null;
  values?: { edges: Array<{ node: { label: string } }> } | null;
};

type BigCommerceProductVariant = {
  entityId: number;
  isPurchasable: boolean;
  prices?: {
    price?: BigCommerceMoney | null;
    priceRange?: { min: BigCommerceMoney; max: BigCommerceMoney } | null;
  } | null;
  options?: { edges: Array<{ node: BigCommerceVariantOption }> } | null;
};

export type BigCommerceProduct = {
  entityId: number;
  name: string;
  path: string;
  sku?: string | null;
  availabilityV2?: { status?: string | null } | null;
  brand?: { name?: string | null } | null;
  description?: string | null;
  plainTextDescription?: string | null;
  defaultImage?: BigCommerceImage | null;
  images?: { edges: Array<{ node: BigCommerceImage }> } | null;
  prices: {
    price?: BigCommerceMoney | null;
    priceRange?: { min: BigCommerceMoney; max: BigCommerceMoney } | null;
  };
  productOptions?: { edges: Array<{ node: BigCommerceProductOption }> } | null;
  variants?: { edges: Array<{ node: BigCommerceProductVariant }> } | null;
};

export type BigCommerceCartItem = {
  entityId: number;
  name: string;
  quantity: number;
  productEntityId?: number | null;
  variantEntityId?: number | null;
  listPrice: BigCommerceMoney;
  extendedListPrice: BigCommerceMoney;
};

export type BigCommerceCart = {
  entityId: string;
  currencyCode: string;
  amount?: BigCommerceMoney | null;
  lineItems: {
    totalQuantity: number;
    physicalItems: BigCommerceCartItem[];
    digitalItems: BigCommerceCartItem[];
  };
};

const toSlug = (path: string) => {
  const normalized = path.replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  return segments.at(-1) ?? "";
};

export const mapMoney = (money?: BigCommerceMoney | null): Money => ({
  value: money?.value ?? 0,
  currencyCode: money?.currencyCode ?? "",
});

export const mapImage = (image?: BigCommerceImage | null): Image | undefined => {
  if (!image?.url) {
    return undefined;
  }

  return {
    url: image.url,
    altText: image.altText ?? "",
  };
};

export const mapCategoryTree = (items: BigCommerceCategoryTreeItem[]): Category[] =>
  items.map((item) => ({
    id: item.entityId.toString(),
    name: item.name,
    path: item.path,
    slug: toSlug(item.path),
    children: item.children ? mapCategoryTree(item.children) : [],
  }));

export const mapRouteEntity = (node?: BigCommerceRouteNode | null): RouteEntity | null => {
  if (!node?.__typename || !node.entityId) {
    return null;
  }

  if (
    node.__typename !== "Product" &&
    node.__typename !== "Category" &&
    node.__typename !== "Brand" &&
    node.__typename !== "NormalPage" &&
    node.__typename !== "ContactPage" &&
    node.__typename !== "RawHtmlPage"
  ) {
    return null;
  }

  const type =
    node.__typename === "NormalPage" ||
    node.__typename === "ContactPage" ||
    node.__typename === "RawHtmlPage"
      ? "Page"
      : (node.__typename as RouteEntity["type"]);

  return {
    type,
    entityId: node.entityId.toString(),
  };
};

const mapProductOptions = (options?: {
  edges: Array<{ node: BigCommerceProductOption }>;
} | null): ProductOption[] => {
  if (!options?.edges?.length) {
    return [];
  }

  return options.edges.map(({ node }) => ({
    id: node.entityId.toString(),
    name: node.displayName,
    values: node.values?.edges?.map(({ node: value }) => value.label) ?? [],
  }));
};

const mapVariantOptions = (options?: {
  edges: Array<{ node: BigCommerceVariantOption }>;
} | null): Array<{ name: string; value: string }> => {
  if (!options?.edges?.length) {
    return [];
  }

  return options.edges.map(({ node }) => ({
    name: node.displayName ?? "",
    value: node.values?.edges?.[0]?.node.label ?? "",
  }));
};

const mapVariants = (
  variants: BigCommerceProduct["variants"],
  productId: string,
): ProductVariant[] => {
  if (!variants?.edges?.length) {
    return [];
  }

  return variants.edges.map(({ node }) => {
    const price = mapMoney(node.prices?.price ?? node.prices?.priceRange?.min ?? null);
    return {
      id: node.entityId.toString(),
      productId,
      availableForSale: node.isPurchasable,
      price,
      selectedOptions: mapVariantOptions(node.options),
    };
  });
};

export const mapProduct = (product: BigCommerceProduct): Product => {
  const images =
    product.images?.edges?.map(({ node }) => mapImage(node)).filter(Boolean) ?? [];
  const defaultImage =
    mapImage(product.defaultImage) ?? (images.length ? images[0] : undefined);
  const price = mapMoney(product.prices?.price ?? product.prices?.priceRange?.min ?? null);
  const priceRange = product.prices?.priceRange
    ? {
        min: mapMoney(product.prices.priceRange.min),
        max: mapMoney(product.prices.priceRange.max),
      }
    : undefined;
  const productId = product.entityId.toString();

  return {
    id: productId,
    name: product.name,
    path: product.path,
    description: product.description ?? "",
    descriptionText: product.plainTextDescription ?? "",
    price,
    priceRange,
    images: images.filter((image): image is Image => image !== undefined),
    defaultImage,
    variants: mapVariants(product.variants, productId),
    options: mapProductOptions(product.productOptions),
    sku: product.sku ?? undefined,
    brand: product.brand?.name ?? undefined,
    availableForSale: product.availabilityV2?.status === "Available",
  };
};

export const mapProducts = (products: BigCommerceProduct[]): Product[] =>
  products.map(mapProduct);

export const mapCart = (cart: BigCommerceCart): Cart => {
  const items = [...cart.lineItems.physicalItems, ...cart.lineItems.digitalItems].map(
    (item): CartLineItem => ({
      id: item.entityId.toString(),
      productId: item.productEntityId?.toString() ?? "",
      variantId: item.variantEntityId?.toString(),
      name: item.name,
      quantity: item.quantity,
      price: mapMoney(item.listPrice),
      totalPrice: mapMoney(item.extendedListPrice),
    }),
  );

  return {
    id: cart.entityId,
    currencyCode: cart.currencyCode,
    items,
    totalQuantity: cart.lineItems.totalQuantity,
    subtotal: cart.amount ? mapMoney(cart.amount) : undefined,
  };
};
