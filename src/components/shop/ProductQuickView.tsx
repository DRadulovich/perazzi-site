"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Eye, X } from "lucide-react";
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

  if (descriptionText) {
    const maxLength = 320;
    const clipped =
      descriptionText.length > maxLength
        ? `${descriptionText.slice(0, maxLength).trimEnd()}…`
        : descriptionText;
    descriptionSection = (
      <Text leading="relaxed" className="max-w-3xl">
        {clipped}
      </Text>
    );
  } else if (descriptionHtml) {
    descriptionSection = (
      <SafeHtml
        html={descriptionHtml}
        className="prose max-w-none prose-p:leading-relaxed max-h-40 overflow-hidden"
      />
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
          className="pointer-events-auto h-10 w-10 px-0 bg-canvas/80 backdrop-blur-sm hover:bg-canvas/95"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Quick view</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
        <Dialog.Content className="fixed inset-0 z-70 flex items-center justify-center p-4 outline-none">
          <div className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl max-h-[90vh]">
            <Dialog.Title className="sr-only">Quick view: {product.name}</Dialog.Title>

            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-card/80 px-4 py-3 sm:px-6">
              <Text size="label-tight" className="text-ink">
                Quick view
              </Text>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-xl border border-border/70 bg-card/60 px-3 py-2 text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                  aria-label="Close quick view"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <ProductGallery
                  images={galleryImages}
                  productName={product.name}
                  enableLightbox={false}
                />

                <div className="space-y-6">
                  <div className="space-y-3">
                    {product.brand ? (
                      <Text size="label-tight" muted className="uppercase tracking-[0.25em]">
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
                        Available options (select on product page)
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

            <div className="border-t border-border/70 bg-card/90 px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" size="sm">
                    Close
                  </Button>
                </Dialog.Close>
                <Button asChild size="sm">
                  <Link href={href} prefetch={false}>
                    View product
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
