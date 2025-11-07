import { serviceData } from "@/content/service";
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

const SERVICE_REQUEST_EMBED = {
  title: "Service request",
  url: "https://calendly.com/perazzi-service/request",
  fallback: "/service/request",
};

const PARTS_REQUEST_EMBED = {
  url: "https://calendly.com/perazzi-service/parts",
  fallback: "/service/parts-request",
};

export default function ServicePage() {
  const {
    hero,
    overview,
    locations,
    maintenanceGuides,
    partsEditorial,
    faq,
    finalCta,
  } = serviceData;

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
