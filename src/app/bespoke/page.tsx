import { BuildHero } from "@/components/bespoke/BuildHero";
import { JourneyOverview } from "@/components/bespoke/JourneyOverview";
import { BuildStepsScroller } from "@/components/bespoke/BuildStepsScroller";
import { ExpertCard } from "@/components/bespoke/ExpertCard";
import { BookingOptions } from "@/components/bespoke/BookingOptions";
import { AssuranceBlock } from "@/components/bespoke/AssuranceBlock";
import { CTASection } from "@/components/shotguns/CTASection";
import { buildData } from "@/content/build";

export default function BespokeBuildPage() {
  const { hero, journey, steps, experts, booking, assurance, footerCta } = buildData;

  return (
    <div className="space-y-16" id="bespoke-top">
      <BuildHero hero={hero} />
      <JourneyOverview journey={journey} />
      <BuildStepsScroller steps={steps} skipTargetId="bespoke-experts" />
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
