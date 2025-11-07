import { shotgunsData } from "@/content/shotguns";
import { SeriesHero } from "@/components/shotguns/SeriesHero";
import { AtAGlanceStrip } from "@/components/shotguns/AtAGlanceStrip";
import { SeriesStory } from "@/components/shotguns/SeriesStory";
import { EngHighlightsGrid } from "@/components/shotguns/EngHighlightsGrid";
import { DisciplineMap } from "@/components/shotguns/DisciplineMap";
import { MarqueeFeature } from "@/components/shotguns/MarqueeFeature";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";

export default function HighTechSeriesPage() {
  const series = shotgunsData.series.ht;
  const disciplines = shotgunsData.disciplines;

  return (
    <div className="space-y-16">
      <SeriesHero hero={series.hero} analyticsId="SeriesHero:ht" />
      <AtAGlanceStrip data={series.atAGlance} />
      <SeriesStory html={series.storyHtml} />
      <EngHighlightsGrid highlights={series.highlights} />
      <DisciplineMap items={series.disciplineMap} disciplines={disciplines} />
      <MarqueeFeature champion={series.champion} />
      <RelatedList items={series.relatedArticles} />
      <CTASection
        text="Work with the atelier to tune High Tech ballast, trigger groups, and rib elevation to your bunker or sporting course."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
