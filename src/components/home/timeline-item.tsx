"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { FittingStage } from "@/types/content";

type TimelineItemProps = {
  stage: FittingStage;
  active?: boolean;
  layout?: "pinned" | "stacked";
  animationsEnabled?: boolean;
};

export function TimelineItem({
  stage,
  active = false,
  layout = "stacked",
  animationsEnabled = true,
}: TimelineItemProps) {
  const ratio = stage.media.aspectRatio ?? 4 / 3;
  const Wrapper = layout === "pinned" && animationsEnabled ? motion.article : "article";

  const content = (
    <>
      <div
        className="relative w-full overflow-hidden rounded-xl bg-neutral-200"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={stage.media.url}
          alt={stage.media.alt}
          fill
          sizes={layout === "pinned" ? "(min-width: 1024px) 560px, 100vw" : "(min-width: 640px) 320px, 100vw"}
          className="object-cover"
          loading={layout === "pinned" && stage.order === 1 ? "eager" : "lazy"}
        />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
        Stage {stage.order}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{stage.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{stage.body}</p>
      {stage.media.caption ? (
        <p className="mt-3 text-xs text-ink-muted">{stage.media.caption}</p>
      ) : null}
    </>
  );

  if (layout === "pinned") {
    if (animationsEnabled) {
      return (
        <Wrapper
          key={stage.id}
          className="absolute inset-0 rounded-3xl bg-card/80 p-6 shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: active ? 1 : 0,
            y: active ? 0 : 30,
            pointerEvents: active ? "auto" : "none",
          }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        >
          {content}
        </Wrapper>
      );
    }
    return (
      <article className="absolute inset-0 rounded-3xl bg-card/80 p-6 shadow-xl">
        {content}
      </article>
    );
  }

  return (
    <article className="space-y-0 rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm">
      {content}
    </article>
  );
}
