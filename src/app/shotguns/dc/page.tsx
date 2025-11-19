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
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";

export default async function DCSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "dc");
  const dcSeries = platform ? platformToSeriesEntry(platform, series.dc, disciplines) : series.dc;

  return (
    <div className="space-y-16">
      <SeriesHero hero={dcSeries.hero} analyticsId="SeriesHero:dc" />
      <div className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ink-muted">Platform guidance</p>
        <p className="mt-1 text-sm text-ink">Questions about the DC Platform? Ask Perazzi.</p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about DC Platform"
            payload={buildPlatformPrompt("dc", { pageUrl: "/shotguns/dc" })}
          />
        </div>
      </div>
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
