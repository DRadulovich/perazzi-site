 "use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import Image from "next/image";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ShotgunsLandingData } from "@/types/catalog";

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
      className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
      aria-labelledby="trigger-explainer-heading"
    >
      <Collapsible.Root
        open={resolvedOpen}
        onOpenChange={(next) => {
          setManualOpen(next);
          console.log("[analytics] TriggerExplainerToggle", next ? "open" : "closed");
        }}
        className="space-y-4"
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="trigger-explainer-heading" className="text-xl font-semibold text-ink">
              {explainer.title}
            </h2>
            <p className="text-sm text-ink-muted">
              Removable or fixed—choose by confidence and feel.
            </p>
          </div>
        <Collapsible.Trigger
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink focus-ring lg:hidden"
          aria-controls="trigger-explainer-content"
          data-analytics-id="TriggerExplainerToggle"
        >
          {resolvedOpen ? "Hide details" : "Show details"}
        </Collapsible.Trigger>
        </header>

        <Collapsible.Content
          id="trigger-explainer-content"
          className="space-y-4 overflow-hidden transition-all duration-300 data-[state=closed]:h-0 data-[state=closed]:opacity-0 data-[state=open]:h-auto data-[state=open]:opacity-100"
        >
          <div
            className="prose prose-sm max-w-none text-ink-muted"
            dangerouslySetInnerHTML={{ __html: explainer.copyHtml }}
          />
          <figure className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <div
              className="relative overflow-hidden rounded-xl bg-neutral-200"
              style={{ aspectRatio: ratio }}
            >
              <Image
                src={explainer.diagram.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-contain"
              />
            </div>
            {explainer.diagram.caption ? (
              <figcaption className="mt-3 text-xs text-ink-muted">
                {explainer.diagram.caption}
              </figcaption>
            ) : null}
          </figure>
          <div className="flex flex-wrap gap-4">
            {explainer.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-analytics-id={`TriggerExplainerLink:${link.href}`}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
                onClick={() =>
                  console.log("[analytics] TriggerExplainerLink", link.href)
                }
              >
                {link.label}
                <span aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </section>
  );
}
