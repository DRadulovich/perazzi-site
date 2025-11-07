import { shotgunsData } from "@/content/shotguns";
import { SeriesHero } from "@/components/shotguns/SeriesHero";
import { AtAGlanceStrip } from "@/components/shotguns/AtAGlanceStrip";
import { SeriesStory } from "@/components/shotguns/SeriesStory";
import { EngHighlightsGrid } from "@/components/shotguns/EngHighlightsGrid";
import { DisciplineMap } from "@/components/shotguns/DisciplineMap";
import { MarqueeFeature } from "@/components/shotguns/MarqueeFeature";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";

export default function TMSeriesPage() {
  const series = shotgunsData.series.tm;
  const disciplines = shotgunsData.disciplines;

  return (
    <div className="space-y-16">
      <SeriesHero hero={series.hero} analyticsId="SeriesHero:tm" />
      <AtAGlanceStrip data={series.atAGlance} />
      <SeriesStory html={series.storyHtml} />
      <EngHighlightsGrid highlights={series.highlights} />
      <DisciplineMap items={series.disciplineMap} disciplines={disciplines} />
      <MarqueeFeature champion={series.champion} />
      <RelatedList items={series.relatedArticles} />
      <CTASection
        text="Schedule a TM fitting to dial adjustable ribs, stock pitch, and trigger feel to your trap routine."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
