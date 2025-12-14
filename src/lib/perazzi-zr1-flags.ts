import "server-only";

export type Zr1FeatureFlags = {
  enableRerank: boolean;
  rerankCandidateLimit: number;
  archetypeConfidenceMin: number;
  enableRetrievalDebug: boolean;
};

const DEFAULTS: Zr1FeatureFlags = {
  enableRerank: false,
  rerankCandidateLimit: 60,
  archetypeConfidenceMin: 0.08,
  enableRetrievalDebug: false,
};

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return raw === "true";
}

function readNumber(
  name: string,
  fallback: number,
  opts?: { min?: number; max?: number; integer?: boolean },
): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;

  const value = opts?.integer ? Math.floor(parsed) : parsed;

  if (opts?.min != null && value < opts.min) return fallback;
  if (opts?.max != null && value > opts.max) return fallback;

  return value;
}

export function getZr1FeatureFlags(): Zr1FeatureFlags {
  return {
    enableRerank: readBool("PERAZZI_ENABLE_RERANK", DEFAULTS.enableRerank),
    rerankCandidateLimit: readNumber(
      "PERAZZI_RERANK_CANDIDATE_LIMIT",
      DEFAULTS.rerankCandidateLimit,
      { min: 1, integer: true },
    ),
    archetypeConfidenceMin: readNumber(
      "PERAZZI_ARCHETYPE_CONFIDENCE_MIN",
      DEFAULTS.archetypeConfidenceMin,
      { min: 0, max: 1 },
    ),
    enableRetrievalDebug: readBool(
      "PERAZZI_ENABLE_RETRIEVAL_DEBUG",
      DEFAULTS.enableRetrievalDebug,
    ),
  };
}
