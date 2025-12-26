import type { ActiveDoc, ChunkInput } from "../types";
import { MAX_CHARS, MAX_TOKENS } from "../constants";
import { enforceChunkBounds } from "../chunking-guardrail";
import { chunkHeadingBlocksForHelperDocs } from "./helper-docs";
import { chunkModelDetailsV2, chunkOlympicMedalsV2 } from "./json";
import { chunkMarkdownLike } from "./markdown";

export function chunkDocument(
  doc: ActiveDoc,
  rawText: string,
  bounds: { maxTokens: number; maxChars: number } = {
    maxTokens: MAX_TOKENS,
    maxChars: MAX_CHARS,
  },
): ChunkInput[] {
  const lowerPath = doc.path.toLowerCase();
  const helperDocTypes = new Set([
    "model-spec-text",
    "base-model-index",
    "discipline-index",
    "platform-guide",
  ]);

  let baseChunks: ChunkInput[];

  if (helperDocTypes.has(doc.docType)) {
    baseChunks = chunkHeadingBlocksForHelperDocs(doc, rawText);
  } else if (lowerPath.endsWith(".json")) {
    if (
      doc.path.includes(
        "/Gun-Info/All-Models-Corpus.json",
      )
    ) {
      baseChunks = chunkModelDetailsV2(rawText);
    } else if (
      doc.path.includes("/Company-Info/Olympic-Medals.json")
    ) {
      baseChunks = chunkOlympicMedalsV2(rawText);
    } else {
      baseChunks = chunkMarkdownLike(doc, rawText);
    }
  } else {
    baseChunks = chunkMarkdownLike(doc, rawText);
  }

  return enforceChunkBounds(baseChunks, bounds);
}
