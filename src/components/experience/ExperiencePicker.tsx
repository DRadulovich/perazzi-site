"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { MouseEvent } from "react";
import type { FAQItem, PickerItem, PickerUi } from "@/types/experience";
import { FAQList } from "./FAQList";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ExpandableSection } from "@/motion/expandable/ExpandableSection";
import type { ExpandableSectionMotionApi } from "@/motion/expandable/expandable-section-motion";
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
  readonly onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
  readonly es: ExpandableSectionMotionApi;
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
    <ExpandableSection
      key={pickerKey}
      sectionId="experience.experiencePicker"
      defaultExpanded={!enableTitleReveal}
      rootRef={analyticsRef}
      data-analytics-id="ExperiencePickerSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="experience-picker-heading"
    >
      {(es) => (
        <ExperiencePickerRevealSection
          items={items}
          faqItems={faqItems}
          faqHeading={faqHeading}
          faqLead={faqLead}
          heading={heading}
          subheading={subheading}
          background={background}
          microLabel={microLabel}
          onAnchorClick={handleCardClick}
          es={es}
        />
      )}
    </ExpandableSection>
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
  onAnchorClick,
  es,
}: ExperiencePickerRevealSectionProps) => {
  const {
    getTriggerProps,
    getCloseProps,
    layoutProps,
    contentVisible,
    bodyId,
  } = es;

  const pickerMinHeight = contentVisible ? null : "min-h-[calc(720px+16rem)]";
  const headerThemeReady = contentVisible;

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div data-es="bg" className="absolute inset-0">
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
          data-es="scrim-bottom"
          className="absolute inset-0 bg-(--scrim-strong)"
          aria-hidden
        />
        <div
          data-es="scrim-top"
          className="pointer-events-none absolute inset-0 overlay-gradient-canvas"
          aria-hidden
        />
      </div>

      <Container size="xl" className="relative z-10">
        <motion.div {...layoutProps} className={cn("relative", pickerMinHeight)}>
          <div
            data-es="glass"
            className={cn(
              "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
              contentVisible
                ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
                : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            )}
          >
            {contentVisible ? (
              <>
                <div data-es="header-expanded" className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
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
                  <button
                    type="button"
                    data-es="close"
                    className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
                    {...getCloseProps()}
                  >
                    Collapse
                  </button>
                </div>

                <div data-es="main">
                  <div data-es="list" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start">
                    {items.map((item) => (
                      <ExperiencePickerCard
                        key={item.id}
                        item={item}
                        onAnchorClick={onAnchorClick}
                        microLabel={microLabel}
                      />
                    ))}
                  </div>
                </div>

                {faqItems.length ? (
                  <div data-es="body" id={bodyId} className="pt-4">
                    <FAQList items={faqItems} embedded heading={faqHeading} lead={faqLead} />
                  </div>
                ) : (
                  <span data-es="body" id={bodyId} className="sr-only">
                    {subheading}
                  </span>
                )}

                <div data-es="cta" className="sr-only">
                  Explore Perazzi experience options.
                </div>
              </>
            ) : null}
          </div>

          <div
            data-es="header-collapsed"
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center",
              contentVisible && "pointer-events-none",
            )}
            aria-hidden={contentVisible}
          >
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
                aria-labelledby="experience-picker-heading"
                {...getTriggerProps({ kind: "header", withHover: true })}
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
                <button type="button" {...getTriggerProps({ kind: "cta" })}>
                  Read more
                </button>
              </Text>
            </div>
          </div>
        </motion.div>
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
    <article data-es="item" className="h-full">
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
