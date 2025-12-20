"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { FactoryAsset } from "@/types/content";

type PortableGalleryProps = {
  readonly items: readonly FactoryAsset[];
};

export function PortableGallery({ items }: PortableGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Ensure SSR/CSR markup stays aligned before honoring reduced motion.
  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);
  const currentAsset = useMemo(() => {
    if (openIndex === null) return undefined;
    return items[openIndex];
  }, [items, openIndex]);

  const length = items.length;

  const handleOpen = useCallback((index: number) => {
    setOpenIndex(index);
  }, []);

  const close = useCallback(() => { setOpenIndex(null); }, []);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        return (prev + direction + length) % length;
      });
    },
    [length],
  );

  if (items.length === 0) return null;

  return (
    <div className="my-8 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((asset, index) => (
          <button
            key={asset.id}
            type="button"
            className="text-left"
            onClick={() => { handleOpen(index); }}
          >
            <figure className="rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm">
              <div
                className="relative overflow-hidden rounded-xl bg-neutral-200"
                style={{ aspectRatio: asset.aspectRatio ?? 4 / 3 }}
              >
                <Image
                  src={asset.url}
                  alt={asset.alt}
                  fill
                  sizes="(min-width: 768px) 360px, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              {asset.caption ? (
                <figcaption className="mt-2 text-xs text-ink-muted">
                  {asset.caption}
                </figcaption>
              ) : null}
            </figure>
          </button>
        ))}
      </div>

      <Dialog.Root open={openIndex !== null} onOpenChange={(open) => (open ? null : close())}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={`fixed inset-0 bg-black/70 backdrop-blur-sm ${
              reduceMotion ? "" : "data-[state=open]:animate-fade-in"
            }`}
          />
          {currentAsset ? (
            <Dialog.Content
              className="fixed inset-0 flex items-center justify-center p-4 focus:outline-none"
              aria-label="Gallery lightbox"
            >
              <figure className="relative flex w-full max-w-4xl flex-col gap-3 rounded-3xl bg-card p-6 shadow-2xl focus:outline-none">
                <p className="sr-only" aria-live="polite">
                  Photo {(openIndex ?? 0) + 1} of {length}
                </p>
                <div
                  className="relative overflow-hidden rounded-2xl bg-neutral-200"
                  style={{ aspectRatio: currentAsset.aspectRatio ?? 4 / 3 }}
                >
                  <Image
                    src={currentAsset.url}
                    alt={currentAsset.alt}
                    fill
                    sizes="(min-width: 1024px) 800px, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
                {currentAsset.caption ? (
                  <figcaption className="text-sm text-ink-muted">
                    {currentAsset.caption}
                  </figcaption>
                ) : null}
                <div className="flex justify-between">
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink"
                    onClick={() => { goTo(-1); }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink"
                    onClick={() => { goTo(1); }}
                  >
                    Next
                  </button>
                </div>
                <Dialog.Close className="focus-ring absolute right-4 top-4 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink">
                  Close
                </Dialog.Close>
              </figure>
            </Dialog.Content>
          ) : null}
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
