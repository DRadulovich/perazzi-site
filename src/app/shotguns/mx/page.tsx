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
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { buildPlatformPrompt } from "@/lib/platform-prompts";

export default async function MXSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "mx");
  const mxSeries = platform ? platformToSeriesEntry(platform, series.mx, disciplines) : series.mx;

  return (
    <div className="space-y-16">
      <SeriesHero hero={mxSeries.hero} analyticsId="SeriesHero:mx" />
      <div className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ink-muted">Platform guidance</p>
        <p className="mt-1 text-sm text-ink">Questions about the MX Platform? Ask Perazzi.</p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about MX Platform"
            payload={buildPlatformPrompt("mx", { pageUrl: "/shotguns/mx" })}
          />
        </div>
      </div>
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
