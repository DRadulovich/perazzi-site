"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { HeritageEvent, HeritageEventLink } from "@/types/heritage";

export type HeritageEventSlideProps = {
  event: HeritageEvent;
  className?: string;
};

export function HeritageEventSlide({
  event,
  className,
}: HeritageEventSlideProps) {
  const hasMedia = Boolean(event.media?.url);

  return (
    <article
      className={cn(
        "flex h-full w-full shrink-0 flex-col",
        "px-4 sm:px-8 lg:px-12",
        "transition-colors transition-shadow duration-200 ease-out",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col md:flex-row",
          "mx-auto max-w-6xl rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm",
        )}
      >
        <div
          className={cn(
            "flex w-full items-stretch p-4 sm:p-6 lg:p-8",
            "border-b border-white/10 md:w-1/2 md:border-b-0 md:border-r md:border-white/10",
          )}
        >
          {hasMedia ? (
            <div className="relative h-full w-full min-h-[240px] overflow-hidden rounded-xl border border-white/15 bg-black/30">
              <Image
                src={event.media!.url}
                alt={event.media!.alt ?? event.title}
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex w-full max-w-xl items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 text-[0.65rem] uppercase tracking-[0.25em] text-neutral-500">
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
              <p className="text-[0.65rem] uppercase tracking-[0.28em] text-neutral-400">
                {event.date}
              </p>
              <h3 className="text-xl font-semibold tracking-tight text-neutral-50 md:text-2xl">
                {event.title}
              </h3>
            </header>

            {event.summaryHtml ? (
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed text-neutral-200 prose-p:mb-3 prose-p:mt-0 prose-strong:text-neutral-50 prose-em:text-neutral-200"
                dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
              />
            ) : null}

            {Array.isArray(event.links) && event.links.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {event.links.map((link: HeritageEventLink) => {
                  const isExternal = link.external ?? /^https?:\/\//.test(link.href);
                  return (
                    <a
                      key={`${event.id}-${link.href}-${link.label}`}
                      href={link.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-neutral-100 transition-colors hover:border-white hover:bg-white/10"
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
  );
}
