"use client";

import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

export function IntegrityAdvisory() {
  const analyticsRef = useAnalyticsObserver("IntegrityAdvisorySeen");

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="IntegrityAdvisorySeen"
      className="space-y-4 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
        Authenticity & fitment
      </p>
      <h2 className="text-2xl font-semibold text-ink">
        Protect your investment
      </h2>
      <div className="prose prose-sm max-w-none text-ink-muted">
        <p>
          Perazzi parts are serialised and fit by hand. Grey-market spares often
          compromise safety, timing, or regulation. Work only with the factory
          or authorised service centres; every shipment includes documentation
          so you can verify provenance.
        </p>
        <p>
          If you are unsure, contact the concierge—send photos or serial numbers
          and we will confirm authenticity before you install any component.
        </p>
      </div>
    </section>
  );
}
