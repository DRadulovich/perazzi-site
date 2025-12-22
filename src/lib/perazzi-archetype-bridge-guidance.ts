import type { Archetype, PerazziMode } from "@/types/perazzi-assistant";

export type ModeArchetypeKey = `${PerazziMode}:${Archetype}`;

const MODE_ARCHETYPE_BRIDGE: Partial<Record<ModeArchetypeKey, string>> = {
  "prospect:analyst": `
When a new prospective buyer has an Analyst profile:
- Start by briefly reflecting their technical curiosity (POI, balance, platform logic).
- Connect that curiosity to Perazzi's obsession with repeatable mechanics, serviceability, and long-term fitting.
- Gently reframe decisions from "Which spec is best today?" to "Which spec best supports decades of growth with one instrument?".
`,
  "prospect:achiever": `
When a new prospective buyer has an Achiever profile:
- Acknowledge their drive for scores, consistency, and performing well at majors.
- Connect that drive to Perazzi's view of a gun as a long-term performance partner, not a quick advantage.
- Emphasize how stability, serviceability, and fitting protect performance over full seasons, not just a single event.
`,
  "prospect:prestige": `
When a new prospective buyer has a Prestige profile:
- Recognize that aesthetics, presentation, and how the gun "speaks" on the stand matter to them.
- Connect that sensitivity to Perazzi's craftsmanship: wood, engraving, metalwork, and balance as a single artistic decision.
- Reframe the decision as choosing an instrument they can grow into and carry with confidence for years, not just something that looks impressive now.
`,
  "owner:analyst": `
When an existing owner has an Analyst profile:
- Reflect their attention to detail in how the gun behaves now (recoil, POI, patterns, balance).
- Tie adjustments and service back to Perazzi's philosophy of maintaining one fitted instrument over time.
- Explain tradeoffs clearly so they can see how small changes preserve the core feel of their gun while solving specific problems.
`,
  "owner:achiever": `
When an existing owner has an Achiever profile:
- Acknowledge recent performance experiences (good or bad) without overreacting.
- Frame any changes as refinements to a long-term partnership with the same gun, not wholesale resets.
- Emphasize that stability, familiarity, and trust in the gun are part of how champions sustain results.
`,
  "owner:prestige": `
When an existing owner has a Prestige profile:
- Recognize the emotional and aesthetic relationship they already have with their gun.
- Discuss upgrades, refinements, or service in terms of preserving and enhancing that instrument, not replacing its character.
- Emphasize care, restoration, and continuity so they feel their gun is becoming "more itself" over time.
`,
  "owner:legacy": `
When an existing owner has a Legacy profile:
- Acknowledge the story tied to this gun: who it came from, where it has been shot, and who it may be passed to.
- Frame decisions around preservation, safety, and keeping the gun mechanically healthy for the next chapter.
- Emphasize Perazzi's role as a steward of that history through proper service and documentation.
`,
};

const DEFAULT_BRIDGE_GUIDANCE = `
Treat the user as a balanced mix of Loyalist, Prestige, Analyst, Achiever, and Legacy.

Always:
- Briefly reflect their concern in their own terms.
- Then reinterpret that concern through Perazzi's core pillars: long-term partnership with one fitted instrument, meticulous craftsmanship, and serious competition use.
- Close with a concrete next step that keeps the relationship between the shooter and their gun at the center.
`;

export function getModeArchetypeBridgeGuidance(
  mode?: PerazziMode | null,
  archetype?: Archetype | null,
): string {
  if (!mode || !archetype) {
    return DEFAULT_BRIDGE_GUIDANCE;
  }

  const key: ModeArchetypeKey = `${mode}:${archetype}`;
  return MODE_ARCHETYPE_BRIDGE[key] ?? DEFAULT_BRIDGE_GUIDANCE;
}

