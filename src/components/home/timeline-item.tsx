"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { FittingStage } from "@/types/content";
import { choreoDistance, dreamyPace } from "@/lib/choreo";
import { ChoreoGroup } from "@/components/ui";
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

const resolveStaggerForSpan = (durationMs: number, count: number, span: number) => {
  if (count <= 1) return 0;
  return Math.round((durationMs * span) / (count - 1));
};

function TimelineContent({ stage, isPinned }: TimelineContentProps) {
  const ratio = stage.media.aspectRatio ?? 3 / 2;
  const bodyLines = stage.body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <ChoreoGroup
        effect="scale-parallax"
        distance={choreoDistance.base}
        scaleFrom={1.02}
        itemAsChild
      >
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
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
      </ChoreoGroup>
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.tight}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-3"
      >
        <Text size="button" className="text-ink-muted">
          Stage {stage.order}
        </Text>
        <Heading level={3} className="type-body-title text-ink">
          {stage.title}
        </Heading>
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          durationMs={dreamyPace.lineMs}
          easing={dreamyPace.easing}
          staggerMs={resolveStaggerForSpan(
            dreamyPace.enterMs,
            bodyLines.length,
            dreamyPace.staggerSpan,
          )}
          className="space-y-2"
        >
          {bodyLines.map((line, index) => (
            <Text key={`stage-body-${stage.id}-${index}`} className="type-body text-ink-muted">
              {line}
            </Text>
          ))}
        </ChoreoGroup>
        {stage.media.caption ? (
          <Text size="caption" className="text-ink-muted" leading="normal">
            {stage.media.caption}
          </Text>
        ) : null}
      </ChoreoGroup>
    </div>
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
