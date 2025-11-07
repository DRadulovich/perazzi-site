import { SiteShell } from "@/components/site-shell";
import {
  CTASection,
  HeroBanner,
  MarqueeFeature,
  TimelineScroller,
} from "@/components/home";
import { champion, finale, hero, stages } from "@/content/home";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="space-y-16">
        <HeroBanner hero={hero} />
        <TimelineScroller stages={stages} />
        <MarqueeFeature champion={champion} />
        <CTASection finale={finale} />
      </div>
    </SiteShell>
  );
}
