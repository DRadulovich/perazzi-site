"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { FittingStage } from "@/types/content";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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
        className="relative w-full overflow-hidden rounded-2xl bg-[color:var(--color-canvas)] aspect-dynamic"
        style={{ "--aspect-ratio": ratio }}
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
      <Text size="xs" className="mt-4 font-semibold text-ink-muted" leading="normal">
        Stage {stage.order}
      </Text>
      <Heading level={3} size="sm" className="mt-2 text-ink">
        {stage.title}
      </Heading>
      <Text className="mt-2 text-ink-muted">{stage.body}</Text>
      {stage.media.caption ? (
        <Text size="sm" className="mt-3 text-ink-muted" leading="normal">
          {stage.media.caption}
        </Text>
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
        className="absolute inset-0 rounded-3xl border border-border/70 bg-card/70 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm sm:p-6"
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
      <article className="absolute inset-0 rounded-3xl border border-border/70 bg-card/70 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm sm:p-6">
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
