"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import type { FAQItem, PickerItem, PickerUi } from "@/types/experience";
import { FAQList } from "./FAQList";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  Container,
  Heading,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

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
  readonly onCollapsedChange?: (collapsed: boolean) => void;
  readonly onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
};

export function ExperiencePicker({ items, faqSection, pickerUi }: Readonly<ExperiencePickerProps>) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const analyticsRef = useAnalyticsObserver<HTMLElement>("ExperiencePickerSeen");
  const pickerKey = enableTitleReveal ? "title-reveal" : "always-reveal";
  const anchorMap: Record<string, string | undefined> = {
    visit: "#experience-visit-planning",
    fitting: "#experience-booking-guide",
    demo: "#experience-travel-guide",
  };

  const handleCardClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => {
    logAnalytics(`PickerCardClick:${itemId}`);
    const hashIndex = href.indexOf("#");
    const rawHash = hashIndex < 0 ? undefined : href.slice(hashIndex);
    const hash = rawHash && rawHash.startsWith("#") && rawHash.length > 1
      ? rawHash
      : anchorMap[itemId];
    if (!hash) return;

    const doc = globalThis.document;
    if (!doc) return;

    const target = doc.getElementById(hash.replace(/^#/, ""));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "auto", block: "start" });

    const history = globalThis.history;
    if (history) {
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

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  if (!items.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperiencePickerSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        isCollapsed
          ? "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:content-['']"
          : null,
      )}
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
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}

type ExperiencePickerBodyProps = Readonly<{
  items: PickerItem[];
  faqItems: FAQItem[];
  faqHeading: string;
  faqLead: string;
  microLabel: string;
  onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
}>;

const ExperiencePickerBody = ({
  items,
  faqItems,
  faqHeading,
  faqLead,
  microLabel,
  onAnchorClick,
}: ExperiencePickerBodyProps) => (
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
    {faqItems.length > 0 && (
      <div className="pt-4">
        <FAQList items={faqItems} embedded heading={faqHeading} lead={faqLead} />
      </div>
    )}
  </div>
);

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
  onCollapsedChange,
}: ExperiencePickerRevealSectionProps) => {
  const [pickerExpanded, setPickerExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const revealPicker = !enableTitleReveal || pickerExpanded;
  const revealPhotoFocus = revealPicker;
  const pickerMinHeight = enableTitleReveal ? "min-h-[50vh]" : undefined;
  const {
    ref: pickerShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealPicker,
    deps: [items.length, faqItems.length],
  });

  const handlePickerExpand = () => {
    beginExpand(() => {
      setPickerExpanded(true);
      setHeaderThemeReady(true);
      onCollapsedChange?.(false);
    });
  };

  const handlePickerCollapse = () => {
    clearPremeasure();
    setHeaderThemeReady(false);
    setPickerExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <>
      <RevealExpandedHeader
        headingId="experience-picker-heading"
        heading={heading}
        subheading={subheading}
        headerThemeReady={headerThemeReady}
        enableTitleReveal={enableTitleReveal}
        onCollapse={handlePickerCollapse}
      />
      <ExperiencePickerBody
        items={items}
        faqItems={faqItems}
        faqHeading={faqHeading}
        faqLead={faqLead}
        microLabel={microLabel}
        onAnchorClick={onAnchorClick}
      />
    </>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt ?? "Perazzi experience background" }}
        reveal={revealPicker}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealPicker}
        overlay="canvas"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={pickerShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={pickerMinHeight ?? undefined}
        >
          {revealPicker ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="experience-picker-heading"
                heading={heading}
                subheading={subheading}
                controlsId="experience-picker-body"
                expanded={revealPicker}
                onExpand={handlePickerExpand}
              />
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
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
        <div className="relative aspect-3/2">
          <Image
            src={item.media.url}
            alt={item.media.alt}
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/70 via-(--scrim-strong)/45 to-transparent"
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
