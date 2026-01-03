"use client";

import { LayoutGroup, motion, useReducedMotion, useScroll, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { MouseEvent, RefObject } from "react";
import type { FAQItem, PickerItem, PickerUi } from "@/types/experience";
import { FAQList } from "./FAQList";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  EASE_CINEMATIC,
  EXPAND_TIME_SCALE,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";
import { createExpandableSectionVariants } from "@/motion/createExpandableSectionVariants";
import {
  buildGlassToneVariants,
  buildTitleToneVariants,
  mergeVariants,
} from "@/motion/expandableSectionTone";
import { useExpandableSectionTimeline } from "@/motion/useExpandableSectionTimeline";
import { useParallaxMotion } from "@/motion/useParallaxMotion";
import { ExpandableTextReveal } from "@/components/motion/ExpandableTextReveal";
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
  readonly isDesktop: boolean;
  readonly enableTitleReveal: boolean;
  readonly motionEnabled: boolean;
  readonly sectionRef: RefObject<HTMLElement | null>;
  readonly onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
};

export function ExperiencePicker({ items, faqSection, pickerUi }: Readonly<ExperiencePickerProps>) {
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
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
    const behavior: ScrollBehavior = motionEnabled ? "smooth" : "auto";
    target.scrollIntoView({ behavior, block: "start" });

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
        isDesktop={isDesktop}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={analyticsRef}
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
  isDesktop,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
  onAnchorClick,
}: ExperiencePickerRevealSectionProps) => {
  const {
    expanded,
    phase,
    open,
    close,
    onTriggerKeyDown,
    onEscapeKeyDown,
    showExpanded,
    showCollapsed,
  } = useExpandableSectionTimeline({
    defaultExpanded: false,
    containerRef: sectionRef,
    scrollOnExpand: true,
  });

  const revealPicker = phase === "expanded" || phase === "closingHold";
  const isCollapsedPhase = phase === "collapsed" || phase === "prezoom";
  const parallaxStrength = 0.16;
  const parallaxEnabled = enableTitleReveal && !revealPicker && motionEnabled;
  const pickerLayoutTransition = motionEnabled
    ? {
        layout: {
          duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
          ease: EASE_CINEMATIC,
        },
      }
    : undefined;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useParallaxMotion(scrollYProgress, {
    enabled: parallaxEnabled,
    strength: parallaxStrength,
    targetRef: sectionRef,
  });
  const parallaxStyle = motionEnabled ? { y: parallaxY } : undefined;
  const toSeconds = (ms: number) => ms / 1000;
  const staggerTransition = (staggerMs: number, direction?: 1 | -1) => ({
    transition: {
      staggerChildren: motionEnabled ? toSeconds(staggerMs) : 0,
      staggerDirection: direction,
    },
  });
  const headerGroup = {
    collapsed: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    expanded: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
  } as const;
  const itemsGroup = {
    collapsed: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_LIST_ITEMS_MS),
    expanded: staggerTransition(STAGGER_LIST_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
  } as const;
  const slotVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    backgroundScale: { collapsed: 1.32, prezoom: 1.12, expanded: 1 },
    itemOffsetY: 12,
    blurPx: 6,
    glassScale: 0.985,
  });
  const surfaceVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    itemOffsetY: 12,
    blurPx: 0,
    glassScale: 0.985,
  });
  const scrimInverted = {
    collapsed: slotVariants.scrimTop.expanded,
    prezoom: slotVariants.scrimTop.expanded,
    expanded: slotVariants.scrimTop.collapsed,
    closingHold: slotVariants.scrimTop.collapsed,
  } as const;
  const headingToneVariants = buildTitleToneVariants("--color-ink");
  const subheadingToneVariants = buildTitleToneVariants("--color-ink-muted");
  const headingItem = mergeVariants(slotVariants.expandedHeader, headingToneVariants);
  const subheadingItem = mergeVariants(slotVariants.expandedHeader, subheadingToneVariants);
  const collapsedHeaderItem = slotVariants.collapsedHeader;
  const bodyItem = slotVariants.content;
  const ctaItem = slotVariants.ctaRow;
  const surfaceItem = surfaceVariants.content;
  const glassSurfaceStrength = isDesktop ? 25 : 40;
  const glassToneVariants = buildGlassToneVariants({
    backgroundStrength: glassSurfaceStrength,
    borderStrength: 70,
    blurPx: 12,
    shadow: isDesktop ? "elevated" : "soft",
  });
  const glassVariants = mergeVariants(slotVariants.glass, glassToneVariants);
  const containerLayoutTransition = {
    layout: {
      duration: motionEnabled
        ? (CONTAINER_EXPAND_MS / 1000) * (isCollapsedPhase ? COLLAPSE_TIME_SCALE : EXPAND_TIME_SCALE)
        : 0,
      ease: EASE_CINEMATIC,
    },
  };
  const glassStyle = {
    minHeight: "40vh",
    overflow: isCollapsedPhase ? "hidden" : "visible",
  };

  const handlePickerExpand = () => {
    if (!enableTitleReveal) return;
    open();
  };

  const handlePickerCollapse = () => {
    if (!enableTitleReveal) return;
    close();
  };

  return (
    <motion.div
      variants={slotVariants.section}
      initial={motionEnabled ? "collapsed" : false}
      animate={phase}
    >
      <motion.div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute inset-0" variants={slotVariants.background}>
          <motion.div className="absolute inset-0 will-change-transform" style={parallaxStyle}>
            <Image
              src={background.url}
              alt={background.alt ?? "Perazzi experience background"}
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" variants={scrimInverted}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas" aria-hidden />
        </motion.div>
      </motion.div>

      <Container size="xl" className="relative z-10">
        <motion.div
          style={glassStyle}
          className="relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10"
          variants={glassVariants}
          onKeyDown={onEscapeKeyDown}
          layout
          transition={containerLayoutTransition}
        >
          <LayoutGroup id="experience-picker-title">
            {showExpanded ? (
              <motion.div
                key="experience-picker-header"
                className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                variants={slotVariants.section}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-3" variants={headerGroup}>
                  <motion.div variants={headingItem}>
                    <motion.div
                      layoutId="experience-picker-title"
                      layoutCrossfade={false}
                      transition={pickerLayoutTransition}
                      className="relative"
                    >
                      <Heading
                        id="experience-picker-heading"
                        level={2}
                        size="xl"
                      >
                        <ExpandableTextReveal text={heading} reduceMotion={!motionEnabled} />
                      </Heading>
                    </motion.div>
                  </motion.div>
                  <motion.div variants={subheadingItem}>
                    <motion.div
                      layoutId="experience-picker-subtitle"
                      layoutCrossfade={false}
                      transition={pickerLayoutTransition}
                      className="relative"
                    >
                      <Text
                        size="lg"
                        className="type-section-subtitle"
                      >
                        <ExpandableTextReveal text={subheading} reduceMotion={!motionEnabled} />
                      </Text>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                  onClick={handlePickerCollapse}
                  variants={surfaceItem}
                >
                  Collapse
                </motion.button>
              </motion.div>
            ) : null}
            {showCollapsed ? (
              <motion.div
                key="experience-picker-collapsed"
                className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                variants={slotVariants.section}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                  <motion.div
                    layoutId="experience-picker-title"
                    layoutCrossfade={false}
                    transition={pickerLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Heading
                        id="experience-picker-heading"
                        level={2}
                        size="xl"
                        className="type-section-collapsed"
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onFocus={handlePickerExpand}
                      onClick={handlePickerExpand}
                      onKeyDown={onTriggerKeyDown}
                      aria-expanded={expanded}
                      aria-controls="experience-picker-body"
                      aria-labelledby="experience-picker-heading"
                    >
                      <span className="sr-only">Expand {heading}</span>
                    </button>
                  </motion.div>
                  <motion.div
                    layoutId="experience-picker-subtitle"
                    layoutCrossfade={false}
                    transition={pickerLayoutTransition}
                    className="relative text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                        {subheading}
                      </Text>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div variants={itemsGroup} className="mt-3">
                  <motion.div variants={ctaItem}>
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handlePickerExpand} onKeyDown={onTriggerKeyDown}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </LayoutGroup>

          <motion.div
            variants={slotVariants.section}
            initial={motionEnabled ? "collapsed" : false}
            animate={phase}
          >
            {showExpanded ? (
              <motion.div
                key="experience-picker-body"
                id="experience-picker-body"
                className="space-y-6"
                variants={slotVariants.section}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start"
                  variants={itemsGroup}
                >
                  {items.map((item) => (
                    <ExperiencePickerCard
                      key={item.id}
                      item={item}
                      onAnchorClick={onAnchorClick}
                      microLabel={microLabel}
                      reducedMotion={!motionEnabled}
                      variants={surfaceItem}
                    />
                  ))}
                </motion.div>
                {faqItems.length ? (
                  <motion.div className="pt-4" variants={bodyItem}>
                    <FAQList
                      items={faqItems}
                      embedded
                      heading={faqHeading}
                      lead={faqLead}
                      motionOverrides={
                        motionEnabled
                          ? {
                              mode: "parent",
                              headingVariant: bodyItem,
                              listVariant: itemsGroup,
                              itemVariant: surfaceItem,
                            }
                          : undefined
                      }
                    />
                  </motion.div>
                ) : null}
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      </Container>
    </motion.div>
  );
};

type ExperiencePickerCardProps = Readonly<{
  readonly item: PickerItem;
  readonly microLabel: string;
  readonly reducedMotion: boolean;
  readonly variants?: Variants;
  readonly onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
}>;

function ExperiencePickerCard({
  item,
  microLabel,
  reducedMotion,
  variants,
  onAnchorClick,
}: ExperiencePickerCardProps) {
  return (
    <motion.article
      className="h-full"
      variants={reducedMotion ? undefined : variants}
    >
      <Link
        href={item.href}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 text-left shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:border-ink/20 hover:bg-card/85 focus-ring sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
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
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/70 via-(--scrim-strong)/45 to-transparent transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
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
          <span className="mt-auto inline-flex items-center gap-2 type-button text-perazzi-red transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none">
            {item.ctaLabel}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
