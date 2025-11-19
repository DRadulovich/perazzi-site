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

export default async function TMSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "tm");
  const tmSeries = platform ? platformToSeriesEntry(platform, series.tm, disciplines) : series.tm;

  return (
    <div className="space-y-16">
      <SeriesHero hero={tmSeries.hero} analyticsId="SeriesHero:tm" />
      <div className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ink-muted">Platform guidance</p>
        <p className="mt-1 text-sm text-ink">Questions about the TM Platform? Ask Perazzi.</p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about TM Platform"
            payload={buildPlatformPrompt("tm", { pageUrl: "/shotguns/tm" })}
          />
        </div>
      </div>
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
