"use client";

import dynamic from "next/dynamic";
import { Section } from "@/components/ui";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Champion, HomeData, HomeGuidePlatform } from "@/types/content";

const HomeGuideFallback = () => (
  <Section
    padding="lg"
    bordered={false}
    className="rounded-none border-t bg-canvas shadow-none!"
    aria-hidden="true"
  >
    <div className="space-y-6">
      <div className="h-5 w-40 rounded-full bg-ink/10" />
      <div className="h-8 w-3/5 rounded-full bg-ink/10" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`home-guide-skeleton-${index}`}
            className="h-20 rounded-2xl bg-ink/10"
          />
        ))}
      </div>
    </div>
  </Section>
);

const MarqueeFeatureFallback = () => (
  <section
    className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed mt-[15px]"
    aria-hidden="true"
  >
    <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16">
      <div className="h-[420px] rounded-3xl bg-ink/10" />
    </div>
  </section>
);

const CTASectionFallback = () => (
  <Section
    padding="md"
    bordered={false}
    className="mt-12 md:mt-16 bg-canvas text-ink"
    aria-hidden="true"
  >
    <div className="space-y-4">
      <div className="h-6 w-48 rounded-full bg-ink/10" />
      <div className="h-4 w-3/4 rounded-full bg-ink/10" />
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-32 rounded-full bg-ink/10" />
        <div className="h-10 w-32 rounded-full bg-ink/10" />
      </div>
    </div>
  </Section>
);

const HomeGuideSection = dynamic(
  () => import("@/components/home/home-guide-section").then((mod) => mod.HomeGuideSection),
  { ssr: false, loading: HomeGuideFallback },
);
const MarqueeFeature = dynamic(
  () => import("@/components/home/marquee-feature").then((mod) => mod.MarqueeFeature),
  { ssr: false, loading: MarqueeFeatureFallback },
);
const CTASection = dynamic(
  () => import("@/components/home/cta-section").then((mod) => mod.CTASection),
  { ssr: false, loading: CTASectionFallback },
);

type HomeGuideSectionDeferredProps = {
  guideSection: HomeData["guideSection"];
  guidePlatforms: readonly HomeGuidePlatform[];
};

export function HomeGuideSectionDeferred({
  guideSection,
  guidePlatforms,
}: Readonly<HomeGuideSectionDeferredProps>) {
  const hydrated = useHydrated();
  if (!hydrated) return <HomeGuideFallback />;
  return <HomeGuideSection guideSection={guideSection} guidePlatforms={guidePlatforms} />;
}

type MarqueeFeatureDeferredProps = {
  champion: Champion;
  ui: HomeData["marqueeUi"];
};

export function MarqueeFeatureDeferred({ champion, ui }: Readonly<MarqueeFeatureDeferredProps>) {
  const hydrated = useHydrated();
  if (!hydrated) return <MarqueeFeatureFallback />;
  return <MarqueeFeature champion={champion} ui={ui} />;
}

type CTASectionDeferredProps = {
  finale: HomeData["finale"];
};

export function HomeCTASectionDeferred({ finale }: Readonly<CTASectionDeferredProps>) {
  const hydrated = useHydrated();
  if (!hydrated) return <CTASectionFallback />;
  return <CTASection finale={finale} />;
}
