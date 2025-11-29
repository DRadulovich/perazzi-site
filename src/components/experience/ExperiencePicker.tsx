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

  const planVisit =
    items.find((item) => item.id === "plan-visit") ||
    items.find((item) =>
      item.title?.toLowerCase().includes("plan a visit"),
    ) ||
    items[0];
  const secondaryItems = items.filter((item) => item.id !== planVisit.id);

  return (
    <section
      className="relative isolate w-screen overflow-hidden py-16 sm:py-20"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="experience-picker-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/experience/pweb-experience-experiencepicker-bg.jpg"
          alt="Perazzi experience background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div
          className="absolute inset-0 bg-[color:var(--scrim-soft)]"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-6 rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-10">
          <div className="space-y-2">
            <p className="text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
              Choose your path
            </p>
            <h2
              id="experience-picker-heading"
              className="text-xl font-light italic text-ink-muted mb-4"
            >
              Visit, fit, or demo with Perazzi
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <ExperiencePickerCard
              item={planVisit}
              delay={prefersReducedMotion ? 0 : 0}
              emphasis
            />
            <div className="space-y-6">
              {secondaryItems.map((item, index) => (
                <ExperiencePickerCard
                  key={item.id}
                  item={item}
                  delay={prefersReducedMotion ? 0 : (index + 1) * 0.08}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperiencePickerCard({
  item,
  delay,
  emphasis = false,
}: {
  item: PickerItem;
  delay: number;
  emphasis?: boolean;
}) {
  const aspect = emphasis ? 2 / 3 : 3 / 1;

  return (
    <motion.article
      className="h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <Link
        href={item.href}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/75 text-left shadow-sm focus-ring"
        data-analytics-id={`PickerCardClick:${item.id}`}
        onClick={() => logAnalytics(`PickerCardClick:${item.id}`)}
      >
        <div
          className="relative"
          style={{ aspectRatio: aspect }}
        >
          <Image
            src={item.media.url}
            alt={item.media.alt}
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/70 via-[color:var(--scrim-strong)]/45 to-transparent"
            aria-hidden
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
            {item.tagline ?? "Perazzi Experience"}
          </p>
          <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
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
