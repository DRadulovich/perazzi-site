import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import type { ActiveDoc, EmbedMode, Status } from "./types";

export async function parseSourceCorpus(): Promise<ActiveDoc[]> {
  const corpusPath =
    "PGPT/V2/AI-Docs/P2/Source-Corpus.md";
  const raw = await readFile(path.resolve(process.cwd(), corpusPath), "utf8");
  const lines = raw.split(/\r?\n/);
  const docs: ActiveDoc[] = [];

  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    if (line.includes("Path") && line.includes("Category")) continue;
    if (/^\|\s*-+/.test(line)) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.length < 6) continue;

    const [filePath, category, docType, statusRaw, pricingRaw, embedModeRaw] =
      cells;
    const status = statusRaw.toLowerCase() as Status;
    const embedMode = embedModeRaw.toLowerCase() as EmbedMode;

    const doc: ActiveDoc = {
      path: filePath,
      category,
      docType,
      status,
      embedMode,
      pricingSensitive: pricingRaw.toLowerCase() === "true",
    };

    if (doc.status === "active" && doc.embedMode !== "ignore") {
      docs.push(doc);
    }
  }

  return docs;
}

export async function readDocumentFile(
  doc: ActiveDoc,
): Promise<{ rawText: string; checksum: string }> {
  const absolutePath = path.resolve(process.cwd(), doc.path);
  const rawText = await readFile(absolutePath, "utf8");
  const checksum = createHash("sha256").update(rawText, "utf8").digest("hex");
  return { rawText, checksum };
}
