import {
  DEFAULT_ANALYZE_MAX_CHARS,
  DEFAULT_ANALYZE_MAX_TOKENS,
  DEFAULT_TOP_OUTLIERS,
  TOKEN_HISTOGRAM_BINS,
} from "./constants";
import { parseSourceCorpus, readDocumentFile } from "./corpus";
import { chunkDocument } from "./chunking/index";
import type {
  ActiveDoc,
  ChunkAnalysisEntry,
  ChunkInput,
  DocChunkStats,
} from "./types";
import { estimateTokens } from "./utils";

interface AnalysisOptions {
  top: number;
  maxChars: number;
  maxTokens: number;
}

export function parseNumberOption(value: unknown, defaultValue: number): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
  return parsed;
}

function normalizeHeadingPath(headingPath?: string): string {
  const trimmed = headingPath?.trim();
  return trimmed ? trimmed : "(no heading)";
}

function computeDocChunkStats(
  chunks: ChunkInput[],
  thresholds: { maxChars: number; maxTokens: number },
): Omit<DocChunkStats, "docType" | "path"> {
  const stats = {
    chunkCount: chunks.length,
    maxChars: 0,
    maxTokens: 0,
    overMaxCharsCount: 0,
    overMaxTokensCount: 0,
  };

  for (const chunk of chunks) {
    const chars = chunk.text.length;
    const estTokens = estimateTokens(chunk.text);

    if (chars > stats.maxChars) stats.maxChars = chars;
    if (estTokens > stats.maxTokens) stats.maxTokens = estTokens;
    if (chars > thresholds.maxChars) stats.overMaxCharsCount += 1;
    if (estTokens > thresholds.maxTokens) stats.overMaxTokensCount += 1;
  }

  return stats;
}

function assignPartMarkers(chunks: ChunkAnalysisEntry[]): void {
  const grouped = new Map<string, ChunkAnalysisEntry[]>();
  for (const chunk of chunks) {
    const key = `${chunk.path}__${chunk.headingPath}`;
    const list = grouped.get(key) ?? [];
    list.push(chunk);
    grouped.set(key, list);
  }

  for (const [, list] of grouped) {
    list.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const total = list.length;
    list.forEach((chunk, idx) => {
      chunk.partMarker = `part ${idx + 1}/${total}`;
    });
  }
}

function buildTokenHistogram(
  chunks: ChunkAnalysisEntry[],
): Array<{ bin: string; count: number }> {
  const histogram = TOKEN_HISTOGRAM_BINS.map((bin) => ({
    bin: bin.label,
    count: 0,
  }));

  for (const chunk of chunks) {
    for (let i = 0; i < TOKEN_HISTOGRAM_BINS.length; i += 1) {
      const bin = TOKEN_HISTOGRAM_BINS[i]!;
      const inMin = chunk.estTokens >= bin.min;
      const inMax = bin.max === undefined || chunk.estTokens <= bin.max;
      if (inMin && inMax) {
        histogram[i]!.count += 1;
        break;
      }
    }
  }

  return histogram;
}

function recordEmptyDocStats(doc: ActiveDoc): DocChunkStats {
  return {
    chunkCount: 0,
    maxChars: 0,
    maxTokens: 0,
    overMaxCharsCount: 0,
    overMaxTokensCount: 0,
    docType: doc.docType,
    path: doc.path,
  };
}

async function collectChunkAnalysis(options: AnalysisOptions): Promise<{
  perDocStats: DocChunkStats[];
  allChunks: ChunkAnalysisEntry[];
}> {
  const docs = await parseSourceCorpus();
  const perDocStats: DocChunkStats[] = [];
  const allChunks: ChunkAnalysisEntry[] = [];

  for (const doc of docs) {
    if (doc.embedMode === "metadata-only") {
      perDocStats.push(recordEmptyDocStats(doc));
      continue;
    }

    let rawText: string | null = null;
    try {
      const res = await readDocumentFile(doc);
      rawText = res.rawText;
    } catch (err) {
      console.warn("Warning: unable to read document", {
        path: doc.path,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (!rawText || !rawText.trim()) {
      perDocStats.push(recordEmptyDocStats(doc));
      continue;
    }

    const chunkInputs = chunkDocument(doc, rawText, {
      maxChars: options.maxChars,
      maxTokens: options.maxTokens,
    });
    const docStats = computeDocChunkStats(chunkInputs, {
      maxChars: options.maxChars,
      maxTokens: options.maxTokens,
    });
    perDocStats.push({
      ...docStats,
      docType: doc.docType,
      path: doc.path,
    });

    const entries = chunkInputs.map((chunk) => ({
      path: doc.path,
      headingPath: normalizeHeadingPath(chunk.headingPath),
      chunkIndex: chunk.chunkIndex,
      chars: chunk.text.length,
      estTokens: estimateTokens(chunk.text),
    }));
    allChunks.push(...entries);
  }

  return { perDocStats, allChunks };
}

function printPerDocStats(perDocStats: DocChunkStats[]): void {
  console.log("---- Per-doc chunk stats ----");
  console.table(
    perDocStats.map((entry) => ({
      chunkCount: entry.chunkCount,
      maxChars: entry.maxChars,
      maxTokens: entry.maxTokens,
      overMaxCharsCount: entry.overMaxCharsCount,
      overMaxTokensCount: entry.overMaxTokensCount,
      docType: entry.docType,
      path: entry.path,
    })),
  );
}

function printHistogram(allChunks: ChunkAnalysisEntry[]): void {
  console.log("---- Global token histogram (estimated tokens) ----");
  console.table(buildTokenHistogram(allChunks));
}

function printOutliers(
  allChunks: ChunkAnalysisEntry[],
  top: number,
): void {
  const sortedOutliers = [...allChunks].sort(
    (a, b) =>
      b.estTokens - a.estTokens ||
      b.chars - a.chars ||
      a.chunkIndex - b.chunkIndex,
  );
  const topOutliers = sortedOutliers.slice(0, top);
  console.log(`---- Top ${topOutliers.length} outliers ----`);
  console.table(
    topOutliers.map((chunk) => ({
      chars: chunk.chars,
      estTokens: chunk.estTokens,
      path: chunk.path,
      headingPath: chunk.headingPath,
      partMarker: chunk.partMarker ?? "",
    })),
  );
}

export async function runChunkAnalysis(options: AnalysisOptions): Promise<void> {
  const { perDocStats, allChunks } = await collectChunkAnalysis(options);
  assignPartMarkers(allChunks);
  printPerDocStats(perDocStats);
  printHistogram(allChunks);
  printOutliers(allChunks, options.top);
}

export async function runSyntheticParagraphAnalysis(): Promise<void> {
  const syntheticDoc: ActiveDoc = {
    path: "__synthetic__",
    category: "synthetic",
    docType: "synthetic",
    status: "active",
    embedMode: "full",
    pricingSensitive: false,
  };

  const bulletLines = Array.from({ length: 300 }).map(
    (_, idx) =>
      `- synthetic line ${idx + 1} with some repeated text to force size growth`,
  );
  const rawText = `# Synthetic oversized paragraph\n\n${bulletLines.join("\n")}`;
  const chunks = chunkDocument(syntheticDoc, rawText, {
    maxChars: DEFAULT_ANALYZE_MAX_CHARS,
    maxTokens: DEFAULT_ANALYZE_MAX_TOKENS,
  });
  const stats = computeDocChunkStats(chunks, {
    maxChars: DEFAULT_ANALYZE_MAX_CHARS,
    maxTokens: DEFAULT_ANALYZE_MAX_TOKENS,
  });

  console.log("---- Synthetic paragraph analysis ----");
  console.table([
    {
      chunkCount: stats.chunkCount,
      maxChars: stats.maxChars,
      maxTokens: stats.maxTokens,
      overMaxCharsCount: stats.overMaxCharsCount,
      overMaxTokensCount: stats.overMaxTokensCount,
    },
  ]);
}

export const DEFAULT_ANALYSIS_OPTIONS = {
  top: DEFAULT_TOP_OUTLIERS,
  maxChars: DEFAULT_ANALYZE_MAX_CHARS,
  maxTokens: DEFAULT_ANALYZE_MAX_TOKENS,
};
