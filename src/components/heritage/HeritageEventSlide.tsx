"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { HeritageEvent, HeritageEventLink } from "@/types/heritage";
import { createPortal } from "react-dom";

export type HeritageEventSlideProps = Readonly<{
  event: HeritageEvent;
  className?: string;
}>;

export function HeritageEventSlide({
  event,
  className,
}: HeritageEventSlideProps) {
  const hasMedia = Boolean(event.media?.url);
  const analyticsRef = useAnalyticsObserver<HTMLElement>(`HeritageEventSeen:${event.id}`);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <article
        ref={analyticsRef}
        data-analytics-id={`HeritageEventSeen:${event.id}`}
        className={cn(
          "flex h-full w-full shrink-0 flex-col",
          "px-4 sm:px-6 lg:px-10",
          "transition-colors transition-shadow duration-200 ease-out",
          className,
        )}
      >
        <div
          className={cn(
            "flex h-full w-full flex-col md:flex-row",
            "mx-auto max-w-6xl rounded-2xl border border-white/10 bg-black/60 shadow-sm backdrop-blur-sm",
          )}
        >
          <div
            className={cn(
              "flex w-full items-stretch p-4 sm:p-6 lg:p-8",
              "border-b border-white/10 md:w-1/2 md:border-b-0 md:border-r md:border-white/10",
            )}
          >
            {hasMedia ? (
              <div className="relative h-full w-full min-h-[240px] overflow-hidden rounded-2xl border border-white/15 bg-[color:var(--color-canvas)]">
                <Image
                  src={event.media!.url}
                  alt={event.media!.alt ?? event.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex w-full max-w-xl items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-neutral-500">
                Perazzi archive
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex w-full items-center p-4 sm:p-6 lg:p-8",
              "md:w-1/2",
            )}
          >
            <div className="w-full space-y-5">
              <header className="space-y-1">
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-neutral-400">
                  {event.date}
                </p>
                <h3 className="text-base sm:text-xl font-semibold tracking-tight text-neutral-50">
                  {event.title}
                </h3>
              </header>

              {event.summaryHtml ? (
                <div
                  className="hidden md:block prose prose-invert max-w-none text-sm leading-relaxed text-neutral-200 prose-p:mb-3 prose-p:mt-0 prose-strong:text-neutral-50 prose-em:text-neutral-200"
                  dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
                />
              ) : null}

              {/* Mobile-only Read More button to open full text modal */}
              {event.summaryHtml ? (
                <button
                  type="button"
                  className="mt-2 inline-flex md:hidden min-h-10 items-center justify-center rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-100 focus-ring"
                  onClick={() => setIsModalOpen(true)}
                >
                  Read full story
                </button>
              ) : null}

              {Array.isArray(event.links) && event.links.length > 0 ? (
                <div className="hidden md:flex flex-wrap gap-3">
                  {event.links.map((link: HeritageEventLink) => {
                    const isExternal = link.external ?? /^https?:\/\//.test(link.href);
                    return (
                      <a
                        key={`${event.id}-${link.href}-${link.label}`}
                        href={link.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-neutral-100 transition-colors hover:border-white hover:bg-white/10 focus-ring"
                      >
                        <span>{link.label}</span>
                        {isExternal ? (
                          <span aria-hidden="true" className="text-[0.55rem]">
                            ↗
                          </span>
                        ) : null}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      {/* Mobile-only text-only modal for full summary in a portal */}
      {isClient && isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 md:hidden">
              {/* Backdrop */}
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-0 bg-black/60"
                aria-hidden="true"
                onClick={() => setIsModalOpen(false)}
              />

              {/* Dialog */}
              <dialog
                open
                aria-modal="true"
                aria-labelledby={`heritage-event-modal-${event.id}`}
                onCancel={() => setIsModalOpen(false)}
                className="relative z-10 m-0 flex h-full w-full items-end justify-center bg-transparent p-4"
              >
                <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-black text-neutral-100 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-400">
                      {event.date}
                    </p>
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-100 focus-ring"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-3 overflow-y-auto px-4 pt-3 pb-4">
                    <h3
                      id={`heritage-event-modal-${event.id}`}
                      className="text-base sm:text-lg font-semibold tracking-tight text-neutral-50"
                    >
                      {event.title}
                    </h3>
                    {event.summaryHtml ? (
                      <div
                        className="prose prose-invert max-w-none text-sm leading-relaxed text-neutral-200 prose-p:mb-3 prose-p:mt-0 prose-strong:text-neutral-50 prose-em:text-neutral-200"
                        dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
                      />
                    ) : null}
                  </div>
                </div>
              </dialog>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
