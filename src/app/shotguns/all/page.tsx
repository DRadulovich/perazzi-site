import type { Metadata } from "next";
import Image from "next/image";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { ModelSearchTable } from "@/components/shotguns/ModelSearchTable";
import { client } from "@/sanity/lib/client";
import medalsHero from "@/../Photos/olympic-medals-1.jpg";

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

const isNonEmptyString = (value?: string | null): value is string => Boolean(value && value.trim().length);

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

export const metadata: Metadata = {
  title: "Model Search | Perazzi",
  description:
    "Explore every Perazzi model in one searchable database. Filter by gauge, barrel information, trigger setup, and more.",
};

export default async function ModelSearchPage() {
  const rawModels = await client.fetch<ModelQueryResult[]>(modelsQuery);
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="relative mb-12 overflow-hidden rounded-[40px] border border-white/10 bg-black/60">
        <div className="relative h-72 w-full sm:h-96 lg:h-[28rem]">
          <Image
            src={medalsHero}
            alt="Perazzi Olympic medals and shotguns"
            fill
            priority
            className="object-cover object-top"
            sizes="(min-width: 1024px) 1200px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center gap-4 px-8 py-10 text-white sm:px-12 lg:px-16">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Model Search</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              The Perazzi Shotguns Database
            </h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">
              Browse every catalogued platform, grade, and gauge combination we maintain inside Sanity.
              Filter by competitive discipline or game application, then deep-dive into full-resolution
              photography and setup specs.
            </p>
          </div>
        </div>
      </section>

      <ModelSearchTable models={models} />
    </div>
  );
}
