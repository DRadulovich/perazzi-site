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
import { Text } from "@/components/ui/text";

export default async function SHOSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "sho");
  const shoSeries = platform ? platformToSeriesEntry(platform, series.sho, disciplines) : series.sho;

  return (
    <div className="space-y-16">
      <SeriesHero hero={shoSeries.hero} analyticsId="SeriesHero:sho" />
      <section
        className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-soft sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-5"
        aria-labelledby="sho-platform-guidance-heading"
      >
        <Text
          asChild
          size="label-tight"
          className="text-ink-muted"
          leading="normal"
        >
          <h2 id="sho-platform-guidance-heading">Platform guidance</h2>
        </Text>
        <Text className="mt-1 text-ink">
          Questions about the SHO Platform? Ask Perazzi.
        </Text>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about SHO Platform"
            payload={buildPlatformPrompt("sho", { pageUrl: "/shotguns/sho" })}
          />
        </div>
      </section>
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
