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

  return (
    <SiteShell mainClassName="flex-1 px-4 pb-12 pt-0 sm:px-8 lg:px-12">
      <div className="space-y-0">
        <HeroBanner hero={homeData.hero} />
        <TimelineScroller stages={homeData.stages} />
        <section
          className="border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-16 sm:py-20"
          aria-labelledby="home-guide-heading"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
            <div className="space-y-4 text-ink">
              <p
                id="home-guide-heading"
                className="text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
              >
                Need a guide?
              </p>
              <p className="text-lg font-light italic text-ink-muted mb-10">
                Ask how Perazzi links heritage, champions, and today’s platforms, then step into the catalog with a clearer sense of where you belong – whether that’s HT, MX, TM or beyond.
              </p>
              <div className="flex flex-wrap gap-3 justify-start">
                <ChatTriggerButton
                  label="Ask about platforms"
                  payload={{
                    question:
                      "Connect Perazzi's heritage stories and champions to current platforms like High Tech and MX, and suggest the next pages I should explore on the site.",
                    context: { pageUrl: "/" },
                  }}
                  variant="outline"
                />
                <Link
                  href="/shotguns"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red focus-ring"
                >
                  Explore shotguns
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="space-y-3 text-xl font-light italic text-ink-muted">
              <p className="text-xl font-semibold text-ink">
                Three starting points most Perazzi shooters choose:
              </p>
              <ul className="space-y-2">
                <li>
                  <span className="text-xl font-black text-ink">HT</span> – modern competition geometry for demanding sporting layouts.
                </li>
                <li>
                  <span className="text-xl font-black text-ink">MX</span> – the classic lineage: balanced, adaptable, and endlessly configurable.
                </li>
                <li>
                  <span className="text-xl font-black text-ink">TM</span> – purpose-built for American trap with a dedicated silhouette.
                </li>
              </ul>
              <p className="text-lg font-light italic text-ink-muted">
                The concierge can map your disciplines, preferences, and ambitions to a starting platform and the right next pages to visit.
              </p>
            </div>
          </div>
        </section>
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
