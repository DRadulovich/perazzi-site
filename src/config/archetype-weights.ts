/**
 * Tiered boost defaults for archetype inference (Pass-5 framework).
 * Values are conservative; env vars can override for experimentation.
 */
export interface ArchetypeBoostTiers {
  high: number; // strong, unambiguous signal (e.g., "family heirloom")
  mid: number;  // moderate, supportive signal (e.g., "pre-shot routine")
  low: number;  // weak, contextual signal (e.g., "average")
  /**
   * Hard cap applied AFTER all sources (mode, page, hints, language) are combined for a single
   * message. May legitimately exceed 1.0 because priors can also add weight.
   * Only requirement: value must be ≥ 0.
   */
  maxPerMessage: number;
}

const DEFAULT_TIERS: ArchetypeBoostTiers = {
  high: 0.45,
  mid: 0.25,
  low: 0.1,
  maxPerMessage: 0.6,
};

// Clamp helper for tier values (0–1 range)
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function readTierValue(key: string, fallback: number): number {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) ? clamp01(raw) : fallback;
}

// Max cap may exceed 1.0; only guard against negatives / NaN
function readMaxValue(key: string, fallback: number): number {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

/**
 * Returns boost tiers, reading overrides from environment variables when present.
 *
 *   ARCHETYPE_BOOST_HIGH
 *   ARCHETYPE_BOOST_MID
 *   ARCHETYPE_BOOST_LOW
 *   ARCHETYPE_BOOST_MAX
 */
export function isTieredBoostsEnabled(): boolean {
  const v = (process.env.ENABLE_TIERED_ARCHETYPE_BOOSTS ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function getBoostTiers(): ArchetypeBoostTiers {
  return {
    high: readTierValue("ARCHETYPE_BOOST_HIGH", DEFAULT_TIERS.high),
    mid: readTierValue("ARCHETYPE_BOOST_MID", DEFAULT_TIERS.mid),
    low: readTierValue("ARCHETYPE_BOOST_LOW", DEFAULT_TIERS.low),
    maxPerMessage: readMaxValue("ARCHETYPE_BOOST_MAX", DEFAULT_TIERS.maxPerMessage),
  };
}
