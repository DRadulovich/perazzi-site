import {
  normalizeArchetypeScores,
  type ArchetypeScores,
} from "@/lib/pgpt-insights/archetype-distribution";
import type { CanonicalArchetype } from "@/lib/pgpt-insights/constants";

export type DecodedRerankChunkScore = {
  chunkId: string;
  baseScore: number;
  boost: number;
  archetypeBoost: number;
  finalScore: number;
};

export type DecodedRerankMetrics = {
  rerankEnabled: boolean;
  candidateLimit?: number;
  topReturnedChunks: DecodedRerankChunkScore[];
};

export type DecodedArchetypeConfidenceMetrics = {
  winner?: CanonicalArchetype;
  runnerUp?: CanonicalArchetype;
  margin?: number;
  snapped?: boolean;
  scores?: ArchetypeScores;
  confidence?: number;
  decision?: unknown;
};

export type DecodedPgptMetadata = {
  rerank?: DecodedRerankMetrics;
  archetype?: DecodedArchetypeConfidenceMetrics;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  let n = Number.NaN;
  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string") {
    n = Number(value);
  }
  return Number.isFinite(n) ? n : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return undefined;
}

const AR_CH_MAP: Record<string, CanonicalArchetype> = {
  loyalist: "Loyalist",
  prestige: "Prestige",
  analyst: "Analyst",
  achiever: "Achiever",
  legacy: "Legacy",
};

function toCanonicalArchetype(value: unknown): CanonicalArchetype | undefined {
  const raw = asString(value)?.trim();
  if (!raw) return undefined;
  return AR_CH_MAP[raw.toLowerCase()];
}

function decodeRerank(md: Record<string, unknown>): DecodedRerankMetrics | undefined {
  const rerankMetrics = md.rerankMetrics;
  const src = isRecord(rerankMetrics) ? rerankMetrics : md;

  const rerankEnabled = asBoolean(src.rerankEnabled);
  const candidateLimit = asNumber(src.candidateLimit);

  const rawTop = src.topReturnedChunks;
  const topReturnedChunks: DecodedRerankChunkScore[] = [];

  if (Array.isArray(rawTop)) {
    for (const item of rawTop.slice(0, 50)) {
      if (!isRecord(item)) continue;
      const chunkId = asString(item.chunkId ?? item.chunk_id ?? item.id);
      if (!chunkId) continue;

      const baseScore = asNumber(item.baseScore) ?? 0;
      const boost = asNumber(item.boost) ?? 0;
      const archetypeBoost = asNumber(item.archetypeBoost) ?? 0;
      const finalScore = asNumber(item.finalScore) ?? baseScore + boost + archetypeBoost;

      topReturnedChunks.push({ chunkId, baseScore, boost, archetypeBoost, finalScore });
    }
  }

  if (rerankEnabled === undefined && candidateLimit === undefined && topReturnedChunks.length === 0) {
    return undefined;
  }

  return {
    rerankEnabled: rerankEnabled ?? false,
    candidateLimit,
    topReturnedChunks,
  };
}

function decodeArchetype(md: Record<string, unknown>): DecodedArchetypeConfidenceMetrics | undefined {
  const winner = toCanonicalArchetype(md.archetypeWinner);
  const runnerUp = toCanonicalArchetype(md.archetypeRunnerUp);

  const margin =
    asNumber(md.archetypeConfidenceMargin) ??
    asNumber(md.archetypeConfidence);

  const snapped = asBoolean(md.archetypeSnapped);

  const scores = normalizeArchetypeScores(md.archetypeScores) ?? undefined;
  const confidence = asNumber(md.archetypeConfidence);
  const decision = md.archetypeDecision;

  if (
    winner === undefined &&
    runnerUp === undefined &&
    margin === undefined &&
    snapped === undefined &&
    scores === undefined &&
    confidence === undefined &&
    decision === undefined
  ) {
    return undefined;
  }

  return { winner, runnerUp, margin, snapped, scores, confidence, decision };
}

export function decodePgptMetadata(metadata: unknown): DecodedPgptMetadata {
  if (!isRecord(metadata)) return {};

  const rerank = decodeRerank(metadata);
  const archetype = decodeArchetype(metadata);

  const out: DecodedPgptMetadata = {};
  if (rerank) out.rerank = rerank;
  if (archetype) out.archetype = archetype;
  return out;
}
