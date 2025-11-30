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

  const faqJsonLd = faq.length ? FAQ_SCHEMA(faq) : null;

  return (
    <div className="space-y-16">
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
      <section
        className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-5"
        aria-labelledby="experience-visit-planning-heading"
      >
        <h2
          id="experience-visit-planning-heading"
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted"
        >
          Visit planning
        </h2>
        <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink">
          Wondering what happens during a fitting or Botticino visit? Ask the concierge before you schedule.
        </p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about the experience"
            payload={{
              question:
                "Describe what to expect from a Perazzi fitting or Botticino visit—from measurements to travel logistics—and how I should prepare before booking.",
              context: { pageUrl: "/experience", mode: "prospect" },
            }}
          />
        </div>
      </section>
      <ExperiencePicker items={picker} faqItems={faq} />
      <VisitFactory visit={visit} />
      <BookingOptions options={fittingOptions} scheduler={bookingScheduler} />
      <TravelNetwork data={networkData} />
      <MosaicGallery assets={mosaic} />
      <CTASection
        dataAnalyticsId="FinalCTASeen"
        analyticsPrefix="FinalCTAClicked"
        text={finalCta.text}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
      />
    </div>
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
