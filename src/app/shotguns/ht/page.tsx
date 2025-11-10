import { SeriesHero } from "@/components/shotguns/SeriesHero";
import { AtAGlanceStrip } from "@/components/shotguns/AtAGlanceStrip";
import { SeriesStory } from "@/components/shotguns/SeriesStory";
import { EngHighlightsGrid } from "@/components/shotguns/EngHighlightsGrid";
import { DisciplineMap } from "@/components/shotguns/DisciplineMap";
import { MarqueeFeature } from "@/components/shotguns/MarqueeFeature"; // Shotguns-specific variant
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { platformToSeriesEntry } from "@/lib/platform-series";

export default async function HighTechSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "ht");
  const htSeries = platform ? platformToSeriesEntry(platform, series.ht, disciplines) : series.ht;

  return (
    <div className="space-y-16">
      <SeriesHero hero={htSeries.hero} analyticsId="SeriesHero:ht" />
      <AtAGlanceStrip data={htSeries.atAGlance} />
      <SeriesStory html={htSeries.storyHtml} />
      <EngHighlightsGrid highlights={htSeries.highlights} />
      <DisciplineMap items={htSeries.disciplineMap} disciplines={disciplines} />
      <MarqueeFeature champion={htSeries.champion} />
      <RelatedList items={htSeries.relatedArticles} />
      <CTASection
        text="Work with the atelier to tune High Tech ballast, trigger groups, and rib elevation to your bunker or sporting course."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
