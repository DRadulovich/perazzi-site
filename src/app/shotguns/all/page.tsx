import type { Metadata } from "next";
import Image from "next/image";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { ModelSearchTable } from "@/components/shotguns/ModelSearchTable";
import { client } from "@/sanity/lib/client";
import medalsHero from "@/../Photos/olympic-medals-1.jpg";

const modelsQuery = groq`*[_type == "models"] | order(s_model_name asc) {
  _id,
  "name": s_model_name,
  "version": s_version_id,
  "use": s_use_id,
  "platform": s_platform_id->name,
  "gaugeNames": array::compact([
    s_gauge_id_1->name,
    s_gauge_id_2->name,
    s_gauge_id_3->name,
    s_gauge_id_4->name,
    s_gauge_id_5->name
  ]),
  "grade": s_grade_id->name,
  "image": s_image_local_path.asset,
  "imageAlt": coalesce(s_image_local_path.alt, s_model_name),
  "triggerType1": coalesce(s_trigger_type_id_1, ""),
  "triggerType2": coalesce(s_trigger_type_id_2, ""),
  "triggerSpring1": coalesce(s_trigger_spring_id_1, ""),
  "triggerSpring2": coalesce(s_trigger_spring_id_2, ""),
  "ribType1": coalesce(s_rib_type_id_1, ""),
  "ribType2": coalesce(s_rib_type_id_2, ""),
  "ribStyle1": coalesce(s_rib_style_id_1, ""),
  "ribStyle2": coalesce(s_rib_style_id_2, ""),
  "ribStyle3": coalesce(s_rib_style_id_3, ""),
  "ribStyle4": coalesce(s_rib_style_id_4, "")
}`;

type ModelQueryResult = {
  _id: string;
  name?: string;
  version?: string;
  use?: string;
  platform?: string;
  gaugeNames?: string[];
  grade?: string;
  image?: SanityImageSource | null;
  imageAlt?: string;
  triggerType1?: string;
  triggerType2?: string;
  triggerSpring1?: string;
  triggerSpring2?: string;
  ribType1?: string;
  ribType2?: string;
  ribStyle1?: string;
  ribStyle2?: string;
  ribStyle3?: string;
  ribStyle4?: string;
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
    version: model.version || "",
    use: model.use || "",
    platform: model.platform || "",
    gaugeNames: (model.gaugeNames as string[]) || [],
    grade: model.grade || "",
    image: model.image || null,
    imageAlt: model.imageAlt || model.name || "Perazzi model",
    triggerTypes: [model.triggerType1, model.triggerType2].filter(Boolean),
    triggerSprings: [model.triggerSpring1, model.triggerSpring2].filter(Boolean),
    ribTypes: [model.ribType1, model.ribType2].filter(Boolean),
    ribStyles: [model.ribStyle1, model.ribStyle2, model.ribStyle3, model.ribStyle4].filter(Boolean),
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
