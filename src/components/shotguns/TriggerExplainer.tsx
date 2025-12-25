"use client";

import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ShotgunsLandingData } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui";

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

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TriggerExplainerSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 mt-25"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
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
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-6 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm backdrop-blur-md sm:rounded-3xl sm:bg-card/25 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10">
          <Collapsible
            open={resolvedOpen}
            onOpenChange={(next) => {
              setManualOpen(next);
              logAnalytics(`TriggerExplainerToggle:${next ? "open" : "closed"}`);
            }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <h2
                id="trigger-explainer-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-ink"
              >
                {explainer.title}
              </h2>
              <p className="text-sm sm:text-base font-light italic text-ink-muted">
                {subheading}
              </p>
              <CollapsibleTrigger
                className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring lg:hidden"
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
                <SafeHtml
                  className="prose prose-sm max-w-none text-ink prose-headings:text-ink prose-strong:text-ink prose-a:text-perazzi-red prose-a:underline-offset-4"
                  html={explainer.copyHtml}
                />
                <div className="mt-5 flex flex-wrap gap-3">
                  {explainer.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      data-analytics-id={`TriggerExplainerLink:${link.href}`}
                      className="inline-flex items-center gap-2 rounded-full border border-perazzi-red/40 bg-card/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red shadow-sm backdrop-blur-sm transition hover:border-perazzi-red hover:bg-card/85 focus-ring"
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

              <figure className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated">
                <div
                  className="relative overflow-hidden rounded-2xl bg-(--color-canvas)"
                  style={{ aspectRatio: ratio }}
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
                  <figcaption className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
                    {explainer.diagram.caption}
                  </figcaption>
                ) : null}
              </figure>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  );
}
