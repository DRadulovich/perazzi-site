import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SafeHtml from "@/components/SafeHtml";
import { Button, Heading, Input, Text } from "@/components/ui";
import { formatProductPrice } from "@/components/shop/utils";
import { addToCartAction } from "@/app/(site)/shop/cart/actions";
import { getProductById, getRouteEntity } from "@/lib/bigcommerce";
import type { Product } from "@/lib/bigcommerce/types";

type ProductPageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const normalizePath = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

const resolveProduct = async (
  slug: string,
  searchParams?: Record<string, string | string[] | undefined>,
): Promise<Product | null> => {
  const id = getParam(searchParams?.id);
  const pathParam = getParam(searchParams?.path);

  if (id && /^\d+$/.test(id)) {
    const product = await getProductById(id);
    if (product) {
      return product;
    }
  }

  if (pathParam) {
    const route = await getRouteEntity(normalizePath(pathParam));
    if (route?.type === "Product") {
      const product = await getProductById(route.entityId);
      if (product) {
        return product;
      }
    }
  }

  const fallbackRoute = await getRouteEntity(`/${slug}`);
  if (fallbackRoute?.type === "Product") {
    return getProductById(fallbackRoute.entityId);
  }

  return null;
};

export async function generateMetadata({
  params,
  searchParams,
}: ProductPageProps): Promise<Metadata> {
  const product = await resolveProduct(params.slug, searchParams);
  if (!product) {
    return { title: "Shop | Perazzi" };
  }

  const description =
    product.descriptionText ||
    product.description.replaceAll(/<[^>]+>/g, "").trim() ||
    `Details on ${product.name}.`;

  const image = product.defaultImage ?? product.images[0];

  return {
    title: `${product.name} | Perazzi Shop`,
    description,
    openGraph: image
      ? {
          title: `${product.name} | Perazzi Shop`,
          description,
          images: [{ url: image.url }],
        }
      : undefined,
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const product = await resolveProduct(params.slug, searchParams);

  if (product === null) {
    notFound();
  }

  const priceLabel = formatProductPrice(product);
  const primaryImage = product.defaultImage ?? product.images[0];
  const galleryImages = primaryImage
    ? product.images.filter((image) => image.url !== primaryImage.url)
    : product.images;
  const descriptionHtml = product.description.trim();
  const descriptionText = product.descriptionText.trim();
  const showOutOfStock = product.availableForSale === false;
  const defaultVariant =
    product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const hasVariant = Boolean(defaultVariant);
  const canAddToCart = hasVariant && product.availableForSale;
  const addToCartDisabled = !canAddToCart;
  const variantIdValue = defaultVariant?.id ?? "";
  let descriptionSection: ReactNode = null;

  if (descriptionHtml) {
    descriptionSection = (
      <SafeHtml
        html={descriptionHtml}
        className="prose max-w-none prose-p:leading-relaxed"
      />
    );
  } else if (descriptionText) {
    descriptionSection = (
      <Text leading="relaxed" className="max-w-3xl">
        {descriptionText}
      </Text>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/shop"
          prefetch={false}
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          Back to shop
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href="/shop/cart" prefetch={false}>
            View cart
          </Link>
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-border/70 bg-card/70">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.altText || product.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 560px, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-canvas/80">
                <Text size="label-tight" muted>
                  Image coming soon
                </Text>
              </div>
            )}
          </div>

          {galleryImages.length ? (
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.slice(0, 6).map((image) => (
                <div
                  key={image.url}
                  className="relative aspect-4/5 overflow-hidden rounded-2xl border border-border/70 bg-card/70"
                >
                  <Image
                    src={image.url}
                    alt={image.altText || product.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 140px, 30vw"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            {product.brand ? (
              <Text size="label-tight" muted>
                {product.brand}
              </Text>
            ) : null}
            <Heading level={1} size="xl">
              {product.name}
            </Heading>
            {priceLabel ? (
              <Text size="lg" className="text-ink">
                {priceLabel}
              </Text>
            ) : null}
            {showOutOfStock ? (
              <Text size="caption" muted>
                Out of stock
              </Text>
            ) : null}
          </div>

          <form action={addToCartAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="variantId" value={variantIdValue} />
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
                className="w-24"
                disabled={addToCartDisabled}
              />
            </label>
            <div className="flex flex-col gap-1">
              <Button type="submit" size="md" disabled={addToCartDisabled}>
                Add to cart
              </Button>
              {addToCartDisabled ? (
                <Text size="caption" muted>
                  This item is unavailable right now.
                </Text>
              ) : null}
            </div>
          </form>

          {product.sku ? (
            <Text size="label-tight" muted>
              SKU: {product.sku}
            </Text>
          ) : null}

          {descriptionSection}

          {product.options.length ? (
            <div className="space-y-2">
              <Text size="label-tight" muted>
                Options
              </Text>
              <div className="space-y-3">
                {product.options.map((option) => (
                  <div key={option.id} className="space-y-1">
                    <Text size="caption" className="text-ink">
                      {option.name}
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <span
                          key={value}
                          className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-ink"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
