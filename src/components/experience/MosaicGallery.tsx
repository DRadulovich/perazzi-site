"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { FactoryAsset } from "@/types/content";
import type { MosaicUi } from "@/types/experience";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import { Heading, Section, Text } from "@/components/ui";

type MosaicGalleryProps = {
  readonly assets: readonly FactoryAsset[];
  readonly mosaicUi: MosaicUi;
};

type MosaicLightboxProps = {
  readonly assets: readonly FactoryAsset[];
  readonly openIndex: number | null;
  readonly currentAsset: FactoryAsset | undefined;
  readonly motionEnabled: boolean;
  readonly onClose: () => void;
  readonly onNavigate: (direction: 1 | -1) => void;
};

type MosaicLightboxContentProps = {
  readonly assets: readonly FactoryAsset[];
  readonly openIndex: number | null;
  readonly currentAsset: FactoryAsset | undefined;
  readonly motionEnabled: boolean;
  readonly onNavigate: (direction: 1 | -1) => void;
};

type MosaicLightboxFrameProps = {
  readonly assets: readonly FactoryAsset[];
  readonly openIndex: number;
  readonly currentAsset: FactoryAsset;
  readonly motionEnabled: boolean;
  readonly onNavigate: (direction: 1 | -1) => void;
};

const MotionSection = motion(Section);

const fadeMotion = { opacity: 0 };
const figureMotion = { opacity: 0, y: 18, scale: 0.985, filter: "blur(14px)" };

function getFadeMotionProps(motionEnabled: boolean) {
  if (!motionEnabled) {
    return { initial: false as const };
  }

  return {
    initial: fadeMotion,
    exit: fadeMotion,
    transition: homeMotion.revealFast,
  };
}

function getFigureMotionProps(motionEnabled: boolean) {
  if (!motionEnabled) {
    return { initial: false as const };
  }

  return {
    initial: figureMotion,
    exit: figureMotion,
    transition: homeMotion.revealFast,
  };
}

function MosaicLightboxContent({
  assets,
  openIndex,
  currentAsset,
  motionEnabled,
  onNavigate,
}: MosaicLightboxContentProps) {
  return (
    <AnimatePresence>
      {openIndex !== null && currentAsset ? (
        <MosaicLightboxFrame
          assets={assets}
          openIndex={openIndex}
          currentAsset={currentAsset}
          motionEnabled={motionEnabled}
          onNavigate={onNavigate}
        />
      ) : null}
    </AnimatePresence>
  );
}

function MosaicLightboxFrame({
  assets,
  openIndex,
  currentAsset,
  motionEnabled,
  onNavigate,
}: MosaicLightboxFrameProps) {
  const fadeMotionProps = getFadeMotionProps(motionEnabled);
  const figureMotionProps = getFigureMotionProps(motionEnabled);

  return (
    <>
      <Dialog.Overlay forceMount asChild>
        <motion.div
          className="fixed inset-0 bg-black/55 backdrop-blur-sm"
          {...fadeMotionProps}
          animate={{ opacity: 1 }}
        >
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        </motion.div>
      </Dialog.Overlay>

      <Dialog.Content forceMount asChild>
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4 focus:outline-none"
          {...fadeMotionProps}
          animate={{ opacity: 1 }}
        >
          <Dialog.Title className="sr-only">Experience mosaic photo</Dialog.Title>
          <Dialog.Description className="sr-only">
            {currentAsset.caption ?? currentAsset.alt ?? "Gallery image"}
          </Dialog.Description>

          <motion.figure
            className="group relative flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl sm:rounded-3xl sm:p-6"
            {...figureMotionProps}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          >
            <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
            <p className="sr-only" aria-live="polite">
              Photo {openIndex + 1} of {assets.length}
            </p>
            <div
              className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
              style={{ "--aspect-ratio": currentAsset.aspectRatio ?? 3 / 2 }}
            >
              <Image
                src={currentAsset.url}
                alt={currentAsset.alt}
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                priority
              />
              <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
            </div>
            {currentAsset.caption ? (
              <figcaption className="type-body-sm text-ink-muted">
                {currentAsset.caption}
              </figcaption>
            ) : null}
            <div className="flex justify-between">
              <button
                type="button"
                className="rounded-full border border-border/70 bg-card/60 px-4 py-2 type-button text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 hover:translate-x-0.5 focus-ring"
                onClick={() => { onNavigate(-1); }}
                aria-label="Previous photo"
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-full border border-border/70 bg-card/60 px-4 py-2 type-button text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 hover:translate-x-0.5 focus-ring"
                onClick={() => { onNavigate(1); }}
                aria-label="Next photo"
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
  );
}

function MosaicLightbox({
  assets,
  openIndex,
  currentAsset,
  motionEnabled,
  onClose,
  onNavigate,
}: MosaicLightboxProps) {
  return (
    <Dialog.Root
      open={openIndex !== null}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        onClose();
      }}
    >
      <Dialog.Portal forceMount>
        <MosaicLightboxContent
          assets={assets}
          openIndex={openIndex}
          currentAsset={currentAsset}
          motionEnabled={motionEnabled}
          onNavigate={onNavigate}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MosaicGallery({ assets, mosaicUi }: MosaicGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
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

  useEffect(() => {
    if (openIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex]);

  if (assets.length === 0) return null;

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="MosaicGallerySeen"
      padding="md"
      className="space-y-6"
      aria-labelledby="mosaic-gallery-heading"
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <motion.div
        className="space-y-2"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Text size="label-tight" muted>
          {eyebrow}
        </Text>
        <Heading id="mosaic-gallery-heading" level={2} size="xl" className="text-ink">
          {heading}
        </Heading>
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
        {assets.map((asset, index) => (
          <motion.li
            key={asset.id}
            variants={{
              hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
            }}
          >
            <button
              type="button"
              className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:border-ink/20 hover:bg-card/85 focus-ring sm:bg-card/80 aspect-dynamic"
              style={{ "--aspect-ratio": asset.aspectRatio ?? 4 / 3 }}
              onClick={() => { openLightbox(index); }}
              aria-label={`Open photo ${index + 1}`}
            >
              <Image
                src={asset.url}
                alt={asset.alt}
                fill
                sizes="(min-width: 1024px) 360px, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
            </button>
          </motion.li>
        ))}
      </motion.ul>
      <MosaicLightbox
        assets={assets}
        openIndex={openIndex}
        currentAsset={currentAsset}
        motionEnabled={motionEnabled}
        onClose={closeLightbox}
        onNavigate={goTo}
      />
    </MotionSection>
  );
}
