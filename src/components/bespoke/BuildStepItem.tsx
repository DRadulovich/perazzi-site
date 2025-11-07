"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { FittingStage } from "@/types/build";

type BuildStepItemProps = {
  step: FittingStage;
  index: number;
  onCtaClick?: (id: string) => void;
};

export function BuildStepItem({ step, index, onCtaClick }: BuildStepItemProps) {
  const ratio = step.media.aspectRatio ?? 4 / 3;
  const analyticsRef = useAnalyticsObserver(`BuildStepVisible:${step.id}`);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleCta = () => {
    console.log(`[analytics] BuildStepCTA:${step.id}`);
    onCtaClick?.(step.id);
  };

  useEffect(() => {
    if (step.media.kind !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [step.media.kind]);

  return (
    <article
      id={`step-${step.id}`}
      ref={analyticsRef}
      data-analytics-id={`BuildStepVisible:${step.id}`}
      className="space-y-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
      aria-label={`Step ${index + 1}: ${step.title}`}
    >
      <figure className="space-y-3">
        <div
          className="relative overflow-hidden rounded-2xl bg-neutral-200"
          style={{ aspectRatio: ratio }}
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
              Sorry, your browser does not support embedded videos.
            </video>
          ) : (
            <Image
              src={step.media.url}
              alt={step.media.alt}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          )}
        </div>
        {step.captionHtml ? (
          <figcaption
            className="rounded-xl border border-border/60 bg-card/60 p-4 text-xs text-ink-muted"
            dangerouslySetInnerHTML={{ __html: step.captionHtml }}
          />
        ) : null}
      </figure>
      <header className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Step {index + 1}
        </span>
        <h3 className="text-xl font-semibold text-ink">{step.title}</h3>
      </header>
      <div
        className="prose prose-sm max-w-none text-ink-muted"
        dangerouslySetInnerHTML={{ __html: step.bodyHtml }}
      />
      {step.ctaHref && step.ctaLabel ? (
        <Button
          asChild
          variant="secondary"
          size="lg"
          onClick={handleCta}
        >
          <a href={step.ctaHref}>{step.ctaLabel}</a>
        </Button>
      ) : null}
    </article>
  );
}
