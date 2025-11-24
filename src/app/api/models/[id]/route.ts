import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

const modelQuery = groq`*[_type == "allModels" && _id == $id][0]{
  _id,
  name,
  baseModel,
  category,
  "use": category,
  "platform": platform->name,
  "gaugeNames": gauges,
  "grade": grade->name,
  "triggerTypes": trigger.type ? [trigger.type] : [],
  "triggerSprings": trigger.springs,
  "ribTypes": rib.type ? [rib.type] : [],
  "ribStyles": rib.styles,
  "image": image
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
      version: model.baseModel ?? "",
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
