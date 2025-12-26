"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState } from "react";
import type { GradeSeries } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type EngravingGalleryProps = Readonly<{
  gallery: GradeSeries["gallery"];
  title?: string;
}>;

export function EngravingGallery({ gallery, title }: EngravingGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const analyticsRef = useAnalyticsObserver<HTMLElement>("EngravingGallerySeen");

  if (gallery.length === 0) return null;

  const currentAsset =
    openIndex === null ? undefined : gallery[openIndex] ?? gallery[0];

  const showPrev = () => {
    if (openIndex === null) return;
    const nextIndex =
      (openIndex - 1 + gallery.length) % gallery.length;
    logAnalytics("EngravingLightbox:prev");
    setOpenIndex(nextIndex);
  };

  const showNext = () => {
    if (openIndex === null) return;
    const nextIndex = (openIndex + 1) % gallery.length;
    logAnalytics("EngravingLightbox:next");
    setOpenIndex(nextIndex);
  };

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="EngravingGallerySeen"
      className="space-y-4"
      aria-labelledby="engraving-gallery-heading"
    >
      <Heading
        id="engraving-gallery-heading"
        level={2}
        size="md"
        className="text-ink"
      >
        {title ?? "Engraving gallery"}
      </Heading>
      <div className="grid gap-4 md:grid-cols-2">
        {gallery.map((asset, index) => {
          const ratio = asset.aspectRatio ?? 3 / 2;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                setOpenIndex(index);
                logAnalytics(`EngravingLightbox:open:${asset.id}`);
              }}
              className="text-left"
            >
              <figure className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-4 sm:shadow-elevated">
                <div
                  className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
                  style={{ aspectRatio: ratio }}
                >
                  <Image
                    src={asset.url}
                    alt={asset.alt}
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                {asset.caption ? (
                  <Text asChild size="sm" className="mt-3 text-ink-muted">
                    <figcaption>{asset.caption}</figcaption>
                  </Text>
                ) : null}
              </figure>
            </button>
          );
        })}
      </div>

      <Dialog.Root
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            logAnalytics("EngravingLightbox:close");
            setOpenIndex(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-fade-in" />
          {currentAsset ? (
            <Dialog.Content
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
            >
              <div className="relative w-full max-w-4xl rounded-2xl border border-border/70 bg-card/95 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl focus:outline-none sm:rounded-3xl sm:p-6">
                <Dialog.Title className="sr-only">
                  {currentAsset.alt}
                </Dialog.Title>
                <div
                  className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
                  style={{ aspectRatio: currentAsset.aspectRatio ?? 3 / 2 }}
                >
                  <Image
                    src={currentAsset.url}
                    alt={currentAsset.alt}
                    fill
                    sizes="90vw"
                    className="object-contain"
                    loading="eager"
                  />
                </div>
                {currentAsset.caption ? (
                  <Text className="mt-4 text-ink-muted" leading="normal">
                    {currentAsset.caption}
                  </Text>
                ) : null}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={showPrev}
                    className="rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-sm uppercase tracking-[0.3em] text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                  >
                    Prev
                  </button>
                  <Text
                    asChild
                    size="xs"
                    className="text-ink-muted"
                    leading="normal"
                  >
                    <span>
                      {openIndex! + 1} / {gallery.length}
                    </span>
                  </Text>
                  <button
                    type="button"
                    onClick={showNext}
                    className="rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-sm uppercase tracking-[0.3em] text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                  >
                    Next
                  </button>
                </div>
                <Dialog.Close
                  type="button"
                  aria-label="Close engraving"
                  className="absolute right-4 top-4 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
                >
                  Close
                </Dialog.Close>
              </div>
            </Dialog.Content>
          ) : null}
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
