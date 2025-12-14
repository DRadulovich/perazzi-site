## PHASE 0 — High‑altitude analysis (ZR1 Rebuild)

### Repo access prerequisite (so we stay “repo‑first”)

Right now, I **can’t yet open/verify your repo files** from here because no GitHub repo has been selected for search. Before we generate any code-change task cards, you’ll need to connect it in this chat: type **@github**, click the GitHub icon, and select the PerazziGPT repo (and any relevant sub‑repos if your app/ingestion live separately).
Once that’s done, I’ll inspect the actual files/paths and adapt safely if anything differs from the roadmap.

---

## A) End goal (restated, in my words)

We’re rebuilding PerazziGPT’s archetype system so it stops being “just a tone knob” and becomes a real **behavioral control layer** across the whole pipeline: **what gets retrieved**, **how it’s ranked**, **how the response is structured**, and **when we trust archetype enough to “snap” to a single primary identity**. That target includes hard guardrails: we must not surface hidden/unsafe content and must not weaken pricing/legal/gunsmithing/system‑meta refusals.  

Concretely: we’ll shift retrieval from “top‑N embedding similarity” to “retrieve a larger candidate set by embeddings, then **rerank** using your existing metadata + user context + archetype alignment” (the horsepower move), then fix archetype inference reliability (token boundaries + confidence gating), align mode inference end‑to‑end (backend+client), add archetype-aware response templates (structure, not labels), fix a client reset bug, and add logging so we can tune like grown-ups with receipts.  

---

## B) Current behavior vs target behavior

**Current (v1)** 

* Archetype persists (`archetypeVector`) and mainly changes **tone** in the system prompt.
* Retrieval is basically **top‑N embedding similarity** and doesn’t exploit rich metadata.
* Intents/topics exist but don’t reliably steer retrieval or structure.

**Target (ZR1)** 

* Archetype influences **retrieval prioritization** (reranking).
* Archetype influences **answer structure** (templates/planning), without labeling the user. 
* Archetype has **confidence gating** (“mixed/balanced” when margin is low). 
* Mode handling is **consistent** across backend/client so the system doesn’t fight itself. 

---

## C) Master Task Card Inventory (whole roadmap)

These are **estimates** until I can inspect your repo (file names and responsibilities sometimes drift). Once GitHub is connected, I’ll confirm exact file paths and tighten each card’s scope.

### Prep checklist (Roadmap “1) Preparation checklist”) — **3 cards**

1. **Add feature flags + defaults** (env var wiring, typed config) 
2. **Create baseline prompt harness doc** (`docs/ARCHETYPE-ANALYSIS/ZR1-baseline-examples.md`) and seed with 10 prompts + expected deltas 
3. **Add a “ZR1 tuning notes” doc** (how to read rerank logs + how to run baselines locally)

**Risk:** Low. Mostly scaffolding. Biggest risk is inconsistent env naming.

---

### Phase 1: Retrieval reranking — **7–9 cards** (Highest risk)

Primary goal: retrieve `candidateLimit` by embeddings, rerank with metadata + mode + archetype alignment, return top 12. 
Likely cards:

1. **Extend fetchV2Chunks to support candidateLimit + metadata selection** (SQL + types) 
2. **Confirm schema + expand query safely** (visibility/status/confidentiality filters stay intact) 
3. **JSONB parsing utilities** (`parseJsonbStringArray`) 
4. **ComputeBoostV2 implementation** aligned to real columns (platforms/disciplines/audiences/tags/entities/labels) 
5. **ComputeArchetypeBoost implementation** (alignment * specialization * optional confidenceFactor) 
6. **Rerank pipeline integration** (baseScore + boost + archetypeBoost, sort, slice) 
7. **Retrieval debug logging (flagged)** (candidate count + top chunk breakdown) 
8. (Optional) **Unit-ish tests for rerank scoring + parsing** (fast, deterministic)
9. (Optional) **Perf sanity checks** (candidateLimit impacts latency)

**Risk (High):** touches retrieval SQL + ranking = easy to accidentally (a) degrade relevance, (b) leak hidden content if filters are wrong, or (c) blow up latency if candidateLimit/joins are heavy. Also ranking math tends to “feel right” while being wrong—so we need logging and baselines.  

---

### Phase 2: Archetype inference reliability + confidence gating — **4–6 cards** (Medium risk)

1. **Replace substring matching with token/boundary matching** (fix false positives like “broadcast”→“cast”) 
2. **Add snap gating** (`winner-runnerUp < PERAZZI_ARCHETYPE_CONFIDENCE_MIN` ⇒ primary=null) 
3. **Propagate “primary may be null” through route** (effectiveArchetype nullable) 
4. **Reduce/condition priors** so mode/page/model don’t overpower language signals 
5. **Wire intent/topic signals into archetype context** (optional but valuable) 

**Risk:** Medium. Can change “personality stability” across turns. Confidence gating reduces damage by not over-asserting.

---

### Phase 3: Mode inference + consistency — **4–5 cards** (Medium–High risk)

1. **Fix hints.mode mismatch** (either add `mode` to `RetrievalHints` or remove backend expectation) 
2. **Add mode inference logic** (owner/navigation/prospect patterns) 
3. **Persist returned mode into client context** (`context.mode = data.mode`) 
4. **Resolve “heritage” mode mismatch** (map to navigation or separate page category) 
5. (Optional) **Regression tests** around mode transitions / client state

**Risk (Med–High):** mode is a cross-cutting state; breaking it can quietly ruin UX or retrieval alignment.

---

### Phase 4: Archetype shapes response structure — **3–5 cards** (Medium risk)

1. **Refactor templates to be archetype-aware** (nested map or key = intent+archetype) 
2. **Add template rules**: no user labeling; archetype decides what to lead with/how to structure 
3. **Confidence gating for templates** (mixed ⇒ neutral templates) 
4. **Integrate into system prompt assembly** in route.ts 
5. **Baseline prompt validation pass** (does structure shift as expected?)

**Risk:** Medium. It changes output shape; must ensure it doesn’t interfere with safety guardrails or factual tone.

---

### Phase 5: Client reset bug — **2–3 cards** (Low–Medium risk)

1. **Fix null handling** (`??` treats null as fallback; must distinguish undefined vs null) 
2. **Ensure reset clears archetypeVector + localStorage doesn’t rehydrate stale values** 
3. (Optional) **Add a tiny client-state test / repro script**

**Risk:** Mostly localized, but it affects perceived “control” of the system.

---

### Phase 6: Logging upgrades — **2–4 cards** (Low risk, high value)

1. **Log reranking metrics** (candidateLimit, top N chunk scores) 
2. **Log archetype confidence + snap decisions** (margin, winner/runnerUp, snapped) 
3. **Wire metadata in route.ts when calling logAiInteraction** 
4. (Optional) **Privacy pass**: ensure logs don’t store user PII or full prompt text unless intended

**Risk:** Low. Biggest risk is logging sensitive payloads unintentionally.

---

### Phase 7: Tuning loop — **1–2 cards + ongoing manual work**

1. **QA workflow doc + labeling checklist** (what to record, how to interpret logs) 
2. (Optional) **Add a small “baseline runner” utility** (if your stack supports it)

Most of this is process: candidateLimit, entity boosts, archetypeBoost K, thresholds, templates. 

**Risk:** Low in code; high in “discipline.” Without a feedback loop, rerank tuning becomes astrology.

---

### Rollout plan — **Mostly external**

Feature-flag rollout staging → partial prod, rerank starts off in prod. 
Safety guardrails unchanged. 

---

## D) Critical Dependencies

### 1) Feature flags / env vars (must exist early)

From the roadmap suggestions: 

* `PERAZZI_ENABLE_RERANK`
* `PERAZZI_RERANK_CANDIDATE_LIMIT`
* `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`
* `PERAZZI_ENABLE_RETRIEVAL_DEBUG`

(We’ll confirm your app’s env naming conventions once repo is connected.)

### 2) DB schema fields we must confirm before SQL changes

Roadmap indicates: 

* `public.chunks.section_labels`, `primary_modes`, `archetype_bias` are `jsonb`
* `public.documents.disciplines`, `platforms`, `audiences`, `tags` are `jsonb`
* embeddings: `public.embeddings.embedding vector(3072)` with HNSW cosine index

**Hard rule we’ll follow:** before touching retrieval SQL, we’ll open `schema.sql` in your repo and verify exact column names/types (including any `visibility`, `confidentiality`, `guardrail_flags`, `pricing_sensitive` fields referenced in the roadmap examples). 

### 3) Ingestion requirements

The reranker only helps if your ingestion actually populates those jsonb arrays consistently:

* `primary_modes`, `archetype_bias`, `section_labels`, `related_entities`, etc. 
  If those are sparse or inconsistent, we’ll need a **re‑ingest** / backfill pass (manual or scripted) before tuning.

### 4) UI implications

* Client currently allows `"heritage"` but backend only supports `prospect|owner|navigation` → must map or separate. 
* Client state must persist server-chosen `mode` to avoid drift. 
* Reset must clear archetype label/vector properly (null vs undefined handling). 

---

## E) Test & Validation Plan (how we avoid “vibes-based shipping”)

### Baseline harness (before any code)

* Create and maintain the baseline prompt doc (10 prompts minimum), recording **current output** and **desired feel** deltas. 
* Keep this doc as the north star through all phases.

### After each phase: what to test locally

Because I haven’t yet verified your repo scripts, I’ll phrase commands generically; once GitHub is connected, I’ll pin exact commands (`pnpm dev`, `npm test`, etc.).

**Prep phase**

* Confirm env flags are readable at runtime (e.g., startup log prints flag states in dev).
* Confirm baseline doc exists and is referenced in README/docs (optional).

**Phase 1 (Reranking)**

* Run baseline prompts with rerank **OFF** and **ON**, compare:

  * retrieved chunk IDs (should shift when archetype vector shifts), and
  * answer factual relevance (should improve without changing guardrails). 
* With `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true`, verify logs show: candidate count + top 12 with baseScore/boost/archetypeBoost/finalScore. 
* Verify filters remain intact (`status`, `visibility`, confidentiality constraints) so hidden content never appears. 
* Watch latency: candidateLimit too high can hurt; candidateLimit too low makes rerank meaningless.

**Phase 2 (Archetype inference + confidence gating)**

* Regression: messages containing “broadcast” should not trigger “cast” match anymore. 
* Confirm snap gating works: when margin < threshold, `primary=null` but vector still present. 
* Confirm route/response tolerates `effectiveArchetype` being null.

**Phase 3 (Mode consistency)**

* Confirm server no longer expects a nonexistent `hints.mode` field (or it now exists). 
* Confirm client uses `data.mode` for next request. 
* Confirm `"heritage"` is mapped/handled consistently. 

**Phase 4 (Archetype-aware templates)**

* For a couple intents (e.g., models/service), verify structure changes by archetype (comparison framing vs performance path vs stewardship vs curated next steps), without labeling the user. 
* When archetype confidence is low, verify neutral template is used. 

**Phase 5 (Reset bug)**

* Repro: get archetype set → hit reset → ensure archetype label clears even if server returns `null`. 
* Confirm localStorage doesn’t resurrect archetypeVector after reset. 

**Phase 6 (Logging)**

* Confirm logs include rerank metrics + confidence fields and are stable JSON (or whatever your logger expects). 
* Confirm no sensitive content is stored unintentionally.

### What to monitor in logs/metrics

* Retrieval latency (p50/p95) before vs after rerank
* Candidate count and the “boost breakdown” distribution (are boosts too large?)
* Frequency of `primary=null` (too frequent = threshold too high; too rare = threshold too low) 
* Guardrail triggers unchanged after rollout 

### Fast regression detection

* Maintain a “golden” subset of 3–5 prompts that must stay stable (facts + refusals).
* Use retrieval debug logs as a diffable artifact: top chunk IDs and scores should be explainable.

---

## Stopping point

That’s the full-phase map. Next, paste the **first roadmap section (Phase 1 section)** and I’ll return a **CODEX TASK CARD PASS** in your required structure.
