"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { FAQItem, PickerItem, PickerUi } from "@/types/experience";
import { FAQList } from "./FAQList";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Container, Heading, Text } from "@/components/ui";

type ExperiencePickerProps = {
  readonly items: PickerItem[];
  readonly faqSection?: {
    readonly heading?: string;
    readonly lead?: string;
    readonly items?: FAQItem[];
  };
  readonly pickerUi: PickerUi;
};

type ExperiencePickerRevealSectionProps = {
  readonly items: PickerItem[];
  readonly faqItems: FAQItem[];
  readonly faqHeading: string;
  readonly faqLead: string;
  readonly heading: string;
  readonly subheading: string;
  readonly background: { url: string; alt?: string };
  readonly microLabel: string;
  readonly enableTitleReveal: boolean;
  readonly onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
};

export function ExperiencePicker({ items, faqSection, pickerUi }: Readonly<ExperiencePickerProps>) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const analyticsRef = useAnalyticsObserver<HTMLElement>("ExperiencePickerSeen");
  const pickerKey = enableTitleReveal ? "title-reveal" : "always-reveal";
  const anchorMap: Record<string, string | undefined> = {
    visit: "#experience-visit-planning",
    fitting: "#experience-booking-guide",
    demo: "#experience-travel-guide",
  };

  if (items.length === 0) return null;

  const handleCardClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => {
    logAnalytics(`PickerCardClick:${itemId}`);
    const hashIndex = href.indexOf("#");
    const rawHash = hashIndex === -1 ? undefined : href.slice(hashIndex);
    const hash = rawHash === undefined || rawHash === "#"
      ? anchorMap[itemId]
      : rawHash;
    if (hash === undefined) return;

    const doc = globalThis.document;
    if (doc === undefined) return;

    const target = doc.getElementById(hash.replace(/^#/, ""));
    if (target === null) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "auto", block: "start" });

    const history = globalThis.history;
    if (history !== undefined) {
      history.replaceState(null, "", hash);
    }
  };

  const faqItems = faqSection?.items ?? [];
  const faqHeading = faqSection?.heading ?? "FAQ";
  const faqLead = faqSection?.lead ?? "Questions from future owners";
  const background = {
    url: pickerUi.backgroundImage?.url
      ?? "/redesign-photos/experience/pweb-experience-experiencepicker-bg.jpg",
    alt: pickerUi.backgroundImage?.alt ?? "Perazzi experience background",
  };
  const heading = pickerUi.heading ?? "Choose your path";
  const subheading = pickerUi.subheading ?? "Visit, fit, or demo with Perazzi";
  const microLabel = pickerUi.microLabel ?? "Perazzi Experience";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperiencePickerSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="experience-picker-heading"
    >
      <ExperiencePickerRevealSection
        key={pickerKey}
        items={items}
        faqItems={faqItems}
        faqHeading={faqHeading}
        faqLead={faqLead}
        heading={heading}
        subheading={subheading}
        background={background}
        microLabel={microLabel}
        enableTitleReveal={enableTitleReveal}
        onAnchorClick={handleCardClick}
      />
    </section>
  );
}

const ExperiencePickerRevealSection = ({
  items,
  faqItems,
  faqHeading,
  faqLead,
  heading,
  subheading,
  background,
  microLabel,
  enableTitleReveal,
  onAnchorClick,
}: ExperiencePickerRevealSectionProps) => {
  const [pickerExpanded, setPickerExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const pickerShellRef = useRef<HTMLDivElement | null>(null);

  const revealPicker = !enableTitleReveal || pickerExpanded;
  const revealPhotoFocus = revealPicker;
  const pickerMinHeight = enableTitleReveal ? "min-h-[calc(720px+16rem)]" : null;

  const handlePickerExpand = () => {
    if (!enableTitleReveal) return;
    setPickerExpanded(true);
    setHeaderThemeReady(true);
  };

  const handlePickerCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setPickerExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealPicker) return;
    const node = pickerShellRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enableTitleReveal, revealPicker, items.length, faqItems.length]);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={background.url}
            alt={background.alt ?? "Perazzi experience background"}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            revealPicker ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 overlay-gradient-canvas",
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <Container size="xl" className="relative z-10">
        <div
          ref={pickerShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            pickerMinHeight,
          )}
        >
          {revealPicker ? (
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="space-y-3">
                <div className="relative">
                  <Heading
                    id="experience-picker-heading"
                    level={2}
                    size="xl"
                    className={headerThemeReady ? "text-ink" : "text-white"}
                  >
                    {heading}
                  </Heading>
                </div>
                <div className="relative">
                  <Text
                    size="lg"
                    className={cn(
                      "type-section-subtitle",
                      headerThemeReady ? "text-ink-muted" : "text-white",
                    )}
                  >
                    {subheading}
                  </Text>
                </div>
              </div>
              {enableTitleReveal ? (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
                  onClick={handlePickerCollapse}
                >
                  Collapse
                </button>
              ) : null}
            </div>
          ) : (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative inline-flex text-white">
                <Heading
                  id="experience-picker-heading"
                  level={2}
                  size="xl"
                  className="type-section-collapsed"
                >
                  {heading}
                </Heading>
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer focus-ring"
                  onPointerEnter={handlePickerExpand}
                  onFocus={handlePickerExpand}
                  onClick={handlePickerExpand}
                  aria-expanded={revealPicker}
                  aria-controls="experience-picker-body"
                  aria-labelledby="experience-picker-heading"
                >
                  <span className="sr-only">Expand {heading}</span>
                </button>
              </div>
              <div className="relative text-white">
                <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                  {subheading}
                </Text>
              </div>
              <div className="mt-3">
                <Text
                  size="button"
                  className="text-white/80 cursor-pointer focus-ring"
                  asChild
                >
                  <button type="button" onClick={handlePickerExpand}>
                    Read more
                  </button>
                </Text>
              </div>
            </div>
          )}

          {revealPicker ? (
            <div id="experience-picker-body" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start">
                {items.map((item) => (
                  <ExperiencePickerCard
                    key={item.id}
                    item={item}
                    onAnchorClick={onAnchorClick}
                    microLabel={microLabel}
                  />
                ))}
              </div>
              {faqItems.length ? (
                <div className="pt-4">
                  <FAQList items={faqItems} embedded heading={faqHeading} lead={faqLead} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </>
  );
};

type ExperiencePickerCardProps = Readonly<{
  readonly item: PickerItem;
  readonly microLabel: string;
  readonly onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
}>;

function ExperiencePickerCard({
  item,
  microLabel,
  onAnchorClick,
}: ExperiencePickerCardProps) {
  return (
    <article className="h-full">
      <Link
        href={item.href}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 text-left shadow-soft backdrop-blur-sm ring-1 ring-border/70 hover:border-ink/20 hover:bg-card/85 focus-ring sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
        data-analytics-id={`PickerCardClick:${item.id}`}
        onClick={(event) => {
          if (onAnchorClick) {
            onAnchorClick(event, item.href, item.id);
          } else {
            logAnalytics(`PickerCardClick:${item.id}`);
          }
        }}
      >
        <div className="relative aspect-[3/2]">
          <Image
            src={item.media.url}
            alt={item.media.alt}
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/70 via-[color:var(--scrim-strong)]/45 to-transparent"
            aria-hidden
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 px-6 py-5">
          <Text size="label-tight" muted>
            {microLabel}
          </Text>
          <Heading level={3} className="type-card-title text-ink">
            {item.title}
          </Heading>
          <Text className="type-body text-ink-muted" leading="relaxed">
            {item.summary}
          </Text>
          <span className="mt-auto inline-flex items-center gap-2 type-button text-perazzi-red">
            {item.ctaLabel}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
