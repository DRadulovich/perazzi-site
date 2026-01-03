"use client";

import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { useState, type RefObject } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll } from "framer-motion";
import type { ShotgunsLandingData } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import {
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  EASE_CINEMATIC,
  EXPAND_TIME_SCALE,
  STAGGER_BODY_ITEMS_MS,
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
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Container, Heading, Text } from "@/components/ui";

type TriggerExplainerProps = Readonly<{
  explainer: ShotgunsLandingData["triggerExplainer"];
}>;

type TriggerExplainerRevealSectionProps = {
  readonly explainer: ShotgunsLandingData["triggerExplainer"];
  readonly manualOpen: boolean;
  readonly setManualOpen: (next: boolean) => void;
  readonly isDesktop: boolean;
  readonly enableTitleReveal: boolean;
  readonly motionEnabled: boolean;
  readonly sectionRef: RefObject<HTMLElement | null>;
};

export function TriggerExplainer({ explainer }: TriggerExplainerProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const motionEnabled = !prefersReducedMotion;
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const triggerKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const analyticsRef = useAnalyticsObserver<HTMLElement>("TriggerExplainerSeen");

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TriggerExplainerSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 mt-25 full-bleed"
      aria-labelledby="trigger-explainer-heading"
    >
      <TriggerExplainerRevealSection
        key={triggerKey}
        explainer={explainer}
        manualOpen={manualOpen}
        setManualOpen={setManualOpen}
        isDesktop={isDesktop}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={analyticsRef}
      />
    </section>
  );
}

const TriggerExplainerRevealSection = ({
  explainer,
  manualOpen,
  setManualOpen,
  isDesktop,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: TriggerExplainerRevealSectionProps) => {
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

  const ratio = explainer.diagram.aspectRatio ?? 16 / 9;
  const subheading = explainer.subheading ?? "Removable or fixed—choose by confidence and feel.";
  const background = explainer.background ?? {
    id: "trigger-explainer-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg",
    alt: "Perazzi trigger workshop background",
  };

  const revealExplainer = showExpanded;
  const isCollapsedPhase = phase === "collapsed" || phase === "prezoom";
  const parallaxStrength = 0.16;
  const parallaxEnabled = enableTitleReveal && !revealExplainer && motionEnabled;
  const explainerLayoutTransition = motionEnabled
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
  const bodyGroup = {
    collapsed: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_BODY_ITEMS_MS),
    expanded: staggerTransition(STAGGER_BODY_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
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
  const cardItem = surfaceItem;
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

  const copyClasses =
    "max-w-none type-body text-ink [&_p]:mb-4 [&_p:last-child]:mb-0 prose-headings:text-ink prose-strong:text-ink prose-a:text-perazzi-red prose-a:underline-offset-4";

  const contentClassName =
    "gap-6 overflow-hidden px-2 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start";

  const explainerContent = (
    <>
      <motion.div
        className="rounded-2xl border border-border/0 bg-card/0 p-4 sm:rounded-3xl sm:p-6 lg:flex lg:h-full lg:flex-col lg:justify-start"
        variants={cardItem}
      >
        {explainer.copyPortableText?.length ? (
          <motion.div variants={bodyItem}>
            <PortableText className={copyClasses} blocks={explainer.copyPortableText} />
          </motion.div>
        ) : explainer.copyHtml ? (
          <motion.div variants={bodyItem}>
            <SafeHtml className={copyClasses} html={explainer.copyHtml} />
          </motion.div>
        ) : null}
        <motion.div className="mt-5 flex flex-wrap gap-3" variants={itemsGroup}>
          {explainer.links.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              data-analytics-id={`TriggerExplainerLink:${link.href}`}
              className="type-button inline-flex items-center gap-2 rounded-sm border border-perazzi-red/40 bg-card/60 px-4 py-2 text-perazzi-red shadow-soft backdrop-blur-sm transition hover:border-perazzi-red hover:bg-card/85 hover:translate-x-0.5 focus-ring motion-reduce:transition-none motion-reduce:transform-none"
              onClick={() =>
                logAnalytics(`TriggerExplainerLink:${link.href}`)
              }
              variants={surfaceItem}
            >
              {link.label}
              <span aria-hidden="true">→</span>
            </motion.a>
          ))}
        </motion.div>
      </motion.div>

      <motion.figure
        className="group rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
        variants={surfaceItem}
      >
        <div
          className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
          style={{ "--aspect-ratio": ratio }}
        >
          <Image
            src={explainer.diagram.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:transform-none"
          />
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/60 via-(--scrim-strong)/40 to-transparent"
            aria-hidden
          />
        </div>
        {explainer.diagram.caption ? (
          <Text
            asChild
            size="caption"
            className="mt-3 text-ink-muted"
            leading="normal"
          >
            <figcaption>{explainer.diagram.caption}</figcaption>
          </Text>
        ) : null}
      </motion.figure>
    </>
  );

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    open();
  };

  const handleCollapse = () => {
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
              alt={background.alt}
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" variants={scrimInverted}>
          <div
            className="absolute inset-0 bg-(--scrim-strong)"
            aria-hidden
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div
            className="absolute inset-0 bg-(--scrim-strong)"
            aria-hidden
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div
            className="pointer-events-none absolute inset-0 opacity-20 film-grain"
            aria-hidden="true"
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div
            className="pointer-events-none absolute inset-0 overlay-gradient-canvas"
            aria-hidden
          />
        </motion.div>
      </motion.div>

      <motion.div>
        <Container size="xl" className="relative z-10">
          <motion.div
            className="relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10"
            variants={glassVariants}
            style={glassStyle}
            onKeyDown={onEscapeKeyDown}
            layout
            transition={containerLayoutTransition}
          >
            <motion.div
              variants={slotVariants.section}
              initial={motionEnabled ? "collapsed" : false}
              animate={phase}
            >
              <LayoutGroup id="shotguns-trigger-explainer-title">
                {showExpanded ? (
                  <motion.div
                    key="trigger-explainer-header"
                    className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                    variants={slotVariants.section}
                    initial={motionEnabled ? "collapsed" : false}
                    animate={phase}
                    onKeyDown={onEscapeKeyDown}
                  >
                    <motion.div variants={slotVariants.section} className="flex-1">
                      <Collapsible
                        open={manualOpen}
                        onOpenChange={(next) => {
                          setManualOpen(next);
                          logAnalytics(`TriggerExplainerToggle:${next ? "open" : "closed"}`);
                        }}
                        className="space-y-4 flex-1"
                      >
                        <motion.div className="space-y-3" variants={headerGroup}>
                          <motion.div
                            layoutId="trigger-explainer-title"
                            layoutCrossfade={false}
                            transition={explainerLayoutTransition}
                            className="relative"
                          >
                            <motion.div variants={headingItem}>
                              <Heading
                                id="trigger-explainer-heading"
                                level={2}
                                size="xl"
                              >
                                <ExpandableTextReveal
                                  text={explainer.title ?? ""}
                                  reduceMotion={!motionEnabled}
                                />
                              </Heading>
                            </motion.div>
                          </motion.div>
                          <motion.div
                            layoutId="trigger-explainer-subtitle"
                            layoutCrossfade={false}
                            transition={explainerLayoutTransition}
                            className="relative"
                          >
                            <motion.div variants={subheadingItem}>
                              <Text
                                className="type-section-subtitle"
                                leading="normal"
                              >
                                <ExpandableTextReveal text={subheading} reduceMotion={!motionEnabled} />
                              </Text>
                            </motion.div>
                          </motion.div>
                          <motion.div variants={surfaceItem}>
                            <CollapsibleTrigger
                              className="type-button mt-1 inline-flex w-fit items-center gap-2 rounded-sm border border-border/70 bg-card/60 px-4 py-2 text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring lg:hidden"
                              aria-controls="trigger-explainer-content"
                              data-analytics-id="TriggerExplainerToggle"
                            >
                              {manualOpen ? "Hide details" : "Show details"}
                            </CollapsibleTrigger>
                          </motion.div>
                        </motion.div>
                        <CollapsibleContent
                          id="trigger-explainer-content"
                          forceMount
                          className="lg:hidden data-[state=closed]:animate-none data-[state=open]:animate-none"
                        >
                          <AnimatePresence initial={false}>
                            {manualOpen ? (
                              <motion.div
                                key="trigger-explainer-mobile"
                                className={`grid ${contentClassName}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={motionEnabled ? homeMotion.revealFast : undefined}
                                layout
                              >
                                <motion.div className="contents" variants={bodyGroup}>
                                  {explainerContent}
                                </motion.div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                    <motion.button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleCollapse}
                      variants={surfaceItem}
                    >
                      Collapse
                    </motion.button>
                  </motion.div>
                ) : null}
                {showCollapsed ? (
                  <motion.div
                    key="trigger-explainer-collapsed"
                    className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                    variants={slotVariants.section}
                    initial={motionEnabled ? "collapsed" : false}
                    animate={phase}
                  >
                    <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                      <motion.div
                        layoutId="trigger-explainer-title"
                        layoutCrossfade={false}
                        transition={explainerLayoutTransition}
                        className="relative inline-flex text-white"
                      >
                        <motion.div variants={collapsedHeaderItem}>
                          <Heading
                            id="trigger-explainer-heading"
                            level={2}
                            size="xl"
                            className="type-section-collapsed"
                          >
                            {explainer.title}
                          </Heading>
                        </motion.div>
                        <button
                          type="button"
                          className="absolute inset-0 z-10 cursor-pointer focus-ring"
                          onFocus={handleExpand}
                          onClick={handleExpand}
                          onKeyDown={onTriggerKeyDown}
                          aria-expanded={expanded}
                          aria-controls="trigger-explainer-body"
                          aria-labelledby="trigger-explainer-heading"
                        >
                          <span className="sr-only">Expand {explainer.title}</span>
                        </button>
                      </motion.div>
                      <motion.div
                        layoutId="trigger-explainer-subtitle"
                        layoutCrossfade={false}
                        transition={explainerLayoutTransition}
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
                          <button type="button" onClick={handleExpand} onKeyDown={onTriggerKeyDown}>
                            Read more
                          </button>
                        </Text>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ) : null}
              </LayoutGroup>
            </motion.div>

            <motion.div
              variants={slotVariants.section}
              initial={motionEnabled ? "collapsed" : false}
              animate={phase}
            >
              {showExpanded ? (
                <motion.div
                  key="trigger-explainer-body"
                  id="trigger-explainer-body"
                  className="space-y-6"
                  variants={slotVariants.section}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  <motion.div className={`hidden lg:grid ${contentClassName}`} variants={bodyGroup}>
                    {explainerContent}
                  </motion.div>
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>
        </Container>
      </motion.div>
    </motion.div>
  );
};
