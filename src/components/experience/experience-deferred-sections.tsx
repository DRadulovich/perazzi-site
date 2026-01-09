"use client";

import dynamic from "next/dynamic";
import { Section } from "@/components/ui";
import { useHydrated } from "@/hooks/use-hydrated";
import type { FactoryAsset } from "@/types/content";
import type { ExperienceNetworkData, TravelNetworkUi, MosaicUi } from "@/types/experience";

const TravelNetworkFallback = () => (
  <section
    className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
    aria-hidden="true"
  >
    <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16">
      <div className="h-[420px] rounded-3xl bg-ink/10" />
    </div>
  </section>
);

const MosaicGalleryFallback = () => (
  <Section padding="md" className="space-y-6" aria-hidden="true">
    <div className="space-y-2">
      <div className="h-4 w-28 rounded-full bg-ink/10" />
      <div className="h-8 w-1/2 rounded-full bg-ink/10" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={`mosaic-skeleton-${index}`}
          className="aspect-4/3 rounded-2xl bg-ink/10"
        />
      ))}
    </div>
  </Section>
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

const TravelNetwork = dynamic(
  () => import("@/components/experience/TravelNetwork").then((mod) => mod.TravelNetwork),
  { ssr: false, loading: TravelNetworkFallback },
);
const MosaicGallery = dynamic(
  () => import("@/components/experience/MosaicGallery").then((mod) => mod.MosaicGallery),
  { ssr: false, loading: MosaicGalleryFallback },
);
const CTASection = dynamic(
  () => import("@/components/shotguns/CTASection").then((mod) => mod.CTASection),
  { ssr: false, loading: CTASectionFallback },
);

type TravelNetworkDeferredProps = {
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
};

export function ExperienceTravelNetworkDeferred({ data, ui }: Readonly<TravelNetworkDeferredProps>) {
  const hydrated = useHydrated();
  if (!hydrated) return <TravelNetworkFallback />;
  return <TravelNetwork data={data} ui={ui} />;
}

type MosaicGalleryDeferredProps = {
  assets: readonly FactoryAsset[];
  mosaicUi: MosaicUi;
};

export function ExperienceMosaicGalleryDeferred({ assets, mosaicUi }: Readonly<MosaicGalleryDeferredProps>) {
  const hydrated = useHydrated();
  if (!hydrated) return <MosaicGalleryFallback />;
  return <MosaicGallery assets={assets} mosaicUi={mosaicUi} />;
}

type CTASectionDeferredProps = {
  heading?: string;
  text: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  dataAnalyticsId?: string;
  analyticsPrefix?: string;
};

export function ExperienceCTASectionDeferred({
  heading,
  text,
  primary,
  secondary,
  dataAnalyticsId,
  analyticsPrefix,
}: Readonly<CTASectionDeferredProps>) {
  const hydrated = useHydrated();
  if (!hydrated) return <CTASectionFallback />;
  return (
    <CTASection
      heading={heading}
      text={text}
      primary={primary}
      secondary={secondary}
      dataAnalyticsId={dataAnalyticsId}
      analyticsPrefix={analyticsPrefix}
    />
  );
}
