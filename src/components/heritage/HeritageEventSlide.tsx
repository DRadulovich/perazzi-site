"use client";

import * as React from "react";
import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { Button, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { HeritageEvent, HeritageEventLink } from "@/types/heritage";
import * as Dialog from "@radix-ui/react-dialog";

export type HeritageEventSlideProps = Readonly<{
  event: HeritageEvent;
  className?: string;
}>;

export function HeritageEventSlide({
  event,
  className,
}: HeritageEventSlideProps) {
  const mediaUrl = event.media?.url;
  const analyticsRef = useAnalyticsObserver<HTMLElement>(`HeritageEventSeen:${event.id}`);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const hasSummary = Boolean(event.summaryPortableText?.length || event.summaryHtml);

  const renderSummary = (className: string) => {
    if (event.summaryPortableText?.length) {
      return <PortableText className={className} blocks={event.summaryPortableText} />;
    }
    if (event.summaryHtml) {
      return <SafeHtml className={className} html={event.summaryHtml} />;
    }
    return null;
  };

  return (
    <>
      <article
        ref={analyticsRef}
        data-analytics-id={`HeritageEventSeen:${event.id}`}
        className={cn(
          "flex h-full w-full shrink-0 flex-col",
          "px-4 sm:px-6 lg:px-10",
          "transition-colors duration-200 ease-out",
          className,
        )}
      >
        <div
          className={cn(
            "flex h-full w-full flex-col md:flex-row",
            "mx-auto max-w-6xl rounded-2xl border border-white/10 bg-black/60 shadow-soft backdrop-blur-sm",
          )}
        >
          <div
            className={cn(
              "flex w-full items-stretch p-4 sm:p-6 lg:p-8",
            "border-b border-white/10 md:w-1/2 md:border-b-0 md:border-r md:border-white/10",
            )}
          >
            {mediaUrl ? (
              <div className="relative h-full w-full min-h-60 overflow-hidden rounded-2xl border border-white/15 bg-(--color-canvas)">
                <Image
                  src={mediaUrl}
                  alt={event.media?.alt ?? event.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <Text
                asChild
                size="xs"
                className="flex w-full max-w-xl items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 tracking-[0.25em] text-neutral-500"
                leading="normal"
              >
                <div>Perazzi archive</div>
              </Text>
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
                <Text size="xs" className="tracking-[0.28em] text-neutral-400" leading="normal">
                  {event.date}
                </Text>
                <Heading level={3} size="sm" className="tracking-tight text-neutral-50">
                  {event.title}
                </Heading>
              </header>

              {hasSummary
                ? renderSummary(
                  "hidden md:block prose prose-invert max-w-none text-sm leading-relaxed text-neutral-200 prose-p:mb-3 prose-p:mt-0 prose-strong:text-neutral-50 prose-em:text-neutral-200",
                )
                : null}

              {/* Mobile-only Read More button to open full text modal */}
              {hasSummary ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 md:hidden min-h-10 rounded-full border border-white/30 px-4 text-neutral-100 hover:border-white hover:bg-white/10"
                  onClick={() => { setIsModalOpen(true); }}
                >
                  Read full story
                </Button>
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
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100 md:hidden" />
          <Dialog.Content
            aria-labelledby={`heritage-event-modal-${event.id}`}
            className="fixed inset-0 z-60 flex h-full w-full items-end justify-center bg-transparent p-4 outline-none transition duration-200 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2 data-[state=open]:opacity-100 data-[state=open]:translate-y-0 md:hidden"
          >
            <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-black text-neutral-100 shadow-elevated">
              <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
                <Text size="xs" className="tracking-[0.28em] text-neutral-400" leading="normal">
                  {event.date}
                </Text>
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full border border-white/30 px-3 text-neutral-100 hover:border-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </Dialog.Close>
              </div>
              <div className="space-y-3 overflow-y-auto px-4 pt-3 pb-4">
                <Heading
                  id={`heritage-event-modal-${event.id}`}
                  level={3}
                  size="sm"
                  className="tracking-tight text-neutral-50"
                >
                  {event.title}
                </Heading>
                {hasSummary
                  ? renderSummary(
                    "prose prose-invert max-w-none text-sm leading-relaxed text-neutral-200 prose-p:mb-3 prose-p:mt-0 prose-strong:text-neutral-50 prose-em:text-neutral-200",
                  )
                  : null}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
