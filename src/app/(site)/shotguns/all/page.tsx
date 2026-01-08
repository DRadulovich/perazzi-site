import type { Metadata } from "next";
import Image from "next/image";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { ModelSearchTable } from "@/components/shotguns/ModelSearchTable";
import { Heading, Text } from "@/components/ui";
import { client } from "@/sanity/lib/client";
import medalsHero from "@/../Photos/olympic-medals-1.jpg";
import { getModelSearchPage } from "@/sanity/queries/search-pages";

const modelsQuery = groq`*[_type == "allModels"] | order(name asc) {
  _id,
  name,
  baseModel,
  category,
  "use": category,
  "platform": platform->name,
  "platformSlug": platform->slug.current,
  gauges,
  grade->{
    name
  },
  image,
  imageFallbackUrl,
  "imageAlt": coalesce(image.alt, name),
  trigger,
  rib
}`;

const isNonEmptyString = (value?: string | null): value is string => Boolean(value?.trim().length);

type ModelQueryResult = {
  _id: string;
  name?: string;
  baseModel?: string;
  category?: string;
  use?: string;
  platform?: string;
  platformSlug?: string | null;
  gauges?: string[];
  grade?: { name?: string };
  image?: SanityImageSource | null;
  imageFallbackUrl?: string | null;
  imageAlt?: string;
  trigger?: { type?: string; springs?: string[] };
  rib?: { type?: string; adjustableNotch?: number | null; heightMm?: number | null; styles?: string[] };
};

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getModelSearchPage();
  return {
    title: cms?.seo?.title ?? "Model Search | Perazzi",
    description:
      cms?.seo?.description ??
      "Explore every Perazzi model in one searchable database. Filter by gauge, barrel information, trigger setup, and more.",
  };
}

export default async function ModelSearchPage() {
  const [rawModels, cms] = await Promise.all([
    client.fetch<ModelQueryResult[]>(modelsQuery),
    getModelSearchPage(),
  ]);
  const models = rawModels.map((model) => ({
    _id: model._id,
    name: model.name || "",
    version: model.baseModel || "",
    use: model.use || "",
    platform: model.platform || "",
    gaugeNames: model.gauges ?? [],
    grade: model.grade?.name || "",
    image: model.image || null,
    imageFallbackUrl: model.imageFallbackUrl || null,
    imageAlt: model.imageAlt || model.name || "Perazzi model",
    triggerTypes: model.trigger?.type ? [model.trigger.type] : [],
    triggerSprings: (model.trigger?.springs || []).filter(isNonEmptyString),
    ribTypes: model.rib?.type ? [model.rib.type] : [],
    ribStyles: (model.rib?.styles || []).filter(isNonEmptyString),
    ribNotch: model.rib?.adjustableNotch ?? null,
    ribHeight: model.rib?.heightMm ?? null,
  }));
  const heroLabel = cms?.hero?.label ?? "Model Search";
  const heroTitle = cms?.hero?.title ?? "The Perazzi Shotguns Database";
  const heroDescription =
    cms?.hero?.description ??
    "Browse every catalogued platform, grade, and gauge combination we maintain inside Sanity.\nFilter by competitive discipline or game application, then deep-dive into full-resolution\nphotography and setup specs.";
  const heroImage = cms?.hero?.image;
  const heroImageSrc = heroImage?.url ?? medalsHero;
  const heroImageAlt = heroImage?.alt ?? "Perazzi Olympic medals and shotguns";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <section className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-black/60">
        <div className="relative h-72 w-full sm:h-96 lg:h-112">
          <Image
            src={heroImageSrc}
            alt={heroImageAlt}
            fill
            priority
            className="object-cover object-top"
            sizes="(min-width: 1024px) 1200px, 100vw"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center gap-4 px-8 py-10 text-white sm:px-12 lg:px-16">
            <Text size="label-tight" className="text-white/70">{heroLabel}</Text>
            <Heading level={1} size="xl" className="text-white">
              {heroTitle}
            </Heading>
            <Text className="type-section-subtitle max-w-2xl text-white/80">
              {heroDescription}
            </Text>
          </div>
        </div>
      </section>

      <ModelSearchTable models={models} />
    </div>
  );
}
