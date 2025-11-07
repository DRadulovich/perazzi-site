"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { FactoryAsset } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type MosaicGalleryProps = {
  assets: FactoryAsset[];
};

export function MosaicGallery({ assets }: MosaicGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const analyticsRef = useAnalyticsObserver("MosaicGallerySeen", {
    threshold: 0.3,
  });

  const openLightbox = useCallback(
    (index: number) => {
      setOpenIndex(index);
      const asset = assets[index];
      if (asset) {
        logAnalytics(`MosaicLightboxOpen:${asset.id}`);
      }
    },
    [assets],
  );

  const closeLightbox = useCallback(() => setOpenIndex(null), []);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        const nextIndex = (prev + direction + assets.length) % assets.length;
        const asset = assets[nextIndex];
        if (asset) {
          logAnalytics(`MosaicLightboxOpen:${asset.id}`);
        }
        return nextIndex;
      });
    },
    [assets],
  );

  const currentAsset = useMemo(
    () => (openIndex !== null ? assets[openIndex] : undefined),
    [assets, openIndex],
  );

  if (!assets.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="MosaicGallerySeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="mosaic-gallery-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Atelier mosaic
        </p>
        <h2
          id="mosaic-gallery-heading"
          className="text-2xl font-semibold text-ink"
        >
          Moments from the journey
        </h2>
      </div>
      <ul
        role="list"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {assets.map((asset, index) => (
          <li key={asset.id}>
            <button
              type="button"
              className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card focus-ring"
              style={{ aspectRatio: asset.aspectRatio ?? 4 / 3 }}
              onClick={() => openLightbox(index)}
              aria-label={`Open photo ${index + 1}`}
            >
              <Image
                src={asset.url}
                alt={asset.alt}
                fill
                sizes="(min-width: 1024px) 360px, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>
      <Dialog.Root
        open={openIndex !== null}
        onOpenChange={(next) => {
          if (!next) {
            closeLightbox();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 focus:outline-none">
            <Dialog.Title className="sr-only">Experience mosaic photo</Dialog.Title>
            <Dialog.Description className="sr-only">
              {currentAsset?.caption ?? currentAsset?.alt ?? "Gallery image"}
            </Dialog.Description>
            {currentAsset ? (
              <figure className="relative flex max-w-4xl flex-col gap-3 rounded-3xl bg-card p-6 shadow-2xl">
                <p className="sr-only" aria-live="polite">
                  Photo {(openIndex ?? 0) + 1} of {assets.length}
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
                    onClick={() => goTo(-1)}
                    aria-label="Previous photo"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink"
                    onClick={() => goTo(1)}
                    aria-label="Next photo"
                  >
                    Next
                  </button>
                </div>
                <Dialog.Close className="focus-ring absolute right-4 top-4 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink">
                  Close
                </Dialog.Close>
              </figure>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
