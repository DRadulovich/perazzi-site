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
import { Container, Heading, Section, Text } from "@/components/ui";

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
    <div className="space-y-16" id="bespoke-top">
      <BuildHero hero={hero} fullBleed />
      <BuildStepsScroller steps={steps} intro={stepsIntro} skipTargetId="bespoke-experts" />
      <Section
        padding="lg"
        bordered={false}
        className="rounded-none border-t border-none! bg-canvas shadow-none!"
        aria-labelledby="bespoke-guide-heading"
      >
        <Container
          size="xl"
          className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="space-y-4 text-ink">
            <Heading
              id="bespoke-guide-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {bespokeGuide?.heading ?? "Need a bespoke guide?"}
            </Heading>
            <Text className="mb-8 type-subsection text-ink-muted">
              {bespokeGuide?.body
                ?? "Ask how fittings, platform choices, engraving, and finishing should flow for you—so your visit to the atelier is focused, confident, and personal."}
            </Text>
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
                className="type-button inline-flex items-center justify-center gap-2 pill border border-perazzi-red/60 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {bespokeGuide?.linkLabel ?? "Request a visit"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 type-subsection text-ink-muted">
              <Text className="type-card-title text-ink !text-2xl" leading="normal">
                Three things we’ll map together:
              </Text>
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
                          <span className="text-ink">{label.trim()}</span>
                          {rest.length ? ` — ${rest.join("—").trim()}` : ""}
                        </li>
                      );
                    })}
              </ul>
              <Text className="text-ink-muted">
                The concierge aligns your disciplines, aesthetic cues, and schedule so the atelier session runs smoothly.
              </Text>
            </div>
        </Container>
      </Section>
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
          <Text size="label-tight" muted>
            {expertsIntro?.eyebrow ?? "Atelier team"}
          </Text>
          <Heading id="expert-section-heading" level={2} size="xl" className="text-ink">
            {expertsIntro?.heading ?? "Meet the craftsmen guiding your build"}
          </Heading>
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
