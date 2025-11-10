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

export default async function MXSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "mx");
  const mxSeries = platform ? platformToSeriesEntry(platform, series.mx, disciplines) : series.mx;

  return (
    <div className="space-y-16">
      <SeriesHero hero={mxSeries.hero} analyticsId="SeriesHero:mx" />
      <AtAGlanceStrip data={mxSeries.atAGlance} />
      <SeriesStory html={mxSeries.storyHtml} />
      <EngHighlightsGrid highlights={mxSeries.highlights} />
      <DisciplineMap items={mxSeries.disciplineMap} disciplines={disciplines} />
      <MarqueeFeature champion={mxSeries.champion} />
      <RelatedList items={mxSeries.relatedArticles} />
      <CTASection
        text="Begin your fitting to specify MX drop-out triggers, stock dimensions, and barrel regulation tuned to your bunker rhythm."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
