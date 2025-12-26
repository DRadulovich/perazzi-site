## 1) Phase 6 — Objective

Upgrade PerazziGPT’s persisted AI interaction logs so you can **tune reranking and archetype inference empirically** (instead of guessing). Specifically, write additional fields into `perazzi_conversation_logs.metadata` (jsonb) for:

* **Reranking metrics:** whether rerank was enabled, candidateLimit used, and the **top returned chunks** with `chunkId`, `baseScore`, `boost`, `archetypeBoost`, `finalScore`. ([GitHub][1])
* **Archetype confidence metrics:** confidence margin, winner + runner-up, and whether we “snapped” to a primary archetype vs stayed mixed/balanced. ([GitHub][2])

---

## 2) Repo touchpoints

### `src/lib/aiLogging.ts`

* **`logAiInteraction()`** inserts into `perazzi_conversation_logs` and stores `metadata` (after `withArchetypeDistribution(...)`). ([GitHub][3])
* No schema changes needed: `perazzi_conversation_logs.metadata` is already `jsonb`. ([GitHub][4])

### `src/app/api/perazzi-assistant/route.ts`

Key spots:

* **Guardrail-block path** directly calls `logAiInteraction({ context: { ... metadata: { mode, guardrailStatus, guardrailReason }}})` today. ([GitHub][5])
* **Normal answer path** builds `interactionContext.metadata` in `generateAssistantAnswer()` (currently includes `mode`, guardrail fields, `maxScore`, and `retrievedChunks: [{chunkId, score}]`). ([GitHub][5])
* Retrieval is executed before the model call: `const retrieval = await retrievePerazziContext(retrievalBody, hints);` ([GitHub][5])

### `src/lib/perazzi-retrieval.ts`

* Retrieval already computes:

  * `rerankEnabled` from `PERAZZI_ENABLE_RERANK`
  * `candidateLimit` via `PERAZZI_RERANK_CANDIDATE_LIMIT` (default 60, max 200)
  * per-chunk `baseScore`, `boost`, `archetypeBoost`, `finalScore` during rerank
* BUT it currently only returns `chunks` + `maxBaseScore` and does **not** return that scoring breakdown to the route for DB logging. ([GitHub][1])

---

## 3) Proposed Task Cards (do NOT write the full cards yet)

### Card count: **2**

---

### **Card #1 — Retrieval: return rerank scoring breakdown + candidateLimit (for logging)**

**Scope**

* Add a small `rerankMetrics` (or similarly named) object to the return from `retrievePerazziContext()` so the route can log:

  * `rerankEnabled`
  * `candidateLimit` (the **effective** candidateLimit used for the SQL limit)
  * `topReturnedChunks`: top N returned chunks with `{ chunkId, baseScore, boost, archetypeBoost, finalScore }`
* Populate it in both cases:

  * rerank disabled → boost/archetypeBoost are 0; finalScore = baseScore
  * rerank enabled → use the computed values already available in `fetchV2Chunks()`
* Ensure **no chunk text/content** is included in this metrics object.

**Files to touch**

* `src/lib/perazzi-retrieval.ts` ([GitHub][1])

**Acceptance criteria (testable)**

* `retrievePerazziContext()` returns `{ chunks, maxScore, rerankMetrics }` (or equivalent) without breaking existing call sites. ([GitHub][1])
* When `PERAZZI_ENABLE_RERANK=false`, `rerankMetrics.rerankEnabled === false` and each returned chunk entry has `boost=0`, `archetypeBoost=0`, `finalScore === baseScore`. ([GitHub][1])
* When `PERAZZI_ENABLE_RERANK=true`, `rerankMetrics.rerankEnabled === true`, `candidateLimit` is present, and entries include non-zero boosts when applicable. ([GitHub][1])
* `rerankMetrics` contains only IDs + numbers (no `content`, no document/chunk bodies).

**Test notes (local verification)**

* Temporarily `console.info(JSON.stringify(retrieval.rerankMetrics))` in the route (or use Card #2 which will surface it via persisted logs).
* Flip `PERAZZI_ENABLE_RERANK` on/off and compare the presence/values.

**Dependencies**

* None (safe additive return data).

---

### **Card #2 — Route: store rerank + archetype confidence metrics into `AiInteractionContext.metadata` (and guardrail logAiInteraction call)**

**Scope**

* **Archetype confidence logging**

  * Compute from `archetypeBreakdown.vector`:

    * `archetypeWinner`
    * `archetypeRunnerUp`
    * `archetypeConfidenceMargin` (winnerScore − runnerUpScore)
    * `archetypeSnapped` (margin >= `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`) ([GitHub][2])
  * Store these in `interactionContext.metadata` for normal requests.
  * Also add them to the **guardrail-block** direct `logAiInteraction()` call’s metadata block. ([GitHub][5])
* **Rerank metrics logging**

  * Take `retrieval.rerankMetrics` (from Card #1) and store into metadata:

    * `rerankEnabled`
    * `candidateLimit`
    * `topReturnedChunks` with scoring breakdown
* Keep the API response shape unchanged (still returns `answer`, `citations`, `mode`, `archetype`, etc.). ([GitHub][5])
* Do **not** add chunk text bodies to metadata.

**Files to touch**

* `src/app/api/perazzi-assistant/route.ts` ([GitHub][5])
* (Likely **no change needed**) `src/lib/aiLogging.ts` already persists `metadata` jsonb after augmentation. ([GitHub][3])

**Acceptance criteria (testable)**

* For a normal (non-blocked) request, the metadata passed into the model logging context includes:

  * `rerankEnabled`, `candidateLimit`, and top chunk scoring breakdown
  * `archetypeConfidenceMargin`, `archetypeWinner`, `archetypeRunnerUp`, `archetypeSnapped` ([GitHub][5])
* For a guardrail-blocked request, the direct `logAiInteraction()` call includes the archetype confidence fields in metadata (and does not throw). ([GitHub][5])
* No metadata field contains chunk/document `content` bodies (IDs + numeric fields only).
* TypeScript builds cleanly; runtime still returns the same response contract.

**Test notes (how we’ll verify locally)**

* With DB logging enabled (see External Tasks), issue:

  1. a rerank-relevant request
  2. a mixed-confidence archetype request (so `primary=null`)
  3. a blocked request (pricing/gunsmithing/system meta)
* Query Supabase: confirm the latest row(s) contain the new metadata fields.

**Dependencies**

* **Card #1** (so the route has the per-chunk rerank breakdown to log).
* Requires env var `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` to be present or defaulted consistently with archetype inference. ([GitHub][2])

---

## 4) External / Manual Tasks (outside the repo)

### DB/Supabase verification (recommended)

1. Ensure `PERAZZI_AI_LOGGING_ENABLED=true` (otherwise `logAiInteraction` is a no-op). ([GitHub][3])
2. Ensure `DATABASE_URL` points to the environment that has `perazzi_conversation_logs`. ([GitHub][3])
3. Run 2–3 test prompts locally.
4. In Supabase SQL editor run:

   * `select created_at, env, endpoint, metadata from perazzi_conversation_logs order by created_at desc limit 10;` ([GitHub][4])
5. Validate the new metadata keys exist and values look sane.

### Env vars involved

* `PERAZZI_AI_LOGGING_ENABLED=true` ([GitHub][3])
* `PERAZZI_ENABLE_RERANK=true|false` and (optional) `PERAZZI_RERANK_CANDIDATE_LIMIT` ([GitHub][1])
* `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` (for snapped vs mixed) ([GitHub][2])

---

## 5) Risks & gotchas

* **Metric source-of-truth:** rerank scoring components (`boost`, `archetypeBoost`) are computed inside retrieval; logging must use those exact values (hence Card #1). ([GitHub][1])
* **Prompt logging unknown:** depending on how `runChatCompletion` logs prompts, the stored `prompt` could include system prompt content. This phase only adds metadata; it does not change what’s stored as `prompt`. (Worth sanity-checking once you inspect logs.) ([GitHub][5])
* **Metadata bloat:** keep “top N” small (top 12) and only store numeric fields + IDs.

---

## 6) Ready to write Task Cards checklist

Before we generate Card #1:

* Confirm we’re operating on branch `feature/archetype-zr1-rerank`.
* Confirm `retrievePerazziContext()` currently returns only `{ chunks, maxScore }` and rerank computations exist in `fetchV2Chunks()`. ([GitHub][1])
* Confirm `perazzi_conversation_logs.metadata` is `jsonb` so no schema migrations are needed. ([GitHub][4])

Before we generate Card #2:

* Confirm where metadata is assembled in `generateAssistantAnswer()` and in the guardrail-block `logAiInteraction()` call. ([GitHub][5])
* Confirm you can access Supabase logs (or at least have `DATABASE_URL` wired locally) to verify the new fields.

When you say **“Create Task Card #1”**, I’ll write the single detailed Codex Task Card for Card #1 only.

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-retrieval.ts "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-archetypes.ts "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/aiLogging.ts "raw.githubusercontent.com"
[4]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/docs/ARCHETYPE-ANALYSIS/SUPABASE/schema.sql "raw.githubusercontent.com"
[5]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/api/perazzi-assistant/route.ts "raw.githubusercontent.com"
