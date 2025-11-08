import { SeriesHero } from "@/components/shotguns/SeriesHero";
import { AtAGlanceStrip } from "@/components/shotguns/AtAGlanceStrip";
import { SeriesStory } from "@/components/shotguns/SeriesStory";
import { EngHighlightsGrid } from "@/components/shotguns/EngHighlightsGrid";
import { DisciplineMap } from "@/components/shotguns/DisciplineMap";
import { MarqueeFeature } from "@/components/shotguns/MarqueeFeature";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getShotgunsSectionData } from "@/lib/shotguns-data";

export default async function TMSeriesPage() {
  const { series, disciplines } = await getShotgunsSectionData();
  const tmSeries = series.tm;

  return (
    <div className="space-y-16">
      <SeriesHero hero={tmSeries.hero} analyticsId="SeriesHero:tm" />
      <AtAGlanceStrip data={tmSeries.atAGlance} />
      <SeriesStory html={tmSeries.storyHtml} />
      <EngHighlightsGrid highlights={tmSeries.highlights} />
      <DisciplineMap items={tmSeries.disciplineMap} disciplines={disciplines} />
      <MarqueeFeature champion={tmSeries.champion} />
      <RelatedList items={tmSeries.relatedArticles} />
      <CTASection
        text="Schedule a TM fitting to dial adjustable ribs, stock pitch, and trigger feel to your trap routine."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
