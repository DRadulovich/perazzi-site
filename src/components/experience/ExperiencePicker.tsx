"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { PickerItem } from "@/types/experience";
import { logAnalytics } from "@/lib/analytics";

type ExperiencePickerProps = {
  items: PickerItem[];
};

export function ExperiencePicker({ items }: ExperiencePickerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!items.length) return null;

  return (
    <section
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="experience-picker-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Choose your path
        </p>
        <h2
          id="experience-picker-heading"
          className="text-2xl font-semibold text-ink"
        >
          Visit, fit, or demo with Perazzi
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item, index) => (
          <ExperiencePickerCard
            key={item.id}
            item={item}
            delay={prefersReducedMotion ? 0 : index * 0.08}
          />
        ))}
      </div>
    </section>
  );
}

function ExperiencePickerCard({
  item,
  delay,
}: {
  item: PickerItem;
  delay: number;
}) {
  const ratio = item.media.aspectRatio ?? 4 / 3;

  return (
    <motion.article
      className="h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <Link
        href={item.href}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card text-left shadow-sm focus-ring"
        data-analytics-id={`PickerCardClick:${item.id}`}
        onClick={() => logAnalytics(`PickerCardClick:${item.id}`)}
      >
        <div className="relative" style={{ aspectRatio: ratio }}>
          <Image
            src={item.media.url}
            alt={item.media.alt}
            fill
            sizes="(min-width: 1024px) 320px, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
          <p className="text-sm text-ink-muted">{item.summary}</p>
          <span className="mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
            {item.ctaLabel}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
