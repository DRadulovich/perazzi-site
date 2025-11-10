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

export default async function DCSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "dc");
  const dcSeries = platform ? platformToSeriesEntry(platform, series.dc, disciplines) : series.dc;

  return (
    <div className="space-y-16">
      <SeriesHero hero={dcSeries.hero} analyticsId="SeriesHero:dc" />
      <AtAGlanceStrip data={dcSeries.atAGlance} />
      <SeriesStory html={dcSeries.storyHtml} />
      <EngHighlightsGrid highlights={dcSeries.highlights} />
      <DisciplineMap items={dcSeries.disciplineMap} disciplines={disciplines} />
      <MarqueeFeature champion={dcSeries.champion} />
      <RelatedList items={dcSeries.relatedArticles} />
      <CTASection
        text="Plan a DC fitting to tune ballast, trigger feel, and rib geometry before your next championship rotation."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
