"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import Image from "next/image";
import type { HeritageEvent } from "@/types/heritage";
import { logAnalytics } from "@/lib/analytics";

type MilestoneDetailDrawerProps = {
  event: HeritageEvent;
  triggerLabel?: string;
};

export function MilestoneDetailDrawer({
  event,
  triggerLabel = "Learn more",
}: MilestoneDetailDrawerProps) {
  const [open, setOpen] = useState(false);
  const media = event.media;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          logAnalytics(`TimelineLearnMore:${event.id}`);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink focus-ring"
        >
          {triggerLabel}
          <span aria-hidden="true">→</span>
        </button>
      </Dialog.Trigger>
      {open ? (
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-y-0 right-0 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-card p-6 shadow-2xl focus:outline-none sm:rounded-l-3xl">
            <Dialog.Title className="text-lg font-semibold text-ink">
              {event.title}
            </Dialog.Title>
            <Dialog.Description className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              {event.date}
            </Dialog.Description>
            {media ? (
              <figure className="space-y-3">
                <div
                  className="relative overflow-hidden rounded-2xl bg-neutral-200"
                  style={{ aspectRatio: media.aspectRatio ?? 16 / 9 }}
                >
                  <Image
                    src={media.url}
                    alt={media.alt}
                    fill
                    sizes="(min-width: 768px) 440px, 100vw"
                    className="object-cover"
                  />
                </div>
                {media.caption ? (
                  <figcaption className="text-xs text-ink-muted">
                    {media.caption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}
            <div
              className="prose prose-sm max-w-none text-ink"
              dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
            />
            {event.links ? (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                  Connected stories
                </p>
                <ul className="space-y-2 text-sm text-ink">
                  {event.links.articles?.map((article) => (
                    <li key={article.id}>
                      <a
                        href={`/${article.slug}`}
                        className="focus-ring inline-flex items-center gap-2 text-perazzi-red hover:underline"
                      >
                        {article.title}
                        <span aria-hidden="true">→</span>
                      </a>
                    </li>
                  ))}
                  {event.links.platforms?.map((platform) => (
                    <li key={platform.id}>
                      <a
                        href={`/shotguns/${platform.slug}`}
                        className="focus-ring inline-flex items-center gap-2 text-perazzi-red hover:underline"
                      >
                        {platform.title}
                        <span aria-hidden="true">→</span>
                      </a>
                    </li>
                  ))}
                  {event.links.champions?.map((champion) => (
                    <li key={champion.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="text-ink">{champion.name}</span>
                        <span className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                          Champion
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Dialog.Close className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink focus-ring">
              Close
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  );
}
