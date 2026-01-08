"use client";

import Image from "next/image";
import clsx from "clsx";
import { type ReactNode, useEffect, useRef } from "react";
import { Heading, Text } from "@/components/ui";

type InfoCard = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  fullImageUrl?: string | null;
  platform?: string | null;
  grade?: string | null;
  gauges?: string[];
  triggerTypes?: string[];
  recommendedPlatforms?: string[];
  popularModels?: string[];
  optionValue?: string;
};

type DrawerUi = {
  panelLabel?: string;
  panelTitle?: string;
  loadingMessage?: string;
  emptyMessage?: string;
  viewMoreLabel?: string;
  closeLabel?: string;
};

type SanityDetailsDrawerProps = Readonly<{
  open: boolean;
  cards: readonly InfoCard[];
  selectedCard?: InfoCard | null;
  loading?: boolean;
  error?: string | null;
  onSelect?: (card: InfoCard) => void;
  onClose?: () => void;
  ui?: DrawerUi;
}>;

export function SanityDetailsDrawer({
  open,
  cards,
  selectedCard,
  loading,
  error,
  onSelect,
  onClose,
  ui,
}: SanityDetailsDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLButtonElement | null>(null);
  const panelLabel = ui?.panelLabel ?? "Sanity Data";
  const panelTitle = ui?.panelTitle ?? "Details for the current step";
  const loadingMessage = ui?.loadingMessage ?? "Loading details…";
  const emptyMessage = ui?.emptyMessage ?? "No details available.";
  const viewMoreLabel = ui?.viewMoreLabel ?? "View more";
  const closeLabel = ui?.closeLabel ?? "Close";

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose?.();
        }
      };
      const target = typeof globalThis === "undefined" ? undefined : globalThis;
      target?.addEventListener("keydown", handleKey);
      return () => target?.removeEventListener("keydown", handleKey);
    }
    return undefined;
  }, [open, onClose]);

  let content: ReactNode;
  if (error) {
    content = (
      <Text className="text-red-600" leading="relaxed">
        {error}
      </Text>
    );
  } else if (loading) {
    content = (
      <Text className="text-ink-muted" leading="relaxed">
        {loadingMessage}
      </Text>
    );
  } else if (cards.length === 0) {
    content = (
      <Text className="text-ink-muted" leading="relaxed">
        {emptyMessage}
      </Text>
    );
  } else {
    content = (
      <div className="space-y-3">
        {cards.map((card) => (
          <button
            key={`${card.id}-${card.optionValue ?? ""}`}
            type="button"
            onClick={() => onSelect?.(card)}
            className={clsx(
              "w-full text-left transition",
              selectedCard?.id === card.id
                ? "border-ink/40 bg-card/85"
                : "border-border/70 bg-card/70 hover:border-ink/30 hover:bg-card/85",
              "flex flex-col rounded-2xl border p-3 text-ink shadow-soft backdrop-blur-sm focus-ring",
            )}
          >
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.title}
                width={400}
                height={240}
                className="h-32 w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <Heading level={3} size="sm">
                  {card.title}
                </Heading>
                <span className="type-label-tight text-perazzi-red">
                  {viewMoreLabel}
                </span>
              </div>
              {card.description ? (
                <Text className="text-ink-muted line-clamp-3" leading="relaxed">
                  {card.description}
                </Text>
              ) : null}
              {card.platform ? (
                <Text size="label-tight" className="text-ink-muted" leading="normal">
                  Platform: {card.platform}
                </Text>
              ) : null}
              {card.grade ? (
                <Text size="label-tight" className="text-ink-muted" leading="normal">
                  Grade: {card.grade}
                </Text>
              ) : null}
              {card.gauges?.length ? (
                <Text size="label-tight" className="text-ink-muted" leading="normal">
                  Gauges: {card.gauges.join(", ")}
                </Text>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        ref={backdropRef}
        tabIndex={-1}
        className={clsx(
          "fixed inset-0 z-30 h-full w-full bg-black/45 backdrop-blur-sm transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={() => onClose?.()}
      />
      <div
        ref={containerRef}
        className={clsx(
          "fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-border bg-card/95 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
        tabIndex={-1}
        aria-label="Sanity Data"
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div>
            <Text size="label-tight" className="text-ink-muted" leading="normal">
              {panelLabel}
            </Text>
            <Text className="text-ink" leading="normal">
              {panelTitle}
            </Text>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/60 px-3 py-2 type-button text-ink-muted shadow-soft transition hover:border-ink/30 hover:bg-card/80 hover:text-ink focus-ring"
            >
              {closeLabel}
            </button>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {content}
        </div>
      </div>
    </>
  );
}
