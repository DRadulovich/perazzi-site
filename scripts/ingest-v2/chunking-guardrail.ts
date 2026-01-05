import { LIST_START_REGEX, MAX_CHARS, MAX_TOKENS, TOKEN_ESTIMATE_DIVISOR } from "./constants";
import type { ChunkInput } from "./types";
import { estimateTokens } from "./utils";

interface ChunkBounds {
  maxTokens: number;
  maxChars: number;
}

function fitsChunkBounds(text: string, limits: ChunkBounds): boolean {
  return (
    estimateTokens(text) <= limits.maxTokens && text.length <= limits.maxChars
  );
}

function splitByBlankLines(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function collectListItems(lines: string[]): string[] {
  const items: string[] = [];
  let current: string[] = [];
  let seenListStart = false;

  const pushCurrent = () => {
    const joined = current.join("\n").trimEnd();
    if (joined) items.push(joined);
    current = [];
  };

  for (const line of lines) {
    if (LIST_START_REGEX.test(line)) {
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
  return items.filter(Boolean);
}

function splitMarkdownListItemsWithContinuation(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const starts = lines.filter((line) => LIST_START_REGEX.test(line)).length;
  if (starts < 2) return [text];
  return collectListItems(lines);
}

function splitBySingleLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitIntoSentencesForBounds(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function selectSliceCandidate(
  remaining: string,
  maxCharsAllowed: number,
): { candidate: string; end: number } {
  let end = Math.min(remaining.length, maxCharsAllowed);
  let candidate = remaining.slice(0, end);
  const whitespaceCut = candidate.lastIndexOf(" ");
  if (whitespaceCut > Math.floor(end * 0.5)) {
    end = whitespaceCut;
    candidate = remaining.slice(0, end);
  }

  candidate = candidate.trim();
  if (!candidate) {
    candidate = remaining.slice(0, end);
  }

  return { candidate, end };
}

function shrinkCandidateToLimits(
  remaining: string,
  candidate: string,
  end: number,
  limits: ChunkBounds,
): { candidate: string; end: number } {
  let currentEnd = end;
  let currentCandidate = candidate;

  while (
    currentCandidate.length > 1 &&
    (currentCandidate.length > limits.maxChars ||
      estimateTokens(currentCandidate) > limits.maxTokens)
  ) {
    currentEnd = Math.max(1, Math.floor(currentEnd * 0.9));
    currentCandidate = remaining.slice(0, currentEnd).trim();
    if (!currentCandidate) {
      currentCandidate = remaining.slice(0, currentEnd);
    }
  }

  return { candidate: currentCandidate, end: currentEnd };
}

function trimPieceToBounds(candidate: string, limits: ChunkBounds): string {
  let piece = candidate.trim();
  while (piece.length > 0 && !fitsChunkBounds(piece, limits)) {
    piece = piece.slice(0, -1).trimEnd();
  }
  return piece;
}

function hardSliceToBounds(text: string, limits: ChunkBounds): string[] {
  const slices: string[] = [];
  const maxCharsAllowed = Math.min(
    limits.maxChars,
    limits.maxTokens * TOKEN_ESTIMATE_DIVISOR,
  );
  let remaining = text.trim();

  while (remaining) {
    remaining = remaining.trimStart();
    if (!remaining) break;

    const { candidate, end } = selectSliceCandidate(remaining, maxCharsAllowed);
    const { candidate: shrunkCandidate, end: shrunkEnd } =
      shrinkCandidateToLimits(remaining, candidate, end, limits);
    const piece = trimPieceToBounds(shrunkCandidate, limits);

    if (!piece) break;
    slices.push(piece);
    remaining = remaining.slice(shrunkEnd);
  }

  return slices;
}

function splitTextToFit(
  text: string,
  limits: ChunkBounds,
  strategyIndex = 0,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (fitsChunkBounds(trimmed, limits)) return [trimmed];

  const strategies: Array<(value: string) => string[]> = [
    splitByBlankLines,
    splitMarkdownListItemsWithContinuation,
    splitBySingleLines,
    splitIntoSentencesForBounds,
  ];

  for (let i = strategyIndex; i < strategies.length; i += 1) {
    const parts = strategies[i](trimmed)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length <= 1) continue;

    const result: string[] = [];
    for (const part of parts) {
      result.push(...splitTextToFit(part, limits, i + 1));
    }
    if (result.length) return result;
  }

  const slices = hardSliceToBounds(trimmed, limits);
  return slices.length ? slices : [trimmed.slice(0, limits.maxChars).trim()];
}

export function enforceChunkBounds(
  chunks: ChunkInput[],
  limits?: ChunkBounds,
): ChunkInput[] {
  const resolvedLimits: ChunkBounds = limits ?? {
    maxTokens: MAX_TOKENS,
    maxChars: MAX_CHARS,
  };
  const bounded: ChunkInput[] = [];

  for (const chunk of chunks) {
    const pieces = splitTextToFit(chunk.text, resolvedLimits);
    for (const piece of pieces) {
      bounded.push({
        ...chunk,
        text: piece,
      });
    }
  }

  return bounded.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
  }));
}
