import { BuildHero } from "@/components/bespoke/BuildHero";
import { BuildStepsScroller } from "@/components/bespoke/BuildStepsScroller";
import { BookingOptions } from "@/components/bespoke/BookingOptions"; // Bespoke-specific variant
import { AssuranceBlock } from "@/components/bespoke/AssuranceBlock";
import { BespokeGuideSection } from "@/components/bespoke/BespokeGuideSection";
import { BespokeExpertsSection } from "@/components/bespoke/BespokeExpertsSection";
import { CTASection } from "@/components/shotguns/CTASection";
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
import { getBespokePageData } from "@/lib/bespoke-data";

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
      <BespokeGuideSection guide={bespokeGuide} />
      <CinematicImageStrip
        src={(cinematicStrips?.[0]?.image?.url) ?? "/cinematic_background_photos/p-web-25.jpg"}
        image={cinematicStrips?.[0]?.image}
        alt={cinematicStrips?.[0]?.alt ?? "Perazzi bespoke craftsmanship in cinematic lighting"}
      />
      <BespokeExpertsSection experts={experts} intro={expertsIntro} />
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
