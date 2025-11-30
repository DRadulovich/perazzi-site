"use client";

import { useEffect, useState } from "react";
import type { FAQItem } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";

type FAQListProps = {
  items: FAQItem[];
};

export function FAQList({ items }: FAQListProps) {
  const analyticsRef = useAnalyticsObserver("ServiceFAQSeen");

  if (!items.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ServiceFAQSeen"
      className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="service-faq-heading"
    >
      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          FAQ
        </p>
        <h2
          id="service-faq-heading"
          className="text-2xl sm:text-3xl font-semibold text-ink"
        >
          Service questions
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

function FAQItemCard({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      logAnalytics(`FAQViewed:${index}`);
    }
  }, [open, index]);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-sm focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-perazzi-red"
    >
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        {item.q}
      </summary>
      <div
        className={cn("mt-2 text-sm leading-relaxed text-ink-muted")}
        dangerouslySetInnerHTML={{ __html: item.aHtml }}
      />
    </details>
  );
}
