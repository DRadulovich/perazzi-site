import "server-only";

import { bigCommerceFetch } from "./client";
import {
  mapCart,
  mapCategoryTree,
  mapProduct,
  mapProducts,
  mapRouteEntity,
  type BigCommerceCart,
  type BigCommerceCategoryTreeItem,
  type BigCommerceProduct,
  type BigCommerceRouteNode,
} from "./mappers";
import { createCartRedirectUrlsMutation, createCartMutation, deleteCartLineItemMutation, addCartLineItemsMutation, updateCartLineItemMutation } from "./mutations/cart";
import { getCartQuery } from "./queries/cart";
import { getCategoryTreeQuery } from "./queries/category";
import { getProductQuery, searchProductsQuery } from "./queries/product";
import { getRouteEntityQuery } from "./queries/route";
import type {
  Cart,
  CartLineInput,
  Product,
  ProductSearchFilters,
  ProductSearchResult,
  RouteEntity,
} from "./types";

type GraphQLResponse<T> = { data: T };

type CategoryTreeData = {
  site: { categoryTree: BigCommerceCategoryTreeItem[] };
};

type RouteEntityData = {
  site: { route: { node?: BigCommerceRouteNode | null } | null };
};

type SearchProductsData = {
  site: {
    search: {
      searchProducts: {
        products: {
          edges: Array<{ node: BigCommerceProduct }>;
          collectionInfo: { totalItems: number };
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor?: string | null;
            endCursor?: string | null;
          };
        };
      };
    };
  };
};

type ProductData = {
  site: { product: BigCommerceProduct | null };
};

type CartData = {
  site: { cart: BigCommerceCart | null };
};

type CartMutationData = {
  cart: {
    createCart?: { cart: BigCommerceCart };
    addCartLineItems?: { cart: BigCommerceCart };
    updateCartLineItem?: { cart: BigCommerceCart };
    deleteCartLineItem?: { cart: BigCommerceCart };
  };
};

type CartRedirectData = {
  cart: {
    createCartRedirectUrls: {
      errors: Array<{ __typename?: string | null }>;
      redirectUrls?: { redirectedCheckoutUrl?: string | null } | null;
    };
  };
};

const normalizePath = (path: string) => {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
};

const parseEntityId = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new TypeError(`Invalid BigCommerce entity id: ${value}`);
  }
  return parsed;
};

export const getCategoryTree = async (): Promise<ReturnType<typeof mapCategoryTree>> => {
  const res = await bigCommerceFetch<GraphQLResponse<CategoryTreeData>>({
    query: getCategoryTreeQuery,
  });

  return mapCategoryTree(res.body.data.site.categoryTree);
};

export const getRouteEntity = async (path: string): Promise<RouteEntity | null> => {
  const res = await bigCommerceFetch<GraphQLResponse<RouteEntityData>>({
    query: getRouteEntityQuery,
    variables: { path: normalizePath(path) },
  });

  return mapRouteEntity(res.body.data.site.route?.node ?? null);
};

export const searchProducts = async (
  filters: ProductSearchFilters,
): Promise<ProductSearchResult> => {
  const {
    searchTerm,
    categoryEntityId,
    minPrice,
    maxPrice,
    inStock,
    sort,
    limit = 24,
    after,
  } = filters;

  const searchFilters = {
    searchTerm: searchTerm || undefined,
    categoryEntityId: categoryEntityId ? parseEntityId(categoryEntityId) : undefined,
    hideOutOfStock: inStock ? true : undefined,
    price:
      minPrice || maxPrice
        ? {
            minPrice: minPrice ?? undefined,
            maxPrice: maxPrice ?? undefined,
          }
        : undefined,
  };

  const res = await bigCommerceFetch<GraphQLResponse<SearchProductsData>>({
    query: searchProductsQuery,
    variables: {
      first: limit,
      after: after ?? undefined,
      filters: searchFilters,
      sort: sort ?? null,
    },
    cache: "no-store",
  });

  const products = res.body.data.site.search.searchProducts.products;
  const items = mapProducts(products.edges.map(({ node }) => node));

  return {
    items,
    total: products.collectionInfo.totalItems,
    pageInfo: {
      hasNextPage: products.pageInfo.hasNextPage,
      hasPreviousPage: products.pageInfo.hasPreviousPage,
      startCursor: products.pageInfo.startCursor ?? undefined,
      endCursor: products.pageInfo.endCursor ?? undefined,
    },
  };
};

export const getProductById = async (entityId: string): Promise<Product | null> => {
  const res = await bigCommerceFetch<GraphQLResponse<ProductData>>({
    query: getProductQuery,
    variables: { entityId: parseEntityId(entityId) },
  });

  if (!res.body.data.site.product) {
    return null;
  }

  return mapProduct(res.body.data.site.product);
};

export const getCart = async (cartId: string): Promise<Cart | null> => {
  const res = await bigCommerceFetch<GraphQLResponse<CartData>>({
    query: getCartQuery,
    variables: { cartId },
    cache: "no-store",
  });

  if (!res.body.data.site.cart) {
    return null;
  }

  return mapCart(res.body.data.site.cart);
};

export const createCart = async (lines: CartLineInput[]): Promise<Cart> => {
  if (!lines.length) {
    throw new Error("Cannot create a cart without line items.");
  }

  const res = await bigCommerceFetch<GraphQLResponse<CartMutationData>>({
    query: createCartMutation,
    variables: {
      input: {
        lineItems: lines.map((line) => ({
          productEntityId: parseEntityId(line.productEntityId),
          variantEntityId: parseEntityId(line.variantEntityId),
          quantity: line.quantity,
        })),
      },
    },
    cache: "no-store",
  });

  const cart = res.body.data.cart.createCart?.cart;
  if (!cart) {
    throw new Error("Failed to create BigCommerce cart.");
  }

  return mapCart(cart);
};

export const addCartLineItems = async (
  cartId: string,
  lines: CartLineInput[],
): Promise<Cart> => {
  const res = await bigCommerceFetch<GraphQLResponse<CartMutationData>>({
    query: addCartLineItemsMutation,
    variables: {
      input: {
        cartEntityId: cartId,
        data: {
          lineItems: lines.map((line) => ({
            productEntityId: parseEntityId(line.productEntityId),
            variantEntityId: parseEntityId(line.variantEntityId),
            quantity: line.quantity,
          })),
        },
      },
    },
    cache: "no-store",
  });

  const cart = res.body.data.cart.addCartLineItems?.cart;
  if (!cart) {
    throw new Error("Failed to add items to BigCommerce cart.");
  }

  return mapCart(cart);
};

export const updateCartLineItem = async ({
  cartId,
  lineItemId,
  productEntityId,
  variantEntityId,
  quantity,
}: {
  cartId: string;
  lineItemId: string;
  productEntityId: string;
  variantEntityId: string;
  quantity: number;
}): Promise<Cart> => {
  const res = await bigCommerceFetch<GraphQLResponse<CartMutationData>>({
    query: updateCartLineItemMutation,
    variables: {
      input: {
        cartEntityId: cartId,
        lineItemEntityId: lineItemId,
        data: {
          lineItem: {
            productEntityId: parseEntityId(productEntityId),
            variantEntityId: parseEntityId(variantEntityId),
            quantity,
          },
        },
      },
    },
    cache: "no-store",
  });

  const cart = res.body.data.cart.updateCartLineItem?.cart;
  if (!cart) {
    throw new Error("Failed to update BigCommerce cart item.");
  }

  return mapCart(cart);
};

export const removeCartLineItem = async (
  cartId: string,
  lineItemId: string,
): Promise<Cart> => {
  const res = await bigCommerceFetch<GraphQLResponse<CartMutationData>>({
    query: deleteCartLineItemMutation,
    variables: {
      input: {
        cartEntityId: cartId,
        lineItemEntityId: lineItemId,
      },
    },
    cache: "no-store",
  });

  const cart = res.body.data.cart.deleteCartLineItem?.cart;
  if (!cart) {
    throw new Error("Failed to remove BigCommerce cart item.");
  }

  return mapCart(cart);
};

export const createCheckoutRedirectUrl = async (cartId: string): Promise<string> => {
  const res = await bigCommerceFetch<GraphQLResponse<CartRedirectData>>({
    query: createCartRedirectUrlsMutation,
    variables: { cartId },
    cache: "no-store",
  });

  const payload = res.body.data.cart.createCartRedirectUrls;
  if (payload.errors.length > 0 || !payload.redirectUrls?.redirectedCheckoutUrl) {
    throw new Error("Failed to generate checkout redirect URL.");
  }

  return payload.redirectUrls.redirectedCheckoutUrl;
};
