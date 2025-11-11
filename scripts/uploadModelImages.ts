import fs from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";

const client = getCliClient({
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
});

async function run() {
  const docs = await client.fetch<
    Array<{
      _id: string;
      s_image_local_path?: {
        alt?: string;
        decorative?: boolean;
        asset?: {
          _upload?: { path?: string };
          _ref?: string;
          asset?: { _ref?: string };
        };
      };
    }>
  >(`*[_type == "models" && !defined(s_image_local_path.asset.asset._ref)]{
    _id,
    s_image_local_path
  }`);

  if (!docs.length) {
    console.log("No models require image uploads.");
    return;
  }

  for (const doc of docs) {
    const current = doc.s_image_local_path;
    const uploadPath = current?.asset?._upload?.path;
    const legacyRef = current?.asset?._ref;
    const alt = current?.alt || `${doc._id} image`;
    const decorative = current?.decorative ?? false;

    let assetId = current?.asset?.asset?._ref;

    if (!assetId && uploadPath) {
      const absolutePath = path.resolve(uploadPath);
      if (!fs.existsSync(absolutePath)) {
        console.warn(`Skipping ${doc._id}: file not found at ${absolutePath}`);
        continue;
      }
      console.log(`Uploading ${absolutePath} for ${doc._id}...`);
      const stream = fs.createReadStream(absolutePath);
      const asset = await client.assets.upload("image", stream, {
        filename: path.basename(uploadPath),
      });
      assetId = asset._id;
    }

    if (!assetId && legacyRef) {
      assetId = legacyRef;
    }

    if (!assetId) {
      console.warn(`Skipping ${doc._id}: no asset reference available.`);
      continue;
    }

    await client
      .patch(doc._id)
      .set({
        s_image_local_path: {
          _type: "imageWithMeta",
          alt,
          decorative,
          asset: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: assetId,
            },
          },
        },
      })
      .commit();

    console.log(`Updated ${doc._id} with asset ${assetId}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
