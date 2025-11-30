import { ServiceHero } from "@/components/service/ServiceHero";
import { ServiceOverview } from "@/components/service/ServiceOverview";
import { ServiceNetworkFinder } from "@/components/service/ServiceNetworkFinder";
import { MaintenanceRepairs } from "@/components/service/MaintenanceRepairs";
import { PartsEditorial } from "@/components/service/PartsEditorial";
import { IntegrityAdvisory } from "@/components/service/IntegrityAdvisory";
import { ServiceRequest } from "@/components/service/ServiceRequest";
import { PartsRequest } from "@/components/service/PartsRequest";
import { CareGuidesDownloads } from "@/components/service/CareGuidesDownloads";
import { FAQList } from "@/components/service/FAQList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getServicePageData } from "@/lib/service-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

const SERVICE_REQUEST_EMBED = {
  title: "Service request",
  url: "https://calendly.com/perazzi-service/request",
  fallback: "/service/request",
};

const PARTS_REQUEST_EMBED = {
  url: "https://calendly.com/perazzi-service/parts",
  fallback: "/service/parts-request",
};

export default async function ServicePage() {
  const { hero, overview, locations, maintenanceGuides, partsEditorial, faq, finalCta } =
    await getServicePageData();

  const faqSchema = faq.length
    ? {
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
      }
    : null;

  return (
    <div className="space-y-16">
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      ) : null}
      <ServiceHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Service", href: "/service" },
        ]}
      />
      <ServiceOverview overview={overview} />
      <section
        className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-5"
        aria-labelledby="service-guidance-heading"
      >
        <h2
          id="service-guidance-heading"
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted"
        >
          Service guidance
        </h2>
        <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink">
          Need help mapping out service and care cadence? Ask Perazzi for the recommended intervals and how to
          coordinate with the atelier.
        </p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about service &amp; care"
            payload={{
              question:
                "Walk me through Perazzi's recommended care cadence, how the authorized centers coordinate with Botticino, and what an owner should prepare before scheduling service.",
              context: { pageUrl: "/service", mode: "owner" },
            }}
          />
        </div>
      </section>
      <ServiceNetworkFinder locations={locations} />
      <MaintenanceRepairs overview={overview} guide={maintenanceGuides[0]} />
      <PartsEditorial parts={partsEditorial} />
      <IntegrityAdvisory />
      <ServiceRequest
        title="Request factory service"
        description="Schedule inspections, rebuilds, and engraving refresh with the Botticino team."
        buttonLabel="Open service request"
        embedSrc={SERVICE_REQUEST_EMBED.url}
        fallbackHref={SERVICE_REQUEST_EMBED.fallback}
        analyticsOpenId="RequestServiceOpen"
      />
      <section
        className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-5"
        aria-labelledby="service-shipping-heading"
      >
        <h2
          id="service-shipping-heading"
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted"
        >
          Shipping prep
        </h2>
        <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink">
          Wondering what to include when shipping your gun or scheduling an inspection? Ask before you book.
        </p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask before I ship"
            payload={{
              question:
                "What information, paperwork, and packing steps should I complete before shipping a Perazzi in for service, and how does the concierge coordinate follow-ups?",
              context: { pageUrl: "/service", mode: "owner" },
            }}
          />
        </div>
      </section>
      <PartsRequest
        embedSrc={PARTS_REQUEST_EMBED.url}
        fallbackHref={PARTS_REQUEST_EMBED.fallback}
      />
      <CareGuidesDownloads guides={maintenanceGuides} />
      <FAQList items={faq} />
      <CTASection
        dataAnalyticsId="FinalCTASeen"
        analyticsPrefix="FinalCTAClicked"
        text="Need a hand planning service or sourcing parts? Our concierge responds within one business day."
        primary={finalCta.primary}
        secondary={finalCta.secondary}
      />
    </div>
  );
}
