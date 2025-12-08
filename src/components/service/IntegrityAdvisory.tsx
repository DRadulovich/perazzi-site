"use client";

import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { IntegrityAdvisorySection } from "@/types/service";

type IntegrityAdvisoryProps = Readonly<{
  integrityAdvisory: IntegrityAdvisorySection;
}>;

export function IntegrityAdvisory({ integrityAdvisory }: IntegrityAdvisoryProps) {
  const analyticsRef = useAnalyticsObserver("IntegrityAdvisorySeen");
  const heading = integrityAdvisory.heading ?? "Protect your investment";
  const body = integrityAdvisory.body ??
    "Perazzi parts are serialised and fit by hand. Grey-market spares often compromise safety, timing, or regulation. Work only with the factory or authorised service centres; every shipment includes documentation so you can verify provenance.\n\nIf you are unsure, contact the concierge—send photos or serial numbers and we will confirm authenticity before you install any component.";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="IntegrityAdvisorySeen"
      className="space-y-4 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
    >
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
        Authenticity & fitment
      </p>
      <h2 className="text-2xl sm:text-3xl font-semibold text-ink">
        {heading}
      </h2>
      <div className="prose prose-sm max-w-none leading-relaxed text-ink-muted md:prose-lg">
        {body.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
