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
import type { FAQItem } from "@/types/experience";

export default async function ExperiencePage() {
  const [pageData, networkData] = await Promise.all([
    getExperiencePageData(),
    getExperienceNetworkData(),
  ]);

  const {
    hero,
    picker,
    visit,
    fittingOptions,
    mosaic,
    faq,
    finalCta,
    bookingScheduler,
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

  const faqJsonLd = faq.length ? FAQ_SCHEMA(faq) : null;

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
      <ExperiencePicker items={pickerItems} faqItems={faq} />
      <section
        id="experience-visit-planning"
        className="relative isolate w-screen max-w-[100vw] scroll-mt-24 overflow-hidden border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-10 sm:py-16"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="experience-visit-planning-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4 text-ink">
            <h2
              id="experience-visit-planning-heading"
              className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
            >
              Visit planning
            </h2>
            <p className="mb-8 text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
              Map out a Botticino factory visit or fitting day before you commit: what happens, who you'll meet, and how to arrive ready.
            </p>
            <div className="flex flex-wrap justify-start gap-3">
              <ChatTriggerButton
                label="Plan my visit"
                payload={{
                  question:
                    "Draft a plan for a Perazzi fitting or Botticino visit: outline the schedule, who I'll meet, what to bring, and travel or lodging options nearby.",
                  context: { pageUrl: "/experience", mode: "prospect" },
                }}
                variant="outline"
              />
              <Link
                href="/experience/visit"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                See visit options
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
            <p className="text-sm sm:text-base font-semibold not-italic text-ink">
              What the concierge can line up:
            </p>
            <ul className="space-y-2">
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Itinerary & fittings</span>
                {" "}-{" "}
                  timing for measurements, patterning, gunroom walkthroughs, and engraving consults if needed.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Travel & lodging</span>
                {" "}-{" "}
                best airports, drivers or rentals, and partner hotels close to Botticino and Gardone.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Range-day add-ons</span>
                {" "}-{" "}
                clays venues and coaching near the factory to test setups or confirm gunfit.
              </li>
            </ul>
            <p className="text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
              Share your dates, disciplines, and goals; our team will send a draft itinerary and the right next pages to review before you book.
            </p>
          </div>
        </div>
      </section>
      <VisitFactory visit={visit} />
      <section
        id="experience-booking-guide"
        className="relative isolate w-screen max-w-[100vw] scroll-mt-24 overflow-hidden border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-10 sm:py-16"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="experience-booking-guide-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4 text-ink">
            <h2
              id="experience-booking-guide-heading"
              className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
            >
              Fitting guidance
            </h2>
            <p className="mb-8 text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
              Not sure which fitting session to book? The concierge will match your goals to the right format and send a prep list before you reserve.
            </p>
            <div className="flex flex-wrap justify-start gap-3">
              <ChatTriggerButton
                label="Help me book"
                payload={{
                  question:
                    "Help me pick the right Perazzi fitting option (virtual consult, range session, or Botticino visit) and list what I should prepare before scheduling.",
                  context: { pageUrl: "/experience", mode: "prospect" },
                }}
                variant="outline"
              />
              <Link
                href="/experience/fitting"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                View fitting sessions
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
            <p className="text-sm sm:text-base font-semibold not-italic text-ink">
              What the concierge can clarify:
            </p>
            <ul className="space-y-2">
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Session match</span>
                {" "}-{" "}
                align travel, timelines, and goals to virtual consults, local range days, or Botticino fittings.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Prep checklist</span>
                {" "}-{" "}
                measurements, photos or video, gun history, and any disciplines to highlight before booking.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Next steps</span>
                {" "}-{" "}
                which scheduler link to use, lead times, and what happens after your slot is confirmed.
              </li>
            </ul>
            <p className="text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
              Share your dates, preferred format, and competition calendar; we will point you to the right session and finalize the booking flow for you.
            </p>
          </div>
        </div>
      </section>
      <BookingOptions options={fittingOptions} scheduler={bookingScheduler} />
      <section
        id="experience-travel-guide"
        className="relative isolate w-screen max-w-[100vw] scroll-mt-24 overflow-hidden border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-10 sm:py-16"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="experience-travel-guide-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4 text-ink">
            <h2
              id="experience-travel-guide-heading"
              className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
            >
              Meet us on the road
            </h2>
            <p className="mb-8 text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
              Connect with Perazzi when we travel or through trusted dealers. The concierge can point you to the closest stop and what to bring.
            </p>
            <div className="flex flex-wrap justify-start gap-3">
              <ChatTriggerButton
                label="Plan my stop"
                payload={{
                  question:
                    "Find the best way to meet Perazzi near me: upcoming travel stops, nearby authorized dealers, and what I should bring to test guns or discuss a build.",
                  context: { pageUrl: "/experience", mode: "prospect" },
                }}
                variant="outline"
              />
              <Link
                href="#travel-network-heading"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                View schedule and dealers
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
            <p className="text-sm sm:text-base font-semibold not-italic text-ink">
              What the concierge can organize:
            </p>
            <ul className="space-y-2">
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Travel stops</span>
                {" "}-{" "}
                confirm dates, cities, and which team members will be on-site for fittings or demos.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">Dealer introductions</span>
                {" "}-{" "}
                match you with a trusted Perazzi dealer nearby and set expectations for inventory or services.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-ink">What to bring</span>
                {" "}-{" "}
                targets, disciplines, gun history, and measurements to make a road-stop session efficient.
              </li>
            </ul>
            <p className="text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
              Share your location and dates; we will route you to the right stop or dealer and prep a checklist for your visit.
            </p>
          </div>
        </div>
      </section>
      <TravelNetwork data={networkData} />
      <MosaicGallery assets={mosaic} />
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
