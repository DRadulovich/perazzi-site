"use client";

import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { useEffect, useState } from "react";
import type { ShotgunsLandingData } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Container,
  Heading,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

type TriggerExplainerProps = Readonly<{
  explainer: ShotgunsLandingData["triggerExplainer"];
}>;

type TriggerExplainerRevealSectionProps = {
  readonly explainer: ShotgunsLandingData["triggerExplainer"];
  readonly manualOpen: boolean;
  readonly setManualOpen: (next: boolean) => void;
  readonly enableTitleReveal: boolean;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

type TriggerExplainerExpandedLayoutProps = Readonly<{
  explainer: ShotgunsLandingData["triggerExplainer"];
  manualOpen: boolean;
  setManualOpen: (next: boolean) => void;
  headerThemeReady: boolean;
  subheading: string;
  enableTitleReveal: boolean;
  onCollapse: () => void;
}>;

type TriggerExplainerContentProps = Readonly<{
  explainer: ShotgunsLandingData["triggerExplainer"];
}>;

type TriggerExplainerCopyProps = Readonly<{
  explainer: ShotgunsLandingData["triggerExplainer"];
  className: string;
}>;

export function TriggerExplainer({ explainer }: TriggerExplainerProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const triggerKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const analyticsRef = useAnalyticsObserver<HTMLElement>("TriggerExplainerSeen");

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TriggerExplainerSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 mt-25 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
      aria-labelledby="trigger-explainer-heading"
    >
      <TriggerExplainerRevealSection
        key={triggerKey}
        explainer={explainer}
        manualOpen={manualOpen}
        setManualOpen={setManualOpen}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}

const TriggerExplainerRevealSection = ({
  explainer,
  manualOpen,
  setManualOpen,
  enableTitleReveal,
  onCollapsedChange,
}: TriggerExplainerRevealSectionProps) => {
  const [explainerExpanded, setExplainerExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);

  const subheading = explainer.subheading ?? "Removable or fixed—choose by confidence and feel.";
  const background = explainer.background ?? {
    id: "trigger-explainer-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg",
    alt: "Perazzi trigger workshop background",
  };

  const revealExplainer = !enableTitleReveal || explainerExpanded;
  const revealPhotoFocus = revealExplainer;
  const {
    ref: explainerShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealExplainer,
    deps: [manualOpen],
  });

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setExplainerExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setExplainerExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <RevealAnimatedBody>
      <TriggerExplainerExpandedLayout
        explainer={explainer}
        manualOpen={manualOpen}
        setManualOpen={setManualOpen}
        headerThemeReady={headerThemeReady}
        subheading={subheading}
        enableTitleReveal={enableTitleReveal}
        onCollapse={handleCollapse}
      />
    </RevealAnimatedBody>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealExplainer}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealExplainer}
        overlay="canvas"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={explainerShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={enableTitleReveal ? "min-h-[50vh]" : undefined}
        >
          {revealExplainer ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="trigger-explainer-heading"
                heading={explainer.title}
                subheading={subheading}
                controlsId="trigger-explainer-body"
                expanded={revealExplainer}
                onExpand={handleExpand}
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

const TriggerExplainerExpandedLayout = ({
  explainer,
  manualOpen,
  setManualOpen,
  headerThemeReady,
  subheading,
  enableTitleReveal,
  onCollapse,
}: TriggerExplainerExpandedLayoutProps) => {
  const contentClassName =
    "gap-6 overflow-hidden px-2 py-3 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start";
  const explainerContent = <TriggerExplainerContent explainer={explainer} />;

  return (
    <>
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
            onClick={onCollapse}
          >
            Collapse
          </button>
        ) : null}
      </div>
      <div id="trigger-explainer-body" className="space-y-6">
        <div className={`hidden lg:grid ${contentClassName}`}>{explainerContent}</div>
      </div>
    </>
  );
};

const TriggerExplainerCopy = ({ explainer, className }: TriggerExplainerCopyProps) => {
  if (explainer.copyPortableText?.length) {
    return <PortableText className={className} blocks={explainer.copyPortableText} />;
  }

  if (explainer.copyHtml) {
    return <SafeHtml className={className} html={explainer.copyHtml} />;
  }

  return null;
};

const TriggerExplainerContent = ({ explainer }: TriggerExplainerContentProps) => {
  const ratio = explainer.diagram.aspectRatio ?? 16 / 9;
  const copyClasses =
    "max-w-none type-body text-ink [&_p]:mb-4 [&_p:last-child]:mb-0 prose-headings:text-ink prose-strong:text-ink prose-a:text-perazzi-red prose-a:underline-offset-4";

  return (
    <>
      <div className="rounded-2xl border border-border/0 bg-card/0 p-4 sm:rounded-3xl sm:p-6 lg:flex lg:h-full lg:flex-col lg:justify-start">
        <TriggerExplainerCopy explainer={explainer} className={copyClasses} />
        <div className="mt-5 flex flex-wrap gap-3">
          {explainer.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-analytics-id={`TriggerExplainerLink:${link.href}`}
              className="type-button inline-flex items-center gap-2 rounded-sm border border-perazzi-red/40 bg-card/60 px-4 py-2 text-perazzi-red shadow-soft backdrop-blur-sm hover:border-perazzi-red hover:bg-card/85 focus-ring"
              onClick={() => logAnalytics(`TriggerExplainerLink:${link.href}`)}
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
          <Text asChild size="caption" className="mt-3 text-ink-muted" leading="normal">
            <figcaption>{explainer.diagram.caption}</figcaption>
          </Text>
        ) : null}
      </figure>
    </>
  );
};
