"use client";

import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { useEffect, useRef, useState } from "react";
import type { ShotgunsLandingData } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
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
  readonly enableTitleReveal: boolean;
};

export function TriggerExplainer({ explainer }: TriggerExplainerProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
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
        enableTitleReveal={enableTitleReveal}
      />
    </section>
  );
}

const TriggerExplainerRevealSection = ({
  explainer,
  manualOpen,
  setManualOpen,
  enableTitleReveal,
}: TriggerExplainerRevealSectionProps) => {
  const [explainerExpanded, setExplainerExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const explainerShellRef = useRef<HTMLDivElement | null>(null);

  const ratio = explainer.diagram.aspectRatio ?? 16 / 9;
  const subheading = explainer.subheading ?? "Removable or fixed—choose by confidence and feel.";
  const background = explainer.background ?? {
    id: "trigger-explainer-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg",
    alt: "Perazzi trigger workshop background",
  };

  const revealExplainer = !enableTitleReveal || explainerExpanded;
  const revealPhotoFocus = revealExplainer;
  const explainerMinHeight = enableTitleReveal ? "min-h-[calc(520px+18rem)]" : null;

  const copyClasses =
    "max-w-none type-body text-ink [&_p]:mb-4 [&_p:last-child]:mb-0 prose-headings:text-ink prose-strong:text-ink prose-a:text-perazzi-red prose-a:underline-offset-4";

  const contentClassName =
    "gap-6 overflow-hidden px-2 py-3 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start";

  const explainerContent = (
    <>
      <div className="rounded-2xl border border-border/0 bg-card/0 p-4 sm:rounded-3xl sm:p-6 lg:flex lg:h-full lg:flex-col lg:justify-start">
        {explainer.copyPortableText?.length ? (
          <PortableText className={copyClasses} blocks={explainer.copyPortableText} />
        ) : explainer.copyHtml ? (
          <SafeHtml className={copyClasses} html={explainer.copyHtml} />
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          {explainer.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-analytics-id={`TriggerExplainerLink:${link.href}`}
              className="type-button inline-flex items-center gap-2 rounded-sm border border-perazzi-red/40 bg-card/60 px-4 py-2 text-perazzi-red shadow-soft backdrop-blur-sm hover:border-perazzi-red hover:bg-card/85 focus-ring"
              onClick={() =>
                logAnalytics(`TriggerExplainerLink:${link.href}`)
              }
            >
              {link.label}
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      </div>

      <figure className="group rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated">
        <div
          className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
          style={{ "--aspect-ratio": ratio }}
        >
          <Image
            src={explainer.diagram.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-contain"
          />
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
      </figure>
    </>
  );

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    setExplainerExpanded(true);
    setHeaderThemeReady(true);
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setExplainerExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealExplainer) return;
    const node = explainerShellRef.current;
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
  }, [enableTitleReveal, revealExplainer, manualOpen]);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={background.url}
            alt={background.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            revealExplainer ? "opacity-0" : "opacity-100",
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
          ref={explainerShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            explainerMinHeight,
          )}
        >
          {revealExplainer ? (
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
              <Collapsible
                open={manualOpen}
                onOpenChange={(next) => {
                  setManualOpen(next);
                  logAnalytics(`TriggerExplainerToggle:${next ? "open" : "closed"}`);
                }}
                className="space-y-4 flex-1"
              >
                <div className="space-y-3">
                  <div className="relative">
                    <Heading
                      id="trigger-explainer-heading"
                      level={2}
                      size="xl"
                      className={headerThemeReady ? "text-ink" : "text-white"}
                    >
                      {explainer.title}
                    </Heading>
                  </div>
                  <div className="relative">
                    <Text
                      className={cn(
                        "type-section-subtitle",
                        headerThemeReady ? "text-ink-muted" : "text-white",
                      )}
                      leading="normal"
                    >
                      {subheading}
                    </Text>
                  </div>
                  <CollapsibleTrigger
                    className="type-button mt-1 inline-flex w-fit items-center gap-2 rounded-sm border border-border/70 bg-card/60 px-4 py-2 text-ink shadow-soft backdrop-blur-sm hover:border-ink/20 hover:bg-card/85 focus-ring lg:hidden"
                    aria-controls="trigger-explainer-content"
                    data-analytics-id="TriggerExplainerToggle"
                  >
                    {manualOpen ? "Hide details" : "Show details"}
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent
                  id="trigger-explainer-content"
                  className={`grid ${contentClassName} lg:hidden`}
                >
                  {explainerContent}
                </CollapsibleContent>
              </Collapsible>
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
                  id="trigger-explainer-heading"
                  level={2}
                  size="xl"
                  className="type-section-collapsed"
                >
                  {explainer.title}
                </Heading>
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer focus-ring"
                  onPointerEnter={handleExpand}
                  onFocus={handleExpand}
                  onClick={handleExpand}
                  aria-expanded={revealExplainer}
                  aria-controls="trigger-explainer-body"
                  aria-labelledby="trigger-explainer-heading"
                >
                  <span className="sr-only">Expand {explainer.title}</span>
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
                  <button type="button" onClick={handleExpand}>
                    Read more
                  </button>
                </Text>
              </div>
            </div>
          )}

          {revealExplainer ? (
            <div id="trigger-explainer-body" className="space-y-6">
              <div className={`hidden lg:grid ${contentClassName}`}>
                {explainerContent}
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </>
  );
};
