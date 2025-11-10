import { SeriesHero } from "@/components/shotguns/SeriesHero";
import { AtAGlanceStrip } from "@/components/shotguns/AtAGlanceStrip";
import { SeriesStory } from "@/components/shotguns/SeriesStory";
import { EngHighlightsGrid } from "@/components/shotguns/EngHighlightsGrid";
import { DisciplineMap } from "@/components/shotguns/DisciplineMap";
import { MarqueeFeature } from "@/components/shotguns/MarqueeFeature";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { platformToSeriesEntry } from "@/lib/platform-series";

export default async function SHOSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "sho");
  const shoSeries = platform ? platformToSeriesEntry(platform, series.sho, disciplines) : series.sho;

  return (
    <div className="space-y-16">
      <SeriesHero hero={shoSeries.hero} analyticsId="SeriesHero:sho" />
      <AtAGlanceStrip data={shoSeries.atAGlance} />
      <SeriesStory html={shoSeries.storyHtml} />
      <EngHighlightsGrid highlights={shoSeries.highlights} />
      <DisciplineMap items={shoSeries.disciplineMap} disciplines={disciplines} />
      <MarqueeFeature champion={shoSeries.champion} />
      <RelatedList items={shoSeries.relatedArticles} />
      <CTASection
        text="Commission a SHO sidelock with engraving, provenance, and balance bespoke to your story."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
