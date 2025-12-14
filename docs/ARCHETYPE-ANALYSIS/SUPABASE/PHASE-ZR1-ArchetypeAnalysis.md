GitHub connection ✅ — I can see and inspect your repo (`DRadulovich/perazzi-site`), and the roadmap’s “files to touch” are real paths in the repo (with a couple of small *type/contract mismatches* we’ll explicitly fix in Phase 3). Here are the key verified touchpoints:

* `src/lib/perazzi-retrieval.ts` 
* `src/lib/perazzi-archetypes.ts` 
* `src/lib/perazzi-intents.ts` 
* `src/app/api/perazzi-assistant/route.ts` 
* `src/components/chat/useChatState.ts` 
* `src/hooks/usePerazziAssistant.ts`
* `src/types/perazzi-assistant.ts`
* `src/lib/aiLogging.ts` 
* `scripts/ingest-v2.ts` 
* `.env.example` 

Below is PHASE 0 (high‑altitude analysis) based on your uploaded roadmap + what’s actually in the repo today.

---

## A) End goal (restated)

You’re rebuilding “Archetype Analysis ZR1” so PerazziGPT stops being a polite autocomplete machine and starts behaving like a consistent, measurable system:

1. It should **retrieve more relevant context** by reranking semantic-search candidates using **mode + page context + doc/chunk metadata + archetype bias**, not just raw embedding similarity. 
2. It should **infer archetype more reliably**, with **confidence gating** (i.e., it’s allowed to say “mixed/balanced” internally and fall back to neutral behavior rather than forcing a persona).
3. Archetype should influence not just tone but **answer architecture** (what gets lead, what gets structured), while keeping all safety/guardrail behaviors intact.

---

## B) Current behavior vs target behavior

### What the system does today (as implemented)

* **Retrieval is essentially “top‑K by embedding similarity”**. `retrievePerazziContext()` embeds the query and pulls matching chunks through `match_embeddings_v2`, then fetches chunk/doc info with no rerank step. 
* A boosting function exists (`computeBoost`) but it’s **not part of the retrieval flow right now** (defined in the file, but the current `retrievePerazziContext()` path doesn’t apply it). 
* **Hints are extracted** (`detectRetrievalHints`) into intents/topics/keywords/entities, but (today) retrieval does not use them for ranking. 
* **Mode typing is inconsistent across layers**: the client context allows `mode?: PerazziMode | "heritage"` , while the backend contract defines `PerazziMode` as only `"prospect" | "owner" | "navigation"` .
* Chunk/doc metadata **does exist in the DB ingest path** (chunks: `section_labels`, `primary_modes`, `archetype_bias`; docs: `disciplines`, `platforms`, `audiences`, `tags`) — meaning the *data foundation* for reranking is already there. 
* Logging exists and is gated by `PERAZZI_AI_LOGGING_ENABLED`, but it doesn’t yet capture rerank metrics or archetype confidence margins. 

### Target behavior (ZR1 rebuild)

* **Retrieval**: fetch a larger candidate set, compute a schema‑aligned boost (mode/platform/discipline/entity/topic/keyword + archetype bias), then return the top N chunks with optional debug traces (behind flags).
* **Archetype inference**: token/boundary matching (no substring flukes), reduced priors, and a confidence margin threshold that can yield “mixed” (→ neutral templates).
* **Mode**: one consistent meaning end-to-end (client → API → response → client), including a clear strategy for “heritage.”
* **Templates**: response structure becomes archetype-aware (but never labels the user), and only applies when confidence is high enough.

---

## C) Master Task Card Inventory (whole roadmap)

Estimates below are “small, surgical” cards — each card changes one coherent behavior.

### Prep checklist (feature flags + baseline harness)

**~2 cards**

1. **Add feature flags & defaults** (env vars + config plumbing; no behavior change unless enabled).
2. **Create baseline prompt set + runbook doc** (store ZR1 baseline examples so we can measure deltas).

### Phase 1: Archetype-aware retrieval reranking

**~6 cards** *(Highest risk: affects what knowledge is retrieved, so it can change answers quickly and subtly.)*

1. **Add rerank config plumbing** (`PERAZZI_ENABLE_RERANK`, `PERAZZI_RERANK_CANDIDATE_LIMIT`, debug flag) and surface config into retrieval.
2. **Expand candidate fetch**: adjust retrieval to pull *candidateLimit* from embeddings/chunks/docs (include needed metadata fields).
3. **Implement schema-aligned `computeBoostV2`** using doc/chunk metadata that actually exists (platforms/disciplines/audiences/tags + section_labels/primary_modes).
4. **Add archetype boost function**: combine user archetype vector + chunk `archetype_bias` into a stable numeric boost.
5. **Wire rerank pipeline**: compute baseScore + boosts → finalScore → stable sort → return top CHUNK_LIMIT; add debug payload (optional).
6. **Add retrieval regression tests / harness**: deterministic tests for scoring + sorting + gating-by-flag.

### Phase 2: Fix archetype inference reliability + confidence gating

**~4 cards** *(High risk: can shift persona + structure; we mitigate via confidence gating + neutral fallback.)*

1. **Replace substring matching with token/boundary matching** in `perazzi-archetypes.ts`.
2. **Add confidence margin + “mixed/balanced” output** (don’t force a winner when margin < threshold).
3. **Reduce priors + reweight signals** (priors help only when vector is neutral; language/behavior dominate).
4. **Optionally add intent/topic signals** into archetype context (requires wiring hints into archetype scoring).

### Phase 3: Mode inference + consistency

**~3 cards** *(Medium risk: contract/type mismatches can cause subtle bugs across client/server.)*

1. **Unify mode contract**: resolve “backend expects X / hints provide Y” issues and make server authoritative.
2. **Client follows server mode**: after response, persist `data.mode` back into chat context.
3. **Resolve `"heritage"` cleanly**: map it to a supported backend mode (or separate “page category” vs “conversation mode”).

### Phase 4: Make archetype shape response structure

**~2 cards**

1. **Add archetype-aware template selection** (nested template map by intent + archetype; never labels the user).
2. **Template gating**: if archetype confidence is low → neutral templates only.

### Phase 5: Fix client reset bug

**~1 card**

1. **Fix `null` vs `undefined` merge logic** so reset and server responses can actually clear `archetype`/`archetypeVector`.

### Phase 6: Logging upgrades for tuning

**~2 cards**

1. **Log rerank metrics** (top N chunks: baseScore/boost/finalScore, candidateLimit, rerankEnabled).
2. **Log archetype decision quality** (winner/runner-up, confidence margin, snapped/mixed).

### Phase 7: Tuning loop

**~1 card (repo) + ongoing manual**

1. **Add tuning runbook + QA workflow hooks** (doc + optional small UI/log-filter improvements if you already have a QA dashboard path).

### Rollout plan

**~1 card + manual**

1. **Ship behind flags + staged rollout checklist** (staging enablement, production gradual enable, rollback steps).

**Highest-risk phases:**

* **Phase 1** (retrieval rerank): wrong weights can surface the wrong chunks → wrong answers with confident tone.
* **Phase 2** (archetype inference): if it over-assigns archetypes, you’ll “feel” personality drift. Confidence gating is the safety net.

---

## D) Critical dependencies

### Feature flags / env vars (new)

* `PERAZZI_ENABLE_RERANK` (bool)
* `PERAZZI_RERANK_CANDIDATE_LIMIT` (int)
* `PERAZZI_ENABLE_RETRIEVAL_DEBUG` (bool)
* `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` (float 0–1)

(Logging already has `PERAZZI_AI_LOGGING_ENABLED`.) 

### DB schema fields required (confirmed via ingest + retrieval code)

* `public.chunks`: `section_labels`, `primary_modes`, `archetype_bias`, plus visibility gating (`visibility`) 
* `public.documents`: `platforms`, `disciplines`, `audiences`, `tags`, plus status gating (`status`) 
* `public.embeddings`: `embedding` + `chunk_id` (already used by retrieval) 
* Conversation logging table: must accept metadata json and archetype/mode fields (already in use by `logAiInteraction`) 

### Ingestion requirements

* Rerank depends on metadata actually being populated; if old rows are missing JSON fields, we’ll need a **re‑ingest** via `scripts/ingest-v2.ts`. 
* Embedding dimension must match the model being used (current code uses `text-embedding-3-large` and expects a consistent vector size). 

### UI implications

* Client mode is currently broader than backend mode (includes `"heritage"`), so we must standardize without breaking page UX.
* Reset behavior needs to clear both stored state and rehydration paths.

---

## E) Test & Validation Plan

### After each phase (local)

* **Always:** Typecheck + build + quick smoke chat flow.
* **Prep:** Confirm flags exist in `.env` and baseline prompt doc is created.
* **Phase 1:**

  * Run with rerank **off** → behavior unchanged.
  * Run with rerank **on** + debug flag → verify logs show candidateLimit, boosts, and stable ordering; verify retrieval still respects “public/active” gating.
* **Phase 2:**

  * Unit tests for token/boundary matching (no “broadcast → cast” false hits).
  * Baseline prompts: verify low-confidence queries stay neutral (no forced archetype).
* **Phase 3:**

  * Verify `"heritage"` never reaches server as an unsupported mode.
  * Verify server-chosen mode (if returned) persists into next request.
* **Phase 4:**

  * Spot-check structured outputs: archetype changes *structure* only when confidence high; otherwise uses existing neutral templates.
* **Phase 5:**

  * Reset clears archetype label/vector; server response `archetype: null` clears UI state (no `??` resurrection).
* **Phase 6:**

  * Confirm logs include rerank metrics + archetype margin fields; ensure no PII leakage beyond what you already log.

### Logs / metrics to check

* API route logs: rerank enabled, candidate count, top chunk IDs.
* Supabase logs table: metadata fields present + consistent types (especially arrays/json).
* Error budget: watch for increased 500s in `/api/perazzi-assistant` and any rate-limit false positives.

### Fast regression detection

* Keep a short “golden set” of prompts (your ZR1 baseline examples) and re-run them after each phase.
* Any time relevance drops or guardrails soften → immediately flip flags off (rollback is mostly env toggles in early phases).

---

We’re ready to start. Next step in your workflow: paste the first roadmap section (Phase 1 section) and I’ll return the **CODEX TASK CARD PASS** for it (card count, titles, scopes, files, acceptance criteria, dependencies, external tasks) — no full cards until you say “Create Task Card #N.”
