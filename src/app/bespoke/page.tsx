import { BuildHero } from "@/components/bespoke/BuildHero";
import { JourneyOverview } from "@/components/bespoke/JourneyOverview";
import { BuildStepsScroller } from "@/components/bespoke/BuildStepsScroller";
import { ExpertCard } from "@/components/bespoke/ExpertCard";
import { BookingOptions } from "@/components/bespoke/BookingOptions"; // Bespoke-specific variant
import { AssuranceBlock } from "@/components/bespoke/AssuranceBlock";
import { CTASection } from "@/components/shotguns/CTASection";
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
import { getBespokePageData } from "@/lib/bespoke-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

export default async function BespokeBuildPage() {
  const { hero, journey, steps, experts, booking, assurance, footerCta } = await getBespokePageData();

  return (
    <div className="space-y-16 px-2 sm:px-4 lg:px-6" id="bespoke-top">
      <div
        className="relative w-screen"
        style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}
      >
        <BuildHero hero={hero} fullBleed />
      </div>
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">Concierge insight</p>
        <p className="mt-2 text-sm text-ink">
          Considering a bespoke build? Ask how Perazzi sequences fitting, platform selection, and engraving.
        </p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about bespoke builds"
            payload={{
              question:
                "Walk me through the bespoke Perazzi build journey—how fitting, platform choice, engraving, and hand finishing come together—and what decisions I should prepare for before visiting the atelier.",
              context: { pageUrl: "/bespoke", mode: "prospect" },
            }}
          />
        </div>
      </section>
      <JourneyOverview journey={journey} />
      <BuildStepsScroller steps={steps} skipTargetId="bespoke-experts" />
      <CinematicImageStrip
        src="/cinematic_background_photos/p-web-25.jpg"
        alt="Perazzi bespoke craftsmanship in cinematic lighting"
      />
      <section
        id="bespoke-experts"
        tabIndex={-1}
        className="space-y-6 focus:outline-none"
        aria-labelledby="expert-section-heading"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
            Atelier team
          </p>
          <h2
            id="expert-section-heading"
            className="text-2xl font-semibold text-ink"
          >
            Meet the craftsmen guiding your build
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      </section>
      <CinematicImageStrip
        src="/cinematic_background_photos/p-web-16.jpg"
        alt="Perazzi atelier ambience in cinematic lighting"
      />
      <BookingOptions booking={booking} />
      <AssuranceBlock assurance={assurance} />
      <CTASection
        dataAnalyticsId="FinalCTASeen"
        analyticsPrefix="FinalCTAClicked"
        text={footerCta.text}
        primary={{ label: footerCta.ctaLabel, href: footerCta.href }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
