## PHASE 0 — Initial high‑altitude analysis

### A) End goal (restated)

You’re rebuilding PerazziGPT’s “Archetype Analysis” so it stops being mostly *a tone filter* and becomes a real *decision engine* for relevance and structure.

Concretely: the user’s evolving archetype profile (the persisted `archetypeVector`) should (1) change **what knowledge gets retrieved and prioritized** via metadata-aware reranking, (2) change **how answers are structured** via archetype-aware templates, (3) only apply archetype influence when it’s **confident enough** (confidence gating), and (4) keep **mode** consistent across turns so the system isn’t arguing with itself.

---

### B) Current system behavior vs target behavior

**What the repo is doing now (verified in code):**

* **Archetype exists and persists across turns** (`context.archetypeVector` is sent by the client; server computes `archetypeBreakdown` and returns it).

  * Server supports dev phrases: “Please change my archetype to …” and “Please clear your memory of my archetype.” (`src/app/api/perazzi-assistant/route.ts`)
* **Archetype affects tone** via the system prompt (“Additional tone guidance for this archetype…”). (`buildSystemPrompt` in `src/app/api/perazzi-assistant/route.ts`)
* **Retrieval is plain top‑N embedding similarity** (vector search returns `limit` rows ordered by distance; no reranking). (`fetchV2Chunks` in `src/lib/perazzi-retrieval.ts`)
* **Hints/topics/templates exist** and are used to add “response structure guidelines” to the prompt, but they **do not steer retrieval** today.

  * `detectRetrievalHints()` returns `{ intents, topics, focusEntities, keywords }` (no mode). (`src/lib/perazzi-intents.ts`)
* **Backend currently expects `hints.mode`** (`const effectiveMode = hints?.mode ?? context.mode ?? "prospect"`), but `detectRetrievalHints()` **does not produce `mode`**. (`src/app/api/perazzi-assistant/route.ts`)
* **Guardrails exist and fire before retrieval** (pricing/legal/competitor/gunsmithing blocks appear to be enforced via `detectBlockedIntent`). (`src/app/api/perazzi-assistant/route.ts`)
* **Low-confidence gating exists for retrieval**: if `retrieval.maxScore < PERAZZI_LOW_CONF_THRESHOLD`, it returns the low-confidence message and no citations. (`src/app/api/perazzi-assistant/route.ts`)
* **Feature flags for ZR1 already exist in `.env.example`** (good):
  `PERAZZI_ENABLE_RERANK`, `PERAZZI_RERANK_CANDIDATE_LIMIT`, `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`, `PERAZZI_ENABLE_RETRIEVAL_DEBUG`. (`.env.example`)
* **Potential config mismatch to watch:** retrieval SQL is hard-coded to `halfvec(3072)` while `.env.example` shows `PGVECTOR_DIM=1536`. That’s a “break your embeddings silently / loudly” kind of mismatch that we’ll treat as a critical dependency.

**Target behavior (ZR1):**

* Retrieval becomes a 2-stage pipeline:

  1. pull top‑K candidates by embedding similarity
  2. rerank with metadata + hints + **archetype alignment** → return top‑N final
* Archetype becomes *conditional power*:

  * if archetype confidence is low/mixed, it should **not** meaningfully bias retrieval or templates
* Mode becomes coherent:

  * the backend and client agree what “mode” is, and the chosen mode persists across turns
* Templates become archetype-aware **without labeling the user**:

  * the user never sees “you are an Analyst”, but the structure shifts accordingly

---

### C) Master Task Card Inventory (whole roadmap)

Below is the “inventory map” for the entire roadmap, broken into small, surgical cards. Counts are estimates; we’ll refine per section once you paste it.

#### Phase 1 — Preparation checklist

**Estimated cards: 3**

1. **Create ZR1 working branch + safety baseline notes**
2. **Confirm feature flags + local env wiring** (flags already exist in `.env.example`, so this becomes “verify + document + wire into Vercel preview/staging”)
3. **Create baseline prompt harness doc** (`docs/ARCHETYPE-ANALYSIS/ZR1-baseline-examples.md`) and capture “before” outputs

**Risk level:** Low (process/doc), but sets you up to not get lost.

---

#### Phase 2 — Retrieval reranking (largest horsepower gain)

**Estimated cards: 7 (highest risk phase)**

1. **Add rerank toggles into retrieval pipeline** (read flags, choose candidateLimit, keep existing behavior when off)
2. **Expand retrieval SQL to fetch candidateLimit + required metadata fields** (documents + chunks jsonb columns)
3. **Add robust JSONB parsing/normalization helpers** (string/array/null handling; lowercasing)
4. **Implement `computeBoostV2()` using *real selected columns*** (topics/platform/discipline/entity/keyword logic)
5. **Implement `computeArchetypeBoost()`** (alignment × specialization × confidenceFactor)
6. **Rerank candidates → return top CHUNK_LIMIT with `baseScore` and `score`**
7. **Add retrieval debug logging behind `PERAZZI_ENABLE_RETRIEVAL_DEBUG` + tests**

**Risk level:** High
Why: it changes what knowledge is surfaced, can accidentally up-rank restricted content if filters are wrong, and can affect latency/cost.

---

#### Phase 3 — Archetype inference reliability + confidence gating

**Estimated cards: 4 (medium-high risk)**

1. **Fix false positives by replacing naive substring matching** (token/boundary matching for single words; phrase logic for multi-word)
2. **Compute archetype confidence margin + “snap” gating** (use `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`)
3. **Adjust priors so they don’t dominate** (especially near-neutral vectors)
4. **Optionally: incorporate intent/topic signals into archetype scoring** (requires wiring hints into `ArchetypeContext`)

**Risk level:** Medium-high
Why: small heuristic changes can “flip” archetypes unexpectedly and cause whiplash or blandness if gating is too strict.

---

#### Phase 4 — Mode inference + consistency

**Estimated cards: 4 (medium risk)**

1. **Resolve `hints.mode` mismatch** (either add `mode` to `RetrievalHints`, or remove that expectation and centralize mode inference in `route.ts`)
2. **Sanitize/normalize mode on the server** (ensure only supported backend modes flow into prompts and archetype logic)
3. **Persist returned mode into the client context** (so next turn uses server’s chosen mode)
4. **Handle `"heritage"` mode in UI** (map to backend-supported mode or separate “page category” from “mode”)

**Risk level:** Medium
Why: mode touches prompt behavior, templates, and archetype signals; inconsistency causes “assistant feels random.”

---

#### Phase 5 — Archetype-aware templates (structure, not just tone)

**Estimated cards: 3 (medium risk)**

1. **Extend templates to be archetype-aware** (nested map or composite keys)
2. **Confidence gating for templates** (low confidence → neutral templates)
3. **Wire template selection cleanly into prompt assembly** (ensure no user labeling; keep guardrails intact)

**Risk level:** Medium
Why: big “feel” impact; easy to overdo and create repetitive formatting.

---

#### Phase 6 — Fix client reset bug (“null doesn’t clear archetype label”)

**Estimated cards: 2 (low-medium risk)**

1. **Fix null-handling when applying server response meta** (`undefined` should fall back; `null` should clear)
2. **Ensure reset clears localStorage state correctly** (no stale rehydration)

**Risk level:** Low-medium
Why: localized, but user-facing and trust-impacting (“I reset but you didn’t listen”).

---

#### Phase 7 — Logging upgrades for tuning

**Estimated cards: 2 (low-medium risk)**

1. **Log rerank metrics** in `metadata` (candidateLimit, scoring breakdown for returned chunks)
2. **Log archetype confidence + snap decision** (margin, winner/runner-up, snapped boolean)

**Risk level:** Low-medium
Why: changes data shape; must not break DB insert.

---

#### Phase 8 — Tuning loop

**Estimated cards: 1 (process + maybe small tooling)**

1. **Create QA/tuning workflow doc** (how to label interactions and tune weights in order)

**Risk level:** Low (mostly process).

---

#### Phase 9 — Rollout plan

**Estimated cards: 1 (process)**

1. **Rollout checklist** (staging enablement, partial rollout strategy, guardrail regression checks)

**Risk level:** Low.

---

### Highest risk phases (and why)

1. **Phase 2 (Retrieval reranking):** can change factual grounding and can unintentionally elevate content that should remain hidden unless filters are perfect. Also impacts latency.
2. **Phase 3 (Archetype confidence gating):** can cause “personality drift” or overly-neutral responses if thresholds are wrong.
3. **Phase 5 (Templates):** high “feel” impact; risk of making responses formulaic or too performative.

---

### D) Critical Dependencies

#### Feature flags / env vars

Already present in `.env.example` (good):

* `PERAZZI_ENABLE_RERANK` (default false)
* `PERAZZI_RERANK_CANDIDATE_LIMIT`
* `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`
* `PERAZZI_ENABLE_RETRIEVAL_DEBUG`
  Also relevant:
* `DATABASE_URL`, `PGSSL_MODE`
* `PERAZZI_EMBED_MODEL`, `PERAZZI_COMPLETIONS_MODEL`
* `PERAZZI_RETRIEVAL_LIMIT`, `PERAZZI_LOW_CONF_THRESHOLD`
* `PERAZZI_AI_LOGGING_ENABLED`, `PERAZZI_ENABLE_FILE_LOG`

#### DB schema fields needed (must be confirmed before we touch SQL)

Roadmap claims these exist as jsonb:

* `public.chunks.section_labels`, `primary_modes`, `archetype_bias`
* `public.documents.disciplines`, `platforms`, `audiences`, `tags`
  But: I attempted common repo locations (`sql/schema.sql`, `sql/README.md`, `sql/migrations/schema.sql`, `sql/schema-v2.sql`) and they were **not present** at those paths. So we’ll treat “locate schema source of truth” as a prerequisite task (either it exists elsewhere in-repo, or you’ll supply the schema snapshot / Supabase migration source).

#### Embedding dimensionality must match everywhere

* Retrieval SQL is casting to `halfvec(3072)` in `src/lib/perazzi-retrieval.ts`, strongly implying a 3072-dim embedding pipeline.
* `.env.example` shows `PGVECTOR_DIM=1536` as an example.
  We must reconcile this early (otherwise ingestion/retrieval will be inconsistent or fail).

#### Ingestion requirements

Reranking only works if ingestion reliably populates:

* document-level arrays (platforms/disciplines/audiences/tags)
* chunk-level jsonb (primary_modes/archetype_bias/section_labels/etc)
  If these are missing or messy, reranking becomes noise.

#### UI implications

Client must:

* send back `context.mode`, `context.archetype`, `context.archetypeVector` each turn
* correctly *clear* archetype + vector on reset
* persist *server-chosen* mode across turns (otherwise mode inference work is wasted)

---

### E) Test & Validation Plan

#### After each phase, what to test locally

**Baseline harness (starts in Phase 1 and stays forever):**

* Run the 10 baseline prompts after every phase.
* Capture: retrieved citations, response structure, guardrail behavior, and whether the “feel” moved in the intended direction.

**Phase 2 (reranking):**

* With `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true`, verify logs show:

  * candidateLimit count
  * scoring breakdown (baseScore/boost/archetypeBoost/finalScore)
  * top chunk IDs change when you change `archetypeVector`
* With `PERAZZI_ENABLE_RERANK=false`, confirm behavior matches “before” (same top-N retrieval pattern).

**Phase 3 (archetype inference):**

* Unit test the token/boundary matcher:

  * “broadcast” must not trigger “cast”
  * multi-word phrases still match
* Verify confidence gating:

  * “mixed” conversations do not snap to a hard archetype
  * strong-signal conversations do snap consistently across turns

**Phase 4 (mode):**

* Confirm mode does not bounce:

  * server returns mode
  * client uses that mode on next request
* Confirm `"heritage"` doesn’t break backend mode expectations.

**Phase 5 (templates):**

* Confirm structure changes per archetype, but:

  * no “you are X” labeling
  * tone changes do not change factual safety/guardrails

**Phase 6 (client reset):**

* Send reset phrase → next message must:

  * have `archetype === null`
  * have `archetypeVector === null` (or neutral, depending on design)
  * not resurrect prior archetype from localStorage

**Phase 7 (logging):**

* With `PERAZZI_AI_LOGGING_ENABLED=true`, verify DB rows insert successfully and metadata contains rerank + confidence fields.

#### Commands / observability hooks you’ll use

From `package.json`:

* `pnpm dev`
* `pnpm test`
* ingestion commands exist: `pnpm ingest:v2`, `pnpm ingest:v2:full`, `pnpm ingest:v2:dry-run`

Logs/metrics to watch:

* Server console logs from `logInteraction()` (and optional file log in `tmp/logs/perazzi-conversations.ndjson`)
* DB insert errors from `logAiInteraction`
* Response latency for `/api/perazzi-assistant` (reranking increases work)

#### Fast regression detection

Every phase, re-run a “guardrail smoke set”:

* pricing question (should refuse)
* competitor-bashing question (should refuse/redirect)
* gunsmithing / dangerous instruction (should refuse)
  If any of these weaken, we stop and fix immediately.

---

When you paste the **first roadmap section (Phase 1 / Preparation checklist)**, I’ll return a **CODEX TASK CARD PASS** for that section in the exact structure you specified.
