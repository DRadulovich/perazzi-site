export type Money = {
  value: number;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string;
};

export type Category = {
  id: string;
  name: string;
  path: string;
  slug: string;
  children: Category[];
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  productId: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: Array<{ name: string; value: string }>;
};

export type Product = {
  id: string;
  name: string;
  path: string;
  description: string;
  descriptionText: string;
  price: Money;
  priceRange?: {
    min: Money;
    max: Money;
  };
  images: Image[];
  defaultImage?: Image;
  variants: ProductVariant[];
  options: ProductOption[];
  sku?: string;
  brand?: string;
  availableForSale: boolean;
};

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
};

export type ProductSearchResult = {
  items: Product[];
  total: number;
  pageInfo?: PageInfo;
};

export type CartLineItem = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  price: Money;
  totalPrice: Money;
};

export type Cart = {
  id: string;
  currencyCode: string;
  items: CartLineItem[];
  totalQuantity: number;
  subtotal?: Money;
};

export type RouteEntity = {
  type: "Product" | "Category" | "Brand" | "Page";
  entityId: string;
};

export type ProductSortKey =
  | "RELEVANCE"
  | "BEST_SELLING"
  | "NEWEST"
  | "HIGHEST_PRICE"
  | "LOWEST_PRICE"
  | "A_TO_Z"
  | "Z_TO_A";

export type ProductSearchFilters = {
  searchTerm?: string;
  categoryEntityId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSortKey;
  limit?: number;
  after?: string;
};

export type CartLineInput = {
  productEntityId: string;
  variantEntityId: string;
  quantity: number;
};
