"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import type { ReactNode } from "react";
import SafeHtml from "@/components/SafeHtml";
import { Button, Heading, Text } from "@/components/ui";
import { formatProductPrice } from "@/components/shop/utils";
import { ProductGallery } from "@/components/shop/ProductGallery";
import type { Product } from "@/lib/bigcommerce/types";

type ProductQuickViewProps = Readonly<{
  product: Product;
  href: string;
}>;

export function ProductQuickView({ product, href }: ProductQuickViewProps) {
  const priceLabel = formatProductPrice(product);
  const showOutOfStock = product.availableForSale === false;
  const descriptionHtml = product.description.trim();
  const descriptionText = product.descriptionText.trim();
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

  const primaryImage = product.defaultImage ?? product.images[0];
  const galleryImages = primaryImage
    ? [primaryImage, ...product.images.filter((image) => image.url !== primaryImage.url)]
    : product.images;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="pointer-events-auto"
        >
          Quick view
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
        <Dialog.Content className="fixed inset-0 z-70 flex items-center justify-center p-4 outline-none">
          <div className="relative w-full max-w-6xl rounded-3xl border border-border/70 bg-card/95 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="sr-only">Quick view: {product.name}</Dialog.Title>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <ProductGallery
                images={galleryImages}
                productName={product.name}
                enableLightbox={false}
              />

              <div className="space-y-6">
                <div className="space-y-3">
                  {product.brand ? (
                    <Text size="label-tight" muted>
                      {product.brand}
                    </Text>
                  ) : null}
                  <Heading level={2} size="lg">
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

                <Button asChild variant="ghost" size="sm">
                  <Link href={href} prefetch={false}>
                    View full product
                  </Link>
                </Button>
              </div>
            </div>

            <Dialog.Close
              type="button"
              aria-label="Close quick view"
              className="type-button absolute right-4 top-4 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
            >
              Close
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
