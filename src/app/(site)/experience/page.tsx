import Script from "next/script";
import { ExperiencePicker } from "@/components/experience/ExperiencePicker";
import { VisitFactory } from "@/components/experience/VisitFactory";
import { BookingOptions } from "@/components/experience/BookingOptions"; // Experience-specific variant
import { TravelNetwork } from "@/components/experience/TravelNetwork";
import { MosaicGallery } from "@/components/experience/MosaicGallery";
import { ExperienceHero } from "@/components/experience/ExperienceHero";
import { ExperienceAdvisorySection } from "@/components/experience/ExperienceAdvisorySection";
import { CTASection } from "@/components/shotguns/CTASection";
import { getExperiencePageData } from "@/lib/experience-data";
import { getExperienceNetworkData } from "@/sanity/queries/experience";
import type { FAQItem } from "@/types/experience";

export default async function ExperiencePage() {
  const [pageData, networkData] = await Promise.all([
    getExperiencePageData(),
    getExperienceNetworkData(),
  ]);

  const {
    hero,
    picker,
    pickerUi,
    faqSection,
    visitPlanningBlock,
    fittingGuidanceBlock,
    travelGuideBlock,
    visitFactorySection,
    bookingSection,
    travelNetworkUi,
    mosaicUi,
    mosaic,
    finalCta,
  } = pageData;

  const pickerAnchorsById: Record<string, string> = {
    visit: "#experience-visit-planning",
    fitting: "#experience-booking-guide",
    demo: "#experience-travel-guide",
  };

  const pickerAnchorsByHref: Record<string, string> = {
    "/experience/visit": "#experience-visit-planning",
    "/experience/fitting": "#experience-booking-guide",
    "/experience/demo": "#experience-travel-guide",
    "/experience#visit": "#experience-visit-planning",
    "/experience#fitting": "#experience-booking-guide",
    "/experience#demo": "#experience-travel-guide",
  };

  const resolveAnchor = (itemId?: string, href?: string) => {
    const anchorFromId = itemId ? pickerAnchorsById[itemId] : undefined;
    if (href) {
      const hashIndex = href.indexOf("#");
      if (hashIndex >= 0) {
        const hash = href.slice(hashIndex);
        if (hash && hash !== "#") return hash;
      }
      const direct = pickerAnchorsByHref[href];
      if (direct) return direct;
      if (href.includes("visit")) return pickerAnchorsById.visit;
      if (href.includes("fitting")) return pickerAnchorsById.fitting;
      if (href.includes("demo") || href.includes("travel")) {
        return pickerAnchorsById.demo;
      }
    }
    return anchorFromId;
  };

  const pickerItems = picker.map((item) => {
    const anchor = resolveAnchor(item.id, item.href);
    return anchor ? { ...item, href: anchor } : item;
  });

  const faqItems = faqSection.items ?? [];
  const faqJsonLd = faqItems.length ? FAQ_SCHEMA(faqItems) : null;

  const visitPlanningHeading = visitPlanningBlock.heading ?? "Visit planning";
  const visitPlanningIntro =
    visitPlanningBlock.intro ??
    "Map out a Botticino factory visit or fitting day before you commit: what happens, who you'll meet, and how to arrive ready.";
  const visitPlanningBullets = visitPlanningBlock.bullets?.length
    ? visitPlanningBlock.bullets
    : [
        "Itinerary & fittings - timing for measurements, patterning, gunroom walkthroughs, and engraving consults if needed.",
        "Travel & lodging - best airports, drivers or rentals, and partner hotels close to Botticino and Gardone.",
        "Range-day add-ons - clays venues and coaching near the factory to test setups or confirm gunfit.",
      ];
  const visitPlanningClosing =
    visitPlanningBlock.closing ??
    "Share your dates, disciplines, and goals; our team will send a draft itinerary and the right next pages to review before you book.";
  const visitPlanningChatLabel = visitPlanningBlock.chatLabel ?? "Plan my visit";
  const visitPlanningChatPrompt =
    visitPlanningBlock.chatPrompt ??
    "Draft a plan for a Perazzi fitting or Botticino visit: outline the schedule, who I'll meet, what to bring, and travel or lodging options nearby.";
  const visitPlanningLinkLabel = visitPlanningBlock.linkLabel ?? "See visit options";
  const visitPlanningLinkHref = visitPlanningBlock.linkHref ?? "/experience/visit";
  const visitPlanningRightTitle =
    visitPlanningBlock.rightTitle ?? "What the concierge can line up:";

  const fittingGuidanceHeading = fittingGuidanceBlock.heading ?? "Fitting guidance";
  const fittingGuidanceIntro =
    fittingGuidanceBlock.intro ??
    "Not sure which fitting session to book? The concierge will match your goals to the right format and send a prep list before you reserve.";
  const fittingGuidanceBullets = fittingGuidanceBlock.bullets?.length
    ? fittingGuidanceBlock.bullets
    : [
        "Session match - align travel, timelines, and goals to virtual consults, local range days, or Botticino fittings.",
        "Prep checklist - measurements, photos or video, gun history, and any disciplines to highlight before booking.",
        "Next steps - which scheduler link to use, lead times, and what happens after your slot is confirmed.",
      ];
  const fittingGuidanceClosing =
    fittingGuidanceBlock.closing ??
    "Share your dates, preferred format, and competition calendar; we will point you to the right session and finalize the booking flow for you.";
  const fittingGuidanceChatLabel = fittingGuidanceBlock.chatLabel ?? "Help me book";
  const fittingGuidanceChatPrompt =
    fittingGuidanceBlock.chatPrompt ??
    "Help me pick the right Perazzi fitting option (virtual consult, range session, or Botticino visit) and list what I should prepare before scheduling.";
  const fittingGuidanceLinkLabel = fittingGuidanceBlock.linkLabel ?? "View fitting sessions";
  const fittingGuidanceLinkHref = fittingGuidanceBlock.linkHref ?? "/experience/fitting";
  const fittingGuidanceRightTitle =
    fittingGuidanceBlock.rightTitle ?? "What the concierge can clarify:";

  const travelHeading = travelGuideBlock.heading ?? "Meet us on the road";
  const travelIntro =
    travelGuideBlock.intro ??
    "Connect with Perazzi when we travel or through trusted dealers. The concierge can point you to the closest stop and what to bring.";
  const travelBullets = travelGuideBlock.bullets?.length
    ? travelGuideBlock.bullets
    : [
        "Travel stops - confirm dates, cities, and which team members will be on-site for fittings or demos.",
        "Dealer introductions - match you with a trusted Perazzi dealer nearby and set expectations for inventory or services.",
        "What to bring - targets, disciplines, gun history, and measurements to make a road-stop session efficient.",
      ];
  const travelClosing =
    travelGuideBlock.closing ??
    "Share your location and dates; we will route you to the right stop or dealer and prep a checklist for your visit.";
  const travelChatLabel = travelGuideBlock.chatLabel ?? "Plan my stop";
  const travelChatPrompt =
    travelGuideBlock.chatPrompt ??
    "Find the best way to meet Perazzi near me: upcoming travel stops, nearby authorized dealers, and what I should bring to test guns or discuss a build.";
  const travelLinkLabel = travelGuideBlock.linkLabel ?? "View schedule and dealers";
  const travelLinkHref = travelGuideBlock.linkHref ?? "#travel-network-heading";
  const travelRightTitle =
    travelGuideBlock.rightTitle ?? "What the concierge can organize:";

  return (
    <main className="space-y-12 sm:space-y-16">
      {faqJsonLd ? (
        <Script
          id="experience-faq-schema"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(faqJsonLd)}
        </Script>
      ) : null}
      <div className="space-y-0">
        <ExperienceHero
          hero={hero}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Experience", href: "/experience" },
          ]}
        />
        <ExperiencePicker items={pickerItems} faqSection={faqSection} pickerUi={pickerUi} />
      </div>
      <div className="space-y-0">
        <ExperienceAdvisorySection
          sectionId="experience-visit-planning"
          headingId="experience-visit-planning-heading"
          heading={visitPlanningHeading}
          intro={visitPlanningIntro}
          chatLabel={visitPlanningChatLabel}
          chatPayload={{
            question: visitPlanningChatPrompt,
            context: { pageUrl: "/experience", mode: "prospect" },
          }}
          link={{ href: visitPlanningLinkHref, label: visitPlanningLinkLabel }}
          rightTitle={visitPlanningRightTitle}
          bullets={visitPlanningBullets}
          closing={visitPlanningClosing}
        />
        <VisitFactory visitFactorySection={visitFactorySection} />
      </div>
      <ExperienceAdvisorySection
        sectionId="experience-booking-guide"
        headingId="experience-booking-guide-heading"
        heading={fittingGuidanceHeading}
        intro={fittingGuidanceIntro}
        chatLabel={fittingGuidanceChatLabel}
        chatPayload={{
          question: fittingGuidanceChatPrompt,
          context: { pageUrl: "/experience", mode: "prospect" },
        }}
        link={{ href: fittingGuidanceLinkHref, label: fittingGuidanceLinkLabel }}
        rightTitle={fittingGuidanceRightTitle}
        bullets={fittingGuidanceBullets}
        closing={fittingGuidanceClosing}
      />
      <BookingOptions bookingSection={bookingSection} />
      <ExperienceAdvisorySection
        sectionId="experience-travel-guide"
        headingId="experience-travel-guide-heading"
        heading={travelHeading}
        intro={travelIntro}
        chatLabel={travelChatLabel}
        chatPayload={{
          question: travelChatPrompt,
          context: { pageUrl: "/experience", mode: "prospect" },
        }}
        link={{ href: travelLinkHref, label: travelLinkLabel }}
        rightTitle={travelRightTitle}
        bullets={travelBullets}
        closing={travelClosing}
      />
      <TravelNetwork data={networkData} ui={travelNetworkUi} />
      <MosaicGallery assets={mosaic} mosaicUi={mosaicUi} />
      <CTASection
        dataAnalyticsId="FinalCTASeen"
        analyticsPrefix="FinalCTAClicked"
        text={finalCta.text}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
      />
    </main>
  );
}

function FAQ_SCHEMA(faq: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.aHtml,
      },
    })),
  };
}
