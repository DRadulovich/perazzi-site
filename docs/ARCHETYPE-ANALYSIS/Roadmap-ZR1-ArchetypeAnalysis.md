# Perazzi GPT Archetype Analysis “ZR1 Rebuild” Roadmap

## 0) What we’re rebuilding (in plain terms)

### Current behavior (v1)

* Archetype exists, persists across turns (`archetypeVector`), and changes **tone** in the system prompt.
* Retrieval is essentially “top‑N embedding similarity” and does **not** use the rich metadata you ingest.
* Intents/topics exist but are not fully used to steer retrieval or structure.

### Target behavior (ZR1)

Archetype should influence:

1. **Which knowledge is retrieved and prioritized** (reranking)
2. **How the answer is structured** (templates/planning)
3. **When we *trust* archetype** (confidence gating)
4. **Mode consistency** so the system doesn’t fight itself

### Important schema confirmation

Your uploaded `schema.sql` confirms:

* `public.chunks.section_labels`, `primary_modes`, `archetype_bias` are **jsonb**
* `public.documents.disciplines`, `platforms`, `audiences`, `tags` are **jsonb**
* embeddings are stored in `public.embeddings.embedding vector(3072)` with an HNSW cosine index
  All of which is exactly what we need for metadata-driven retrieval reranking. 

---

# 1) Preparation checklist (do this once)

## 1.1 Create a safe working branch

* Branch name suggestion: `feature/archetype-zr1-rerank`

## 1.2 Add feature flags (so you can ship safely)

Add env flags (names are suggestions; pick a consistent naming style):

* `PERAZZI_ENABLE_RERANK=true|false`
* `PERAZZI_RERANK_CANDIDATE_LIMIT=60` (how many candidates to pull before reranking)
* `PERAZZI_ARCHETYPE_CONFIDENCE_MIN=0.08` (margin threshold before “snapping” to a primary archetype)
* `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true|false`

## 1.3 Collect “before” baseline examples (small but crucial)

Create a doc in repo (example: `docs/ARCHETYPE-ANALYSIS/ZR1-baseline-examples.md`) with at least:

* 10 prompts (mix of models, service, heritage, dealers/navigation)
* what PerazziGPT answers today
* what you want it to feel like instead (1–3 bullets)
  These become your test harness for “did we actually improve outputs?”

---

# 2) Phase 1: Retrieval reranking (the biggest horsepower gain)

**Primary file:** `src/lib/perazzi-retrieval.ts`

## 2.1 Goal

Instead of returning the top 12 “closest embeddings,” do:

1. Retrieve top `candidateLimit` by embedding similarity (e.g., 60)
2. Rerank candidates using:

   * hints/topics/entities/keywords
   * mode alignment (chunk `primary_modes`)
   * platform/model/discipline alignment (doc + chunk jsonb)
   * archetype alignment (chunk `archetype_bias` + user `archetypeVector`)
3. Return the top 12 reranked

## 2.2 Step-by-step implementation plan

### Step A — Make `fetchV2Chunks()` retrieve more candidates + metadata

**Search for:** `fetchV2Chunks(` in `src/lib/perazzi-retrieval.ts`

1. Add a `candidateLimit` parameter:

   * `limit` becomes the *final* number you return (still `CHUNK_LIMIT`)
   * `candidateLimit` becomes “how many to pull for reranking”

2. Expand the SQL select to include metadata needed for rerank:

   * From `chunks`: `primary_modes`, `archetype_bias`, `section_labels`, `disciplines`, `platforms`, `audiences`, `context_tags`, `related_entities`, `guardrail_flags`, etc.
   * From `documents`: `disciplines`, `platforms`, `audiences`, `tags`, `pricing_sensitive`, `visibility`, `confidentiality`, etc.

3. Keep existing filters:

   * `d.status = 'active'`
   * `coalesce(c.visibility, 'public') = 'public'`
     (Optionally also ensure `d.visibility = 'public'` if you use it)

### Step B — Add JSONB parsing helpers (critical for safety and consistency)

Create helper(s) in `perazzi-retrieval.ts` (or a small utility file if you prefer):

* `parseJsonbStringArray(value: unknown): string[]`

  * accepts jsonb coming back from PG as object/array/string/null
  * returns a normalized `string[]` lowercased + trimmed
  * handles both cases:

    * `["Owner", "Prospect"]`
    * `["owner","prospect"]`

### Step C — Implement `computeBoostV2()` aligned to your real schema

You already have `computeBoost()` but it expects fields like `metadata.topics` that aren’t currently selected. Do one of these:

**Option 1 (recommended):** Write a fresh `computeBoostV2(row, context, hints)`

* Use **actual columns** from the query row:

  * doc platforms/disciplines/audiences/tags (jsonb arrays)
  * chunk platforms/disciplines/audiences/context_tags/section_labels (jsonb arrays)
  * plus `context.modelSlug/platformSlug` and `hints.topics/keywords/focusEntities`

**Option 2:** Build an adapter object to match the old `computeBoost()` expected shape
(Usually messier; the clean rewrite is better.)

**Boost logic guidelines**
Keep boosts small and additive (you’re tuning ranking, not overriding embeddings):

* mode alignment: +0.03 to +0.08
* platform match: +0.05 to +0.12
* discipline match: +0.03 to +0.08
* entity match (strong): +0.10 to +0.20
* keyword in title/path/labels: +0.02 to +0.06
  …and so on.

### Step D — Implement archetype alignment boost (this is the ZR1 secret sauce)

Add a function:

`computeArchetypeBoost(userVector, chunkArchetypeBias, archetypeConfidence): number`

Suggested behavior:

* If `chunkArchetypeBias` is empty or contains **all five archetypes**, boost = 0
  (That chunk is “general-purpose”; archetype shouldn’t move it.)
* Compute:

  * `alignment = sum(userVector[a] for a in chunkBias)`
  * `specialization = 1 - (chunkBias.length / 5)`
  * `confidenceFactor = clamp(archetypeConfidence / threshold, 0, 1)` (optional)
  * `boost = K * alignment * specialization * confidenceFactor`
* Start with `K ≈ 0.08` (tune later)

### Step E — Rerank and return top `CHUNK_LIMIT`

For each candidate row:

* `baseScore = 1 - distance`
* `boost = computeBoostV2(...)`
* `archetypeBoost = computeArchetypeBoost(...)`
* `finalScore = baseScore + boost + archetypeBoost`

Sort by `finalScore` descending and slice top `CHUNK_LIMIT`.

**Important:** Return both:

* `baseScore` (for transparency / tuning)
* `score` (final score)

### Step F — Add retrieval debug logging (feature flagged)

When `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true`, log:

* candidate count
* top 12 chunkIds with:

  * baseScore
  * boost
  * archetypeBoost
  * finalScore
  * chunk primary_modes and archetype_bias (optional)

This gives you instant “dyno graphs” to tune the reranker.

## 2.3 Acceptance tests for Phase 1

Use your baseline prompts and verify:

1. The same prompt with different archetype vectors should retrieve **different top chunks** (especially when you have specialized bias like models/olympics).
2. Reranking does not surface hidden content:

   * respects `status`, `visibility`, and any confidentiality constraints
3. Answers become more “identity aligned” even before template changes, because the underlying facts change.

---

# 3) Phase 2: Fix archetype inference reliability + confidence gating

**Primary file:** `src/lib/perazzi-archetypes.ts`

## 3.1 Replace substring matching with token/boundary matching

**Search for:** `messageIncludesAny(`

Current issue: `includes()` causes false positives (“broadcast” → “cast”).

Implementation approach:

* Tokenize message into words (`[a-z0-9']+`), build a set.
* For single words, check token membership.
* For phrases (“point of impact”), keep phrase matching as `includes()`, but only for multi-word phrases.

## 3.2 Add archetype “snap” gating

Add a “mixed/balanced” mode:

* Compute the winner and runner-up from the vector.
* If `winner - runnerUp < PERAZZI_ARCHETYPE_CONFIDENCE_MIN`, set `primary = null`

  * Keep vector! (vector is still useful for soft weighting; you just don’t declare a single identity.)

Where to implement:

* Either in `computeArchetypeBreakdown()` or in `buildArchetypeClassification()`
* Then propagate into `route.ts` so `effectiveArchetype` may be null when confidence is low.

## 3.3 Reduce non-identity priors (or make them conditional)

Right now mode/page/model signals may bias archetype too strongly. Update logic so:

* priors apply strongly only when the vector is near-neutral
* or priors are lower-weighted than language + behavior signals

## 3.4 Add intent/topic signals into archetype scoring (high value)

Update archetype context to include `hints.intents` and `hints.topics` so archetype inference uses higher-quality signals than raw keywords.

This requires:

* adding fields to `ArchetypeContext`
* wiring them in `route.ts` where `archetypeContext` is created

---

# 4) Phase 3: Mode inference + consistency (stop fighting yourself)

**Primary files:**

* `src/app/api/perazzi-assistant/route.ts`
* `src/lib/perazzi-intents.ts`
* `src/components/chat/useChatState.ts`

## 4.1 Fix backend expectation mismatch (`hints.mode`)

**Search for:** `hints?.mode` in `route.ts`

Right now `detectRetrievalHints()` doesn’t produce `mode`, but `route.ts` expects it.

Choose one approach:

### Option A (clean): Add `mode` to `RetrievalHints`

* Update `RetrievalHints` type to include `mode?: PerazziMode`
* In `detectRetrievalHints()`, infer mode using patterns:

  * Owner signals: “my gun”, “serial”, “service”, “maintenance”, “timing”, etc.
  * Navigation signals: “where can I find”, “link”, “page”, “show me”, etc.
  * Default: prospect
* Then `route.ts` can safely use `hints.mode`

### Option B: Remove `hints.mode` logic in `route.ts` and infer mode centrally in `route.ts`

This keeps intents pure, but you’ll duplicate logic.

## 4.2 Persist returned mode into client context

**File:** `src/components/chat/useChatState.ts`

After receiving response, update context so next request uses the server’s chosen mode:

* `context.mode = data.mode` (when defined)

## 4.3 Resolve `"heritage"` mode in the client

Your UI types allow `"heritage"`; backend only supports `prospect|owner|navigation`.

Pick one:

* Map `"heritage"` → `"navigation"` before sending to the API
* Or store `"heritage"` separately as a “page category” and keep `mode` clean

---

# 5) Phase 4: Make archetype shape response structure (not just tone)

**Primary file:** `src/lib/perazzi-intents.ts` --> `https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-intents.ts`

**Also touches:** `src/app/api/perazzi-assistant/route.ts` (system prompt assembly) --> `https://github.com/DRadulovich/perazzi-site/blob/feature/archetype-zr1-rerank/src/app/api/perazzi-assistant/route.ts`

## 5.1 Add archetype-aware templates (structured “output architecture”)

Today: `TEMPLATE_GUIDES[intent]`

Upgrade: `TEMPLATE_GUIDES[intent + archetype]` (or a nested map)

Examples:

* `models + analyst` → comparison table + decision criteria + “how to test”
* `models + achiever` → performance path + training implications
* `service + legacy` → preservation + documentation + stewardship framing
* `bespoke + prestige` → curated options + discreet next step

Rules:

* Never label the user (“you are an Analyst”)
* Use archetype only to decide **what to lead with** and **how to structure**

## 5.2 Confidence gating for templates

If archetype confidence is low (mixed/balanced), default to your current neutral templates.

---

# 6) Phase 5: Fix the client “reset doesn’t clear archetype label” bug

**Primary file:** `src/components/chat/useChatState.ts`

**Search for:**
`archetype: data.archetype ?? prev.archetype ?? null`

Problem:

* `??` treats `null` as “fallback,” so a server response of `archetype: null` won’t clear the previous value.

Fix pattern:

* Only fallback when `data.archetype === undefined`, not when it’s explicitly null.

Also ensure reset clears `archetypeVector` and doesn’t rehydrate stale values from localStorage.

---

# 7) Phase 6: Logging upgrades for tuning (turn your system into science)

**Primary file:** `src/lib/aiLogging.ts`
**Also:** add metadata in `route.ts` when calling `logAiInteraction`

## 7.1 Log reranking metrics

In `metadata`, store:

* `rerankEnabled: true|false`
* `candidateLimit`
* For top N returned chunks:

  * `chunkId`, `baseScore`, `boost`, `archetypeBoost`, `finalScore`

## 7.2 Log archetype confidence and “mixed/balanced” decisions

Store:

* `archetypeConfidenceMargin`
* `archetypeWinner`, `runnerUp`
* `archetypeSnapped: boolean`

This makes tuning weights straightforward.

---

# 8) Phase 7: Tuning loop (how you reach the “holy sh*t” 10–20%)

## 8.1 Use QA flags as your labeling tool

Workflow:

1. Run baseline prompts after each phase
2. Flag bad interactions in QA dashboard
3. Build a small labeled set:

   * desired mode
   * “did archetype help?” (yes/no)
   * optional: archetype label (if you can infer it)

## 8.2 Weight tuning strategy

Tune in this order (most impact first):

1. candidateLimit size (too low = rerank can’t help)
2. entity matches + platform/discipline boosts
3. archetypeBoost K
4. mode priors + archetype confidence threshold
5. archetype-aware templates

---

# 9) Rollout plan (ship without fear)

## 9.1 Deploy behind feature flags

* Start with rerank off in production
* Enable in staging / preview
* Slowly turn on for a subset of traffic if you have that ability

## 9.2 Safety guardrails stay unchanged

None of these upgrades should change your pricing/legal/gunsmithing refusals—only relevance and structure.

---

# “Single‑page” file touch summary (print this)

### Must touch

1. `src/lib/perazzi-retrieval.ts`

   * candidate retrieval + rerank + metadata parsing + archetype boost

2. `src/lib/perazzi-archetypes.ts`

   * boundary matching + confidence gating + intent/topic signals

3. `src/app/api/perazzi-assistant/route.ts`

   * pass hints/archetype context cleanly, include rerank metadata in logging

4. `src/components/chat/useChatState.ts`

   * persist mode, fix null-handling for archetype reset

5. `src/lib/perazzi-intents.ts`

   * add mode inference and archetype-aware templates

### Optional but smart

6. `src/lib/aiLogging.ts`

   * store rerank metrics + archetype confidence

---

If you want, I can convert this roadmap into a **single markdown file** layout (with checkboxes and “search strings” under every step) that you can drop directly into your repo (e.g., `docs/ARCHETYPE-ANALYSIS/ZR1-ROADMAP.md`).
