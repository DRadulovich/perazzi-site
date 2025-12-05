import type { IdentifiedSanityDocumentStub } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";

type ModelRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  baseModel: string | null;
  platform: string | null;
  grade: string | null;
  category: string | null;
  disciplines: string[];
  gauges: string[];
  barrelConfig: string | null;
  combo: boolean;
  comboType: string | null;
  trigger: {
    type: string | null;
    springs: string[];
  };
  rib: {
    type: string | null;
    adjustableNotch: number | null;
    heightMm: number | null;
    styles: string[];
  };
  images: {
    localPath: string | null;
    fallbackUrl: string | null;
  };
  sourceUrl: string | null;
};

function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const [rawKey, ...rest] = line.split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim().replace(/^"|"$/g, "");
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv(path.resolve(".env.local"));

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN;

if (!projectId || !dataset) {
  throw new Error("Missing Sanity projectId/dataset environment variables");
}
if (!token) {
  throw new Error("Missing Sanity write token (SANITY_WRITE_TOKEN or SANITY_AUTH_TOKEN)");
}

const client = getCliClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
});

const DATA_PATH = path.resolve("PerazziGPT/DEVELOPER/corpus_models_sanity.json");

function toSlug(value: string | null): string | undefined {
  if (!value) return undefined;
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || undefined;
}

async function buildGradeMap() {
  const grades = await client.fetch<Array<{ _id: string; name?: string }>>(
    '*[_type == "grade"]{ _id, name }',
  );
  const map = new Map<string, string>();
  grades.forEach((g) => {
    if (g.name) {
      map.set(g.name, g._id);
      map.set(g.name.toLowerCase(), g._id);
    }
  });
  return map;
}

async function buildPlatformMap() {
  const platforms = await client.fetch<Array<{ _id: string; name?: string; slug?: { current?: string } }>>(
    '*[_type == "platform"]{ _id, name, slug }',
  );
  const map = new Map<string, string>();
  platforms.forEach((p) => {
    if (p.slug?.current) map.set(p.slug.current.toLowerCase(), p._id);
    if (p.name) map.set(p.name.toLowerCase(), p._id);
  });
  return map;
}

async function uploadImage(localPath: string, alt: string) {
  const absolutePath = path.resolve(localPath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`Image not found at ${absolutePath}, skipping upload.`);
    return null;
  }
  const stream = fs.createReadStream(absolutePath);
  const asset = await client.assets.upload("image", stream, {
    filename: path.basename(localPath),
  });
  return asset?._id ?? null;
}

async function run() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`Data file not found at ${DATA_PATH}`);
    process.exit(1);
  }

  const rows: ModelRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  if (!rows.length) {
    console.log("No model records found to import.");
    return;
  }

  const gradeMap = await buildGradeMap();
  const platformMap = await buildPlatformMap();

  let createdOrUpdated = 0;
  let skippedPlatform = 0;
  let missingImages = 0;

  for (const row of rows) {
    if (!row.name || !row.slug) {
      console.warn(`Skipping row without name/slug: ${JSON.stringify(row)}`);
      continue;
    }

    const platformId = row.platform ? platformMap.get(row.platform.toLowerCase()) : undefined;
    if (!platformId) {
      skippedPlatform += 1;
      console.warn(`Skipping ${row.name}: platform "${row.platform}" not found.`);
      continue;
    }

    let gradeRef: { _type: "reference"; _ref: string } | undefined;
    if (row.grade) {
      const gradeId = gradeMap.get(row.grade) || gradeMap.get(row.grade.toLowerCase());
      if (gradeId) {
        gradeRef = { _type: "reference", _ref: gradeId };
      } else {
        console.warn(`Grade "${row.grade}" not found for ${row.name}; leaving grade empty.`);
      }
    }

    let imageAssetId: string | null = null;
    if (row.images?.localPath) {
      imageAssetId = await uploadImage(row.images.localPath, `${row.name} image`);
      if (!imageAssetId) {
        missingImages += 1;
      }
    }

    const safeId = row.id || toSlug(row.slug) || toSlug(row.name) || "";
    const docId = `allModels-${safeId}`;
    const payload: IdentifiedSanityDocumentStub<Record<string, any>> = {
      _id: docId,
      _type: "allModels",
      name: row.name,
      slug: { _type: "slug", current: safeId },
      platform: { _type: "reference", _ref: platformId },
      baseModel: row.baseModel || undefined,
      category: row.category || undefined,
      disciplines: row.disciplines || [],
      gauges: row.gauges || [],
      barrelConfig: row.barrelConfig || undefined,
      combo: row.combo,
      comboType: row.comboType || undefined,
      trigger: {
        type: row.trigger?.type || undefined,
        springs: row.trigger?.springs || [],
      },
      rib: {
        type: row.rib?.type || undefined,
        adjustableNotch: row.rib?.adjustableNotch ?? undefined,
        heightMm: row.rib?.heightMm ?? undefined,
        styles: row.rib?.styles || [],
      },
      imageFallbackUrl: row.images?.fallbackUrl || undefined,
      sourceUrl: row.sourceUrl || undefined,
      grade: gradeRef,
      idLegacy: row.id,
    };

    if (imageAssetId) {
      payload.image = {
        _type: "imageWithMeta",
        alt: `${row.name} image`,
        decorative: false,
        asset: {
          _type: "image",
          asset: { _type: "reference", _ref: imageAssetId },
        },
      };
    }

    await client.createOrReplace(payload);
    createdOrUpdated += 1;
    console.log(`Imported ${row.name} (${row.slug})`);
  }

  console.log("Import complete:", {
    createdOrUpdated,
    skippedPlatform,
    missingImages,
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
