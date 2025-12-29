"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import type { FittingStage } from "@/types/build";
import SafeHtml from "@/components/SafeHtml";

const swallowPlayError = () => {};

const buildCaptionTrackSrc = (media: FittingStage["media"]) => {
  const caption = media.caption ?? media.alt;
  const vtt = caption
    ? `WEBVTT\n\n00:00.000 --> 99:59.000\n${caption}`
    : "WEBVTT";

  return `data:text/vtt,${encodeURIComponent(vtt)}`;
};

type BuildStepItemProps = Readonly<{
  step: FittingStage;
  index: number;
  onCtaClick?: (id: string) => void;
  layout?: "stacked" | "pinned";
}>;

export function BuildStepItem({
  step,
  index,
  onCtaClick,
  layout = "stacked",
}: BuildStepItemProps) {
  const ratio = step.media.aspectRatio ?? 3 / 2;
  const analyticsRef = useAnalyticsObserver(`BuildStepVisible:${step.id}`);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isPinned = layout === "pinned";

  const handleCta = () => {
    logAnalytics(`BuildStepCTA:${step.id}`);
    onCtaClick?.(step.id);
  };

  useEffect(() => {
    if (step.media.kind !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          video.play().catch(swallowPlayError);
        } else {
          video.pause();
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.5 });
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [step.media.kind]);

  const media = (
    <div
      className={`relative overflow-hidden rounded-2xl bg-(--color-canvas) ${
        isPinned ? "flex-1 h-full min-h-0 w-full" : "aspect-dynamic"
      }`}
      style={isPinned ? undefined : { "--aspect-ratio": ratio }}
    >
      {step.media.kind === "video" ? (
        <video
          ref={videoRef}
          src={step.media.url}
          poster={step.media.caption}
          controls
          playsInline
          className="h-full w-full object-cover"
        >
          <track
            kind="captions"
            label="Captions"
            src={buildCaptionTrackSrc(step.media)}
            default
          />
          Sorry, your browser does not support embedded videos.
        </video>
      ) : (
        <Image
          src={step.media.url}
          alt={step.media.alt}
          fill
          sizes={
            layout === "pinned"
              ? "(min-width: 1280px) 640px, (min-width: 1024px) 60vw, 100vw"
              : "(min-width: 1280px) 720px, (min-width: 1024px) 60vw, 100vw"
          }
          className="object-cover"
          loading={index === 0 ? "eager" : "lazy"}
        />
      )}
    </div>
  );

  const caption = step.captionHtml ? (
    <SafeHtml
      as="figcaption"
      className="rounded-2xl border border-border/70 bg-card/60 p-4 type-caption text-ink-muted shadow-soft backdrop-blur-sm"
      html={step.captionHtml}
    />
  ) : null;

  const header = (
    <header className="space-y-1">
      <Text size="label-tight" muted>
        Step {index + 1}
      </Text>
      <Heading level={3} size="md" className="text-ink">
        {step.title}
      </Heading>
    </header>
  );

  const description = (
    <SafeHtml
      className="prose prose-sm max-w-none leading-relaxed text-ink-muted"
      html={step.bodyHtml}
    />
  );

  const cta =
    step.ctaHref && step.ctaLabel ? (
      <Button
        asChild
        variant="secondary"
        size="lg"
        onClick={handleCta}
        className={isPinned ? "mt-auto self-start" : undefined}
      >
        <a href={step.ctaHref}>{step.ctaLabel}</a>
      </Button>
    ) : null;

  return (
    <article
      id={`step-${step.id}`}
      ref={analyticsRef}
      data-analytics-id={`BuildStepVisible:${step.id}`}
      className={
        isPinned
          ? "grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,3fr)] gap-6 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm sm:rounded-3xl sm:p-6"
          : "space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-6"
      }
      aria-label={`Step ${index + 1}: ${step.title}`}
    >
      {isPinned ? (
        <>
          <div className="flex min-h-0 flex-col gap-4">
            {header}
            {description}
            {cta}
          </div>
          <figure className="flex min-h-0 flex-col gap-4">
            {media}
            {caption}
          </figure>
        </>
      ) : (
        <>
          <figure className="space-y-3">
            {media}
            {caption}
          </figure>
          {header}
          {description}
          {cta}
        </>
      )}
    </article>
  );
}
