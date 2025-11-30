"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { PickerItem } from "@/types/experience";
import type { FAQItem } from "@/types/experience";
import { FAQList } from "./FAQList";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type ExperiencePickerProps = {
  items: PickerItem[];
  faqItems?: FAQItem[];
};

export function ExperiencePicker({ items, faqItems }: ExperiencePickerProps) {
  const prefersReducedMotion = useReducedMotion();
  const analyticsRef = useAnalyticsObserver<HTMLElement>("ExperiencePickerSeen");

  if (!items.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperiencePickerSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
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
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg lg:px-10">
          <div className="space-y-2">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
              Choose your path
            </p>
            <h2
              id="experience-picker-heading"
              className="mb-4 text-sm sm:text-base font-light italic leading-relaxed text-ink-muted"
            >
              Visit, fit, or demo with Perazzi
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start">
            {items.map((item, index) => (
              <ExperiencePickerCard
                key={item.id}
                item={item}
                delay={prefersReducedMotion ? 0 : index * 0.08}
              />
            ))}
          </div>
          {faqItems?.length ? (
            <div className="pt-4">
              <FAQList items={faqItems} embedded />
            </div>
          ) : null}
        </div>
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
  const aspect = 3 / 2;
  const microLabel = "Perazzi Experience";

  return (
    <motion.article
      className="h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <Link
        href={item.href}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/75 bg-card/75 text-left shadow-sm focus-ring sm:rounded-3xl"
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/70 via-[color:var(--scrim-strong)]/45 to-transparent transition-transform duration-300 group-hover:scale-105"
            aria-hidden
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 px-6 py-5">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            {microLabel}
          </p>
          <h3 className="text-base sm:text-lg font-semibold text-ink">
            {item.title}
          </h3>
          <p className="text-sm leading-relaxed text-ink-muted">{item.summary}</p>
          <span className="mt-auto inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
            {item.ctaLabel}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
