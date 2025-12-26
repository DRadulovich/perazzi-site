## CODEX TASK CARD PASS

### 1) Section 3 — Objective

**Fix archetype inference reliability and add confidence gating** so PerazziGPT stops making “false-positive identity calls” (e.g., *broadcast → cast*) and only “snaps” to a primary archetype when the signal is strong enough. Also incorporate higher-quality signals (intents/topics) and reduce overpowered priors.

---

### 2) Repo touchpoints (files + key functions/classes)

**Primary**

* `src/lib/perazzi-archetypes.ts`

  * `messageIncludesAny(` (substring matching to replace with token/boundary logic)
  * `computeArchetypeBreakdown()` and/or `buildArchetypeClassification()` (where “primary” is decided and vector is produced)
  * Prior logic (mode/page/model priors) — we’ll locate by searching for `prior`, `mode`, `page`, `model`, `bias`, `weights`, or constants/maps.

**Wiring / propagation**

* `src/app/api/perazzi-assistant/route.ts`

  * Where `ArchetypeContext` is constructed
  * Where `effectiveArchetype` is chosen for prompt tone (must allow `null` when confidence is low)
  * Where `hints` are computed (to pass `hints.intents` and `hints.topics` into archetype scoring)

**Types (likely touched)**

* `src/types/perazzi-assistant.ts` (or wherever `Archetype`, `ArchetypeVector`, and `ArchetypeContext` are defined)

---

### 3) Proposed Task Cards (do NOT write the full cards yet)

**Card count: 5**

#### Card #1 — Fix false positives: replace substring matching with token/boundary matching

**Scope**

* Replace `includes()` logic in `messageIncludesAny()` with:

  * tokenization (`[a-z0-9']+`) → token set
  * single-word match via token membership
  * multi-word phrase match via `includes()` (only for phrases with whitespace)
* Keep behavior deterministic and case-insensitive.
* Add a few “known-bad” regression cases.

**Files to touch**

* `src/lib/perazzi-archetypes.ts`

**Acceptance criteria**

* “broadcast” does **not** match “cast”.
* “casting” does **not** match “cast” unless “cast” is a token on its own.
* Multi-word phrase like “point of impact” still matches when present in the message.
* No new runtime errors; function returns stable boolean outputs.

**Test notes**

* Add lightweight unit-ish checks (either a tiny test block if the repo has tests, or a dev-only self-check snippet removed before commit).
* Also validate against 2–3 baseline prompts from `ZR1-baseline-examples.md`.

**Dependencies**

* None.

---

#### Card #2 — Add “snap gating”: compute confidence margin and allow `primary = null`

**Scope**

* Compute winner and runner-up from the resulting archetype vector.
* If `winner - runnerUp < PERAZZI_ARCHETYPE_CONFIDENCE_MIN`:

  * set `primary = null`
  * **keep the vector** unchanged/returned (soft signal still used for rerank weighting)
* Ensure the threshold read is consistent (env var, fallback default).

**Files to touch**

* `src/lib/perazzi-archetypes.ts`
* (Possibly) `src/types/perazzi-assistant.ts` (if types currently require `primary: Archetype`)

**Acceptance criteria**

* For a mixed/flat vector (margin below threshold), `primary` becomes `null`.
* For a strong vector (clear winner), `primary` remains a concrete archetype.
* Vector still sums to ~1 (or remains in the same normalized format your system already expects).
* No behavior change to guardrails; only classification output changes.

**Test notes**

* Create 2–3 controlled examples that force:

  * a mixed vector
  * a strong “analyst” vector
* Confirm `primary` follows threshold rules.

**Dependencies**

* Card #1 recommended first (reduces noisy keyword matches that can distort confidence).

---

#### Card #3 — Propagate `primary=null` through the API route (effectiveArchetype may be null)

**Scope**

* Update `route.ts` so that when archetype confidence is low and classification returns `primary=null`:

  * `effectiveArchetype` used for tone guidance can be `null`
  * prompt assembly should omit “Additional tone guidance…” when `effectiveArchetype` is null
* Ensure this works even when `body.context` is missing.
* Keep returned API response shape the same (no new required fields).

**Files to touch**

* `src/app/api/perazzi-assistant/route.ts`

**Acceptance criteria**

* When `primary=null`, system prompt does **not** apply archetype tone guidance.
* When `primary` is set, tone guidance still applies as before.
* No schema / response contract changes; no runtime errors if `body.context` is absent.

**Test notes**

* Run one “strong analyst” prompt and confirm archetype tone is applied.
* Run one mixed/neutral prompt and confirm tone defaults neutral (and does not cling to prior archetype).

**Dependencies**

* Card #2.

---

#### Card #4 — Reduce non-identity priors: make priors conditional (near-neutral) or lower-weight than language signals

**Scope**

* Identify where mode/page/model priors are applied in `perazzi-archetypes.ts`.
* Modify weighting so priors:

  * apply strongly only when language evidence is weak / vector near-neutral
  * otherwise are damped (language/behavior signals dominate)
* Keep changes small and measurable (adjust weights, don’t rewrite the whole engine).

**Files to touch**

* `src/lib/perazzi-archetypes.ts`

**Acceptance criteria**

* A message with strong archetype language signals overrides priors (does not get “dragged” by mode/page/model).
* A vague/short message (near-neutral evidence) can still be gently guided by priors.
* Snap gating still behaves predictably (priors shouldn’t cause random snap unless evidence supports it).

**Test notes**

* Use two prompts:

  * one strong analyst/achiever signal phrase set
  * one vague “tell me about Perazzi” prompt
* Compare outputs with priors present vs reduced (expect: priors matter mostly in the vague case).

**Dependencies**

* Card #2 (we’ll likely use the same margin/neutrality signal to scale priors).

---

#### Card #5 — Add intent/topic signals to archetype scoring (wire `hints.intents` + `hints.topics`)

**Scope**

* Extend `ArchetypeContext` to include:

  * `intents?: string[]`
  * `topics?: string[]`
* Wire these fields in `route.ts` when creating archetype context (from `detectRetrievalHints()` output).
* Add small, controlled scoring contributions from intents/topics (low weight, additive).

  * Example: analyst-ish topics (POI/patterning/fit/ballistics) gently boost analyst
  * prestige-ish topics (engraving/bespoke) gently boost prestige
  * legacy-ish topics (history/stewardship) gently boost legacy
* Ensure these do not override direct language signals.

**Files to touch**

* `src/lib/perazzi-archetypes.ts`
* `src/app/api/perazzi-assistant/route.ts`
* `src/types/perazzi-assistant.ts` (or wherever `ArchetypeContext` lives)

**Acceptance criteria**

* When hints include relevant intents/topics, archetype vector reflects a small shift in the expected direction.
* These hints do not cause snap on their own unless combined with enough language evidence (i.e., still respects `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` gating).
* No crashes if `hints` are missing or empty.

**Test notes**

* Use a prompt that reliably produces a known intent/topic set and confirm the vector shifts slightly in the expected direction.
* Confirm “broadcast/cast” style false positives stay fixed (Card #1 regression).

**Dependencies**

* Card #2 (snap gating)
* Card #3 recommended (so `primary=null` doesn’t incorrectly keep tone)
* Requires that `detectRetrievalHints()` already produces `intents` and `topics` (it should).

---

### 4) External / Manual Tasks (outside the repo)

* **Env var:** Ensure `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` is set consistently across local + staging/prod (default you’ve been using is fine; tuning comes later).
* **No DB/Supabase changes** in this phase.
* **No re-ingest required** for this phase.

---

### 5) Risks & gotchas (short)

* Tokenization can **reduce sensitivity** if your keyword lists rely on substring behavior; we’ll compensate by being explicit about single-word vs phrase matching.
* Snap gating can make the system feel “less personalized” if the threshold is too high (we’ll keep vector and only suppress the *label*).
* Priors dampening might change archetype drift behavior in subtle ways; we’ll use your baseline harness to validate.

---

### 6) Ready to write Task Cards checklist

Before generating Card #1:

* `src/lib/perazzi-archetypes.ts` contains `messageIncludesAny(` and the archetype scoring path (`computeArchetypeBreakdown` / `buildArchetypeClassification`) we’ll modify.
* We know where `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` is currently read (or we’ll add a consistent read with a safe default).
* `route.ts` has a clear `effectiveArchetype` selection point for tone guidance.
* You can run local prompts from `ZR1-baseline-examples.md` to verify regressions quickly.

(Stop here. When you say **“Create Task Card #1”**, I’ll write the full detailed Codex Task Card for Card #1 only.)
