"use client";

import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ShotgunsLandingData } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Container, Heading, Section, Text } from "@/components/ui";

type TriggerExplainerProps = Readonly<{
  explainer: ShotgunsLandingData["triggerExplainer"];
}>;

export function TriggerExplainer({ explainer }: TriggerExplainerProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [manualOpen, setManualOpen] = useState(false);
  const resolvedOpen = isDesktop ? true : manualOpen;
  const ratio = explainer.diagram.aspectRatio ?? 16 / 9;
  const subheading = explainer.subheading ?? "Removable or fixed—choose by confidence and feel.";
  const background = explainer.background ?? {
    id: "trigger-explainer-bg",
    kind: "image",
    url: "/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg",
    alt: "Perazzi trigger workshop background",
  };

  const analyticsRef = useAnalyticsObserver<HTMLElement>("TriggerExplainerSeen");
  const copyClasses =
    "max-w-none type-card-body text-ink [&_p]:mb-4 [&_p:last-child]:mb-0 prose-headings:text-ink prose-strong:text-ink prose-a:text-perazzi-red prose-a:underline-offset-4";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TriggerExplainerSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 mt-25 full-bleed"
      aria-labelledby="trigger-explainer-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={background.url}
          alt={background.alt}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-(--scrim-soft)" aria-hidden />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/40">
          <Collapsible
            open={resolvedOpen}
            onOpenChange={(next) => {
              setManualOpen(next);
              logAnalytics(`TriggerExplainerToggle:${next ? "open" : "closed"}`);
            }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <Heading
                id="trigger-explainer-heading"
                level={2}
                size="xl"
                className="text-ink"
              >
                {explainer.title}
              </Heading>
              <Text className="type-section-subtitle text-ink-muted" leading="normal">
                {subheading}
              </Text>
              <CollapsibleTrigger
                className="type-button mt-1 inline-flex w-fit items-center gap-2 rounded-sm border border-border/70 bg-card/60 px-4 py-2 text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring lg:hidden"
                aria-controls="trigger-explainer-content"
                data-analytics-id="TriggerExplainerToggle"
              >
                {resolvedOpen ? "Hide details" : "Show details"}
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent
              id="trigger-explainer-content"
              className="grid gap-6 overflow-hidden transition-all duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start"
            >
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
                      className="type-button inline-flex items-center gap-2 rounded-sm border border-perazzi-red/40 bg-card/60 px-4 py-2 text-perazzi-red shadow-soft backdrop-blur-sm transition hover:border-perazzi-red hover:bg-card/85 focus-ring"
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

              <figure className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated">
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
            </CollapsibleContent>
          </Collapsible>
        </Section>
      </Container>
    </section>
  );
}
