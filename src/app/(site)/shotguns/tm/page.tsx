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
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default async function TMSeriesPage() {
  const { series, disciplines, landing } = await getShotgunsSectionData();
  const platform = landing.platforms.find((entry) => entry.slug === "tm");
  const tmSeries = platform ? platformToSeriesEntry(platform, series.tm, disciplines) : series.tm;

  return (
    <div className="space-y-16">
      <SeriesHero hero={tmSeries.hero} analyticsId="SeriesHero:tm" />
      <section
        className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-5"
        aria-labelledby="tm-platform-guidance-heading"
      >
        <Heading
          asChild
          size="sm"
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted"
        >
          <h2 id="tm-platform-guidance-heading">Platform guidance</h2>
        </Heading>
        <Text className="mt-1 text-ink">
          Questions about the TM Platform? Ask Perazzi.
        </Text>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about TM Platform"
            payload={buildPlatformPrompt("tm", { pageUrl: "/shotguns/tm" })}
          />
        </div>
      </section>
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
