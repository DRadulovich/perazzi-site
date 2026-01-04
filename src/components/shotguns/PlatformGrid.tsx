"use client";

import Image from "next/image";
import { useMemo, useState, useRef, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type PlatformGridProps = {
  readonly platforms: Platform[];
  readonly ui?: ShotgunsLandingData["platformGridUi"];
};

const defaultChatPayloadTemplate =
  "Help me understand the {platformName} platform and which model configurations I should start from.";

type PlatformBackground = NonNullable<NonNullable<ShotgunsLandingData["platformGridUi"]>["background"]>;
type TemplateConfig = {
  heading: string;
  subheading: string;
  background: PlatformBackground;
  chatLabelTemplate: string;
  chatPayloadTemplate?: string;
  cardFooterTemplate: string;
};

const preferredOrder = ["ht", "mx", "tm", "dc", "sho"];
const defaultBackground: PlatformBackground = {
  id: "platform-grid-bg",
  kind: "image",
  url: "/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg",
  alt: "Perazzi workshop background for platform section",
};

const formatTemplate = (template: string, platformName: string) =>
  template.replaceAll("{platformName}", platformName);

const normalizeTemplate = (value?: string) => value?.trim() ?? "";

const buildTemplates = (ui?: ShotgunsLandingData["platformGridUi"]): TemplateConfig => {
  const normalizedChatLabel = normalizeTemplate(ui?.chatLabelTemplate);
  const normalizedChatPayload = normalizeTemplate(ui?.chatPayloadTemplate);
  const normalizedFooter = normalizeTemplate(ui?.cardFooterTemplate);

  return {
    heading: ui?.heading ?? "Platforms & Lineages",
    subheading:
      ui?.subheading ??
      "Explore the MX, HT, and TM Platforms and learn how each carry a different balance, design philosophy, and place on the line.",
    background: ui?.background ?? defaultBackground,
    chatLabelTemplate: normalizedChatLabel || "Ask about {platformName}",
    chatPayloadTemplate: normalizedChatPayload || undefined,
    cardFooterTemplate: normalizedFooter || "Explore the {platformName} lineage",
  };
};

const orderPlatforms = (platforms: readonly Platform[]): Platform[] => {
  const lookup = new Map(platforms.map((platform) => [platform.slug.toLowerCase(), platform]));

  const inOrder = preferredOrder.map((slug) => lookup.get(slug)).filter(Boolean) as Platform[];
  const remaining = platforms.filter((platform) => !lookup.has(platform.slug.toLowerCase()));

  return [...inOrder, ...remaining];
};

const getClosestCardIndex = (container: HTMLDivElement) => {
  const containerRect = container.getBoundingClientRect();
  const containerCenter = containerRect.left + containerRect.width / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  container.querySelectorAll<HTMLDivElement>("[data-index]").forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const distance = Math.abs(cardCenter - containerCenter);
    const indexAttr = card.dataset.index;
    const index = indexAttr ? Number(indexAttr) : Number.NaN;

    if (!Number.isNaN(index) && distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const scrollToIndex = (container: HTMLDivElement | null, index: number) => {
  if (!container) return;

  const target = container.querySelector<HTMLDivElement>(`[data-index="${index}"]`);
  target?.scrollIntoView({
    behavior: "auto",
    inline: "center",
    block: "nearest",
  });
};

const createPayloadBuilder =
  (chatPayloadTemplate?: string) =>
  (platform: Platform): ChatTriggerPayload => {
    const basePayload = buildPlatformPrompt(platform.slug);
    if (chatPayloadTemplate && chatPayloadTemplate !== defaultChatPayloadTemplate) {
      return {
        question: formatTemplate(chatPayloadTemplate, platform.name),
        context: basePayload.context,
      };
    }
    return basePayload;
  };

const PlatformTabs = ({
  platforms,
  activeIndex,
  onSelect,
}: {
  readonly platforms: readonly Platform[];
  readonly activeIndex: number;
  onSelect: (index: number) => void;
}) => (
  <div role="tablist" aria-label="Platforms" className="flex flex-wrap gap-2">
    {platforms.map((platform, index) => {
      const isActive = index === activeIndex;
      const buttonClass = `group relative overflow-hidden type-label-tight pill border focus-ring ${
        isActive
          ? "border-perazzi-red text-perazzi-red shadow-elevated"
          : "border-border/70 bg-transparent text-ink-muted hover:border-ink/60"
      }`;

      return (
        <button
          key={platform.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={buttonClass}
          onClick={() => { onSelect(index); }}
        >
          {isActive ? (
            <span className="absolute inset-0 bg-canvas/55 backdrop-blur-sm" aria-hidden="true" />
          ) : null}
          <span className="relative z-10">{platform.name}</span>
        </button>
      );
    })}
  </div>
);

type PlatformCardWithChatProps = {
  platform: Platform;
  footerLabel: string;
  chatLabel: string;
  payload: ChatTriggerPayload;
  priority: boolean;
};

const PlatformCardWithChat = ({
  platform,
  footerLabel,
  chatLabel,
  payload,
  priority,
}: PlatformCardWithChatProps) => (
  <div className="space-y-3">
    <PlatformCard platform={platform} priority={priority} footerLabel={footerLabel} />
    <ChatTriggerButton
      label={chatLabel}
      variant="outline"
      className="w-full justify-center"
      payload={payload}
    />
  </div>
);

type MobilePlatformCarouselProps = {
  readonly platforms: readonly Platform[];
  readonly cardFooterTemplate: string;
  readonly chatLabelTemplate: string;
  buildPayload: (platform: Platform) => ChatTriggerPayload;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

const MobilePlatformCarousel = ({
  platforms,
  cardFooterTemplate,
  chatLabelTemplate,
  buildPayload,
  scrollRef,
}: MobilePlatformCarouselProps) => (
  <div className="md:hidden">
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-6 -mx-6 pt-6 pb-6 sm:mx-0 sm:px-6"
      aria-label="Swipe to explore platforms"
    >
      {platforms.map((platform, index) => (
        <div key={platform.id} data-index={index} className="snap-center shrink-0 w-[85vw] max-w-sm">
          <PlatformCardWithChat
            platform={platform}
            priority={index === 0}
            footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
            chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
            payload={buildPayload(platform)}
          />
        </div>
      ))}
    </div>
  </div>
);

type ChampionHighlightProps = {
  hallmark?: string | null;
  champion?: Platform["champion"];
  platformId?: string;
};

const ChampionHighlight = ({
  hallmark,
  champion,
  platformId,
}: ChampionHighlightProps) => {
  if (!hallmark && !champion) return null;

  return (
    <div
      key={platformId}
      className="flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 text-ink text-center"
    >
      {hallmark ? (
        <p className="type-quote font-artisan text-ink">{hallmark}</p>
      ) : null}
      {champion ? (
        <div className="flex items-center justify-center gap-5">
          {champion.image ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-(--surface-elevated)">
              <Image
                src={champion.image.url}
                alt={champion.image.alt ?? `${champion.name ?? "Perazzi champion"}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            {champion.name ? (
              <p className="type-body-title text-ink">
                {champion.name}
              </p>
            ) : null}
            {champion.title ? (
              <Text size="md" className="type-label-tight text-ink-muted" leading="normal">
                {champion.title}
              </Text>
            ) : null}
            {champion.resume?.winOne ? (
              <Text size="md" className="text-ink-muted" leading="normal">
                Win highlight: <span className="text-ink">{champion.resume.winOne}</span>
              </Text>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

type DesktopPlatformGridProps = {
  platform?: Platform;
  activeIndex: number;
  cardFooterTemplate: string;
  chatLabelTemplate: string;
  buildPayload: (platform: Platform) => ChatTriggerPayload;
};

const DesktopPlatformGrid = ({
  platform,
  activeIndex,
  cardFooterTemplate,
  chatLabelTemplate,
  buildPayload,
}: DesktopPlatformGridProps) => (
  <div className="hidden md:grid gap-6 md:grid-cols-2 min-h-[720px] sm:min-h-[820px] md:min-h-[750px] items-stretch">
    {platform ? (
      <div key={platform.id} className="h-full">
        <PlatformCardWithChat
          platform={platform}
          priority={activeIndex === 0}
          footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
          chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
          payload={buildPayload(platform)}
        />
      </div>
    ) : null}
    <div className="hidden h-full md:flex items-center justify-center">
      <ChampionHighlight
        hallmark={platform?.hallmark}
        champion={platform?.champion}
        platformId={platform?.id}
      />
    </div>
  </div>
);

type PlatformGridRevealSectionProps = {
  readonly platforms: readonly Platform[];
  readonly templates: TemplateConfig;
  readonly activeIndex: number;
  readonly setActiveIndex: Dispatch<SetStateAction<number>>;
  readonly buildPayload: (platform: Platform) => ChatTriggerPayload;
  readonly enableTitleReveal: boolean;
};

const PlatformGridRevealSection = ({
  platforms,
  templates,
  activeIndex,
  setActiveIndex,
  buildPayload,
  enableTitleReveal,
}: PlatformGridRevealSectionProps) => {
  const [platformExpanded, setPlatformExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const platformShellRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const headingTitle = templates.heading;
  const headingSubtitle = templates.subheading;
  const revealGrid = !enableTitleReveal || platformExpanded;
  const revealPhotoFocus = revealGrid;
  const activePlatform = platforms[activeIndex] ?? platforms[0];
  const platformMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    setPlatformExpanded(true);
    setHeaderThemeReady(true);
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setPlatformExpanded(false);
  };

  const handleTabSelect = useCallback((index: number) => {
    setActiveIndex(index);
    scrollToIndex(scrollRef.current, index);
  }, [setActiveIndex]);

  useEffect(() => {
    if (!enableTitleReveal || !revealGrid) return;
    const node = platformShellRef.current;
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
  }, [enableTitleReveal, revealGrid, activeIndex]);

  useEffect(() => {
    if (!revealGrid) return;
    const container = scrollRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      const closestIndex = getClosestCardIndex(container);
      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [revealGrid, setActiveIndex]);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={templates.background.url}
            alt={templates.background.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            revealGrid ? "opacity-0" : "opacity-100",
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

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div
          ref={platformShellRef}
          style={
            enableTitleReveal && revealGrid && expandedHeight
              ? { minHeight: expandedHeight }
              : undefined
          }
          className={cn(
            "relative flex flex-col space-y-8 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            platformMinHeight,
          )}
        >
          {revealGrid ? (
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="space-y-3">
                <div className="relative">
                  <Heading
                    id="platforms-heading"
                    level={2}
                    size="xl"
                    className={headerThemeReady ? "text-ink" : "text-white"}
                  >
                    {headingTitle}
                  </Heading>
                </div>
                <div className="relative">
                  <Text
                    className={cn(
                      "type-section-subtitle max-w-4xl",
                      headerThemeReady ? "text-ink-muted" : "text-white",
                    )}
                    leading="normal"
                  >
                    {headingSubtitle}
                  </Text>
                </div>
              </div>
              {enableTitleReveal ? (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
                  onClick={handleCollapse}
                >
                  Collapse
                </button>
              ) : null}
            </div>
          ) : (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative inline-flex text-white">
                <Heading
                  id="platforms-heading"
                  level={2}
                  size="xl"
                  className="type-section-collapsed"
                >
                  {headingTitle}
                </Heading>
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer focus-ring"
                  onPointerEnter={handleExpand}
                  onFocus={handleExpand}
                  onClick={handleExpand}
                  aria-expanded={revealGrid}
                  aria-controls="platform-grid-body"
                  aria-labelledby="platforms-heading"
                >
                  <span className="sr-only">Expand {headingTitle}</span>
                </button>
              </div>
              <div className="relative text-white">
                <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                  {headingSubtitle}
                </Text>
              </div>
              <div className="mt-3">
                <Text
                  size="button"
                  className="text-white/80 cursor-pointer focus-ring"
                  asChild
                >
                  <button type="button" onClick={handleExpand}>
                    Read more
                  </button>
                </Text>
              </div>
            </div>
          )}

          {revealGrid ? (
            <div id="platform-grid-body" className="space-y-8">
              <PlatformTabs
                platforms={platforms}
                activeIndex={activeIndex}
                onSelect={handleTabSelect}
              />

              <MobilePlatformCarousel
                platforms={platforms}
                cardFooterTemplate={templates.cardFooterTemplate}
                chatLabelTemplate={templates.chatLabelTemplate}
                buildPayload={buildPayload}
                scrollRef={scrollRef}
              />

              <DesktopPlatformGrid
                platform={activePlatform}
                activeIndex={activeIndex}
                cardFooterTemplate={templates.cardFooterTemplate}
                chatLabelTemplate={templates.chatLabelTemplate}
                buildPayload={buildPayload}
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export function PlatformGrid({ platforms, ui }: PlatformGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const analyticsRef = useAnalyticsObserver("PlatformGridSeen");

  const orderedPlatforms = useMemo(() => orderPlatforms(platforms), [platforms]);
  const templates = useMemo(() => buildTemplates(ui), [ui]);
  const buildPayload = useMemo(
    () => createPayloadBuilder(templates.chatPayloadTemplate),
    [templates.chatPayloadTemplate],
  );

  const enableTitleReveal = isDesktop;
  const gridKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PlatformGridSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-visible py-10 sm:py-16 full-bleed"
      aria-labelledby="platforms-heading"
    >
      <PlatformGridRevealSection
        key={gridKey}
        platforms={orderedPlatforms}
        templates={templates}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        buildPayload={buildPayload}
        enableTitleReveal={enableTitleReveal}
      />
    </section>
  );
}
