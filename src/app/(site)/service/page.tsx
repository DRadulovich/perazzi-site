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
import { ServiceGuidanceSection } from "@/components/service/ServiceGuidanceSection";
import { CTASection } from "@/components/shotguns/CTASection";
import { getServicePageData } from "@/lib/service-data";

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
  const faqSchemaJson = faqSchema ? JSON.stringify(faqSchema).replaceAll('<', String.raw`\u003c`) : null;

  return (
    <div className="space-y-16">
      {faqSchemaJson ? (
        <script type="application/ld+json">{faqSchemaJson}</script>
      ) : null}
      <ServiceHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Service", href: "/service" },
        ]}
      />
      <ServiceOverview overview={overviewSection} />
      <ServiceGuidanceSection
        analyticsId="ServiceGuidanceSeen"
        headingId="service-guidance-heading"
        eyebrow={serviceGuidanceBlock.eyebrow ?? "Service guidance"}
        body={
          serviceGuidanceBlock.body ??
          "Need help mapping out service and care cadence? Ask Perazzi for the recommended intervals and how to coordinate with the atelier."
        }
        chatLabel={serviceGuidanceBlock.chatLabel ?? "Ask about service & care"}
        chatPayload={{
          question:
            serviceGuidanceBlock.chatPrompt ??
            "Walk me through Perazzi's recommended care cadence, how the authorized centers coordinate with Botticino, and what an owner should prepare before scheduling service.",
          context: { pageUrl: "/service", mode: "owner" },
        }}
      />
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
      <ServiceGuidanceSection
        analyticsId="ServiceShippingPrepSeen"
        headingId="service-shipping-heading"
        eyebrow={shippingPrepBlock.eyebrow ?? "Shipping prep"}
        body={
          shippingPrepBlock.body ??
          "Wondering what to include when shipping your gun or scheduling an inspection? Ask before you book."
        }
        chatLabel={shippingPrepBlock.chatLabel ?? "Ask before I ship"}
        chatPayload={{
          question:
            shippingPrepBlock.chatPrompt ??
            "What information, paperwork, and packing steps should I complete before shipping a Perazzi in for service, and how does the concierge coordinate follow-ups?",
          context: { pageUrl: "/service", mode: "owner" },
        }}
      />
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
