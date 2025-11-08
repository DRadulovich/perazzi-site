import { SiteShell } from "@/components/site-shell";
import { CTASection } from "@/components/home/cta-section";
import { HeroBanner } from "@/components/home/hero-banner";
import { MarqueeFeature } from "@/components/home/marquee-feature"; // Home-specific variant
import { TimelineScroller } from "@/components/home/timeline-scroller";
import { getHome } from "@/sanity/queries/home";

export default async function HomePage() {
  const homeData = await getHome();

  return (
    <SiteShell>
      <div className="space-y-16">
        <HeroBanner hero={homeData.hero} />
        <TimelineScroller stages={homeData.stages} />
        <MarqueeFeature champion={homeData.champion} />
        {homeData.finale ? (
          <CTASection finale={homeData.finale} />
        ) : (
          <section className="rounded-3xl border border-border/70 bg-card px-6 py-8 text-center text-ink shadow-sm sm:px-10">
            <p className="text-lg font-semibold">Final invitation coming soon</p>
            <p className="mt-2 text-sm text-ink-muted">
              Update the Home CTA in Sanity to surface the latest experience.
            </p>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
