"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { Platform, ShotgunsLandingData } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
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
    behavior: "smooth",
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

const PlatformHeader = ({ heading, subheading }: { heading: string; subheading: string }) => (
  <div className="space-y-2">
    <Heading
      id="platforms-heading"
      level={2}
      size="xl"
      className="font-black italic uppercase tracking-[0.35em] text-ink"
    >
      {heading}
    </Heading>
    <Text className="mb-6 max-w-4xl font-light italic text-ink-muted" leading="normal">
      {subheading}
    </Text>
  </div>
);

type PlatformTabsProps = {
  readonly platforms: readonly Platform[];
  readonly activeIndex: number;
  onSelect: (index: number) => void;
};

const PlatformTabs = ({ platforms, activeIndex, onSelect }: PlatformTabsProps) => (
  <div role="tablist" aria-label="Platforms" className="flex flex-wrap gap-2">
    {platforms.map((platform, index) => {
      const isActive = index === activeIndex;
      return (
        <button
          key={platform.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] focus-ring transition ${
            isActive
              ? "border-perazzi-red bg-canvas/40 text-perazzi-red backdrop-blur-sm shadow-elevated"
              : "border-border/70 bg-transparent text-ink-muted hover:border-ink/60"
          }`}
          onClick={() => { onSelect(index); }}
        >
          {platform.name}
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
      className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none"
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
  prefersReducedMotion: boolean;
  platformId?: string;
};

const ChampionHighlight = ({
  hallmark,
  champion,
  prefersReducedMotion,
  platformId,
}: ChampionHighlightProps) => {
  if (!hallmark && !champion) return null;

  return (
    <motion.div
      key={platformId}
      className="flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 text-ink text-center"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion ? undefined : { duration: 1.5, delay: 0.3, ease: [0.33, 1, 0.68, 1] }
      }
    >
      {hallmark ? (
        <Text className="text-xl italic text-ink" leading="normal">
          {hallmark}
        </Text>
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
              <Heading level={3} size="lg" className="text-ink">
                {champion.name}
              </Heading>
            ) : null}
            {champion.title ? (
              <Text size="md" className="text-ink-muted" leading="normal">
                {champion.title}
              </Text>
            ) : null}
            {champion.resume?.winOne ? (
              <Text size="md" className="text-ink-muted" leading="normal">
                Win highlight: <span className="font-medium">{champion.resume.winOne}</span>
              </Text>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

type DesktopPlatformGridProps = {
  platform?: Platform;
  activeIndex: number;
  cardFooterTemplate: string;
  chatLabelTemplate: string;
  buildPayload: (platform: Platform) => ChatTriggerPayload;
  prefersReducedMotion: boolean;
};

const DesktopPlatformGrid = ({
  platform,
  activeIndex,
  cardFooterTemplate,
  chatLabelTemplate,
  buildPayload,
  prefersReducedMotion,
}: DesktopPlatformGridProps) => (
  <div className="hidden md:grid gap-6 md:grid-cols-2 min-h-[720px] sm:min-h-[820px] md:min-h-[750px] items-stretch">
    {platform ? (
      <PlatformCardWithChat
        platform={platform}
        priority={activeIndex === 0}
        footerLabel={formatTemplate(cardFooterTemplate, platform.name)}
        chatLabel={formatTemplate(chatLabelTemplate, platform.name)}
        payload={buildPayload(platform)}
      />
    ) : null}
    <div className="hidden h-full md:flex items-center justify-center">
      <ChampionHighlight
        hallmark={platform?.hallmark}
        champion={platform?.champion}
        prefersReducedMotion={prefersReducedMotion}
        platformId={platform?.id}
      />
    </div>
  </div>
);

const PlatformBackground = ({ background }: { background: PlatformBackground }) => (
  <div className="absolute inset-0 z-0 overflow-hidden">
    <Image
      src={background.url}
      alt={background.alt}
      fill
      sizes="100vw"
      className="object-cover"
      priority={false}
    />
    <div className="absolute inset-0 bg-(--scrim-soft)" aria-hidden />
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
          "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%), " +
          "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 70%)",
      }}
      aria-hidden
    />
  </div>
);

export function PlatformGrid({ platforms, ui }: PlatformGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const analyticsRef = useAnalyticsObserver("PlatformGridSeen");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const orderedPlatforms = useMemo(() => orderPlatforms(platforms), [platforms]);
  const templates = useMemo(() => buildTemplates(ui), [ui]);

  const activePlatform = orderedPlatforms[activeIndex] ?? orderedPlatforms[0];
  const buildPayload = useMemo(
    () => createPayloadBuilder(templates.chatPayloadTemplate),
    [templates.chatPayloadTemplate],
  );

  useEffect(() => {
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
  }, []);

  const handleTabSelect = useCallback((index: number) => {
    setActiveIndex(index);
    scrollToIndex(scrollRef.current, index);
  }, []);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PlatformGridSeen"
      className="relative w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        minHeight: "80vh",
      }}
      aria-labelledby="platforms-heading"
    >
      <PlatformBackground background={templates.background} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-8">
          <PlatformHeader heading={templates.heading} subheading={templates.subheading} />
          <PlatformTabs platforms={orderedPlatforms} activeIndex={activeIndex} onSelect={handleTabSelect} />

          {/* Mobile carousel */}
          <MobilePlatformCarousel
            platforms={orderedPlatforms}
            cardFooterTemplate={templates.cardFooterTemplate}
            chatLabelTemplate={templates.chatLabelTemplate}
            buildPayload={buildPayload}
            scrollRef={scrollRef}
          />

          {/* Desktop grid */}
          <DesktopPlatformGrid
            platform={activePlatform}
            activeIndex={activeIndex}
            cardFooterTemplate={templates.cardFooterTemplate}
            chatLabelTemplate={templates.chatLabelTemplate}
            buildPayload={buildPayload}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>
    </section>
  );
}
