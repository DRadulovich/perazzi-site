"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { FAQItem } from "@/types/experience";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import { faq as faqFixture } from "@/content/experience/faq";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Heading, Text } from "@/components/ui";

type FAQListProps = Readonly<{
  items: FAQItem[];
  embedded?: boolean;
  heading?: string;
  lead?: string;
}>;

export function FAQList({ items, embedded = false, heading, lead }: FAQListProps) {
  const analyticsRef = useAnalyticsObserver<HTMLDivElement>("ExperienceFAQSeen");

  const faqItems = items.length ? items : faqFixture;

  if (!faqItems.length) return null;

  const title = heading ?? "FAQ";
  const subtitle = lead ?? "Questions from future owners";

  const content = (
    <>
      <div className="space-y-2">
        <Heading
          id="experience-faq-heading"
          level={2}
          size="xl"
          className="font-black uppercase italic tracking-[0.35em] text-ink"
        >
          {title}
        </Heading>
        <Text size="md" muted leading="relaxed" className="font-light italic">
          {subtitle}
        </Text>
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
        className="space-y-6 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:px-6 sm:py-8 sm:shadow-elevated"
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
          className="absolute inset-0 bg-(--scrim-soft)"
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
        <div className="space-y-6 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm backdrop-blur-md sm:rounded-3xl sm:bg-card/25 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10">
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
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left text-sm font-semibold text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring sm:rounded-3xl sm:bg-card/80"
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
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 text-sm leading-relaxed text-ink-muted shadow-sm backdrop-blur-sm sm:bg-card/80">
        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
          {item.aHtml}
        </ReactMarkdown>
      </CollapsibleContent>
    </Collapsible>
  );
}
