import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

const modelQuery = groq`*[_type == "models" && _id == $id][0]{
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
  "triggerTypes": array::compact([s_trigger_type_id_1, s_trigger_type_id_2]),
  "triggerSprings": array::compact([s_trigger_spring_id_1, s_trigger_spring_id_2]),
  "ribTypes": array::compact([s_rib_type_id_1, s_rib_type_id_2]),
  "ribStyles": array::compact([s_rib_style_id_1, s_rib_style_id_2, s_rib_style_id_3, s_rib_style_id_4]),
  "image": s_image_local_path
}`;

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const nonEmptyStrings = (values?: Array<string | null | undefined>) =>
  (values ?? []).filter((value): value is string => Boolean(value && value.trim().length));

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing model id" }, { status: 400 });
    }

    const model = await client.fetch(modelQuery, { id });
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const imageAsset = model.image?.asset ?? model.image;

    const payload = {
      id: model._id,
      name: model.name ?? "Untitled Model",
      version: model.version ?? "",
      use: model.use ?? "",
      platform: model.platform ?? "",
      grade: model.grade ?? "",
      gaugeNames: nonEmptyStrings(model.gaugeNames),
      triggerTypes: nonEmptyStrings(model.triggerTypes),
      triggerSprings: nonEmptyStrings(model.triggerSprings),
      ribTypes: nonEmptyStrings(model.ribTypes),
      ribStyles: nonEmptyStrings(model.ribStyles),
      imageUrl: imageAsset ? urlFor(imageAsset).width(2000).quality(90).url() : undefined,
      imageAlt: model.image?.alt ?? model.name ?? "Perazzi model",
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error(`[api/models] Failed to load model`, error);
    return NextResponse.json({ error: "Failed to load model details" }, { status: 500 });
  }
}
