"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { FAQItem } from "@/types/experience";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import { faq as faqFixture } from "@/content/experience/faq";

type FAQListProps = Readonly<{
  items: FAQItem[];
  embedded?: boolean;
  heading?: string;
  lead?: string;
}>;

export function FAQList({ items, embedded = false, heading, lead }: FAQListProps) {
  const analyticsRef = useAnalyticsObserver<HTMLDivElement>("ExperienceFAQSeen");

  const faqItems = items?.length ? items : faqFixture;

  if (!faqItems.length) return null;

  const title = heading ?? "FAQ";
  const subtitle = lead ?? "Questions from future owners";

  const content = (
    <>
      <div className="space-y-2">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
          {title}
        </p>
        <h2
          id="experience-faq-heading"
          className="text-sm sm:text-base font-light italic leading-relaxed text-ink-muted"
        >
          {subtitle}
        </h2>
      </div>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <FAQItemCard key={item.q} item={item} index={index} />
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div
        ref={analyticsRef}
        data-analytics-id="ExperienceFAQSeen"
        className="space-y-6 rounded-2xl border border-border/60 bg-card/40 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/75 sm:px-6 sm:py-8"
        aria-labelledby="experience-faq-heading"
      >
        {content}
      </div>
    );
  }

  return (
    <section
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="experience-faq-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/experience/pweb-experience-faq-bg.jpg"
          alt="Perazzi experience FAQ background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
          loading="lazy"
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

      <div
        ref={analyticsRef}
        data-analytics-id="ExperienceFAQSeen"
        className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10"
      >
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg lg:px-10">
          {content}
        </div>
      </div>
    </section>
  );
}

type FAQItemCardProps = Readonly<{
  item: FAQItem;
  index: number;
}>;

function FAQItemCard({ item, index }: FAQItemCardProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      logAnalytics(`FAQViewed:${index}`);
    }
  }, [open, index]);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-left text-sm font-semibold text-ink focus-ring shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/75"
        aria-expanded={open}
      >
        {item.q}
        <span
          aria-hidden="true"
          className={cn(
            "text-lg transition-transform",
            open ? "rotate-45" : "rotate-0",
          )}
        >
          +
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-ink-muted sm:bg-card/60">
        <div dangerouslySetInnerHTML={{ __html: item.aHtml }} />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
