"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { FactoryEssayItem } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type FactoryPhotoEssayProps = {
  items: FactoryEssayItem[];
  introHtml?: string;
};

export function FactoryPhotoEssay({ items, introHtml }: FactoryPhotoEssayProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hasItems = items.length > 0;

  const handleOpen = useCallback(
    (index: number) => {
      setOpenIndex(index);
      const item = items[index];
      if (item) {
        logAnalytics(`FactoryLightboxOpen:${item.image.id}`);
      }
    },
    [items],
  );

  const close = useCallback(() => setOpenIndex(null), []);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        const nextIndex = (prev + direction + items.length) % items.length;
        const item = items[nextIndex];
        if (item) {
          logAnalytics(`FactoryLightboxOpen:${item.image.id}`);
        }
        return nextIndex;
      });
    },
    [items],
  );

  const currentItem = useMemo(
    () => (openIndex !== null ? items[openIndex] : undefined),
    [items, openIndex],
  );

  return (
    <section
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="factory-essay-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Factory essay
        </p>
        <h2
          id="factory-essay-heading"
          className="text-2xl font-semibold text-ink"
        >
          Inside the Botticino atelier
        </h2>
        {introHtml ? (
          <div
            className="prose prose-sm max-w-3xl text-ink-muted"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        ) : null}
      </div>
      <ul
        role="list"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item, index) => (
          <li key={item.id}>
            <PhotoCard item={item} onOpen={() => handleOpen(index)} />
          </li>
        ))}
      </ul>
      {hasItems ? (
        <Dialog.Root
          open={openIndex !== null}
          onOpenChange={(next) => {
            if (!next) close();
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 focus:outline-none">
              <Dialog.Title className="sr-only">
                Factory photo detail
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {currentItem?.image.caption ?? currentItem?.image.alt}
              </Dialog.Description>
              {currentItem ? (
                <figure className="relative flex max-w-4xl flex-col gap-3 rounded-3xl bg-card p-6 shadow-2xl">
                  <p
                    className="sr-only"
                    aria-live="polite"
                  >
                    Photo {(openIndex ?? 0) + 1} of {items.length}
                  </p>
                  <div
                    className="relative overflow-hidden rounded-2xl bg-neutral-200"
                    style={{ aspectRatio: currentItem.image.aspectRatio ?? 3 / 2 }}
                  >
                    <Image
                      src={currentItem.image.url}
                      alt={currentItem.image.alt}
                      fill
                      sizes="(min-width: 1024px) 800px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  {currentItem.image.caption ? (
                    <figcaption className="text-sm text-ink-muted">
                      {currentItem.image.caption}
                    </figcaption>
                  ) : null}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink"
                      aria-label="Previous photo"
                      onClick={() => goTo(-1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink"
                      aria-label="Next photo"
                      onClick={() => goTo(1)}
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
      ) : null}
    </section>
  );
}

type PhotoCardProps = {
  item: FactoryEssayItem;
  onOpen: () => void;
};

function PhotoCard({ item, onOpen }: PhotoCardProps) {
  const ratio = item.image.aspectRatio ?? 3 / 2;
  const analyticsRef = useAnalyticsObserver<HTMLDivElement>(`FactoryEssaySeen:${item.image.id}`, {
    threshold: 0.3,
  });

  return (
    <div ref={analyticsRef} data-analytics-id={`FactoryEssaySeen:${item.image.id}`}>
      <button
        type="button"
        className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card focus-ring"
        style={{ aspectRatio: ratio }}
        onClick={onOpen}
        aria-label={`Open photo essay item: ${item.image.alt}`}
      >
        <Image
          src={item.image.url}
          alt={item.image.alt}
          fill
          sizes="(min-width: 1024px) 360px, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
          Expand
        </span>
      </button>
    </div>
  );
}
