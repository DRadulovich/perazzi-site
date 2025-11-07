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
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="service-faq-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          FAQ
        </p>
        <h2
          id="service-faq-heading"
          className="text-2xl font-semibold text-ink"
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
      className="rounded-2xl border border-border/70 bg-card/70 p-4 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-perazzi-red"
    >
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        {item.q}
      </summary>
      <div
        className={cn("mt-2 text-sm text-ink-muted")}
        dangerouslySetInnerHTML={{ __html: item.aHtml }}
      />
    </details>
  );
}
