"use client";

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useRef } from "react";

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

type SanityDetailsDrawerProps = {
  open: boolean;
  cards: InfoCard[];
  selectedCard?: InfoCard | null;
  loading?: boolean;
  error?: string | null;
  onSelect?: (card: InfoCard) => void;
  onClose?: () => void;
};

export function SanityDetailsDrawer({ open, cards, selectedCard, loading, error, onSelect, onClose }: SanityDetailsDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        ref={backdropRef}
        className={clsx(
          "fixed inset-0 z-30 h-full w-full bg-black/30 transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={() => onClose?.()}
      />
      <div
        ref={containerRef}
        className={clsx(
          "fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-subtle bg-card shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
        tabIndex={-1}
        role="dialog"
        aria-label="Sanity Data"
      >
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Sanity Data</p>
            <p className="text-sm text-ink">Details for the current step</p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-subtle bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
            >
              Close
            </button>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : loading ? (
            <p className="text-sm text-ink-muted">Loading details…</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-ink-muted">No details available.</p>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <button
                  key={`${card.id}-${card.optionValue ?? ""}`}
                  type="button"
                  onClick={() => onSelect?.(card)}
                  className={clsx(
                    "w-full text-left transition",
                    selectedCard?.id === card.id ? "border-ink bg-subtle/50" : "border-subtle hover:border-ink",
                    "flex flex-col rounded-2xl border bg-card p-3 text-sm text-ink shadow-sm",
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
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-perazzi-red">View more</span>
                    </div>
                    {card.description ? <p className="text-sm text-ink-muted line-clamp-3">{card.description}</p> : null}
                    {card.platform ? (
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Platform: {card.platform}</p>
                    ) : null}
                    {card.grade ? (
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Grade: {card.grade}</p>
                    ) : null}
                    {card.gauges?.length ? (
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                        Gauges: {card.gauges.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
