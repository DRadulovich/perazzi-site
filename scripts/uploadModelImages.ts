import fs from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";

const client = getCliClient({
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
});

async function run() {
  const docs = await client.fetch<
    Array<{ _id: string; s_image_local_path?: { asset?: { _upload?: { path?: string } } } }>
  >(`*[_type == "models" && defined(s_image_local_path.asset._upload.path)]{
    _id,
    s_image_local_path
  }`);

  if (!docs.length) {
    console.log("No models require image uploads.");
    return;
  }

  for (const doc of docs) {
    const localPath = doc.s_image_local_path?.asset?._upload?.path;
    if (!localPath) {
      console.warn(`Skipping ${doc._id}: no local path.`);
      continue;
    }

    const absolutePath = path.resolve(localPath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`Skipping ${doc._id}: file not found at ${absolutePath}`);
      continue;
    }

    console.log(`Uploading ${absolutePath} for ${doc._id}...`);
    const stream = fs.createReadStream(absolutePath);
    const asset = await client.assets.upload("image", stream, {
      filename: path.basename(localPath),
    });

    await client
      .patch(doc._id)
      .set({
        "s_image_local_path.asset": {
          _type: "reference",
          _ref: asset._id,
        },
      })
      .commit();

    console.log(`Updated ${doc._id} with asset ${asset._id}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
