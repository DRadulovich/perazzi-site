"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import type { FAQItem, PickerItem, PickerUi } from "@/types/experience";
import { FAQList } from "./FAQList";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { homeMotion } from "@/lib/motionConfig";
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
    target.scrollIntoView({ behavior: "smooth", block: "start" });

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
  enableTitleReveal,
  motionEnabled,
  sectionRef,
  onAnchorClick,
}: ExperiencePickerRevealSectionProps) => {
  const [pickerExpanded, setPickerExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const pickerShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

  const revealPicker = !enableTitleReveal || pickerExpanded;
  const revealPhotoFocus = revealPicker;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealPicker;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition =
    "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition =
    "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const pickerReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const pickerRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const pickerCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const pickerLayoutTransition = motionEnabled ? { layout: pickerReveal } : undefined;
  const pickerMinHeight = enableTitleReveal ? "min-h-[calc(720px+16rem)]" : null;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", parallaxEnabled ? parallaxStrength : "0%"],
  );
  const parallaxStyle = parallaxEnabled ? { y: parallaxY } : undefined;
  const backgroundScale = parallaxEnabled ? 1.32 : 1;
  const backgroundScaleTransition = revealPicker ? pickerReveal : pickerCollapse;

  const atmosphereStagger = motionEnabled ? 0.12 : 0;
  const contentStagger = motionEnabled ? 0.12 : 0;
  const listStagger = motionEnabled ? 0.25 : 0;
  const atmosphereDelay = motionEnabled ? 0.05 : 0;
  const headerDelay = motionEnabled ? 0.24 : 0;
  const bodyDelay = motionEnabled ? 0.56 : 0;
  const listDelay = motionEnabled ? 0.12 : 0;
  const bodyChildDelay = motionEnabled ? 0.12 : 0;
  const lastCardOffset = listStagger * Math.max(items.length - 1, 0);
  const faqHeadingDelay = motionEnabled
    ? bodyDelay + bodyChildDelay + listDelay + lastCardOffset + 0.15
    : 0;
  const faqListDelay = motionEnabled ? faqHeadingDelay + 0.15 : 0;

  const atmosphereContainer = {
    hidden: {},
    show: {
      transition: {
        delayChildren: atmosphereDelay,
        staggerChildren: atmosphereStagger,
      },
    },
  } as const;

  const atmosphereLayer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 1.2, ease: homeMotion.cinematicEase },
    },
  } as const;

  const atmosphereBackground = {
    hidden: { opacity: 0, scale: backgroundScale * 1.04 },
    show: {
      opacity: 1,
      scale: backgroundScale,
      transition: {
        opacity: { duration: 1.3, ease: homeMotion.cinematicEase },
        scale: backgroundScaleTransition,
      },
    },
  } as const;

  const headerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delay: headerDelay,
        delayChildren: motionEnabled ? 0.08 : 0,
        staggerChildren: contentStagger,
      },
    },
    exit: { opacity: 0, transition: pickerRevealFast },
  } as const;

  const headerGroup = {
    hidden: {},
    show: { transition: { staggerChildren: contentStagger } },
  } as const;

  const headerItem = {
    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: pickerRevealFast },
  } as const;

  const bodyItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
  } as const;

  const bodyContainer = {
    hidden: {},
    show: {
      transition: {
        delay: bodyDelay,
        delayChildren: bodyChildDelay,
        staggerChildren: contentStagger,
      },
    },
    exit: { opacity: 0, y: -12, transition: pickerCollapse },
  } as const;

  const cardsContainer = {
    hidden: {},
    show: {
      transition: {
        delayChildren: listDelay,
        staggerChildren: listStagger,
      },
    },
  } as const;

  const handlePickerExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setPickerExpanded(true);
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };

  const handlePickerCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    setPickerExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealPicker) return;
    const node = pickerShellRef.current;
    if (!node) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!node) return;
        const nextHeight = Math.ceil(node.getBoundingClientRect().height);
        setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return () => { cancelAnimationFrame(frame); };
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enableTitleReveal, revealPicker, items.length, faqItems.length]);

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <>
      <motion.div
        className="absolute inset-0 -z-10 overflow-hidden"
        variants={atmosphereContainer}
        initial={motionEnabled ? "hidden" : false}
        animate={motionEnabled ? "show" : undefined}
      >
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={parallaxStyle}
          variants={atmosphereBackground}
        >
          <Image
            src={background.url}
            alt={background.alt ?? "Perazzi experience background"}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereLayer} aria-hidden>
          <div
            className={cn(
              "absolute inset-0 bg-(--scrim-strong)",
              focusFadeTransition,
              revealPicker ? "opacity-0" : "opacity-100",
            )}
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereLayer} aria-hidden>
          <div
            className={cn(
              "absolute inset-0 bg-(--scrim-strong)",
              focusFadeTransition,
              revealPhotoFocus ? "opacity-100" : "opacity-0",
            )}
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereLayer} aria-hidden>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 film-grain",
              focusFadeTransition,
              revealPhotoFocus ? "opacity-20" : "opacity-0",
            )}
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereLayer} aria-hidden>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 overlay-gradient-canvas",
              focusFadeTransition,
              revealPhotoFocus ? "opacity-100" : "opacity-0",
            )}
          />
        </motion.div>
      </motion.div>

      <Container size="xl" className="relative z-10">
        <motion.div
          ref={pickerShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            pickerMinHeight,
          )}
        >
          <LayoutGroup id="experience-picker-title">
            <AnimatePresence initial={false}>
              {revealPicker ? (
                <motion.div
                  key="experience-picker-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  variants={headerContainer}
                  initial={motionEnabled ? "hidden" : false}
                  animate={motionEnabled ? "show" : undefined}
                  exit={motionEnabled ? "exit" : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headerGroup}
                  >
                    <motion.div
                      variants={headerItem}
                    >
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
                          className={cn(
                            titleColorTransition,
                            headerThemeReady ? "text-ink" : "text-white",
                          )}
                        >
                          {heading}
                        </Heading>
                      </motion.div>
                    </motion.div>
                    <motion.div
                      variants={headerItem}
                    >
                      <motion.div
                        layoutId="experience-picker-subtitle"
                        layoutCrossfade={false}
                        transition={pickerLayoutTransition}
                        className="relative"
                      >
                        <Text
                          size="lg"
                          className={cn(
                            "type-section-subtitle",
                            titleColorTransition,
                            headerThemeReady ? "text-ink-muted" : "text-white",
                          )}
                        >
                          {subheading}
                        </Text>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  {enableTitleReveal ? (
                    <motion.button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handlePickerCollapse}
                      variants={bodyItem}
                    >
                      Collapse
                    </motion.button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="experience-picker-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  variants={headerContainer}
                  initial={motionEnabled ? "hidden" : false}
                  animate={motionEnabled ? "show" : undefined}
                  exit={motionEnabled ? "exit" : undefined}
                >
                  <motion.div className="flex flex-col items-center gap-3" variants={headerGroup}>
                    <motion.div
                      variants={headerItem}
                    >
                      <motion.div
                        layoutId="experience-picker-title"
                        layoutCrossfade={false}
                        transition={pickerLayoutTransition}
                        className="relative inline-flex text-white"
                      >
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
                      </motion.div>
                    </motion.div>
                    <motion.div
                      variants={headerItem}
                    >
                      <motion.div
                        layoutId="experience-picker-subtitle"
                        layoutCrossfade={false}
                        transition={pickerLayoutTransition}
                        className="relative text-white"
                      >
                        <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                          {subheading}
                        </Text>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    variants={bodyItem}
                    className="mt-3"
                  >
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handlePickerExpand}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {revealPicker ? (
              <motion.div
                key="experience-picker-body"
                id="experience-picker-body"
                className="space-y-6"
                variants={bodyContainer}
                initial={motionEnabled ? "hidden" : false}
                animate={motionEnabled ? "show" : undefined}
                exit={motionEnabled ? "exit" : undefined}
              >
                <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start" variants={cardsContainer}>
                  {items.map((item) => (
                    <ExperiencePickerCard
                      key={item.id}
                      item={item}
                      onAnchorClick={onAnchorClick}
                      microLabel={microLabel}
                      reducedMotion={!motionEnabled}
                    />
                  ))}
                </motion.div>
                {faqItems.length ? (
                  <div className="pt-4">
                    <FAQList
                      items={faqItems}
                      embedded
                      heading={faqHeading}
                      lead={faqLead}
                      motionOverrides={
                        motionEnabled
                          ? {
                              mode: "parent",
                              headingDelay: faqHeadingDelay,
                              listDelay: faqListDelay,
                              itemStagger: 0.15,
                            }
                          : undefined
                      }
                    />
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </Container>
    </>
  );
};

type ExperiencePickerCardProps = Readonly<{
  readonly item: PickerItem;
  readonly microLabel: string;
  readonly reducedMotion: boolean;
  readonly onAnchorClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    itemId: string,
  ) => void;
}>;

const pickerCardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: homeMotion.revealFast },
} as const;

function ExperiencePickerCard({
  item,
  microLabel,
  reducedMotion,
  onAnchorClick,
}: ExperiencePickerCardProps) {
  return (
    <motion.article
      className="h-full"
      variants={reducedMotion ? undefined : pickerCardVariants}
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
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/70 via-(--scrim-strong)/45 to-transparent transition-transform duration-300 group-hover:scale-105"
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
          <span className="mt-auto inline-flex items-center gap-2 type-button text-perazzi-red transition group-hover:translate-x-0.5">
            {item.ctaLabel}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
