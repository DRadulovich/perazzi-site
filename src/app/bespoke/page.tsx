import Link from "next/link";
import { BuildHero } from "@/components/bespoke/BuildHero";
import { BuildStepsScroller } from "@/components/bespoke/BuildStepsScroller";
import { ExpertCard } from "@/components/bespoke/ExpertCard";
import { BookingOptions } from "@/components/bespoke/BookingOptions"; // Bespoke-specific variant
import { AssuranceBlock } from "@/components/bespoke/AssuranceBlock";
import { CTASection } from "@/components/shotguns/CTASection";
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
import { getBespokePageData } from "@/lib/bespoke-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

export default async function BespokeBuildPage() {
  const {
    hero,
    steps,
    stepsIntro,
    bespokeGuide,
    cinematicStrips,
    experts,
    expertsIntro,
    booking,
    bookingSection,
    assurance,
    footerCta,
  } = await getBespokePageData();

  return (
    <div className="space-y-16 px-2 sm:px-4 lg:px-6" id="bespoke-top">
      <BuildHero hero={hero} fullBleed />
      <BuildStepsScroller steps={steps} intro={stepsIntro} skipTargetId="bespoke-experts" />
      <section
        className="border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-10 sm:py-16"
        aria-labelledby="bespoke-guide-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4 text-ink">
            <p
              id="bespoke-guide-heading"
              className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
            >
              {bespokeGuide?.heading ?? "Need a bespoke guide?"}
            </p>
            <p className="mb-8 text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
              {bespokeGuide?.body
                ?? "Ask how fittings, platform choices, engraving, and finishing should flow for you—so your visit to the atelier is focused, confident, and personal."}
            </p>
            <div className="flex flex-wrap gap-3 justify-start">
              <ChatTriggerButton
                label={bespokeGuide?.chatLabel ?? "Plan my bespoke visit"}
                payload={{
                  question:
                    bespokeGuide?.chatPrompt
                    ?? "Map my bespoke Perazzi journey: what to expect at the fitting, how to choose platform and barrels, how engraving is staged, and what decisions I should prep before visiting the atelier.",
                  context: { pageUrl: "/bespoke", mode: "prospect" },
                }}
                variant="outline"
              />
              <Link
                href={bespokeGuide?.linkHref ?? "/experience/visit"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {bespokeGuide?.linkLabel ?? "Request a visit"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
              <p className="text-sm sm:text-base font-semibold not-italic text-ink">
                Three things we’ll map together:
              </p>
              <ul className="space-y-2">
                {(bespokeGuide?.listItems?.length
                  ? bespokeGuide.listItems
                  : [
                      "Fit & Dynamics — try-gun measurements, balance targets, and barrel regulation priorities.",
                      "Platform & Wood — HT or MX lineage, fore-end/stock profiles, and wood blank options.",
                      "Engraving & Finish — story direction, coverage, timelines, and hand-finish details.",
                    ]).map((item) => {
                      const [label, ...rest] = item.split("—");
                      return (
                        <li key={item}>
                          <span className="text-base sm:text-lg font-black not-italic text-ink">{label.trim()}</span>
                          {rest.length ? ` — ${rest.join("—").trim()}` : ""}
                        </li>
                      );
                    })}
              </ul>
              <p className="text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
                The concierge aligns your disciplines, aesthetic cues, and schedule so the atelier session runs smoothly.
              </p>
            </div>
        </div>
      </section>
      <CinematicImageStrip
        src={(cinematicStrips?.[0]?.image?.url) ?? "/cinematic_background_photos/p-web-25.jpg"}
        image={cinematicStrips?.[0]?.image}
        alt={cinematicStrips?.[0]?.alt ?? "Perazzi bespoke craftsmanship in cinematic lighting"}
      />
      <section
        id="bespoke-experts"
        tabIndex={-1}
        className="space-y-6 focus:outline-none"
        aria-labelledby="expert-section-heading"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
            {expertsIntro?.eyebrow ?? "Atelier team"}
          </p>
          <h2
            id="expert-section-heading"
            className="text-2xl font-semibold text-ink"
          >
            {expertsIntro?.heading ?? "Meet the craftsmen guiding your build"}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      </section>
      <CinematicImageStrip
        src={(cinematicStrips?.[1]?.image?.url) ?? "/cinematic_background_photos/p-web-16.jpg"}
        image={cinematicStrips?.[1]?.image}
        alt={cinematicStrips?.[1]?.alt ?? "Perazzi atelier ambience in cinematic lighting"}
      />
      <BookingOptions booking={booking} bookingSection={bookingSection} />
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
