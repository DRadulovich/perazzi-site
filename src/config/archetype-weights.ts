/**
 * Tiered boost defaults for archetype inference (Pass-5 framework).
 * Values are conservative; env vars can override for experimentation.
 */
export interface ArchetypeBoostTiers {
  high: number; // strong, unambiguous signal (e.g., "family heirloom")
  mid: number;  // moderate, supportive signal (e.g., "pre-shot routine")
  low: number;  // weak, contextual signal (e.g., "average")
  maxPerMessage: number; // cap per archetype per message
}

const DEFAULT_TIERS: ArchetypeBoostTiers = {
  high: 0.45,
  mid: 0.25,
  low: 0.10,
  maxPerMessage: 0.6,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function readEnvNumber(key: string, fallback: number): number {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) ? clamp(raw, 0, 1) : fallback;
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
  const high = readEnvNumber("ARCHETYPE_BOOST_HIGH", DEFAULT_TIERS.high);
  const mid = readEnvNumber("ARCHETYPE_BOOST_MID", DEFAULT_TIERS.mid);
  const low = readEnvNumber("ARCHETYPE_BOOST_LOW", DEFAULT_TIERS.low);
  const max = readEnvNumber("ARCHETYPE_BOOST_MAX", DEFAULT_TIERS.maxPerMessage);
  return { high, mid, low, maxPerMessage: max };
}
