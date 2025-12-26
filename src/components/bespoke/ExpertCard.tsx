"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import type { Expert } from "@/types/build";
import { logAnalytics } from "@/lib/analytics";
import { Heading, Text } from "@/components/ui";

type ExpertCardProps = Readonly<{
  expert: Expert;
}>;

export function ExpertCard({ expert }: ExpertCardProps) {
  const ratio = expert.headshot.aspectRatio ?? 3 / 4;
  const [open, setOpen] = useState(false);

  return (
    <article
      data-analytics-id={`BuildExpert:${expert.id}`}
      className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-5"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={expert.headshot.url}
          alt={expert.headshot.alt}
          fill
          sizes="(min-width: 1280px) 320px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-4 space-y-1">
        <Heading level={3} size="sm" className="text-ink">
          {expert.name}
        </Heading>
        <Text size="xs" muted className="font-semibold">
          {expert.role}
        </Text>
        <Text size="md" muted leading="relaxed">
          {expert.bioShort}
        </Text>
        {expert.quote ? (
          <blockquote className="border-l-2 border-perazzi-red/40 pl-3 text-[13px] sm:text-sm italic leading-relaxed text-ink">
            “{expert.quote}”
          </blockquote>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-6">
        {expert.profileHref ? (
          <a
            href={expert.profileHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
          >
            Meet {expert.name.split(" ")[0]}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring"
            onClick={() => logAnalytics(`ExpertBio:${expert.id}`)}
          >
            Full bio
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/55 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
            <div className="max-w-lg rounded-2xl border border-border bg-card/95 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl focus:outline-none sm:rounded-3xl sm:p-6">
                <Heading asChild level={3} size="sm" className="text-ink">
                  <Dialog.Title>{expert.name}</Dialog.Title>
                </Heading>
                <Text asChild size="sm" muted className="mt-1">
                  <Dialog.Description>{expert.role}</Dialog.Description>
                </Text>
                <Text size="md" muted leading="relaxed" className="mt-4">
                  {expert.bioShort}
                </Text>
                <Dialog.Close className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring">
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
