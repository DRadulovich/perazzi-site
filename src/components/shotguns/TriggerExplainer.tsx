"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import Image from "next/image";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ShotgunsLandingData } from "@/types/catalog";
import { logAnalytics } from "@/lib/analytics";

type TriggerExplainerProps = {
  explainer: ShotgunsLandingData["triggerExplainer"];
};

export function TriggerExplainer({ explainer }: TriggerExplainerProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [manualOpen, setManualOpen] = useState(false);
  const resolvedOpen = isDesktop ? true : manualOpen;
  const ratio = explainer.diagram.aspectRatio ?? 16 / 9;

  return (
    <section
      className="relative isolate w-screen overflow-hidden py-16 sm:py-20 mt-25"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="trigger-explainer-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg"
          alt="Perazzi trigger workshop background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
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
        <div className="space-y-6 rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-10">
          <Collapsible.Root
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
                className="text-4xl font-black uppercase italic tracking-[0.35em] text-ink"
              >
                {explainer.title}
              </h2>
              <p className="text-xl font-light italic text-ink-muted">
                Removable or fixed—choose by confidence and feel.
              </p>
              <Collapsible.Trigger
                className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink hover:border-ink/60 focus-ring transition lg:hidden"
                aria-controls="trigger-explainer-content"
                data-analytics-id="TriggerExplainerToggle"
              >
                {resolvedOpen ? "Hide details" : "Show details"}
              </Collapsible.Trigger>
            </div>

            <Collapsible.Content
              id="trigger-explainer-content"
              className="grid gap-6 overflow-hidden transition-all duration-300 data-[state=closed]:h-0 data-[state=closed]:opacity-0 data-[state=open]:h-auto data-[state=open]:opacity-100 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start"
            >
              <div className="rounded-3xl border border-border/0 bg-card/0 p-5 sm:p-6 lg:flex lg:h-full lg:flex-col lg:justify-start">
                <div
                  className="prose prose-sm max-w-none text-ink prose-headings:text-ink prose-strong:text-ink prose-a:text-perazzi-red prose-a:underline-offset-4"
                  dangerouslySetInnerHTML={{ __html: explainer.copyHtml }}
                />
                <div className="mt-5 flex flex-wrap gap-3">
                  {explainer.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      data-analytics-id={`TriggerExplainerLink:${link.href}`}
                      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red hover:border-perazzi-red focus-ring transition"
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

              <figure className="rounded-3xl border border-border/70 bg-card/50 p-3 shadow-sm">
                <div
                  className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
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
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/60 via-[color:var(--scrim-strong)]/40 to-transparent"
                    aria-hidden
                  />
                </div>
                {explainer.diagram.caption ? (
                  <figcaption className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
                    {explainer.diagram.caption}
                  </figcaption>
                ) : null}
              </figure>
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
      </div>
    </section>
  );
}
