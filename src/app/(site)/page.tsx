import { SiteShell } from "@/components/site-shell";
import { CTASection } from "@/components/home/cta-section";
import { HeroBanner } from "@/components/home/hero-banner";
import { HomeGuideSection } from "@/components/home/home-guide-section";
import { MarqueeFeature } from "@/components/home/marquee-feature"; // Home-specific variant
import { TimelineScroller } from "@/components/home/timeline-scroller";
import { getHome } from "@/sanity/queries/home";
import { Section, Text } from "@/components/ui";

export default async function HomePage() {
  const homeData = await getHome();
  const guidePlatforms = homeData.guideSection.platforms;

  return (
    <SiteShell mainClassName="flex-1 pb-12 pt-0">
      <div className="space-y-0">
        <HeroBanner hero={homeData.hero} heroCtas={homeData.heroCtas} fullBleed />
        <TimelineScroller stages={homeData.stages} framing={homeData.timelineFraming} />
        <HomeGuideSection guideSection={homeData.guideSection} guidePlatforms={guidePlatforms} />
        <MarqueeFeature champion={homeData.champion} ui={homeData.marqueeUi} />
        {homeData.finale ? (
          <CTASection finale={homeData.finale} />
        ) : (
          <Section padding="md" className="text-center">
            <Text size="lg" className="text-ink" leading="normal">
              Final invitation coming soon
            </Text>
            <Text size="sm" className="mt-2 text-ink-muted">
              Update the Home CTA in Sanity to surface the latest experience.
            </Text>
          </Section>
        )}
      </div>
    </SiteShell>
  );
}
