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

export default function GaugesPage() {
  return (
    <div className="space-y-16">
      <GaugeHero
        title={gaugesHero.title}
        subheading={gaugesHero.subheading}
      />
      <GaugeCardGrid gauges={gauges} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <EditorialBlock html={gaugesEditorialHtml} />
        <SidebarNote title="Pattern & POI" html={gaugesSidebarHtml} />
      </div>
      <FAQList
        items={gaugesFaq}
        schemaName="Perazzi Gauges FAQ"
        scriptId="shotguns-gauges-faq"
      />
      <CTASection
        text="Bring your preferred gauge to the atelier and we\u2019ll balance frame, barrels, and rib geometry to your rhythm."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
