import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { CTASection } from "@/components/home/cta-section";
import { HeroBanner } from "@/components/home/hero-banner";
import { MarqueeFeature } from "@/components/home/marquee-feature"; // Home-specific variant
import { TimelineScroller } from "@/components/home/timeline-scroller";
import { getHome } from "@/sanity/queries/home";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

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
    <SiteShell mainClassName="flex-1 px-4 pb-12 pt-0 sm:px-8 lg:px-12">
      <div className="space-y-0">
        <HeroBanner hero={homeData.hero} heroCtas={homeData.heroCtas} fullBleed />
        <TimelineScroller stages={homeData.stages} framing={homeData.timelineFraming} />
        <section
          className="border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-10 sm:py-16"
          aria-labelledby="home-guide-heading"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
            <div className="space-y-4 text-ink">
              <p
                id="home-guide-heading"
                className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
              >
                {homeData.guideSection.title ?? "Need a guide?"}
              </p>
              <p className="mb-8 text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
                {homeData.guideSection.intro
                  ?? "Ask how Perazzi links heritage, champions, and today’s platforms, then step into the catalog with a clearer sense of where you belong – whether that’s HT, MX, TM or beyond."}
              </p>
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
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
                >
                  {homeData.guideSection.linkLabel ?? "Explore shotguns"}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="space-y-3 text-sm sm:text-base font-light italic text-ink-muted">
              <p className="text-sm sm:text-base font-semibold not-italic text-ink">
                Three starting points most Perazzi shooters choose:
              </p>
              <ul className="space-y-2">
                {guidePlatforms.map((platform) => (
                  <li key={platform.code}>
                    <span className="text-base sm:text-lg font-black not-italic text-ink">{platform.name ?? platform.code?.toUpperCase()}</span>
                    {" "}–{" "}
                    {platform.description ?? ""}
                  </li>
                ))}
              </ul>
              <p className="text-sm sm:text-base font-light italic text-ink-muted leading-relaxed">
                {homeData.guideSection.closing
                  ?? "The concierge can map your disciplines, preferences, and ambitions to a starting platform and the right next pages to visit."}
              </p>
            </div>
          </div>
        </section>
        <MarqueeFeature champion={homeData.champion} ui={homeData.marqueeUi} />
        {homeData.finale ? (
          <CTASection finale={homeData.finale} />
        ) : (
          <section className="rounded-2xl border border-border/60 bg-card/10 px-4 py-6 text-center text-ink shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-lg">
            <p className="text-base sm:text-lg font-semibold">
              Final invitation coming soon
            </p>
            <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
              Update the Home CTA in Sanity to surface the latest experience.
            </p>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
