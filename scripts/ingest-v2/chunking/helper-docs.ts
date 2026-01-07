import type { ActiveDoc, ChunkInput } from "../types";
import { MAX_TOKENS, TARGET_TOKENS } from "../constants";
import { estimateTokens, slugify } from "../utils";
import { parseSections, type Section } from "./common";

function isBulletLine(line: string): boolean {
  return /^\s*[-*+]\s+\S/.test(line);
}

type HelperLabelAugmenter = (labels: string[], heading: string) => void;

type HelperDocType =
  | "discipline-index"
  | "platform-guide"
  | "base-model-index"
  | "model-spec-text";

const helperLabelAugmenters: Record<HelperDocType, HelperLabelAugmenter> = {
  "discipline-index": (labels, heading) => {
    const normalized = heading.toLowerCase().replaceAll(/\s+/g, "-");
    labels.push(`disciplines:${normalized}`);
  },
  "platform-guide": (labels, heading) => {
    const match = /platform:\s*(.+)/i.exec(heading);
    const platformSlug = slugify(match ? match[1] : heading);
    if (platformSlug) labels.push(`platform:${platformSlug}`);
  },
  "base-model-index": (labels, heading) => {
    const baseSlug = slugify(heading);
    if (baseSlug) labels.push(`base-model:${baseSlug}`);
  },
  "model-spec-text": (labels, heading) => {
    const modelSlug = slugify(heading);
    if (modelSlug) labels.push(`model:${modelSlug}`);
  },
};

function appendHeadingLabels(
  labels: string[],
  heading?: string,
  headingPath?: string,
): void {
  if (heading) {
    const headingSlug = slugify(heading);
    if (headingSlug) labels.push(headingSlug);
  }
  if (headingPath) {
    const pathSlug = slugify(headingPath);
    if (pathSlug) labels.push(pathSlug);
  }
}

function appendDocTypeLabels(
  labels: string[],
  docType: string,
  heading?: string,
): void {
  if (!heading) return;
  switch (docType) {
    case "discipline-index":
      helperLabelAugmenters["discipline-index"](labels, heading);
      return;
    case "platform-guide":
      helperLabelAugmenters["platform-guide"](labels, heading);
      return;
    case "base-model-index":
      helperLabelAugmenters["base-model-index"](labels, heading);
      return;
    case "model-spec-text":
      helperLabelAugmenters["model-spec-text"](labels, heading);
      return;
    default:
      return;
  }
}

function buildHelperSectionLabels(
  doc: ActiveDoc,
  heading?: string,
  headingPath?: string,
): string[] {
  const labels: string[] = [doc.docType];
  appendHeadingLabels(labels, heading, headingPath);
  appendDocTypeLabels(labels, doc.docType, heading);
  return labels;
}

function collectListItems(lines: string[]): string[] {
  const items: string[] = [];
  let current: string[] = [];
  let seenListStart = false;

  const pushCurrent = () => {
    const joined = current.join("\n");
    if (joined.trim()) {
      items.push(joined.trimEnd());
    }
    current = [];
  };

  for (const line of lines) {
    if (isBulletLine(line)) {
      if (current.length) pushCurrent();
      current.push(line);
      seenListStart = true;
    } else if (seenListStart) {
      current.push(line);
    } else {
      current.push(line);
    }
  }

  pushCurrent();
  return items;
}

function splitByParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitUnitByWhitespace(unit: string, maxTokens: number): string[] {
  const words = unit.split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const pieces: string[] = [];
  let buffer: string[] = [];
  let tokens = 0;

  const flush = () => {
    if (buffer.length) {
      pieces.push(buffer.join(" "));
      buffer = [];
      tokens = 0;
    }
  };

  for (const word of words) {
    const wordTokens = estimateTokens(word);
    if (!buffer.length) {
      buffer.push(word);
      tokens = wordTokens;
      continue;
    }

    if (tokens + wordTokens + 1 > maxTokens) {
      flush();
      buffer.push(word);
      tokens = wordTokens;
    } else {
      buffer.push(word);
      tokens += wordTokens + 1; // include space
    }
  }

  flush();
  return pieces;
}

interface UnitLimitOptions {
  headingTokens: number;
  maxTokens: number;
  maxPerUnit: number;
}

function normalizeUnitForLimits(
  unit: string,
  limits: UnitLimitOptions,
): string[] {
  const unitTokens = estimateTokens(unit);
  if (unitTokens + limits.headingTokens <= limits.maxTokens) {
    return [unit];
  }

  const splitUnits = splitUnitByWhitespace(unit, limits.maxPerUnit);
  if (!splitUnits.length) return [];

  return splitUnits.map((piece) => {
    if (estimateTokens(piece) + limits.headingTokens > limits.maxTokens) {
      console.warn("Warning: unit still exceeds max tokens after split", {
        headingTokens: limits.headingTokens,
        maxTokens: limits.maxTokens,
        pieceLength: piece.length,
      });
    }
    return piece;
  });
}

function normalizeUnitsForLimits(
  units: string[],
  limits: { headingTokens: number; maxTokens: number },
): string[] {
  const maxPerUnit = Math.max(1, limits.maxTokens - limits.headingTokens);
  const resolved: string[] = [];

  for (const unit of units) {
    resolved.push(
      ...normalizeUnitForLimits(unit, {
        headingTokens: limits.headingTokens,
        maxTokens: limits.maxTokens,
        maxPerUnit,
      }),
    );
  }

  return resolved;
}

function packUnitsIntoChunks(
  units: string[],
  headingTokens: number,
  options: { targetTokens: number; maxTokens: number },
): string[][] {
  const slices: string[][] = [];
  let current: string[] = [];
  let currentTokens = headingTokens;

  const pushCurrent = () => {
    if (current.length) {
      slices.push(current);
      current = [];
      currentTokens = headingTokens;
    }
  };

  for (const unit of units) {
    const unitTokens = estimateTokens(unit);
    const wouldExceed = currentTokens + unitTokens > options.maxTokens;

    if (current.length && wouldExceed && currentTokens >= options.targetTokens) {
      pushCurrent();
    }

    if (!current.length && unitTokens + headingTokens > options.maxTokens) {
      current.push(unit);
      pushCurrent();
      continue;
    }

    if (currentTokens + unitTokens > options.maxTokens && current.length) {
      pushCurrent();
    }

    current.push(unit);
    currentTokens += unitTokens;
  }

  pushCurrent();
  return slices;
}

function buildSplitChunkText(
  heading: string,
  partIndex: number,
  totalParts: number,
  body: string,
): string {
  const headingLine = `${heading} (part ${partIndex}/${totalParts})`;
  return `${headingLine}\n\n${body.trimEnd()}`;
}

function collectHelperUnits(content: string): { units: string[]; joiner: string } {
  const lines = content.split(/\r?\n/);
  const bulletLines = lines.filter(isBulletLine);
  if (bulletLines.length >= 3) {
    return {
      units: collectListItems(lines),
      joiner: "\n",
    };
  }

  const paragraphs = splitByParagraphs(content);
  if (paragraphs.length) {
    return { units: paragraphs, joiner: "\n\n" };
  }

  return { units: [content.trim()], joiner: "\n\n" };
}

function buildHelperChunksFromSlices(params: {
  section: Section;
  labels: string[];
  primaryModes: string[];
  archetypeBias: string[];
  startIndex: number;
  headingBase: string;
  joiner: string;
  slices: string[][];
}): ChunkInput[] {
  const {
    section,
    labels,
    primaryModes,
    archetypeBias,
    startIndex,
    headingBase,
    joiner,
    slices,
  } = params;
  const totalParts = slices.length || 1;
  const chunks: ChunkInput[] = [];
  let chunkIndex = startIndex;

  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i];
    const body = slice.join(joiner);
    const text = buildSplitChunkText(headingBase, i + 1, totalParts, body);
    chunks.push({
      text,
      chunkIndex,
      heading: section.heading ?? undefined,
      headingPath: section.headingPath ?? undefined,
      sectionLabels: labels.length ? labels : undefined,
      primaryModes,
      archetypeBias,
    });
    chunkIndex += 1;
  }

  return chunks;
}

function splitOversizedHelperSection(params: {
  section: Section;
  content: string;
  labels: string[];
  primaryModes: string[];
  archetypeBias: string[];
  startIndex: number;
}): ChunkInput[] {
  const { section, content, labels, primaryModes, archetypeBias, startIndex } =
    params;
  const headingBase = section.heading?.trim() || "(no heading)";
  const headingTokens = estimateTokens(`${headingBase} (part 1/1)`);
  const { units, joiner } = collectHelperUnits(content);
  const normalizedUnits = normalizeUnitsForLimits(units, {
    headingTokens,
    maxTokens: MAX_TOKENS,
  });
  const slices = packUnitsIntoChunks(normalizedUnits, headingTokens, {
    targetTokens: TARGET_TOKENS,
    maxTokens: MAX_TOKENS,
  });

  return buildHelperChunksFromSlices({
    section,
    labels,
    primaryModes,
    archetypeBias,
    startIndex,
    headingBase,
    joiner,
    slices,
  });
}

export function chunkHeadingBlocksForHelperDocs(
  doc: ActiveDoc,
  rawText: string,
): ChunkInput[] {
  const sections = parseSections(rawText);
  const chunks: ChunkInput[] = [];
  let chunkIndex = 0;
  const primaryModes = ["Prospect", "Owner"];
  const archetypeBias: string[] = []; // neutral unless content skews otherwise

  for (const section of sections) {
    const content = section.content.join("\n").trim();
    const hasHeading = Boolean(section.heading);
    if (!hasHeading && !content) continue;

    const text = [section.heading ? section.heading.trim() : "", content]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!text) continue;

    const labels = buildHelperSectionLabels(
      doc,
      section.heading,
      section.headingPath,
    );

    const estimatedTokens = estimateTokens(text);
    if (estimatedTokens <= MAX_TOKENS) {
      chunks.push({
        text,
        chunkIndex,
        heading: section.heading ?? undefined,
        headingPath: section.headingPath ?? undefined,
        sectionLabels: labels.length ? labels : undefined,
        primaryModes,
        archetypeBias,
      });
      chunkIndex += 1;
      continue;
    }

    const splitChunks = splitOversizedHelperSection({
      section,
      content,
      labels,
      primaryModes,
      archetypeBias,
      startIndex: chunkIndex,
    });
    chunks.push(...splitChunks);
    chunkIndex += splitChunks.length;
  }

  return chunks;
}
