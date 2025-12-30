import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { CTASection } from "@/components/home/cta-section";
import { HeroBanner } from "@/components/home/hero-banner";
import { MarqueeFeature } from "@/components/home/marquee-feature"; // Home-specific variant
import { TimelineScroller } from "@/components/home/timeline-scroller";
import { getHome } from "@/sanity/queries/home";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Container, Heading, Section, Text } from "@/components/ui";

export default async function HomePage() {
  const homeData = await getHome();
  const guidePlatforms = homeData.guideSection.platforms?.length
    ? homeData.guideSection.platforms
    : [
        { code: "ht", name: "HT", description: "modern competition geometry for demanding sporting layouts." },
        { code: "mx", name: "MX", description: "the classic lineage: balanced, adaptable, and endlessly configurable." },
        { code: "tm", name: "TM", description: "purpose-built for American trap with a dedicated silhouette." },
      ];

  return (
    <SiteShell mainClassName="flex-1 pb-12 pt-0">
      <div className="space-y-0">
        <HeroBanner hero={homeData.hero} heroCtas={homeData.heroCtas} fullBleed />
        <TimelineScroller stages={homeData.stages} framing={homeData.timelineFraming} />
        <Section
          padding="lg"
          bordered={false}
          className="rounded-none border-t border-none! bg-canvas shadow-none!"
          aria-labelledby="home-guide-heading"
        >
          <Container
            size="xl"
            className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
          >
            <div className="space-y-4 text-ink">
              <Heading
                id="home-guide-heading"
                level={2}
                size="xl"
                className="text-ink"
              >
                {homeData.guideSection.title ?? "Need a guide?"}
              </Heading>
              <Text className="mb-8 type-subsection text-ink-muted">
                {homeData.guideSection.intro
                  ?? "Ask how Perazzi links heritage, champions, and today’s platforms, then step into the catalog with a clearer sense of where you belong – whether that’s HT, MX, TM or beyond."}
              </Text>
              <div className="flex flex-wrap gap-3 justify-start">
                <ChatTriggerButton
                  label={homeData.guideSection.chatLabel ?? "Ask about platforms"}
                  payload={{
                    question:
                      homeData.guideSection.chatPrompt
                      ?? "Connect Perazzi's heritage stories and champions to current platforms like High Tech and MX, and suggest the next pages I should explore on the site.",
                    context: { pageUrl: "/" },
                  }}
                  variant="outline"
                />
                <Link
                  href={homeData.guideSection.linkHref ?? "/shotguns"}
                  className="type-button inline-flex items-center justify-center gap-2 rounded-sm border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
                >
                  {homeData.guideSection.linkLabel ?? "Explore shotguns"}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="space-y-3 type-subsection text-ink-muted">
              <Text className="text-ink" leading="normal">
                Three starting points most Perazzi shooters choose:
              </Text>
              <ul className="space-y-2">
                {guidePlatforms.map((platform) => (
                  <li key={platform.code}>
                    <span className="text-ink">{platform.name ?? platform.code?.toUpperCase()}</span>
                    {" "}–{" "}
                    {platform.description ?? ""}
                  </li>
                ))}
              </ul>
              <Text className="text-ink-muted">
                {homeData.guideSection.closing
                  ?? "The concierge can map your disciplines, preferences, and ambitions to a starting platform and the right next pages to visit."}
              </Text>
            </div>
          </Container>
        </Section>
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
