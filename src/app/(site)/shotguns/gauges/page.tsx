import { gauges } from "@/content/shotguns";
import {
  gaugesHero,
  gaugesEditorialHtml,
  gaugesSidebarHtml,
  gaugesFaq,
} from "@/content/shotguns/gauges-content";
import { GaugeHero } from "@/components/shotguns/GaugeHero";
import { GaugeCardGrid } from "@/components/shotguns/GaugeCardGrid";
import { EditorialBlock } from "@/components/shotguns/EditorialBlock";
import { SidebarNote } from "@/components/shotguns/SidebarNote";
import { FAQList } from "@/components/shotguns/FAQList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getShotgunsGaugesPage } from "@/sanity/queries/shotguns";

export default async function GaugesPage() {
  const cms = await getShotgunsGaugesPage();
  const hero = cms?.hero?.background
    ? {
        title: cms.hero.title ?? gaugesHero.title,
        subheading: cms.hero.subheading ?? gaugesHero.subheading,
        background: cms.hero.background,
      }
    : gaugesHero;
  const editorialHtml = cms?.editorialHtml ?? gaugesEditorialHtml;
  const sidebarTitle = cms?.sidebarTitle ?? "Pattern & POI";
  const sidebarHtml = cms?.sidebarHtml ?? gaugesSidebarHtml;
  const faqItems = cms?.faq?.length
    ? cms.faq.map((item) => ({
        q: item.q ?? "",
        a: item.a ?? "",
      }))
    : gaugesFaq;
  const fallbackCta = {
    text: "Bring your preferred gauge to the atelier and we\u2019ll balance frame, barrels, and rib geometry to your rhythm.",
    primary: { label: "Begin Your Fitting", href: "/experience/fitting" },
    secondary: { label: "Request a Visit", href: "/experience/visit" },
  };
  const cmsCta = cms?.finalCta;
  const useCmsCta = Boolean(cmsCta?.text && cmsCta.primary?.label && cmsCta.primary?.href);
  const finalCta = useCmsCta
    ? {
        text: cmsCta?.text ?? fallbackCta.text,
        primary: {
          label: cmsCta?.primary?.label ?? fallbackCta.primary.label,
          href: cmsCta?.primary?.href ?? fallbackCta.primary.href,
        },
        secondary: cmsCta?.secondary?.label && cmsCta?.secondary?.href
          ? {
              label: cmsCta.secondary.label,
              href: cmsCta.secondary.href,
            }
          : fallbackCta.secondary,
      }
    : fallbackCta;

  return (
    <div className="space-y-16">
      <GaugeHero
        title={hero.title}
        subheading={hero.subheading}
        background={hero.background}
        dataAnalyticsId="GaugeHeroSeen"
      />
      <GaugeCardGrid gauges={gauges} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <EditorialBlock html={editorialHtml} />
        <SidebarNote title={sidebarTitle} html={sidebarHtml} />
      </div>
      <FAQList
        items={faqItems}
        schemaName="Perazzi Gauges FAQ"
        scriptId="shotguns-gauges-faq"
      />
      <CTASection
        text={finalCta.text}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
        dataAnalyticsId="GaugesFinalCTA"
        analyticsPrefix="GaugesCTA"
      />
    </div>
  );
}
