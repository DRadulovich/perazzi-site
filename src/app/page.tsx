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
        <section
          className="relative w-screen overflow-hidden py-10 sm:py-12"
          style={{
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
          }}
          aria-labelledby="home-concierge-heading"
        >
          <div className="relative mx-auto max-w-5xl px-6 lg:px-10">
            <div className="rounded-3xl border border-border bg-card p-6 text-center text-ink shadow-elevated sm:p-8">
              <p
                id="home-concierge-heading"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted"
              >
                Perazzi Concierge
              </p>
              <p className="mt-3 text-base text-ink">
                Prefer to speak with the workshop? Open the concierge and we’ll guide your first step.
              </p>
              <div className="mt-6 flex justify-center">
                <ChatTriggerButton
                  label="Ask the concierge"
                  payload={{
                    question:
                      "Introduce me to Perazzi's bespoke philosophy and help me choose where to begin if I'm exploring my first build.",
                    context: { pageUrl: "/" },
                  }}
                />
              </div>
            </div>
          </div>
        </section>
        <TimelineScroller stages={homeData.stages} />
        <section
          className="relative w-screen overflow-hidden py-10 sm:py-12"
          style={{
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
          }}
          aria-labelledby="home-guide-heading"
        >
          <div className="relative mx-auto max-w-5xl px-6 lg:px-10">
            <div className="rounded-3xl border border-border bg-card p-6 text-ink mb-10 shadow-elevated sm:p-8">
              <p
                id="home-guide-heading"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted"
              >
                Need a guide?
              </p>
              <p className="mt-3 text-sm text-ink">
                Ask how Perazzi links heritage, champions, and today’s platforms—then follow the concierge into the catalog.
              </p>
              <div className="mt-5">
                <ChatTriggerButton
                  label="Ask about platforms"
                  payload={{
                    question:
                      "Connect Perazzi's heritage stories and champions to current platforms like High Tech and MX, and suggest the next pages I should explore on the site.",
                    context: { pageUrl: "/" },
                  }}
                  variant="outline"
                />
              </div>
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
