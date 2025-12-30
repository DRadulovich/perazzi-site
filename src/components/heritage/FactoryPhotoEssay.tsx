"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useMemo, useState } from "react";
import SafeHtml from "@/components/SafeHtml";
import Image from "next/image";
import type { FactoryEssayItem, FactoryEssayUi } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { Heading, Section, Text } from "@/components/ui";

type FactoryPhotoEssayProps = Readonly<{
  readonly items: readonly FactoryEssayItem[];
  readonly introHtml?: string;
  readonly ui: FactoryEssayUi;
}>;

export function FactoryPhotoEssay({ items, introHtml, ui }: FactoryPhotoEssayProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hasItems = items.length > 0;
  const sectionRef = useAnalyticsObserver<HTMLElement>("FactoryPhotoEssaySeen");
  const eyebrow = ui.eyebrow ?? "Factory essay";
  const heading = ui.heading ?? "Inside the Botticino atelier";

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

  const close = useCallback(() => { setOpenIndex(null); }, []);

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

  const currentItem = useMemo(() => {
    if (openIndex === null) {
      return undefined;
    }
    return items[openIndex];
  }, [items, openIndex]);

  return (
    <Section
      ref={sectionRef}
      data-analytics-id="FactoryPhotoEssaySeen"
      padding="md"
      className="space-y-6"
      aria-labelledby="factory-essay-heading"
    >
      <div className="space-y-2">
        <Text size="label-tight" className="text-ink-muted">
          {eyebrow}
        </Text>
        <Heading id="factory-essay-heading" level={2} size="xl" className="text-ink">
          {heading}
        </Heading>
        {introHtml ? (
          <SafeHtml
            className="type-section-subtitle max-w-3xl text-ink-muted"
            html={introHtml}
          />
        ) : null}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.id}>
            <PhotoCard item={item} onOpen={() => { handleOpen(index); }} />
          </li>
        ))}
      </ul>
      {hasItems ? (
        <Dialog.Root
          open={openIndex !== null}
          onOpenChange={(next) => {
            if (next) {
              return;
            }
            close();
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
            <Dialog.Content
              className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4 py-[15vh] sm:px-6 focus:outline-none"
            >
              <Dialog.Title className="sr-only">
                Factory photo detail
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {currentItem?.image.caption ?? currentItem?.image.alt}
              </Dialog.Description>
              {currentItem ? (
                <figure className="relative flex w-full max-w-5xl flex-col gap-3 rounded-2xl bg-card p-4 shadow-elevated max-h-[70vh] sm:rounded-3xl sm:p-6 sm:shadow-elevated">
                  <Text asChild className="sr-only" leading="normal">
                    <p aria-live="polite">
                      Photo {(openIndex ?? 0) + 1} of {items.length}
                    </p>
                  </Text>
                  <div
                    className="relative w-full flex-1 min-h-0 overflow-hidden rounded-2xl bg-[color:var(--color-canvas)] max-h-[calc(70vh-8rem)] aspect-dynamic"
                    style={{
                      "--aspect-ratio": currentItem.image.aspectRatio ?? 3 / 2,
                    }}
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
                  <Text asChild className="text-ink-muted">
                    <figcaption>{currentItem.image.caption}</figcaption>
                  </Text>
                  ) : null}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-border px-4 py-2 type-button text-ink"
                      aria-label="Previous photo"
                      onClick={() => { goTo(-1); }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-border px-4 py-2 type-button text-ink"
                      aria-label="Next photo"
                      onClick={() => { goTo(1); }}
                    >
                      Next
                    </button>
                  </div>
                  <Dialog.Close className="focus-ring absolute right-4 top-4 rounded-full border border-border bg-card px-4 py-2 type-button text-ink">
                    Close
                  </Dialog.Close>
                </figure>
              ) : null}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </Section>
  );
}

type PhotoCardProps = Readonly<{
  readonly item: FactoryEssayItem;
  readonly onOpen: () => void;
}>;

function PhotoCard({ item, onOpen }: PhotoCardProps) {
  const analyticsRef = useAnalyticsObserver<HTMLDivElement>(`FactoryEssaySeen:${item.image.id}`, {
    threshold: 0.3,
  });

  return (
    <div ref={analyticsRef} data-analytics-id={`FactoryEssaySeen:${item.image.id}`}>
      <button
        type="button"
        className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/10 focus-ring sm:border-border/70 sm:bg-card aspect-[3/2]"
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
        <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/60 px-3 py-2 type-button text-white">
          Expand
        </span>
      </button>
    </div>
  );
}
