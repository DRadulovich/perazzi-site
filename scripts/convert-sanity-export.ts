#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: pnpm tsx scripts/convert-sanity-export.ts <path/to/data.ndjson>");
  process.exit(1);
}

const absoluteInput = path.isAbsolute(inputPath)
  ? inputPath
  : path.join(process.cwd(), inputPath);

if (!fs.existsSync(absoluteInput)) {
  console.error(`Cannot find ${absoluteInput}`);
  process.exit(1);
}

const byType: Record<string, any[]> = {};
const lines = fs.readFileSync(absoluteInput, "utf8").split(/\r?\n/).filter(Boolean);
for (const line of lines) {
  try {
    const doc = JSON.parse(line);
    const type = doc._type ?? "unknown";
    if (!byType[type]) byType[type] = [];
    byType[type].push(doc);
  } catch (error) {
    console.warn("Skipping invalid line", error);
  }
}

const outDir = path.join(process.cwd(), "PerazziGPT", "Sanity_Info");
fs.mkdirSync(outDir, { recursive: true });

Object.entries(byType).forEach(([type, docs]) => {
  const outPath = path.join(outDir, `${type}.json`);
  fs.writeFileSync(outPath, JSON.stringify(docs, null, 2));
  console.log(`Wrote ${docs.length} docs to ${outPath}`);
});
