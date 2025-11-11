import fs from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
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

type EngravingRow = {
  engraving_photo: string;
  engraving_grade: string;
  engraving_id: string;
  engraving_side: string;
};

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error("Missing Sanity projectId/dataset environment variables");
}

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN;

const client = getCliClient({
  projectId,
  dataset,
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
  token,
});

const DATA_PATH = path.resolve("Photos/JSON_DATABASES/Engraving_Database_List.json");

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`Could not find engraving database at ${DATA_PATH}`);
    process.exit(1);
  }

  const rows: EngravingRow[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  if (!rows.length) {
    console.log("No engraving rows found, aborting.");
    return;
  }

  const gradeDocs = await client.fetch<Array<{ _id: string; name?: string }>>(
    '*[_type == "grade"]{ _id, name }',
  );
  const gradeMap = new Map(
    gradeDocs
      .filter((grade) => grade.name)
      .map((grade) => [grade.name as string, grade._id]),
  );

  const summary = {
    total: rows.length,
    createdOrUpdated: 0,
    missingGrade: 0,
    missingFile: 0,
    failed: 0,
  };

  for (const row of rows) {
    const absolutePath = path.resolve(row.engraving_photo);
    if (!fs.existsSync(absolutePath)) {
      summary.missingFile += 1;
      console.warn(`Skipping ${row.engraving_photo}: file not found.`);
      continue;
    }

    const gradeId = gradeMap.get(row.engraving_grade);
    if (!gradeId) {
      summary.missingGrade += 1;
      console.warn(
        `Skipping ${row.engraving_photo}: grade "${row.engraving_grade}" not found in Sanity.`,
      );
      continue;
    }

    try {
      const alt = `${row.engraving_grade} engraving ${row.engraving_id} (${row.engraving_side})`;
      const uploadStream = fs.createReadStream(absolutePath);
      const asset = await client.assets.upload("image", uploadStream, {
        filename: path.basename(row.engraving_photo),
      });

      const docId = `engraving-${slugify(row.engraving_grade)}-${row.engraving_id}-${row.engraving_side.toLowerCase()}`;

      await client.createOrReplace({
        _id: docId,
        _type: "engravings",
        engraving_id: row.engraving_id,
        engraving_side: row.engraving_side,
        engraving_grade: {
          _type: "reference",
          _ref: gradeId,
        },
        engraving_photo: {
          _type: "imageWithMeta",
          alt,
          decorative: false,
          asset: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: asset._id,
            },
          },
        },
      });

      summary.createdOrUpdated += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(`Failed to create engraving for ${row.engraving_photo}`, error);
    }
  }

  console.table(summary);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
