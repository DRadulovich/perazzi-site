import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getZr1FeatureFlags } from "@/lib/perazzi-zr1-flags";

vi.mock("server-only", () => ({}));

const flagKeys = [
  "PERAZZI_ENABLE_RERANK",
  "PERAZZI_RERANK_CANDIDATE_LIMIT",
  "PERAZZI_ARCHETYPE_CONFIDENCE_MIN",
  "PERAZZI_ENABLE_RETRIEVAL_DEBUG",
] as const;

type FlagKey = (typeof flagKeys)[number];

let envBackup: Record<FlagKey, string | undefined>;

const snapshotEnv = (): Record<FlagKey, string | undefined> => {
  return flagKeys.reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {} as Record<FlagKey, string | undefined>);
};

beforeEach(() => {
  envBackup = snapshotEnv();
  for (const key of flagKeys) {
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of flagKeys) {
    const value = envBackup[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("getZr1FeatureFlags", () => {
  it("returns defaults when env vars are missing", () => {
    expect(getZr1FeatureFlags()).toEqual({
      enableRerank: false,
      rerankCandidateLimit: 60,
      archetypeConfidenceMin: 0.08,
      enableRetrievalDebug: false,
    });
  });

  it('parses boolean toggles with "true" only', () => {
    process.env.PERAZZI_ENABLE_RERANK = "true";
    process.env.PERAZZI_ENABLE_RETRIEVAL_DEBUG = "false";

    const flags = getZr1FeatureFlags();

    expect(flags.enableRerank).toBe(true);
    expect(flags.enableRetrievalDebug).toBe(false);
  });

  it("uses valid numeric overrides", () => {
    process.env.PERAZZI_RERANK_CANDIDATE_LIMIT = "80";
    process.env.PERAZZI_ARCHETYPE_CONFIDENCE_MIN = "0.2";

    const flags = getZr1FeatureFlags();

    expect(flags.rerankCandidateLimit).toBe(80);
    expect(flags.archetypeConfidenceMin).toBeCloseTo(0.2);
  });

  it("falls back to defaults when numeric values are invalid or out of range", () => {
    process.env.PERAZZI_RERANK_CANDIDATE_LIMIT = "0";
    process.env.PERAZZI_ARCHETYPE_CONFIDENCE_MIN = "1.2";

    const flags = getZr1FeatureFlags();

    expect(flags.rerankCandidateLimit).toBe(60);
    expect(flags.archetypeConfidenceMin).toBeCloseTo(0.08);
  });
});
