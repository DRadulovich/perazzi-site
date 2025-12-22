# PerazziGPT v2 – Archetype Implementation Notes

> Version: 0.1 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_archetype-implementation-notes.md`  
> Related docs:  
> • `V2_REDO_assistant-spec.md` (canonical definitions)  
> • `V2_REDO_voice-calibration.md` (tone guidance)  
> • `V2_REDO_rerank-algorithm.md` (runtime boost logic)  
> • Code: `src/config/*archetype*` & `src/lib/perazzi-archetypes.*`

This file bridges **brand-level archetype theory** (Assistant-spec §4) and the **code artefacts** that operationalise it.
It is *internal documentation*—not surfaced to users nor injected into prompts.

---

## 1  Source of Truth recap

| Layer | Purpose | Authoritative Location |
|-------|---------|------------------------|
| Marketing definition | Names, motivations, do/don’t | `V2_REDO_assistant-spec.md` §4 |
| Tone & phrasing nuance | Voice tweaks per archetype | `V2_REDO_voice-calibration.md` §5 |
| Runtime weight vector | Numerical guess 0–1 per archetype | `src/lib/perazzi-archetypes.classification.ts` |
| Retrieval bias | Small score boost for chunks labelled with matching biases | `src/lib/perazzi-retrieval.ts` (`computeArchetypeBoost`) |
| Telemetry | Winner, vector, margin stored in logs | `perazzi_conversation_logs` (Phase-3 observability) |

Brand docs should **never** change facts; vectors only influence ordering & tone.

---

## 2  Lexicon mapping (text → archetype signal)

Code file `src/config/archetype-lexicon.ts` contains arrays of keyword stems per archetype.  
Example (partial):

```ts
export const LEXICON: Record<Archetype, string[]> = {
  loyalist: ["heritage", "tradition", "authentic", "made in italy"],
  prestige: ["curated", "bespoke", "atelier", "exclusive"],
  analyst:  ["tolerance", "patterning", "poi", "mass moment"],
  achiever: ["milestone", "personal best", "training plan"],
  legacy:  ["heirloom", "generations", "family", "story"]
};
```

**How it is used**  (`perazzi-archetypes.classification.ts`):
1. Lower-case the latest user/assistant messages.  
2. Count matches per archetype list.  
3. Convert counts → soft vector (normalised).  
4. Smooth with previous vector (session memory) using exponential decay.  
5. Return `{ vector, primary, margin }` where
   * *primary* has highest weight **and** `margin ≥ ARCHETYPE_CONF_MIN` (env, default 0.08).  
   * else `primary = null` (mixed/balanced).

> Governance: when Marketing adds or removes key phrases, update the lexicon **and** bump version in this doc.

---

## 3  File overview & edit rules

| File | Role | Edit guidelines |
|------|------|-----------------|
| `src/config/archetype-lexicon.ts` | Keyword lists | • Keep ≤ ~40 terms per archetype to avoid over-bias  
• Use lower-case stems without punctuation  
• Update alongside brand writers; record change in Changelog §7 |
| `src/config/archetype-weights.ts` | Default neutral vector | • Must sum to 1  
• Usually 0.20 each unless research suggests skew  |
| `src/lib/perazzi-archetypes.classification.ts` | Runtime classifier | • Algorithm tweaks require validation (accuracy vs false-positive)  
• Update `V2_REDO_validation.md` archetype tests |
| `src/lib/perazzi-retrieval.ts` (`computeArchetypeBoost`) | Retrieval nudge | • Keep `K` small (see rerank doc)  
• Any new bias fields in chunks need matching logic here |

---

## 4  Guardrails & responsibilities

• **No exposure of archetype names** in user replies—tone only.  
• Archetype can *never* alter safety guidance, pricing policy, or factual accuracy.  
• Confidence gating must remain: mixed/balanced state → neutral templates.

If code changes risk violating these rules the PR must tag both *Brand* and *Safety* reviewers.

---

## 5  Validation hooks

`V2_REDO_validation.md` now includes:
1. Natural-signal prompts that should pick a *snapped* archetype.  
2. Mixed/balanced prompt ensuring neutral template.  
3. Retrieval ordering test showing archetype bias does **not** surface wrong categories.

Running `pnpm test:validation` locally or in CI must pass before merging archetype-related changes.

---

## 6  Change-management checklist

1. Update lexicon → bump this doc to next 0.x and note in system-manifest changelog.  
2. Run validation suite (archetype & voice segments).  
3. If classification thresholds (`ARCHETYPE_CONF_MIN`) change, also update:  
   • `V2_REDO_rerank-algorithm.md`  
   • `.env.example`  
4. Add new chunk bias tags only via **source-corpus** + **chunking-guidelines** PR, then re-ingest.

---

## 7  Changelog

*0.1 (Draft)* – Initial mapping of code artefacts (lexicon, weights, classifier, retrieval boost) to Phase-1 archetype framework (May 2025).
