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
import { Text } from "@/components/ui";

export default async function ServicePage() {
  const {
    hero,
    overviewSection,
    serviceGuidanceBlock,
    shippingPrepBlock,
    networkFinderUi,
    maintenanceSection,
    guidesSection,
    partsEditorialSection,
    integrityAdvisory,
    serviceRequestBlock,
    partsRequestBlock,
    faqSection,
    locations,
    finalCta,
  } =
    await getServicePageData();

  const faqItems = faqSection.items ?? [];
  const faqSchema = faqItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
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
        <>
          { }
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        </>
      ) : null}
      <ServiceHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Service", href: "/service" },
        ]}
      />
      <ServiceOverview overview={overviewSection} />
      <section
        className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-5"
        aria-labelledby="service-guidance-heading"
      >
        <Text asChild size="xs" muted className="font-semibold">
          <h2 id="service-guidance-heading">
            {serviceGuidanceBlock.eyebrow ?? "Service guidance"}
          </h2>
        </Text>
        <Text className="mt-2" size="md" leading="relaxed">
          {serviceGuidanceBlock.body ??
            "Need help mapping out service and care cadence? Ask Perazzi for the recommended intervals and how to coordinate with the atelier."}
        </Text>
        <div className="mt-4">
          <ChatTriggerButton
            label={serviceGuidanceBlock.chatLabel ?? "Ask about service & care"}
            payload={{
              question:
                serviceGuidanceBlock.chatPrompt ??
                "Walk me through Perazzi's recommended care cadence, how the authorized centers coordinate with Botticino, and what an owner should prepare before scheduling service.",
              context: { pageUrl: "/service", mode: "owner" },
            }}
          />
        </div>
      </section>
      <ServiceNetworkFinder locations={locations} ui={networkFinderUi} />
      <MaintenanceRepairs maintenanceSection={maintenanceSection} guide={guidesSection.guides[0]} />
      <PartsEditorial partsEditorialSection={partsEditorialSection} />
      <IntegrityAdvisory integrityAdvisory={integrityAdvisory} />
      <ServiceRequest
        title={serviceRequestBlock.title}
        description={serviceRequestBlock.description ?? "Schedule inspections, rebuilds, and engraving refresh with the Botticino team."}
        buttonLabel={serviceRequestBlock.buttonLabel}
        embedSrc={serviceRequestBlock.embedUrl}
        fallbackHref={serviceRequestBlock.fallbackUrl}
        analyticsOpenId="RequestServiceOpen"
      />
      <section
        className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-5"
        aria-labelledby="service-shipping-heading"
      >
        <Text asChild size="xs" muted className="font-semibold">
          <h2 id="service-shipping-heading">
            {shippingPrepBlock.eyebrow ?? "Shipping prep"}
          </h2>
        </Text>
        <Text className="mt-2" size="md" leading="relaxed">
          {shippingPrepBlock.body ??
            "Wondering what to include when shipping your gun or scheduling an inspection? Ask before you book."}
        </Text>
        <div className="mt-4">
          <ChatTriggerButton
            label={shippingPrepBlock.chatLabel ?? "Ask before I ship"}
            payload={{
              question:
                shippingPrepBlock.chatPrompt ??
                "What information, paperwork, and packing steps should I complete before shipping a Perazzi in for service, and how does the concierge coordinate follow-ups?",
              context: { pageUrl: "/service", mode: "owner" },
            }}
          />
        </div>
      </section>
      <PartsRequest partsRequestBlock={partsRequestBlock} />
      <CareGuidesDownloads guidesSection={guidesSection} />
      <FAQList items={faqItems} heading={faqSection.heading} intro={faqSection.intro} />
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
