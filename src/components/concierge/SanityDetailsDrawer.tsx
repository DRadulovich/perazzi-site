"use client";

import Image from "next/image";
import clsx from "clsx";
import { type ReactNode, useEffect, useRef } from "react";

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

type SanityDetailsDrawerProps = Readonly<{
  open: boolean;
  cards: readonly InfoCard[];
  selectedCard?: InfoCard | null;
  loading?: boolean;
  error?: string | null;
  onSelect?: (card: InfoCard) => void;
  onClose?: () => void;
}>;

export function SanityDetailsDrawer({ open, cards, selectedCard, loading, error, onSelect, onClose }: SanityDetailsDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLButtonElement | null>(null);

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
    content = <p className="text-sm sm:text-base leading-relaxed text-red-600">{error}</p>;
  } else if (loading) {
    content = <p className="text-sm sm:text-base leading-relaxed text-ink-muted">Loading details…</p>;
  } else if (cards.length === 0) {
    content = <p className="text-sm sm:text-base leading-relaxed text-ink-muted">No details available.</p>;
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
              "flex flex-col rounded-2xl border p-3 text-sm sm:text-base text-ink shadow-sm backdrop-blur-sm focus-ring",
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
                <p className="text-base font-semibold">{card.title}</p>
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red">
                  View more
                </span>
              </div>
              {card.description ? (
                <p className="text-sm sm:text-base leading-relaxed text-ink-muted line-clamp-3">{card.description}</p>
              ) : null}
              {card.platform ? (
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">Platform: {card.platform}</p>
              ) : null}
              {card.grade ? (
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">Grade: {card.grade}</p>
              ) : null}
              {card.gauges?.length ? (
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">
                  Gauges: {card.gauges.join(", ")}
                </p>
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
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">Sanity Data</p>
            <p className="text-sm sm:text-base text-ink">Details for the current step</p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/60 px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted shadow-sm transition hover:border-ink/30 hover:bg-card/80 hover:text-ink focus-ring"
            >
              Close
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
