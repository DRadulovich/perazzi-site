import type { ActiveDoc, ChunkInput } from "../types";
import { LIST_START_REGEX, MAX_TOKENS, TARGET_TOKENS } from "../constants";
import { estimateTokens } from "../utils";
import {
  createChunkFromBuffer,
  defaultArchetypes,
  defaultModesForCategory,
  parseSections,
  type Section,
} from "./common";

function collectListItems(
  lines: string[],
  isListStart: (line: string) => boolean,
): string[] {
  const items: string[] = [];
  let current: string[] = [];

  const pushCurrent = () => {
    const joined = current.join("\n");
    if (joined.trim()) {
      items.push(joined.trimEnd());
    }
    current = [];
  };

  for (const line of lines) {
    if (isListStart(line)) {
      if (current.length) pushCurrent();
      current.push(line);
    } else {
      current.push(line);
    }
  }

  pushCurrent();
  return items;
}

function splitListParagraph(paragraph: string): string[] {
  const lines = paragraph.split(/\r?\n/);
  return collectListItems(lines, (line) => LIST_START_REGEX.test(line));
}

function splitIntoSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [text.trim()];
}

function sliceByTokens(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
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

function packUnitsWithJoiner(
  units: string[],
  joiner: string,
  options: { targetTokens: number; maxTokens: number },
): string[] {
  const result: string[] = [];
  let current = "";

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) result.push(trimmed);
    current = "";
  };

  const pushStandaloneUnit = (unit: string) => {
    const unitTokens = estimateTokens(unit);
    if (unitTokens > options.maxTokens) {
      result.push(...sliceByTokens(unit, options.maxTokens));
      return;
    }
    current = unit;
    if (unitTokens >= options.targetTokens) {
      flush();
    }
  };

  const appendUnit = (unit: string) => {
    const candidate = `${current}${joiner}${unit}`;
    const candidateTokens = estimateTokens(candidate);
    if (candidateTokens > options.maxTokens) {
      flush();
      pushStandaloneUnit(unit);
      return;
    }
    current = candidate;
    if (candidateTokens >= options.targetTokens) {
      flush();
    }
  };

  for (const unitRaw of units) {
    const unit = unitRaw.trim();
    if (!unit) continue;

    if (!current) {
      pushStandaloneUnit(unit);
      continue;
    }

    appendUnit(unit);
  }

  flush();
  return result;
}

function expandParagraphUnits(paragraph: string): string[] {
  if (estimateTokens(paragraph) > MAX_TOKENS) {
    return splitOversizedParagraph(paragraph);
  }
  return [paragraph];
}

function normalizeUnitToTokenLimit(unit: string): string[] {
  if (estimateTokens(unit) > MAX_TOKENS) {
    return sliceByTokens(unit, MAX_TOKENS);
  }
  return [unit];
}

function splitOversizedParagraph(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/);
  const topLevelListStarts = lines.filter((line) => LIST_START_REGEX.test(line))
    .length;

  if (topLevelListStarts >= 3) {
    const items = splitListParagraph(trimmed);
    const packed = packUnitsWithJoiner(items, "\n", {
      targetTokens: TARGET_TOKENS,
      maxTokens: MAX_TOKENS,
    });
    if (packed.length) return packed;
  }

  if (trimmed.includes("\n")) {
    const packedLines = packUnitsWithJoiner(
      lines.filter((line) => line.trim().length > 0),
      "\n",
      { targetTokens: TARGET_TOKENS, maxTokens: MAX_TOKENS },
    );
    if (packedLines.length) return packedLines;
  }

  const sentences = splitIntoSentences(trimmed);
  const packedSentences = packUnitsWithJoiner(sentences, " ", {
    targetTokens: TARGET_TOKENS,
    maxTokens: MAX_TOKENS,
  });
  if (packedSentences.length) return packedSentences;

  return sliceByTokens(trimmed, MAX_TOKENS);
}

function processSectionIntoParagraphChunks(
  section: Section,
  primaryModes: string[],
  archetypeBias: string[],
  startChunkIndex: number,
): ChunkInput[] {
  const sectionText = section.content.join("\n").trim();
  if (!sectionText) return [];

  const paragraphs = sectionText.split(/\n{2,}/);
  const chunks: ChunkInput[] = [];
  let buffer: string[] = [];
  let bufferTokens = 0;
  let chunkIndex = startChunkIndex;

  const flushBuffer = () => {
    const chunk = createChunkFromBuffer(
      buffer,
      chunkIndex,
      section,
      primaryModes,
      archetypeBias,
    );
    if (chunk) {
      chunks.push(chunk);
      chunkIndex += 1;
    }
    buffer = [];
    bufferTokens = 0;
  };

  const addNormalizedUnit = (normalizedUnit: string) => {
    const normalizedTokens = estimateTokens(normalizedUnit);
    if (bufferTokens > 0 && bufferTokens + normalizedTokens > MAX_TOKENS) {
      flushBuffer();
    }

    buffer.push(normalizedUnit);
    bufferTokens += normalizedTokens;
    if (bufferTokens >= TARGET_TOKENS) {
      flushBuffer();
    }
  };

  for (const para of paragraphs) {
    const paraText = para.trim();
    if (!paraText) continue;

    const paraUnits = expandParagraphUnits(paraText);
    for (const unit of paraUnits) {
      const normalizedUnits = normalizeUnitToTokenLimit(unit);
      for (const normalizedUnit of normalizedUnits) {
        addNormalizedUnit(normalizedUnit);
      }
    }
  }

  flushBuffer();
  return chunks;
}

function collectSectionChunks(
  sections: Section[],
  primaryModes: string[],
  archetypeBias: string[],
): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionChunks = processSectionIntoParagraphChunks(
      section,
      primaryModes,
      archetypeBias,
      chunkIndex,
    );
    chunks.push(...sectionChunks);
    chunkIndex += sectionChunks.length;
  }

  return chunks;
}

export function chunkMarkdownLike(doc: ActiveDoc, rawText: string): ChunkInput[] {
  const sections = parseSections(rawText);
  const primaryModes = defaultModesForCategory(doc.category);
  const archetypeBias = defaultArchetypes();
  return collectSectionChunks(sections, primaryModes, archetypeBias);
}
