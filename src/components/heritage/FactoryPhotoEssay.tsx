"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import SafeHtml from "@/components/SafeHtml";
import Image from "next/image";
import type { FactoryEssayItem, FactoryEssayUi } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
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
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
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

  useLockBodyScroll(openIndex !== null);

  useEffect(() => {
    if (openIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(1);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [goTo, openIndex]);

  return (
    <Section
      id="factory-photo-essay"
      ref={sectionRef}
      data-analytics-id="FactoryPhotoEssaySeen"
      padding="md"
      className="space-y-6 scroll-mt-24"
      aria-labelledby="factory-essay-heading"
    >
      <motion.div
        className="space-y-2"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
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
      </motion.div>
      <motion.ul
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: motionEnabled ? 0.08 : 0 } },
        }}
      >
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
            }}
          >
            <PhotoCard item={item} onOpen={() => { handleOpen(index); }} />
          </motion.li>
        ))}
      </motion.ul>
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
          <Dialog.Portal forceMount>
            <AnimatePresence>
              {openIndex !== null && currentItem ? (
                <>
                  <Dialog.Overlay forceMount asChild>
                    <motion.div
                      className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                      initial={motionEnabled ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={motionEnabled ? { opacity: 0 } : undefined}
                      transition={motionEnabled ? homeMotion.revealFast : undefined}
                    >
                      <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
                    </motion.div>
                  </Dialog.Overlay>

                  <Dialog.Content forceMount asChild>
                    <motion.div
                      className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4 py-[15vh] sm:px-6 focus:outline-none"
                      initial={motionEnabled ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={motionEnabled ? { opacity: 0 } : undefined}
                      transition={motionEnabled ? homeMotion.revealFast : undefined}
                    >
                      <Dialog.Title className="sr-only">
                        Factory photo detail
                      </Dialog.Title>
                      <Dialog.Description className="sr-only">
                        {currentItem.image.caption ?? currentItem.image.alt}
                      </Dialog.Description>

                      <motion.figure
                        className="group relative flex w-full max-w-5xl flex-col gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl max-h-[72vh] sm:rounded-3xl sm:p-6"
                        initial={
                          motionEnabled
                            ? { opacity: 0, y: 18, scale: 0.985, filter: "blur(14px)" }
                            : false
                        }
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={
                          motionEnabled
                            ? { opacity: 0, y: 18, scale: 0.985, filter: "blur(14px)" }
                            : undefined
                        }
                        transition={motionEnabled ? homeMotion.revealFast : undefined}
                      >
                        <div className="pointer-events-none absolute inset-0 film-grain opacity-12" aria-hidden="true" />
                        <p className="sr-only" aria-live="polite">
                          Photo {(openIndex ?? 0) + 1} of {items.length}
                        </p>

                        <div
                          className="relative w-full flex-1 min-h-0 overflow-hidden rounded-2xl bg-[color:var(--color-canvas)] max-h-[calc(72vh-9rem)] aspect-dynamic"
                          style={{
                            "--aspect-ratio": currentItem.image.aspectRatio ?? 3 / 2,
                          }}
                        >
                          <Image
                            src={currentItem.image.url}
                            alt={currentItem.image.alt}
                            fill
                            sizes="(min-width: 1024px) 800px, 100vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                            priority
                          />
                          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                        </div>
                        {currentItem.image.caption ? (
                          <Text asChild className="text-ink-muted">
                            <figcaption>{currentItem.image.caption}</figcaption>
                          </Text>
                        ) : null}
                        <div className="flex justify-between">
                          <button
                            type="button"
                            className="rounded-full border border-border/70 bg-card/60 px-4 py-2 type-button text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 hover:translate-x-0.5 focus-ring"
                            aria-label="Previous photo"
                            onClick={() => { goTo(-1); }}
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-border/70 bg-card/60 px-4 py-2 type-button text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 hover:translate-x-0.5 focus-ring"
                            aria-label="Next photo"
                            onClick={() => { goTo(1); }}
                          >
                            Next
                          </button>
                        </div>
                        <Dialog.Close className="absolute right-4 top-4 rounded-full border border-border/70 bg-card/60 px-4 py-2 type-button text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring">
                          Close
                        </Dialog.Close>
                      </motion.figure>
                    </motion.div>
                  </Dialog.Content>
                </>
              ) : null}
            </AnimatePresence>
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
        className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:border-ink/20 hover:bg-card/85 focus-ring sm:bg-card/80 aspect-[3/2]"
        onClick={onOpen}
        aria-label={`Open photo essay item: ${item.image.alt}`}
      >
        <Image
          src={item.image.url}
          alt={item.image.alt}
          fill
          sizes="(min-width: 1024px) 360px, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
        <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/60 px-3 py-2 type-button text-white">
          Expand
        </span>
      </button>
    </div>
  );
}
