# Archetype Analysis (Developer Guide)

Developer-facing documentation for the **Archetype Analysis** feature in PerazziGPT.

For a non-dev overview (what it does and how to evaluate outputs), see `README-ArchetypeAnalysis-Guide.md`.

---

## What Archetype Analysis is

Archetype Analysis is PerazziGPT’s internal personalization layer that estimates **what style of value** a user is seeking, represented as:
- An **archetype distribution vector** across five motivational archetypes.
- An optional **primary archetype** (only when confidence is high; otherwise `null`).

Archetype is a *hint*, not a label. It is used to change **structure, emphasis, and tone**—not facts.

Canonical types live in `src/types/perazzi-assistant.ts`.

---

## Non-negotiables (guardrails)

Archetype must never:
- Change factual claims or technical correctness.
- Change safety posture, refusals, or compliance rules.
- Change pricing policy (pricing remains guarded/blocked at the route level).
- Be asserted back to the user as an identity (“You are a Loyalist”, etc.).

Runtime enforcement is expressed both in brand docs (e.g. `V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/V2_audience-psychology-and-archetypes.md`) and in prompt guidance blocks inside the assistant route (`src/app/api/perazzi-assistant/route.ts`).

---

## Glossary

- **Archetypes**: `loyalist | prestige | analyst | achiever | legacy` (`src/types/perazzi-assistant.ts`).
- **Archetype vector**: normalized weights that usually sum ≈ 1 (e.g. `{ prestige: 0.28, analyst: 0.24, ... }`).
- **Primary archetype**: winner only when confidence is high; otherwise `null` (mixed/balanced).
- **Winner/runner-up margin**: `topScore - secondScore` used for snap gating.
- **Snapped vs mixed**:
  - *snapped*: margin ≥ `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`
  - *mixed/balanced*: margin < `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` (primary becomes `null`)
- **Mode**: high-level user state `prospect | owner | navigation` (chosen by `detectRetrievalHints`).
- **Intent / topic hints**: structured signals derived from the user question + context (e.g. `intents: ["models"]`, `topics: ["specs"]`).

---

## Where archetype is used (3 runtime layers)

Archetype influences runtime behavior in three bounded ways:

1) **Response structure (templates)**
   - Intent-based response templates can have per-archetype variants.
   - When `effectiveArchetype` is `null`, the system falls back to neutral intent templates.
   - Implementation: `src/lib/perazzi-intents.ts`.

2) **Retrieval reranking (soft bias)**
   - When reranking is enabled, candidates are fetched by embedding similarity and reranked with small additive boosts.
   - Archetype adds a bounded boost based on `context.archetypeVector` and each chunk’s `archetype_bias`.
   - Implementation: `src/lib/perazzi-retrieval.ts` (`computeArchetypeBoost`).

3) **Tone guidance (internal-only, confidence-gated)**
   - A short archetype guidance block is injected into the model instructions.
   - Applied only when confidence is high; neutral/mixed omits archetype tone guidance to prevent “clinging”.
   - Implementation: `src/app/api/perazzi-assistant/route.ts` (`buildArchetypeGuidanceBlock`).

---

## End-to-end data flow (assistant request → response)

Primary orchestration is in `src/app/api/perazzi-assistant/route.ts`:

1) **Request arrives** with optional `context.archetypeVector` (previous turn) and page/model context.
2) **Hints are computed** (`detectRetrievalHints`) for `mode`, `intents`, `topics`.
3) **Archetype breakdown is computed**:
   - `computeArchetypeBreakdown(ctx, previousVector, { useTieredBoosts })`
   - returns `{ primary, vector, signalsUsed?, reasoning? }`
   - Implementation: `src/lib/perazzi-archetypes.compute.ts` (+ `.signals.ts`, `.core.ts`).
4) **Effective archetype is chosen**:
   - `effectiveArchetype = devOverride ?? breakdown.primary ?? null`
5) **Templates are selected** based on `intents` + `effectiveArchetype`:
   - Implementation: `src/lib/perazzi-intents.ts`
6) **Retrieval uses the current-turn updated vector**:
   - route passes `context.archetypeVector = archetypeBreakdown.vector` into retrieval.
   - This prevents archetype influence from lagging by one message.
7) **Answer is generated** with the archetype guidance block (confidence-gated).
8) **Telemetry is logged** (archetype scores/margin/signals/templates/variant, etc.) for Insights.

---

## Implementation map (files you’ll touch)

### Core archetype engine
- Types: `src/types/perazzi-assistant.ts`
- Context + classification shape: `src/lib/perazzi-archetypes.types.ts`
- Compute breakdown: `src/lib/perazzi-archetypes.compute.ts`
- Signal extraction (language/mode/page/model/hints): `src/lib/perazzi-archetypes.signals.ts`
- Vector math + smoothing + confidence gating: `src/lib/perazzi-archetypes.core.ts`
- Canonical “scores” object and decision logging: `src/lib/perazzi-archetypes.classification.ts`
- Barrel export entry: `src/lib/perazzi-archetypes.ts`

### Lexicon + boost tiers
- Tiered lexicon (high/mid/low + negatives): `src/config/archetype-lexicon.ts`
- Tiered boost values + env overrides: `src/config/archetype-weights.ts`

### Assistant integration (templates, prompt, logging)
- Intent/topic detection + template selection: `src/lib/perazzi-intents.ts`
- Archetype tone guidance + orchestration: `src/app/api/perazzi-assistant/route.ts`
- DB logging + metadata sanitation: `src/lib/aiLogging.ts`

### Retrieval reranking & archetype bias
- Retrieval pipeline + `computeArchetypeBoost`: `src/lib/perazzi-retrieval.ts`
- Chunk schema field: `chunks.archetype_bias` (queried as `chunk_archetype_bias`)

### Analytics (Insights UI + SQL helpers)
- Admin UI: `src/app/admin/pgpt-insights/`
- Views/indices/alerts:
  - `sql/20251220_archetype_views.sql`
  - `sql/pgpt_archetype_scores_indexes.sql`
  - `sql/20251221_archetype_alert_refactor.sql`

### Internal evaluation docs (human grading)
- Rubric: `docs/ARCHETYPE-ANALYSIS/GRADING-RUBRIC/ARCHETYPE-ANALYSIS-GRADE-RUBRIC.md`
- Example output packs: `docs/ARCHETYPE-ANALYSIS/GRADING-RUBRIC/OUTPUT-TESTS/`
- Implementation notes (bridge doc): `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_archetype-implementation-notes.md`

---

## How inference works (classifier behavior)

`computeArchetypeBreakdown` combines multiple signal sources:

1) **Priors** (context-driven, low-trust)
   - Mode priors: `applyModeSignals` (e.g. prospect nudges prestige/analyst; owner nudges loyalist/legacy)
   - Page URL priors: `applyPageUrlSignals` (heritage/bespoke/technical/competition)
   - Model priors: `applyModelSignals` (rough mapping by model slug)

2) **Language signals** (higher-trust, message-driven)
   - Boundary-safe token and phrase matching against the lexicon.
   - Lexicon tiers map to boost tiers (high/mid/low).
   - Negatives can cancel boosts for ambiguous terms.
   - Implementation: `src/config/archetype-lexicon.ts`, `src/lib/perazzi-archetypes.signals.ts`

3) **Hint signals** (structured, derived)
   - `intents` and `topics` from `detectRetrievalHints` can add small nudges (e.g. `topics: ["specs"]` nudges Analyst).

4) **Priors are damped when language is strong**
   - If language evidence is strong, priors get scaled down to prevent “dragging” the profile.
   - Implementation: `computePriorScale` in `src/lib/perazzi-archetypes.core.ts`

5) **Caps + smoothing**
   - Per-message delta is capped (`ARCHETYPE_BOOST_MAX`).
   - Vector updates are smoothed across turns (`PERAZZI_SMOOTHING_FACTOR`).

6) **Confidence gating**
   - Primary archetype is set only if `margin >= PERAZZI_ARCHETYPE_CONFIDENCE_MIN`.

7) **Dev override**
   - A control phrase can override archetype for debugging:
     - `Please change my archetype to <Archetype>.`
   - A reset phrase clears the profile to neutral:
     - `Please clear your memory of my archetype.`
   - Implementation: `detectArchetypeOverridePhrase` / `detectArchetypeResetPhrase` in `src/app/api/perazzi-assistant/route.ts`

---

## Template selection (structure)

Templates are selected from intent guides, optionally with per-archetype variants:
- Base templates: `TEMPLATE_GUIDES` in `src/lib/perazzi-intents.ts`
- Archetype variants: `TEMPLATE_GUIDES_BY_ARCHETYPE` in `src/lib/perazzi-intents.ts`
- Fallback behavior: if no template matched but `topics` includes `models`, the `models` template is applied.

Important behavior:
- When archetype is mixed (`effectiveArchetype = null`), only neutral intent templates should apply.

---

## Retrieval reranking (archetype bias boost)

Archetype boost is intentionally small and bounded. Summary of `computeArchetypeBoost` (`src/lib/perazzi-retrieval.ts`):
- Inputs:
  - `context.archetypeVector` (normalized defensively)
  - `chunk.archetype_bias` (array of archetype keys; empty or “all 5” means “no bias”)
  - confidence margin (mixed vectors reduce or eliminate effect)
- Behavior:
  - Alignment = sum of user weights for the chunk’s biased archetypes
  - Specialization = higher when chunk is specific (1 archetype) vs broad (2–4 archetypes)
  - Confidence factor = scales down when the user profile is mixed
  - Final boost = `K * alignment * specialization * confidenceFactor`, bounded to a small range
- Knob:
  - `PERAZZI_ARCHETYPE_BOOST_K` (typical 0.05–0.15)

---

## Configuration (env knobs)

See `.env.example` for the authoritative list. The key Archetype Analysis knobs are:

### Confidence + smoothing
- `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` (default `0.08`)
- `PERAZZI_SMOOTHING_FACTOR` (default `0.75`)

### Tiered boost system (classification only)
- `ENABLE_TIERED_ARCHETYPE_BOOSTS` (default `false`)
- `ARCHETYPE_AB_PERCENT` (default `5`) — A/B bucketing into tiered boosts when the main toggle is off
- `ARCHETYPE_BOOST_HIGH` / `ARCHETYPE_BOOST_MID` / `ARCHETYPE_BOOST_LOW` (defaults `0.45/0.25/0.10`)
- `ARCHETYPE_BOOST_MAX` (default `0.6`) — per-archetype, per-message cap across all delta sources

### Retrieval archetype boost (rerank only)
- `PERAZZI_ENABLE_RERANK` (default `false`)
- `PERAZZI_ARCHETYPE_BOOST_K` (default `0.08`)

### Debugging
- `PERAZZI_ADMIN_DEBUG=true`
- `PERAZZI_ADMIN_DEBUG_TOKEN=<secret>`
- Request header: `x-perazzi-admin-debug: <token>`

---

## Observability (logging + Insights)

Telemetry is designed to support tuning without storing full prompts by default:
- Logging toggle: `PERAZZI_AI_LOGGING_ENABLED=true` (`src/lib/aiLogging.ts`)
- Text logging controls: `PERAZZI_LOG_TEXT_MODE` (`omitted|truncate|full`) and `PERAZZI_LOG_TEXT_MAX_CHARS`

Archetype-related fields commonly stored in metadata include:
- `archetype` / `archetypeScores` / `archetypeDecision`
- `archetypeWinner` / `archetypeRunnerUp` / `archetypeConfidenceMargin` / `archetypeSnapped`
- `signalsUsed` and selected `templates`
- `archetypeVariant` (`baseline` vs `tiered`)

SQL helpers for dashboards and alerting:
- Daily distribution + avg margin view: `sql/20251220_archetype_views.sql`
- JSONB indices for filtering: `sql/pgpt_archetype_scores_indexes.sql`
- Margin-drop alert + log table: `sql/20251221_archetype_alert_refactor.sql`

---

## Evaluation (how to grade output quality)

Use the rubric as the primary “quality contract”:
- `docs/ARCHETYPE-ANALYSIS/GRADING-RUBRIC/ARCHETYPE-ANALYSIS-GRADE-RUBRIC.md`

The rubric focuses on two simultaneous goals:
- **Core invariants** stay consistent across archetypes (same decision engine).
- **Archetype fidelity** is separable and recognizable (different wrapper, not different facts).

Example side-by-side output packs live in:
- `docs/ARCHETYPE-ANALYSIS/GRADING-RUBRIC/OUTPUT-TESTS/`

---

## Testing

Unit tests cover key mechanics:
- Archetype vector smoothing: `tests/lib/perazzi-archetypes.test.ts`
- Retrieval archetype boost behavior: `tests/lib/perazzi-retrieval-helpers.test.ts`
- API debug payload wiring: `tests/api/perazzi-assistant.test.ts`

Run tests:
- Full suite: `pnpm test`
- Single file: `pnpm test -- tests/lib/perazzi-retrieval-helpers.test.ts`

Additionally, a lightweight dev self-test runner executes in development:
- `src/lib/perazzi-archetypes.selftest.ts`

---

## Troubleshooting

Common failure modes and where to look:

- **Archetype “clings” when user is mixed**
  - Check snap threshold: `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`
  - Ensure mixed state omits tone guidance and uses neutral templates.

- **Archetype feels too weak / too strong**
  - Classification strength: adjust `ARCHETYPE_BOOST_*` and `ARCHETYPE_BOOST_MAX`
  - Retrieval bias strength: adjust `PERAZZI_ARCHETYPE_BOOST_K` (and confirm rerank is enabled)

- **Wrong archetype due to page/model priors**
  - Review mappings: `applyPageUrlSignals` / `applyModelSignals` in `src/lib/perazzi-archetypes.signals.ts`
  - Priors should be damped when language is strong (`computePriorScale`)

- **Low separability (all archetypes sound the same)**
  - Audit per-archetype template variants in `src/lib/perazzi-intents.ts`
  - Re-grade with “blind attribution” (rubric separability test)

- **Retrieval ordering regressions**
  - Confirm chunk `archetype_bias` tags exist and are not “all five”
  - Confirm `context.archetypeVector` is passed into retrieval (route already does this)

---

## Change management (safe workflow)

When changing archetype behavior:
1) Update only one surface at a time (lexicon, weights, template variants, priors, or retrieval K).
2) Re-run tests (`pnpm test`).
3) Re-grade a small, fixed prompt set using the rubric (core invariants + separability + contradiction scan).
4) If changing thresholds/knobs, update `.env.example` to keep defaults in sync.
