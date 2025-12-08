"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { FittingStage } from "@/types/content";

type TimelineItemProps = {
  readonly stage: FittingStage;
  readonly active?: boolean;
  readonly layout?: "pinned" | "stacked";
  readonly animationsEnabled?: boolean;
};

type TimelineContentProps = {
  readonly stage: FittingStage;
  readonly isPinned: boolean;
};

function TimelineContent({ stage, isPinned }: TimelineContentProps) {
  const ratio = stage.media.aspectRatio ?? 3 / 2;

  return (
    <>
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={stage.media.url}
          alt={stage.media.alt}
          fill
          sizes={isPinned ? "(min-width: 1024px) 560px, 100vw" : "(min-width: 640px) 320px, 100vw"}
          className="object-cover"
          loading={isPinned && stage.order === 1 ? "eager" : "lazy"}
        />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
        Stage {stage.order}
      </p>
      <h3 className="mt-2 text-base sm:text-lg font-semibold text-ink">
        {stage.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{stage.body}</p>
      {stage.media.caption ? (
        <p className="mt-3 text-xs text-ink-muted">{stage.media.caption}</p>
      ) : null}
    </>
  );
}

export function TimelineItem({
  stage,
  active = false,
  layout = "stacked",
  animationsEnabled = true,
}: TimelineItemProps) {
  const isPinned = layout === "pinned";

  if (isPinned && animationsEnabled) {
    return (
      <motion.article
        key={stage.id}
        className="absolute inset-0 rounded-3xl border border-border/70 bg-card/75 p-4 sm:p-6 shadow-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{
          opacity: active ? 1 : 0,
          y: active ? 0 : 30,
          pointerEvents: active ? "auto" : "none",
        }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      >
        <TimelineContent stage={stage} isPinned />
      </motion.article>
    );
  }

  if (isPinned) {
    return (
      <article className="absolute inset-0 rounded-3xl border border-border/70 bg-card/75 p-4 sm:p-6 shadow-sm">
        <TimelineContent stage={stage} isPinned />
      </article>
    );
  }

  return (
    <article className="space-y-0 rounded-2xl border-none bg-card/0 p-4 shadow-none sm:rounded-3xl sm:p-6">
      <TimelineContent stage={stage} isPinned={false} />
    </article>
  );
}
