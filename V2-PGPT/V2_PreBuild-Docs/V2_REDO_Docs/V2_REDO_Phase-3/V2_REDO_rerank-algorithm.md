# PerazziGPT v2 – Retrieval Rerank Algorithm

> Version: 0.1 (Draft)
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-3/V2_REDO_rerank-algorithm.md`  
> Related docs:  
> • `V2_REDO_api-contract.md`  
> • `V2_REDO_metadata-schema.md`  
> • `V2_REDO_chunking-guidelines.md`  
> • `V2_REDO_infrastructure.md` (env-var reference table)  
> • `V2_REDO_validation.md` (§ Rerank tests)

This file explains **how v2 turns raw pgvector similarity results into the final chunk list** that feeds each model call.  
It is strictly an implementation reference (Phase-3) and *not* included in user-facing prompts.

---

## 1  Why a second-pass rerank?

Vector similarity alone is agnostic to business context.  
Rerank lets us push **small, interpretable nudges** so results better reflect:

1. Runtime `mode` (Prospect | Owner | Navigation)
2. Hints in `context` (platformSlug, modelSlug, locale)
3. Topic/discipline clues surfaced by the intent parser
4. Audience‐archetype fit **without changing facts**

Target: move the *right* chunk from rank 5-15 up into the top-12, not wholesale reshuffle.

---

## 2  Flow overview

```
Client request →
  ① Embed last user message (text-embedding-3-large)
  ② pgvector similarity search (k = candidateLimit, default 60)
  ③ Boost & score adjustment (computeBoostV2 + computeArchetypeBoost)
  ④ Resort by finalScore and trim to limit (12)
  ⑤ Return chunks + rerankMetrics
```

*Step ② SQL lives in `src/lib/perazzi-retrieval.ts` → `fetchV2Chunks()`.*

---

## 3  Boost formula details

```
finalScore = baseScore  // 1 – distance
            + boost     // generic context matching
            + archetypeBoost   // motivational nudge
```

### 3.1  Generic boost (`computeBoostV2`)

| Component               | Typical Δ | Trigger                                                     |
|-------------------------|-----------|-------------------------------------------------------------|
| Mode alignment          | +0.06     | chunk.primary_modes contains runtime mode                   |
| Platform slug match     | +0.10     | `platformSlug` in context or topic list hits chunk.platforms|
| Discipline overlap      | +0.06     | intent topics like `discipline_skeet` match chunk.disciplines|
| Entity alignment        | +0.12-0.15| serialised model slug in `related_entities`                 |
| Topic/tag overlap       | +0.04-0.06| free-form tags / labels intersect hint topics               |
| Keyword presence        | +0.03-0.06| loose fallback: title / path / summary contains keywords    |

Hard clamp: **boost ∈ [-0.1 … +0.5]** so similarity still dominates.

### 3.2  Archetype boost (`computeArchetypeBoost`)

```
alignment   = Σ weights(userVector) where key ∈ chunk.archetype_bias
specialisation = 1 – |biasKeys| / 5
confidence  = (margin / ARCHETYPE_CONF_MIN)  ∈ [0…1]
archetypeBoost = K * alignment * specialisation * confidence
```

Defaults
* `ARCHETYPE_CONF_MIN` (ENV `PERAZZI_ARCHETYPE_CONFIDENCE_MIN`) = 0.08
* `K` (ENV `PERAZZI_ARCHETYPE_BOOST_K`) = 0.08
* Clamp boost to ≤ 0.15

Effect: a chunk explicitly tagged **Analyst** moves up only if the user vector is Analyst-heavy *and* confidence margin is strong; neutral/mixed sessions see no change.

---

## 4  Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PERAZZI_ENABLE_RERANK` | `true` | Master on/off switch.  Set to `false` to return similarity order only. |
| `PERAZZI_RERANK_CANDIDATE_LIMIT` | `60` | Number of chunks pulled from pgvector before rerank (≥ final limit). |
| `PERAZZI_ENABLE_RETRIEVAL_DEBUG` | `false` | When `true`, server logs JSON payloads showing rank movements. |
| `PERAZZI_ARCHETYPE_BOOST_K` | `0.08` | Global coefficient for archetypeBoost. |
| `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` | `0.08` | Margin below which confidenceFactor is clamped to 0. |

These keys must be documented as well in `V2_REDO_infrastructure.md` & `.env.example`.

---

## 5  Tuning guidelines

1. **Observe before changing.** Turn on `PERAZZI_ENABLE_RETRIEVAL_DEBUG` in preview to capture `baseScore`, `boost`, `archetypeBoost`, `finalScore` for top-12 chunks.
2. **Adjust candidateLimit** when corpus grows.  60 → 100 if >200 k chunks.
3. **Keep K small.** Archetype should *nudge*, not override content relevance.
4. **Run validation suite** section 2.4 after any K, limit, or component change.

---

## 6  Change-management rules

1. Any edit to this doc or the boost math **bumps version** (0.1 → 0.x) and is listed in system-manifest changelog.
2. Update env-var table in `V2_REDO_infrastructure.md` if new toggles are added.
3. Add / modify validation tests (`V2_REDO_validation.md` § Rerank tests).  Pull-request cannot merge without green validation in CI.

---

## 7  Changelog

*0.1 (Draft)* – Initial extraction of live boost algorithm, env-var knobs, and tuning guidance from source code (May 2025).