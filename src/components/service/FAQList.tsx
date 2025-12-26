"use client";

import { useEffect, useState } from "react";
import SafeHtml from "@/components/SafeHtml";
import type { FAQItem } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Heading, Text } from "@/components/ui";

type FAQListProps = Readonly<{
  items: readonly FAQItem[];
  heading?: string;
  intro?: string;
}>;

export function FAQList({ items, heading, intro }: FAQListProps) {
  const analyticsRef = useAnalyticsObserver("ServiceFAQSeen");

  if (!items.length) return null;

  const title = heading ?? "Service questions";
  const lead = intro;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ServiceFAQSeen"
      className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="service-faq-heading"
    >
      <div className="space-y-2">
        <Text size="xs" muted className="font-semibold">
          FAQ
        </Text>
        <Heading id="service-faq-heading" level={2} size="xl" className="text-ink">
          {title}
        </Heading>
        {lead ? (
          <Text size="md" muted leading="relaxed">
            {lead}
          </Text>
        ) : null}
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <FAQItemCard key={item.q} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function FAQItemCard({
  item,
  index,
}: Readonly<{ item: FAQItem; index: number }>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      logAnalytics(`FAQViewed:${index}`);
    }
  }, [open, index]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-sm focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-perazzi-red">
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left text-sm font-semibold text-ink">
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
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SafeHtml
            className={cn("mt-2 text-sm leading-relaxed text-ink-muted")}
            html={item.aHtml}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
