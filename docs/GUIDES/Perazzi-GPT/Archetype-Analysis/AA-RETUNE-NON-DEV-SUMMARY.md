Below is a **non-dev, phase-by-phase explanation** of what all changed after completing **`docs/ARCHETYPE-ANALYSIS/Roadmap-ZR1-ArchetypeAnalysis.md`**

---

# Phase 1 & Retrieval Reranking (“Big horsepower gain”)

## Task Card 1 & Pull More Candidates + Metadata

### Task Card 1 "Non-Dev" Description:

#### Instead of grabbing only the top 12 “closest matches,” the system now pulls a bigger pool of candidates first (example: 60). It also grabs extra “labels” about each candidate (like mode/platform/discipline/archetype bias) so it can make smarter decisions later when it re-orders them. Think: **pull more books off the shelf, then sort them with context**, not just by title similarity.

### Task Card 1 Important File Paths:

#### `src/lib/perazzi-retrieval.ts`

##### Important Sections:

###### `fetchV2Chunks()` — `candidateLimit` vs final limit (`CHUNK_LIMIT`)

###### SQL SELECT — includes extra chunk/document metadata needed for rerank

###### Visibility/status filters — ensures only allowed/public/active content is retrieved

---

## Task Card 2 & JSONB Metadata Parsing Helpers

### Task Card 2 "Non-Dev" Description:

#### The database sometimes returns metadata arrays in different shapes (array, string, null, etc.). This task made a “normalizer” so the reranker always sees clean, consistent lists. That prevents weird mismatches (“Owner” vs “owner”, spacing differences, etc.) from breaking scoring.

### Task Card 2 Important File Paths:

#### `src/lib/perazzi-retrieval.ts`

##### Important Sections:

###### `parseJsonbStringArray(...)` — turns messy DB JSON into consistent lowercase string arrays

---

## Task Card 3 & Add Rerank Boost Logic (“ComputeBoostV2”)

### Task Card 3 "Non-Dev" Description:

#### After the system pulls candidate chunks, it gives small bonus points to chunks that fit the user’s **current context** and **question hints**:

* matches the current “mode” (prospect/owner/navigation)
* matches platform/model/discipline/audience tags
* matches detected topics/entities/keywords
  These boosts are intentionally small — they don’t replace embeddings; they **fine-tune** the ordering.

### Task Card 3 Important File Paths:

#### `src/lib/perazzi-retrieval.ts`

##### Important Sections:

###### `computeBoostV2(...)` — small additive boosts for mode/platform/discipline/entities/topics/keywords

###### Rerank “context + hints” wiring — ensures boosts use real request context

---

## Task Card 4 & Archetype Alignment Boost (“ZR1 secret sauce”)

### Task Card 4 "Non-Dev" Description:

#### Adds a bonus when a chunk is explicitly relevant to certain archetypes *and* the user’s current archetype vector aligns with that chunk.

Important nuance: if a chunk is “general purpose” (biased toward all archetypes), it gets **no archetype boost** — archetype shouldn’t distort generic truth.

### Task Card 4 Important File Paths:

#### `src/lib/perazzi-retrieval.ts`

##### Important Sections:

###### `computeArchetypeBoost(...)` — uses user archetype vector + chunk archetype bias + confidence scaling

###### “General-purpose chunk” rule — no boost if chunk bias is broad

---

## Task Card 5 & Final Rerank Scoring + Return Top 12

### Task Card 5 "Non-Dev" Description:

#### Each candidate chunk gets a final score:

* **baseScore** (embedding similarity turned into “higher is better”)
* * **boost** (context/hints alignment)
* * **archetypeBoost** (identity alignment when specialized)
    Then we sort by final score and return the top 12. This is the core reranking behavior.

### Task Card 5 Important File Paths:

#### `src/lib/perazzi-retrieval.ts`

##### Important Sections:

###### Rerank scoring pipeline — `baseScore`, `boost`, `archetypeBoost`, `finalScore`

###### Final sort + slice — returns only the top `CHUNK_LIMIT`

---

## Task Card 6 & Feature-Flag Retrieval Debug Logging (“Dyno graphs”)

### Task Card 6 "Non-Dev" Description:

#### Debug logs were previously always-on and noisy. Now they only appear when you intentionally enable a debug flag. When enabled, logs show a clean breakdown of *why* each chunk ranked where it did — but never logs chunk text content.

### Task Card 6 Important File Paths:

#### `src/lib/perazzi-retrieval.ts`

##### Important Sections:

###### `PERAZZI_ENABLE_RETRIEVAL_DEBUG` gate

###### Debug output format — includes scores/IDs, **never chunk content**

---

## Task Card 7 & Ensure Retrieval Uses Current Turn’s Mode + Archetype Vector

### Task Card 7 "Non-Dev" Description:

#### Prevents a subtle “one-turn-late” problem: the server might update your archetype vector for the current message, but retrieval was still using the old vector. This task makes retrieval use the **current request’s** resolved mode + updated archetype vector immediately.

### Task Card 7 Important File Paths:

#### `src/app/api/perazzi-assistant/route.ts`

##### Important Sections:

###### Construction of the `retrievalBody` before calling `retrievePerazziContext()`

###### `context.mode = effectiveMode` and `context.archetypeVector = archetypeBreakdown.vector`

---

# Phase 2 & Archetype Reliability + Confidence Gating

## Task Card 1 & Fix False Positives (Token/Boundary Matching)

### Task Card 1 "Non-Dev" Description:

#### Archetype detection used to match substrings, which caused nonsense (“broadcast” accidentally matching “cast”). This task makes single-word matching behave like real word matching, while still allowing multi-word phrases (“point of impact”) to match reliably.

### Task Card 1 Important File Paths:

#### `src/lib/perazzi-archetypes.ts`

##### Important Sections:

###### `messageIncludesAny(...)` — now tokenizes message and checks real word membership

###### Phrase handling — multi-word phrases still match correctly

---

## Task Card 2 & Snap Gating (Allow `primary = null`)

### Task Card 2 "Non-Dev" Description:

#### Archetype is now treated like a “confidence-based identity signal”:

* If one archetype clearly wins, we label a primary archetype.
* If the top two are too close, we declare “mixed/balanced” (primary becomes `null`) **but we still keep the vector** for soft weighting.

### Task Card 2 Important File Paths:

#### `src/lib/perazzi-archetypes.ts`

##### Important Sections:

###### Winner/runner-up computation from the vector

###### `PERAZZI_ARCHETYPE_CONFIDENCE_MIN` threshold

###### `primary = null` behavior while keeping the vector

---

## Task Card 3 & Route Propagation (`effectiveArchetype` Can Be Null)

### Task Card 3 "Non-Dev" Description:

#### If archetype confidence is low, the system no longer “pretends” it has a strong identity. It stops applying archetype-specific tone guidance in those cases — so the assistant won’t cling to yesterday’s archetype when the current message is neutral or mixed.

### Task Card 3 Important File Paths:

#### `src/app/api/perazzi-assistant/route.ts`

##### Important Sections:

###### `effectiveArchetype` selection — uses snap-gated primary (can be null)

###### System prompt assembly — omits archetype tone guidance when archetype is null

---

## Task Card 4 & Reduce Non-Identity Priors (Make Priors Conditional)

### Task Card 4 "Non-Dev" Description:

#### Mode/page/model cues used to bias archetype too strongly. This task makes those “priors” act like gentle nudges only when the message itself is vague. When the user’s language is strong (“point of impact”, “trigger weight”), language signals dominate.

### Task Card 4 Important File Paths:

#### `src/lib/perazzi-archetypes.ts`

##### Important Sections:

###### Prior signal functions (mode/page/model)

###### Language signal function

###### Prior dampening logic — scale priors down when language/profile evidence is strong

---

## Task Card 5 & Add Intent/Topic Hint Signals to Archetype Scoring

### Task Card 5 "Non-Dev" Description:

#### The system already detects “what the user is trying to do” (intents/topics). This task feeds those hints into archetype scoring as **small extra signals**. It improves stability because structured hints are often cleaner than raw keyword matching — but the weights are small so they won’t overpower the user’s actual words.

### Task Card 5 Important File Paths:

#### `src/lib/perazzi-archetypes.ts`

#### `src/app/api/perazzi-assistant/route.ts`

##### Important Sections:

###### `ArchetypeContext` now includes `intents` and `topics`

###### Hint-based archetype nudges (`applyHintSignals` / equivalent)

###### Route wiring: passing `hints.intents/topics` into `archetypeContext`

---

# Phase 3 & Mode Inference + Consistency

## Task Card 1 & Add `mode` to RetrievalHints + Infer in `detectRetrievalHints()`

### Task Card 1 "Non-Dev" Description:

#### The system now reliably decides which “mode” the user is in:

* **prospect** (shopping/comparison)
* **owner** (service/maintenance/my gun)
* **navigation** (find a page/dealer/contact)
  This mode helps retrieval and templates stay aligned with the user’s actual intent.

### Task Card 1 Important File Paths:

#### `src/lib/perazzi-intents.ts`

##### Important Sections:

###### `RetrievalHints` now includes `mode`

###### `inferMode(...)` logic — owner vs navigation vs prospect patterns

###### “Stickiness” — keeps mode stable when message is neutral

---

## Task Card 2 & Route: Type Hints + Clamp Mode

### Task Card 2 "Non-Dev" Description:

#### The API route stops trusting random/invalid client modes and only allows the three supported modes. So if the client sends something weird (like `"heritage"`), the server clamps it to a safe valid mode and continues.

### Task Card 2 Important File Paths:

#### `src/app/api/perazzi-assistant/route.ts`

##### Important Sections:

###### `hints` is typed (no more `any`)

###### `normalizeMode(...)` / clamping logic for `effectiveMode`

---

## Task Card 3 & Client: Persist Server Mode in Context

### Task Card 3 "Non-Dev" Description:

#### Once the server decides the correct mode for a turn, the client stores it. That prevents the next message from accidentally reverting to an old mode and keeps the conversation consistent.

### Task Card 3 Important File Paths:

#### `src/components/chat/useChatState.ts`

##### Important Sections:

###### Post-response `setContext(...)` — now persists `mode: data.mode`

---

## Task Card 4 & Client: Map `"heritage"` → `"navigation"` Before Sending

### Task Card 4 "Non-Dev" Description:

#### The UI may internally use a `"heritage"` category, but the backend doesn’t support that as a true mode. This task makes the client translate `"heritage"` into `"navigation"` before calling the API, so the backend stays consistent and never receives invalid mode strings.

### Task Card 4 Important File Paths:

#### `src/components/chat/useChatState.ts`

##### Important Sections:

###### Outgoing mode normalizer (`normalizeOutgoingMode` or equivalent)

###### `effectiveContext.mode` assignment before the fetch call

---

# Phase 4 & Archetype Shapes Answer Structure (Templates)

## Task Card 1 & Archetype-Aware Template Map + Neutral Fallback

### Task Card 1 "Non-Dev" Description:

#### Templates are now “intent + archetype” aware. Same intent, different structure:

* models + analyst → comparison table + decision criteria + how-to-test checklist
* models + achiever → performance path + training implications
* service + legacy → preservation + documentation + authorized service emphasis
* bespoke + prestige → curated options + discreet next step (no pricing)
  If archetype confidence is mixed/balanced, the system uses the existing neutral templates.

### Task Card 1 Important File Paths:

#### `src/lib/perazzi-intents.ts`

##### Important Sections:

###### Neutral `TEMPLATE_GUIDES` (unchanged behavior when archetype is null)

###### Archetype variant map (intent → archetype → template)

###### `buildResponseTemplates(hints, archetype?)` selection logic

---

## Task Card 2 & Route Wiring: Pass `effectiveArchetype` Into Template Selection

### Task Card 2 "Non-Dev" Description:

#### This “turns on” the new templates by giving the template picker the current archetype. If archetype is null, the template picker naturally falls back to neutral.

### Task Card 2 Important File Paths:

#### `src/app/api/perazzi-assistant/route.ts`

##### Important Sections:

###### `const responseTemplates = buildResponseTemplates(hints, effectiveArchetype);`

###### System prompt block where “response structure guidelines” are injected

---

# Phase 5 & Fix Client Reset Bug (Archetype Label Won’t Clear)

## Task Card 1 & Fix Null-Clearing + Sticky Reset

### Task Card 1 "Non-Dev" Description:

#### Previously, even if the server said `archetype: null`, the client treated that as “missing” and kept the old archetype. This task fixes that logic so **explicit null actually clears** the stored archetype. It also ensures the reset phrase clears both the archetype label and the vector and doesn’t accidentally bring them back.

### Task Card 1 Important File Paths:

#### `src/components/chat/useChatState.ts`

##### Important Sections:

###### Post-response context merge: distinguish `undefined` vs `null`

###### Reset handling: when reset phrase is used, force `archetype` and `archetypeVector` to remain `null`

---

# Phase 6 & Logging Upgrades for Tuning (“Turn it into science”)

## Task Card 1 & Retrieval Returns `rerankMetrics`

### Task Card 1 "Non-Dev" Description:

#### Retrieval now returns a compact “scorecard” that explains *why* chunks were ranked the way they were: rerank on/off, candidateLimit used, and for each top chunk: base similarity score + boost breakdown + final score. This is built specifically for logging/tuning and **contains no chunk text**.

### Task Card 1 Important File Paths:

#### `src/lib/perazzi-retrieval.ts`

##### Important Sections:

###### `RerankMetrics` type/object

###### `retrievePerazziContext()` return shape now includes `rerankMetrics`

###### `fetchV2Chunks()` populates scoring breakdown (IDs + numbers only)

---

## Task Card 2 & Route Logs Rerank + Archetype Confidence Telemetry

### Task Card 2 "Non-Dev" Description:

#### The system now saves tuning-friendly metadata into your AI interaction logs:

* reranking: enabled?, candidateLimit, top chunk scoring breakdown
* archetype: winner/runner-up, confidence margin, snapped vs mixed
  It logs these both for normal requests and for “blocked” guardrail requests (where appropriate), without changing the API response.

### Task Card 2 Important File Paths:

#### `src/app/api/perazzi-assistant/route.ts`

##### Important Sections:

###### `AiInteractionContext.metadata` construction/merge

###### Archetype confidence metrics computation (winner/runner-up/margin/snapped)

###### Inclusion of `retrieval.rerankMetrics` into metadata

###### Guardrail-block `logAiInteraction(...)` metadata block

---

## What’s next (non-dev)

At this point, the system is **built and instrumented**. The work becomes:

* Run your baseline prompt suite and compare outputs.
* Use the new logs (rerank + archetype confidence) to see:

  * when rerank is helping vs hurting
  * when archetype is snapping too often (or not enough)
  * which boosts are doing the real work
* Tune weights/thresholds in small steps and re-test.

If you want, I can also give you a “Phase 7 tuning playbook” written for non-devs: what to change first, what numbers to watch, and how to avoid breaking things while tuning.
