"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useEffect, useState } from "react";
import type { FAQItem } from "@/types/experience";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";

type FAQListProps = {
  items: FAQItem[];
};

export function FAQList({ items }: FAQListProps) {
  const analyticsRef = useAnalyticsObserver("ExperienceFAQSeen");

  if (!items.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperienceFAQSeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="experience-faq-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          FAQ
        </p>
        <h2
          id="experience-faq-heading"
          className="text-2xl font-semibold text-ink"
        >
          Questions from future owners
        </h2>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <FAQItemCard key={item.q} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

type FAQItemCardProps = {
  item: FAQItem;
  index: number;
};

function FAQItemCard({ item, index }: FAQItemCardProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      console.log(`[analytics] FAQViewed:${index}`);
    }
  }, [open, index]);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold text-ink focus-ring"
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
      <Collapsible.Content className="mt-2 overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4 text-sm text-ink-muted">
        <div dangerouslySetInnerHTML={{ __html: item.aHtml }} />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
