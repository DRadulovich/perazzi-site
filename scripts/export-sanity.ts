#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2), {
  string: ["schema"],
  default: { schema: "platform" },
});

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET,
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_TOKEN,
});

async function exportSchema(schema: string) {
  const docs = await client.fetch(`*[_type == $schema]`, { schema });
  const outDir = path.join(process.cwd(), "PerazziGPT", "Sanity_Info");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${schema}.json`);
  fs.writeFileSync(outPath, JSON.stringify(docs, null, 2));
  console.log(`Exported ${docs.length} ${schema} docs to ${outPath}`);
}

exportSchema(argv.schema).catch((error) => {
  console.error(error);
  process.exit(1);
});
