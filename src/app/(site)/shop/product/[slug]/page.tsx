import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import SafeHtml from "@/components/SafeHtml";
import { ShopCatalogField } from "@/components/shop/ShopCatalogField";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { Button, Heading, Text } from "@/components/ui";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductConciergePanel } from "@/components/shop/ProductConciergePanel";
import { formatProductPrice } from "@/components/shop/utils";
import { addToCartAction } from "@/app/(site)/shop/cart/actions";
import { getProductById, getRouteEntity } from "@/lib/bigcommerce";
import type { Product } from "@/lib/bigcommerce/types";
import productPageBg from "@/../docs/BIGCOMMERCE/Background-Images/product-page-bg.jpg";

type AsyncProp<T> = T | Promise<T>;

type ProductPageProps = {
  params: AsyncProp<{ slug: string }>;
  searchParams?: AsyncProp<Record<string, string | string[] | undefined>>;
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
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const product = await resolveProduct(resolvedParams.slug, resolvedSearchParams);
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
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const product = await resolveProduct(resolvedParams.slug, resolvedSearchParams);

  if (product === null) {
    notFound();
  }

  const priceLabel = formatProductPrice(product);
  const primaryImage = product.defaultImage ?? product.images[0];
  const galleryImages = primaryImage
    ? [primaryImage, ...product.images.filter((image) => image.url !== primaryImage.url)]
    : product.images;
  const descriptionHtml = product.description.trim();
  const descriptionText = product.descriptionText.trim();
  const showOutOfStock = product.availableForSale === false;
  const defaultVariant =
    product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  let descriptionSection: ReactNode = null;
  const conciergeCopy = {
    eyebrow: "Concierge assurance",
    heading: "Confirm fit before you order",
    body:
      "Share your measurements or prior build notes. We will confirm fitment, lead time, and any workshop prep before you check out.",
    primaryCta: { label: "Ask the concierge", href: "/concierge" },
    secondaryCta: { label: "Book a fitting", href: "/bespoke" },
  };

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
    <ShopCatalogField
      id="shop-product"
      backgroundSrc={productPageBg.src}
      backgroundAlt="Perazzi workshop details in warm light"
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/shop"
            prefetch={false}
            className="type-button text-ink-muted transition-colors hover:text-ink focus-ring rounded-xl px-3 py-2"
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
          <div className="space-y-6">
            <ProductGallery images={galleryImages} productName={product.name} />

            <section className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm">
              <Text size="label-tight" muted>
                Details
              </Text>
              <div className="mt-4">{descriptionSection}</div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm lg:sticky lg:top-[calc(var(--site-header-offset-lg)+16px)] lg:self-start">
              <div className="space-y-3">
                {product.brand ? (
                  <Text size="label-tight" muted className="uppercase tracking-[0.25em]">
                    {product.brand}
                  </Text>
                ) : null}
                <Heading level={1} size="xl">
                  {product.name}
                </Heading>
                {showOutOfStock ? (
                  <Text size="caption" muted>
                    Out of stock
                  </Text>
                ) : null}
              </div>

              <div className="mt-6">
                <ProductPurchasePanel
                  action={addToCartAction}
                  productId={product.id}
                  basePriceLabel={priceLabel}
                  variants={product.variants}
                  options={product.options}
                  initialVariantId={defaultVariant?.id}
                  productAvailableForSale={product.availableForSale}
                  sku={product.sku}
                />
              </div>
            </section>

            <ProductConciergePanel
              eyebrow={conciergeCopy.eyebrow}
              heading={conciergeCopy.heading}
              body={conciergeCopy.body}
              primaryCta={conciergeCopy.primaryCta}
              secondaryCta={conciergeCopy.secondaryCta}
            />
          </div>
        </div>
      </div>
    </ShopCatalogField>
  );
}
