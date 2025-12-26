import Link from "next/link";
import Script from "next/script";
import { ExperiencePicker } from "@/components/experience/ExperiencePicker";
import { VisitFactory } from "@/components/experience/VisitFactory";
import { BookingOptions } from "@/components/experience/BookingOptions"; // Experience-specific variant
import { TravelNetwork } from "@/components/experience/TravelNetwork";
import { MosaicGallery } from "@/components/experience/MosaicGallery";
import { ExperienceHero } from "@/components/experience/ExperienceHero";
import { CTASection } from "@/components/shotguns/CTASection";
import { getExperiencePageData } from "@/lib/experience-data";
import { getExperienceNetworkData } from "@/sanity/queries/experience";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Container, Heading, Section, Text } from "@/components/ui";
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
      <ExperienceHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Experience", href: "/experience" },
        ]}
      />
      <ExperiencePicker items={pickerItems} faqSection={faqSection} pickerUi={pickerUi} />
      <Section
        id="experience-visit-planning"
        padding="lg"
        bordered={false}
        className="relative isolate w-screen max-w-[100vw] scroll-mt-24 overflow-hidden rounded-none border-t border-border bg-canvas shadow-none"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="experience-visit-planning-heading"
      >
        <Container
          size="xl"
          className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="space-y-4 text-ink">
            <Heading
              id="experience-visit-planning-heading"
              level={2}
              size="xl"
              className="font-black uppercase italic tracking-[0.35em] text-ink"
            >
              {visitPlanningHeading}
            </Heading>
            <Text size="md" muted leading="relaxed" className="mb-8 font-light italic">
              {visitPlanningIntro}
            </Text>
            <div className="flex flex-wrap justify-start gap-3">
              <ChatTriggerButton
                label={visitPlanningChatLabel}
                payload={{
                  question: visitPlanningChatPrompt,
                  context: { pageUrl: "/experience", mode: "prospect" },
                }}
                variant="outline"
              />
              <Link
                href={visitPlanningLinkHref}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {visitPlanningLinkLabel}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
            <Text size="md" className="font-semibold not-italic text-ink">
              What the concierge can line up:
            </Text>
            <ul className="space-y-2">
              {visitPlanningBullets.map((bullet) => {
                const [label, ...rest] = bullet.split(" - ");
                return (
                  <li key={bullet}>
                    <span className="text-base sm:text-lg font-black not-italic text-ink">{label}</span>
                    {" "}-{" "}
                    {rest.join(" - ")}
                  </li>
                );
              })}
            </ul>
            <Text size="md" muted leading="relaxed" className="font-light italic">
              {visitPlanningClosing}
            </Text>
          </div>
        </Container>
      </Section>
      <VisitFactory visitFactorySection={visitFactorySection} />
      <Section
        id="experience-booking-guide"
        padding="lg"
        bordered={false}
        className="relative isolate w-screen max-w-[100vw] scroll-mt-24 overflow-hidden rounded-none border-t border-border bg-canvas shadow-none"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="experience-booking-guide-heading"
      >
        <Container
          size="xl"
          className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="space-y-4 text-ink">
            <Heading
              id="experience-booking-guide-heading"
              level={2}
              size="xl"
              className="font-black uppercase italic tracking-[0.35em] text-ink"
            >
              {fittingGuidanceHeading}
            </Heading>
            <Text size="md" muted leading="relaxed" className="mb-8 font-light italic">
              {fittingGuidanceIntro}
            </Text>
            <div className="flex flex-wrap justify-start gap-3">
              <ChatTriggerButton
                label={fittingGuidanceChatLabel}
                payload={{
                  question: fittingGuidanceChatPrompt,
                  context: { pageUrl: "/experience", mode: "prospect" },
                }}
                variant="outline"
              />
              <Link
                href={fittingGuidanceLinkHref}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {fittingGuidanceLinkLabel}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
            <Text size="md" className="font-semibold not-italic text-ink">
              What the concierge can clarify:
            </Text>
            <ul className="space-y-2">
              {fittingGuidanceBullets.map((bullet) => {
                const [label, ...rest] = bullet.split(" - ");
                return (
                  <li key={bullet}>
                    <span className="text-base sm:text-lg font-black not-italic text-ink">{label}</span>
                    {" "}-{" "}
                    {rest.join(" - ")}
                  </li>
                );
              })}
            </ul>
            <Text size="md" muted leading="relaxed" className="font-light italic">
              {fittingGuidanceClosing}
            </Text>
          </div>
        </Container>
      </Section>
      <BookingOptions bookingSection={bookingSection} />
      <Section
        id="experience-travel-guide"
        padding="lg"
        bordered={false}
        className="relative isolate w-screen max-w-[100vw] scroll-mt-24 overflow-hidden rounded-none border-t border-border bg-canvas shadow-none"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="experience-travel-guide-heading"
      >
        <Container
          size="xl"
          className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="space-y-4 text-ink">
            <Heading
              id="experience-travel-guide-heading"
              level={2}
              size="xl"
              className="font-black uppercase italic tracking-[0.35em] text-ink"
            >
              {travelHeading}
            </Heading>
            <Text size="md" muted leading="relaxed" className="mb-8 font-light italic">
              {travelIntro}
            </Text>
            <div className="flex flex-wrap justify-start gap-3">
              <ChatTriggerButton
                label={travelChatLabel}
                payload={{
                  question: travelChatPrompt,
                  context: { pageUrl: "/experience", mode: "prospect" },
                }}
                variant="outline"
              />
              <Link
                href={travelLinkHref}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {travelLinkLabel}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
            <Text size="md" className="font-semibold not-italic text-ink">
              What the concierge can organize:
            </Text>
            <ul className="space-y-2">
              {travelBullets.map((bullet) => {
                const [label, ...rest] = bullet.split(" - ");
                return (
                  <li key={bullet}>
                    <span className="text-base sm:text-lg font-black not-italic text-ink">{label}</span>
                    {" "}-{" "}
                    {rest.join(" - ")}
                  </li>
                );
              })}
            </ul>
            <Text size="md" muted leading="relaxed" className="font-light italic">
              {travelClosing}
            </Text>
          </div>
        </Container>
      </Section>
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
