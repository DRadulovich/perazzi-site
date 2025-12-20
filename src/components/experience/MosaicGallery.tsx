"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { FactoryAsset } from "@/types/content";
import type { MosaicUi } from "@/types/experience";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type MosaicGalleryProps = {
  readonly assets: readonly FactoryAsset[];
  readonly mosaicUi: MosaicUi;
};

export function MosaicGallery({ assets, mosaicUi }: MosaicGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const analyticsRef = useAnalyticsObserver("MosaicGallerySeen", {
    threshold: 0.3,
  });
  const eyebrow = mosaicUi.eyebrow ?? "Atelier mosaic";
  const heading = mosaicUi.heading ?? "Moments from the journey";

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

  const closeLightbox = useCallback(() => { setOpenIndex(null); }, []);

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

  const currentAsset = useMemo(() => {
    if (openIndex === null) return undefined;
    return assets[openIndex];
  }, [assets, openIndex]);

  if (assets.length === 0) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="MosaicGallerySeen"
      className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="mosaic-gallery-heading"
    >
      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          {eyebrow}
        </p>
        <h2
          id="mosaic-gallery-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          {heading}
        </h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset, index) => (
          <li key={asset.id}>
            <button
              type="button"
              className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/10 focus-ring sm:border-border/70 sm:bg-card"
              style={{ aspectRatio: asset.aspectRatio ?? 4 / 3 }}
              onClick={() => { openLightbox(index); }}
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
        onOpenChange={(nextOpen) => {
          if (nextOpen) return;
          closeLightbox();
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
              <figure className="relative flex max-w-4xl flex-col gap-3 rounded-2xl bg-card p-4 shadow-xl sm:rounded-3xl sm:p-6 sm:shadow-2xl">
                <p className="sr-only" aria-live="polite">
                  Photo {(openIndex ?? 0) + 1} of {assets.length}
                </p>
                <div
                  className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
                  style={{ aspectRatio: currentAsset.aspectRatio ?? 3 / 2 }}
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
                  <figcaption className="text-sm leading-relaxed text-ink-muted">
                    {currentAsset.caption}
                  </figcaption>
                ) : null}
                <div className="flex justify-between">
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink"
                    onClick={() => { goTo(-1); }}
                    aria-label="Previous photo"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink"
                    onClick={() => { goTo(1); }}
                    aria-label="Next photo"
                  >
                    Next
                  </button>
                </div>
                <Dialog.Close className="focus-ring absolute right-4 top-4 rounded-full border border-border bg-card px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink">
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
