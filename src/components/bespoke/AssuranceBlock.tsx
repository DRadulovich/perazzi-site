"use client";

import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { AssuranceContent } from "@/types/build";
import { homeMotion } from "@/lib/motionConfig";
import { Heading, Section, Text } from "@/components/ui";

type AssuranceBlockProps = Readonly<{
  assurance: AssuranceContent;
}>;

const MotionSection = motion(Section);

export function AssuranceBlock({ assurance }: AssuranceBlockProps) {
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;
  const { html, quote, media } = assurance;
  const heading = assurance.heading;
  const label = assurance.label;
  const body = assurance.body ?? html;
  const ratio = media?.aspectRatio ?? 3 / 2;

  return (
    <MotionSection
      padding="md"
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-8"
      aria-labelledby="assurance-heading"
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <motion.div
        className="space-y-6"
        initial={motionEnabled ? { opacity: 0 } : false}
        whileInView={motionEnabled ? { opacity: 1 } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.5 } : undefined}
        transition={motionEnabled ? { ...homeMotion.revealFast, delay: 0.05 } : undefined}
      >
        {heading ? (
          <Text
            id="assurance-heading"
            size="label-tight"
            className="text-ink-muted"
          >
            {heading}
          </Text>
        ) : null}
        {label ? (
          <motion.div
            initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
            whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
          >
            <Heading level={2} size="xl" className="text-ink">
              {label}
            </Heading>
          </motion.div>
        ) : null}
        {body ? (
          <motion.div
            initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
            whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
          >
            <SafeHtml
              className="max-w-none type-body text-ink [&_p]:mb-4 [&_p:last-child]:mb-0"
              html={body}
            />
          </motion.div>
        ) : null}
        {quote ? (
          <motion.blockquote
            className="rounded-2xl border-l-4 border-perazzi-red/60 bg-card/60 px-5 py-4 text-ink shadow-soft backdrop-blur-sm"
            initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
            whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
          >
            <Text asChild size="md" className="font-artisan text-ink text-2xl">
              <p>“{quote.text}”</p>
            </Text>
            {quote.author ? (
              <Text
                asChild
                size="label-tight"
                className="mt-2 block text-ink-muted"
              >
                <cite>{quote.author}</cite>
              </Text>
            ) : null}
          </motion.blockquote>
        ) : null}
      </motion.div>
      {media ? (
        <motion.figure
          className="group mt-6 space-y-3 lg:mt-0"
          initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
          whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
          transition={motionEnabled ? homeMotion.revealFast : undefined}
        >
          <div
            className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
            style={{ "--aspect-ratio": ratio }}
          >
            {media.kind === "image" ? (
              <Image
                src={media.url}
                alt={media.alt}
                fill
                sizes="(min-width: 1280px) 480px, (min-width: 1024px) 45vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            ) : (
              <video
                src={media.url}
                controls
                preload="metadata"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              >
                <track kind="captions" />
              </video>
            )}
            <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          </div>
          {media.caption ? (
            <Text asChild size="sm" className="text-ink-muted">
              <figcaption>{media.caption}</figcaption>
            </Text>
          ) : null}
        </motion.figure>
      ) : null}
    </MotionSection>
  );
}
