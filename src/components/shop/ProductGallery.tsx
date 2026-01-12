"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState } from "react";
import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Image as ProductImage } from "@/lib/bigcommerce/types";

type ProductGalleryProps = Readonly<{
  images: ProductImage[];
  productName: string;
  enableLightbox?: boolean;
}>;

export function ProductGallery({
  images,
  productName,
  enableLightbox = true,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative aspect-3/2 overflow-hidden rounded-3xl border border-border/70 bg-card/70">
        <div className="flex h-full items-center justify-center bg-canvas/80">
          <Text size="label-tight" muted>
            Image coming soon
          </Text>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, images.length - 1);
  const activeImage = images[safeIndex] ?? images[0];
  const canNavigate = images.length > 1;

  const openAt = (index: number) => {
    setActiveIndex(index);
    if (enableLightbox) {
      setOpen(true);
    }
  };

  const showPrev = () => {
    if (!canNavigate) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const showNext = () => {
    if (!canNavigate) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => openAt(safeIndex)}
        className="relative aspect-3/2 w-full overflow-hidden rounded-3xl border border-border/70 bg-card/70"
        aria-label={`Open image ${safeIndex + 1} of ${images.length}`}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.altText || productName}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 560px, 100vw"
        />
      </button>

      {canNavigate ? (
        <div className="grid grid-cols-3 gap-3">
          {images.slice(0, 6).map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => openAt(index)}
              aria-label={`Open image ${index + 1} of ${images.length}`}
              className={cn(
                "relative aspect-3/2 overflow-hidden rounded-2xl border border-border/70 bg-card/70",
                index === safeIndex && "ring-2 ring-ink/40 ring-offset-2 ring-offset-canvas",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText || productName}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 140px, 30vw"
              />
            </button>
          ))}
        </div>
      ) : null}

      {enableLightbox ? (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
            <Dialog.Content
              className="fixed inset-0 z-60 flex items-center justify-center p-4 outline-none"
              onKeyDown={(event) => {
                if (!canNavigate) return;
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  showNext();
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  showPrev();
                }
              }}
            >
              <div className="relative w-full max-w-5xl rounded-3xl border border-border/70 bg-card/95 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl sm:p-6">
                <Dialog.Title className="sr-only">
                  {productName} image {safeIndex + 1} of {images.length}
                </Dialog.Title>
                <div className="relative aspect-3/2 overflow-hidden rounded-2xl bg-canvas/80">
                  <Image
                    src={activeImage.url}
                    alt={activeImage.altText || productName}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                  />
                </div>

                {canNavigate ? (
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={showPrev}
                      className="type-button rounded-full border border-border/70 bg-card/60 px-4 py-2 text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                    >
                      Prev
                    </button>
                    <Text size="caption" className="text-ink-muted" leading="normal">
                      {safeIndex + 1} / {images.length}
                    </Text>
                    <button
                      type="button"
                      onClick={showNext}
                      className="type-button rounded-full border border-border/70 bg-card/60 px-4 py-2 text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                    >
                      Next
                    </button>
                  </div>
                ) : null}

                <Dialog.Close
                  type="button"
                  aria-label="Close image viewer"
                  className="type-button absolute right-4 top-4 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                >
                  Close
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </div>
  );
}
