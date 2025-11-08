import Script from "next/script";
import { ExperiencePicker } from "@/components/experience/ExperiencePicker";
import { VisitFactory } from "@/components/experience/VisitFactory";
import { BookingOptions } from "@/components/experience/BookingOptions"; // Experience-specific variant
import { DemoProgram } from "@/components/experience/DemoProgram";
import { MosaicGallery } from "@/components/experience/MosaicGallery";
import { FAQList } from "@/components/experience/FAQList";
import { ExperienceHero } from "@/components/experience/ExperienceHero";
import { CTASection } from "@/components/shotguns/CTASection";
import { getExperiencePageData } from "@/lib/experience-data";
import type { FAQItem } from "@/types/experience";

export default async function ExperiencePage() {
  const {
    hero,
    picker,
    visit,
    fittingOptions,
    demo,
    mosaic,
    faq,
    finalCta,
    bookingScheduler,
  } = await getExperiencePageData();

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
      <ExperiencePicker items={picker} />
      <VisitFactory visit={visit} />
      <BookingOptions options={fittingOptions} scheduler={bookingScheduler} />
      <DemoProgram demo={demo} />
      <MosaicGallery assets={mosaic} />
      <FAQList items={faq} />
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
