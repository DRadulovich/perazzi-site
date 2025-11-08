import { SiteShell } from "@/components/site-shell";
import {
  CTASection,
  HeroBanner,
  MarqueeFeature,
  TimelineScroller,
} from "@/components/home";
import { finale } from "@/content/home";
import { getHome } from "@/sanity/queries/home";

export default async function HomePage() {
  const homeData = await getHome();

  return (
    <SiteShell>
      <div className="space-y-16">
        <HeroBanner hero={homeData.hero} />
        <TimelineScroller stages={homeData.stages} />
        <MarqueeFeature champion={homeData.champion} />
        <CTASection finale={finale} />
      </div>
    </SiteShell>
  );
}
