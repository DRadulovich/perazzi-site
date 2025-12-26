## CODEX TASK CARD PASS

### 1) Section 2 — Retrieval reranking Objective

Upgrade retrieval from “top‑12 nearest embeddings” to a **two‑stage pipeline**:

1. Fetch top **candidateLimit** by embedding similarity
2. **Rerank** candidates using: hints/topics/entities/keywords + mode alignment (`chunks.primary_modes`) + doc/chunk metadata alignment (platforms/disciplines/audiences/tags) + archetype alignment (`chunks.archetype_bias` × user `archetypeVector`)
3. Return top **CHUNK_LIMIT (12)** reranked

This will be shipped **behind `PERAZZI_ENABLE_RERANK`** and tuned using **feature‑flagged retrieval debug logs**. ([GitHub][1])

---

### 2) Repo touchpoints

**Core**

* `src/lib/perazzi-retrieval.ts`

  * `retrievePerazziContext()` (entry point called by the API route today) ([GitHub][1])
  * `fetchV2Chunks()` (currently does the SQL + returns “closest embeddings” only) ([GitHub][1])
  * Existing `computeBoost()` is **v1-shaped** (expects `metadata.topics`, `metadata.platform_tags`, etc.) and is **not used** by `fetchV2Chunks()` today — we will add a schema-aligned `computeBoostV2()` instead. ([GitHub][1])

**Call site / consistency**

* `src/app/api/perazzi-assistant/route.ts`

  * Calls `retrievePerazziContext(fullBody, hints)` today. ([GitHub][2])
  * Computes `archetypeBreakdown.vector` and `effectiveMode` in the same request; we should feed those into retrieval so reranking isn’t “one turn behind.” ([GitHub][2])

**Schema truth source**

* `docs/ARCHETYPE-ANALYSIS/SUPABASE/schema.sql` confirms the exact jsonb columns we need:

  * `public.chunks.primary_modes`, `archetype_bias`, `section_labels`, `disciplines`, `platforms`, `audiences`, `context_tags`, `related_entities`, `guardrail_flags`, etc. ([GitHub][3])
  * `public.documents.disciplines`, `platforms`, `audiences`, `tags`, plus `pricing_sensitive`, `visibility`, `confidentiality`. ([GitHub][3])
  * Embeddings live in `public.embeddings.embedding vector(3072)` (and the query already casts to `halfvec(3072)`). ([GitHub][3])

---

### 3) Proposed Task Cards (do NOT write full cards yet)

**Card count: 7**

#### Card #1 — Expand `fetchV2Chunks()` to fetch candidateLimit + required metadata (filters intact)

**Scope**

* Add a `candidateLimit` parameter (separate from final `limit` / CHUNK_LIMIT).
* Expand SQL `SELECT` to include rerank metadata from:

  * `chunks`: `primary_modes`, `archetype_bias`, `section_labels`, `disciplines`, `platforms`, `audiences`, `context_tags`, `related_entities`, `guardrail_flags`, `confidentiality`, `visibility`
  * `documents`: `disciplines`, `platforms`, `audiences`, `tags`, `pricing_sensitive`, `visibility`, `confidentiality`, `guardrail_flags`
* Keep current safety filters and **tighten** them where safe:

  * keep: `d.status='active'` and `coalesce(c.visibility,'public')='public'`
  * add: `coalesce(d.visibility,'public')='public'`
  * add (recommended): `coalesce(d.confidentiality,'normal')='normal'` and `coalesce(c.confidentiality,'normal')='normal'`
* Return **internal candidate rows** (not final `RetrievedChunk[]`) so later steps can score with metadata.

**Files to touch**

* `src/lib/perazzi-retrieval.ts`

**Acceptance criteria**

* `fetchV2Chunks()` accepts `candidateLimit` and SQL returns `<= candidateLimit` rows ordered by distance asc.
* The returned rows include the new columns (at least `primary_modes`, `archetype_bias`, doc/chunk platforms/disciplines).
* Existing filters remain (active + public), plus doc visibility filter is enforced.
* No TypeScript errors; `retrievePerazziContext()` still runs with rerank disabled.

**Test notes**

* Locally call the assistant once and temporarily log `Object.keys(rows[0])` behind the debug flag to confirm the column set (then remove).
* Verify no runtime crash when DB returns jsonb fields as objects/arrays.

**Dependencies**

* None (must be first).

---

#### Card #2 — Add JSONB normalization helpers (arrays + entity IDs)

**Scope**

* Implement `parseJsonbStringArray(value: unknown): string[]`

  * Accepts PG jsonb coming back as: array, object, stringified JSON, null
  * Returns normalized `string[]` (lowercased, trimmed, de-duped)
* Implement `extractRelatedEntityIds(value: unknown): string[]`

  * Handles related entity shapes like:

    * `["mx8","hts"]`
    * `[{"entity_id":"mx8"}]`
    * `[{"slug":"mx8"}]`
* Add small helper(s) like `normalizeToken(s: unknown): string | null`

**Files to touch**

* `src/lib/perazzi-retrieval.ts` (keep it in-file for now to stay surgical)

**Acceptance criteria**

* `parseJsonbStringArray(null/undefined)` returns `[]` and never throws.
* `parseJsonbStringArray(["Owner","Prospect"])` → `["owner","prospect"]`.
* `parseJsonbStringArray('["owner","prospect"]')` → `["owner","prospect"]`.
* `extractRelatedEntityIds()` returns stable, lowercase IDs for all supported shapes.

**Test notes**

* Add a tiny local “dev-only self-test” block guarded by `NODE_ENV === "development"` (or add unit tests if the repo already has a test runner wired).

**Dependencies**

* None (but will be used by Cards #3–#5).

---

#### Card #3 — Implement `computeBoostV2()` aligned to ZR1 schema

**Scope**

* Add `computeBoostV2(candidateRow, context, hints): number` that uses **real columns** now available from Card #1.
* Boost logic (small, additive; tune later):

  * Mode alignment via `chunks.primary_modes` (e.g., +0.03…+0.08)
  * Platform alignment via doc/chunk `platforms` and hint topics `platform_*` (+0.05…+0.12)
  * Discipline alignment via doc/chunk `disciplines` and hint topics `discipline_*` (+0.03…+0.08)
  * Strong entity match via `related_entities` vs `hints.focusEntities` (+0.10…+0.20)
  * Keyword match in `documents.path`, `documents.title`, `chunks.heading_path`, `section_labels`, `context_tags` (+0.02…+0.06)
* Keep existing `computeBoost()` unchanged (we’re not trying to “fix v1”; we’re adding v2).

**Files to touch**

* `src/lib/perazzi-retrieval.ts`

**Acceptance criteria**

* `computeBoostV2()` never returns `NaN` (always finite).
* Returns `0` when there are no matches.
* Entity match boost > keyword boost (so it behaves like a ranking signal, not random noise).
* Platform + mode boosts only apply when those values are present and normalized matches exist.

**Test notes**

* Manually call `computeBoostV2()` with a mocked candidate row + hints object in a quick dev snippet.
* Verify boosts stay within a sane envelope (e.g., roughly `0..0.35`).

**Dependencies**

* Card #2 (helpers), Card #1 (row includes fields).

---

#### Card #4 — Implement `computeArchetypeBoost()` (alignment × specialization × confidenceFactor)

**Scope**

* Add `computeArchetypeBoost(userVector, chunkArchetypeBiasJsonb): number`
* Parse `chunks.archetype_bias` into `string[]` of archetype keys.
* Behavior rules:

  * If bias is empty OR contains all five archetypes → boost = 0
  * `alignment = sum(userVector[a]) for a in bias`
  * `specialization = 1 - (bias.length / 5)`
  * `confidenceFactor = clamp(margin / PERAZZI_ARCHETYPE_CONFIDENCE_MIN, 0, 1)`
    where `margin = best(userVector) - secondBest(userVector)` (computed locally from the vector)
  * `boost = K * alignment * specialization * confidenceFactor`, start `K = 0.08`

**Files to touch**

* `src/lib/perazzi-retrieval.ts`

**Acceptance criteria**

* Bias `[]` → `0`; bias with 5 items → `0`.
* With a peaked vector (e.g., analyst-dominant), bias `["analyst"]` > bias `["legacy"]`.
* With neutral vector, archetypeBoost is small and doesn’t dominate.
* Never returns `NaN` and never throws on weird jsonb shapes.

**Test notes**

* Hardcode a few vectors + biases in a dev snippet and print outputs (dev-only).
* Later tuning will use retrieval debug logs (Card #6).

**Dependencies**

* Card #2 (parsing), Card #1 (bias column present).

---

#### Card #5 — Wire two-stage retrieval + reranking behind `PERAZZI_ENABLE_RERANK`

**Scope**

* Read env vars:

  * `PERAZZI_ENABLE_RERANK`
  * `PERAZZI_RERANK_CANDIDATE_LIMIT`
* Flow:

  1. Fetch `candidateLimit` candidates by distance
  2. For each candidate:

     * `baseScore = 1 - distance`
     * `boost = computeBoostV2(...)`
     * `archetypeBoost = computeArchetypeBoost(...)`
     * `finalScore = baseScore + boost + archetypeBoost`
  3. Sort by `finalScore` desc; return top `CHUNK_LIMIT`
* Important semantic guard:

  * Return chunks with both `baseScore` and `score` (finalScore)
  * Keep `maxScore` based on **baseScore**, so low-confidence gating still reflects embedding similarity, not heuristic boosts.

**Files to touch**

* `src/lib/perazzi-retrieval.ts`

**Acceptance criteria**

* With `PERAZZI_ENABLE_RERANK=false`, output is unchanged in spirit: `score === baseScore`, top-N matches current behavior.
* With `PERAZZI_ENABLE_RERANK=true`, ordering can change and `score` differs from `baseScore` for matched candidates.
* `maxScore` stays in `[0,1]` and does not jump above 1 due to boosts.
* CandidateLimit is clamped to `>= CHUNK_LIMIT` to avoid accidental “rerank with fewer than final”.

**Test notes**

* Run locally with rerank off, call assistant, note citations.
* Turn rerank on and debug on, repeat; confirm reranking reshuffles when metadata matches exist.
* Use your baseline harness prompts as the real-world regression test.

**Dependencies**

* Cards #1–#4.

---

#### Card #6 — Feature-flag retrieval debug logging (“dyno graphs”) + remove always-on logs

**Scope**

* Current `fetchV2Chunks()` logs retrieval debug **unconditionally**; move all such logs behind `PERAZZI_ENABLE_RETRIEVAL_DEBUG`. ([GitHub][1])
* When enabled, log:

  * candidate count
  * top 12 with: `chunkId`, `baseScore`, `boost`, `archetypeBoost`, `finalScore`
  * optionally: `primary_modes`, `archetype_bias`, `document_path`
* Do **not** log chunk text content.

**Files to touch**

* `src/lib/perazzi-retrieval.ts`

**Acceptance criteria**

* With `PERAZZI_ENABLE_RETRIEVAL_DEBUG=false`, no per-request retrieval debug spam.
* With debug=true, logs show a clear scoring breakdown for returned chunks.
* Logs do not include chunk content bodies.

**Test notes**

* Flip debug flag locally and confirm log presence/absence.
* Confirm log format is JSON (easy to grep).

**Dependencies**

* Card #5.

---

#### Card #7 — Keep retrieval inputs consistent with server-resolved mode + updated archetype vector (same request)

**Scope**

* In `route.ts`, before calling `retrievePerazziContext()`, construct a `retrievalBody` that ensures:

  * `context.mode = effectiveMode`
  * `context.archetypeVector = archetypeBreakdown.vector`
* This prevents rerank from using stale/previous vector when the server has already updated it for this request. ([GitHub][2])

**Files to touch**

* `src/app/api/perazzi-assistant/route.ts`

**Acceptance criteria**

* With rerank enabled, retrieval reacts to the *current message’s* archetype shift (not one turn later), observable via debug logs.
* No API response schema changes; only retrieval input consistency.
* Works even when `body.context` is missing (route builds a safe context object).

**Test notes**

* Ask a prompt containing strong analyst signals (“point of impact”, “rib height”, “trigger weight”) and confirm rerank shows archetypeBoost aligned immediately.

**Dependencies**

* Card #5 (so there is a rerank behavior to observe), Card #6 recommended for visibility.

---

### 4) External / Manual Tasks (outside the repo)

**DB / Supabase**

* No schema migration needed for Phase 2 — `schema.sql` already contains required jsonb columns and embeddings table. ([GitHub][3])
* Confirm your ingested rows actually *populate* the metadata fields we’re relying on (`platforms`, `disciplines`, `primary_modes`, `archetype_bias`, etc.). If not, plan a re‑ingest before tuning.

**Env vars**

* Set/confirm these in your local `.env` and in your deployment target (keep OFF in prod initially):

  * `PERAZZI_ENABLE_RERANK`
  * `PERAZZI_RERANK_CANDIDATE_LIMIT`
  * `PERAZZI_ENABLE_RETRIEVAL_DEBUG` ([GitHub][4])

**Ingestion / re-ingest**

* If doc/chunk metadata fields are mostly null right now, reranking won’t help — you’ll need a re‑ingest run after you confirm ingestion emits jsonb arrays that match the schema.

**Deployment toggles**

* Keep `PERAZZI_ENABLE_RERANK=false` in production until your baseline harness shows consistent improvement.

---

### 5) Risks & gotchas (short)

* **Embedding dimension mismatch trap:** schema + retrieval code are clearly using **3072** (`vector(3072)` + `halfvec(3072)`), but `.env.example` still shows `PGVECTOR_DIM=1536`. That variable may be used by ingest scripts; if so, it must be aligned to 3072 to avoid silent breakage. ([GitHub][3])
* **Two embedding tables exist:** `public.embeddings` (3072) and legacy-ish `public.perazzi_chunks` (1536). We must not accidentally rerank against the wrong store. ([GitHub][3])
* **JSONB shape uncertainty:** `related_entities`, `tags`, etc. can come back as arrays/objects/strings depending on ingestion and pg driver; parsing must be defensive.
* **Score semantics:** finalScore may exceed 1 due to boosts — that’s fine for ranking, but **low-confidence gating must stay tied to base similarity** (baseScore).

---

### 6) “Ready to write Task Cards” checklist

Before we generate Task Card #1, these should be true:

* You’re on branch `feature/archetype-zr1-rerank` (already).
* You have a working `DATABASE_URL` pointing at a DB that contains the ZR1 schema (tables: `documents`, `chunks`, `embeddings`). ([GitHub][3])
* Your baseline harness file is the canonical “before/after judge” (already).
* You can run the app locally and hit `/api/perazzi-assistant` at least once successfully (even before rerank). ([GitHub][2])
* You’re prepared to keep rerank behind `PERAZZI_ENABLE_RERANK` until your baseline prompts improve consistently. ([GitHub][4])

When you’re ready: tell me **“Create Task Card #1”** and I’ll write that single Codex Task Card in the exact detailed format.

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-retrieval.ts "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/api/perazzi-assistant/route.ts "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/docs/ARCHETYPE-ANALYSIS/SUPABASE/schema.sql "raw.githubusercontent.com"
[4]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/.env.example "raw.githubusercontent.com"
