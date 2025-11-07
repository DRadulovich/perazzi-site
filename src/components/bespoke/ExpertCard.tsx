"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import type { Expert } from "@/types/build";

type ExpertCardProps = {
  expert: Expert;
};

export function ExpertCard({ expert }: ExpertCardProps) {
  const ratio = expert.headshot.aspectRatio ?? 3 / 4;
  const [open, setOpen] = useState(false);

  return (
    <article
      data-analytics-id={`BuildExpert:${expert.id}`}
      className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-neutral-200"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={expert.headshot.url}
          alt={expert.headshot.alt}
          fill
          sizes="(min-width: 1024px) 260px, 100vw"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-lg font-semibold text-ink">{expert.name}</h3>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          {expert.role}
        </p>
        <p className="text-sm text-ink-muted">{expert.bioShort}</p>
        {expert.quote ? (
          <blockquote className="border-l-2 border-perazzi-red/40 pl-3 text-sm italic text-ink">
            “{expert.quote}”
          </blockquote>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-6">
        {expert.profileHref ? (
          <a
            href={expert.profileHref}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
          >
            Meet {expert.name.split(" ")[0]}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink focus-ring"
            onClick={() => console.log(`[analytics] ExpertBio:${expert.id}`)}
          >
            Full bio
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
              <div className="max-w-lg rounded-3xl bg-card p-6 shadow-2xl focus:outline-none">
                <Dialog.Title className="text-lg font-semibold text-ink">
                  {expert.name}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-ink-muted">
                  {expert.role}
                </Dialog.Description>
                <p className="mt-4 text-sm text-ink-muted">
                  {expert.bioShort}
                </p>
                <Dialog.Close className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.3em] text-ink focus-ring">
                  Close
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </article>
  );
}
