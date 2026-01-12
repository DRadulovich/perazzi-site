import type { MetadataRoute } from "next";
import { getCategoryTree, searchProducts } from "@/lib/bigcommerce";
import type { Category, Product } from "@/lib/bigcommerce/types";
import { getProductSlug } from "@/components/shop/utils";

const PRODUCT_PAGE_SIZE = 50;
const MAX_PRODUCT_PAGES = 40;

const resolveSiteUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const normalized = vercelUrl.replace(/\/+$/, "");
    return normalized.startsWith("http") ? normalized : `https://${normalized}`;
  }

  return "http://localhost:3000";
};

const flattenCategories = (categories: Category[]): Category[] =>
  categories.flatMap((category) => [
    category,
    ...(category.children?.length ? flattenCategories(category.children) : []),
  ]);

const fetchAllProducts = async (): Promise<Product[]> => {
  const products: Product[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PRODUCT_PAGES; page += 1) {
    const result = await searchProducts({
      limit: PRODUCT_PAGE_SIZE,
      after: cursor,
    });

    products.push(...result.items);

    const pageInfo = result.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) {
      break;
    }

    cursor = pageInfo.endCursor;
  }

  return products;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveSiteUrl();
  const lastModified = new Date();

  const [categoryTree, products] = await Promise.all([
    getCategoryTree(),
    fetchAllProducts(),
  ]);

  const categories = flattenCategories(categoryTree);

  const shopEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/shop`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const categoryEntries = categories
    .filter((category) => category.slug)
    .map((category) => ({
      url: `${baseUrl}/shop/category/${encodeURIComponent(category.slug)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const productEntries = products.map((product) => {
    const slug = getProductSlug(product.path, product.name);
    return {
      url: `${baseUrl}/shop/product/${encodeURIComponent(slug)}?id=${product.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    };
  });

  return [...shopEntries, ...categoryEntries, ...productEntries];
}
