# PerazziGPT v2 – Concierge API Contract

> Version: 0.2 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-3/V2_REDO_api-contract.md`  

Endpoint: `POST /api/perazzi-assistant`

This is the primary API route for PerazziGPT v2.  
The client sends chat messages and optional context; the server:

- Applies the v2 behavior spec (modes, archetypes, guardrails, voice).  
- Runs RAG queries against the v2 Supabase corpus.  
- Calls `gpt-4.1` to generate the answer.  
- Returns the answer, citations, guardrail status, and (in dev) the mode + archetype used.

---

## 1. Request

```jsonc
{
  "sessionId": "optional-session-id",
  "messages": [
    { "role": "user", "content": "Help me choose between MX2000 and High Tech." }
  ],
  "context": {
    "pageUrl": "/shotguns",
    "modelSlug": "mx2000",
    "platformSlug": "mx",
    "mode": "prospect",
    "locale": "en-US",
    "archetype": null,
    "archetypeVector": { "loyalist": 0.2, "prestige": 0.2, "analyst": 0.2, "achiever": 0.2, "legacy": 0.2 }
  },
  "summaryIntent": null
}
```

### 1.1 `messages`

- Follows the standard OpenAI Chat API format.  
- Client-supplied `system` messages are **ignored/dropped** for safety; only `user` and prior `assistant` messages are kept when constructing the model prompt.  
- The last `user` message drives retrieval hints, archetype inference, and mode inference when `context.mode` is missing or invalid.

### 1.2 `context` (optional)

```ts
interface PerazziContext {
  pageUrl?: string | null;   // e.g. "/shotguns/mx8"
  modelSlug?: string | null; // e.g. "mx8", if on a specific model page
  platformSlug?: string | null; // e.g. "mx"
  mode?: "prospect" | "owner" | "navigation" | null;
  locale?: string | null;    // e.g. "en-US", "it-IT"
  archetype?: "loyalist" | "prestige" | "analyst" | "achiever" | "legacy" | null;
  archetypeVector?: Record<"loyalist" | "prestige" | "analyst" | "achiever" | "legacy", number> | null;
}
```

- `mode`:
  - Only `"prospect"`, `"owner"`, or `"navigation"` are accepted; invalid/legacy values are ignored and the server defaults to `"prospect"`.
  - The server also infers mode from hints (latest user message + context) and clamps any invalid input to the allowed set.
- `archetype`:
  - Optional hint; the runtime currently infers archetype internally (see §4).
  - For explicit override in dev/testing, use the control phrase described in §4.3.
- `archetypeVector`:
  - Optional **soft signal** carrying the previous archetype vector. The server uses this as a prior (`previousVector`) when smoothing across turns.
- `platformSlug`:
  - Optional platform hint (e.g., `"mx"`) used by retrieval/templates.

### 1.3 Other top-level fields

```ts
interface PerazziAssistantRequest {
  messages: ChatMessage[];
  sessionId?: string;
  context?: PerazziContext;
  summaryIntent?: string | null;
}
```

- `sessionId`:
  - Optional opaque identifier at the **top level** (not inside `context`). Used for logging and continuity, including archetype smoothing.
- `summaryIntent`:
  - Optional string used by some internal callers as a pre-labeled intent; currently passed through without changing runtime behavior.

---

## 2. Response

```json
{
  "answer": "…",
  "citations": [
    { "chunkId": "…", "title": "…", "sourcePath": "…", "excerpt": "…" }
  ],
  "guardrail": { "status": "ok", "reason": null },
  "intents": ["models"],
  "topics": ["platforms"],
  "templates": ["…"],
  "similarity": 0.42,
  "mode": "prospect",
  "archetype": null,
  "archetypeBreakdown": {
    "primary": null,
    "vector": { "loyalist": 0.2, "prestige": 0.2, "analyst": 0.2, "achiever": 0.2, "legacy": 0.2 },
    "reasoning": "…",
    "signalsUsed": ["…"]
  }
}
```

### 2.1 Fields

- `answer` (string)  
  - Final assistant reply. Non-streaming in current runtime. If a guardrail triggers, the refusal or low-confidence message is placed here.

- `citations` (array)

  ```ts
  interface Citation {
    chunkId: string;
    title: string;
    sourcePath: string;
    excerpt?: string;
  }
  ```

  - Shape matches `mapChunkToCitation()` in the route: chunk ID, title, source path, and an excerpt trimmed server-side.

- `guardrail` (object)

  ```ts
  interface GuardrailInfo {
    status: "ok" | "low_confidence" | "blocked";
    reason: string | null;   // e.g., "retrieval_low", "pricing", "gunsmithing", "scope"
  }
  ```

  - `status` reflects retrieval confidence or hard guardrails.  
  - `reason` is the code for the guardrail decision; no separate `message` field is returned.

- `intents` / `topics` / `templates` (arrays)
  - Internal intent/topic/tone hints used to build the prompt and structure responses; echoed so clients can observe routing choices.

- `similarity` (number, optional)
  - Max similarity score from retrieval; present in current responses for observability.

- `mode` (string, optional)
  - Mode the server actually used: `"prospect"`, `"owner"`, or `"navigation"`. Invalid inputs are clamped and the resolved mode is echoed here.

- `archetype` (string | null, optional)
  - Primary archetype lens applied for tone; may be `null` on mixed/balanced turns or when confidence is low.

- `archetypeBreakdown` (object, optional)

  ```ts
  interface ArchetypeBreakdown {
    primary: "loyalist" | "prestige" | "analyst" | "achiever" | "legacy" | null;
    vector: Record<"loyalist" | "prestige" | "analyst" | "achiever" | "legacy", number>;
    reasoning?: string;
    signalsUsed?: string[];
  }
  ```

  - `primary` may be `null` when confidence margin is below threshold; `vector` still reflects the soft weighting used for tone/rerank.  
  - `reasoning` and `signalsUsed` are optional debug-friendly notes returned by the runtime today.

### 2.2 Practical examples

Minimal request with the current contract:

```bash
curl -X POST http://localhost:3000/api/perazzi-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-session",
    "messages": [{ "role": "user", "content": "What is the difference between MX2000 and High Tech?" }],
    "context": {
      "pageUrl": "/shotguns",
      "modelSlug": "mx2000",
      "platformSlug": "mx",
      "mode": "prospect",
      "archetypeVector": { "loyalist": 0.2, "prestige": 0.2, "analyst": 0.2, "achiever": 0.2, "legacy": 0.2 }
    }
  }'
```

Minimal response shape (keys and types as returned today):

```json
{
  "answer": "…",
  "citations": [{ "chunkId": "…", "title": "…", "sourcePath": "…", "excerpt": "…" }],
  "guardrail": { "status": "ok", "reason": null },
  "intents": [],
  "topics": [],
  "templates": [],
  "similarity": 0.0,
  "mode": "prospect",
  "archetype": null,
  "archetypeBreakdown": { "primary": null, "vector": { "loyalist": 0.2, "prestige": 0.2, "analyst": 0.2, "achiever": 0.2, "legacy": 0.2 } }
}
```

---

## 3. Server Behavior

### 3.1 Model & generation

- Model: **`gpt-4.1`**  
- Temperature: ~**0.3–0.4**  
- Max completion tokens: ~**800–1200** (tuned to allow nuanced, but not rambling, answers).  
- System prompt:
  - Constructed from Phase 1 docs (assistant spec, guardrails, voice, use-case depth).  
  - Client-provided `system` messages are ignored in v2.0.

### 3.2 Retrieval (Supabase + pgvector)

- The server:
  1. Embeds the latest user message using `text-embedding-3-large`.  
  2. Queries Supabase:
     - `public.embeddings` joined to `chunks` and `documents`.  
     - Uses **HNSW** index on `embedding::halfvec(3072)` with cosine similarity.  
     - Applies filters:
       - `documents.status = 'active'`  
       - `chunks.visibility = 'public'`  
       - Optional: `category` / `doc_type` depending on mode and context (e.g., `making-a-perazzi` for craft questions).  
       - Optional: mild bias based on `primary_modes` and (internally) archetype.  
  3. Collects top-k chunks (default `k = 12`), passes them as context to `gpt-4.1`.
- The server tracks the maximum similarity score across the retrieved chunks to inform guardrail decisions.

### 3.3 Low confidence behavior

- Low-confidence threshold: configurable, e.g. `PERAZZI_LOW_CONF_THRESHOLD` (default 0.1–0.2).  
- If `maxSimilarity < threshold`:
  - Set `guardrail.status = "low_confidence"`.  
  - `guardrail.reason = "retrieval_low"`.  
  - The system prompt instructs the model to:
    - Lead with uncertainty: “I’m not confident I have enough information to answer this fully.”  
    - Avoid inventing details.  
    - Suggest next steps (contact Perazzi, rephrase, etc.).  
  - Partial answers may still be given **if** clearly supported by retrieved chunks, but must explicitly signal uncertainty.

### 3.4 Guardrail blocking

- If the user’s question triggers hard guardrails (pricing, detailed gunsmithing, out-of-scope firearms, legal issues):
  - Set `guardrail.status = "blocked"`.  
  - Set `guardrail.reason` to the appropriate code (`pricing`, `gunsmithing`, `scope`, etc.).  
  - `answer` should be an approved refusal/deflection message aligned with Phase 1 docs.  
  - No speculative or partial answers revealing forbidden information.

### 3.5 Logging (server-side only)

- The server may log:
  - User message and context.  
  - Top chunk IDs and similarity scores.  
  - Guardrail status & reason.  
  - Archetype classification metadata (winner, runner-up, margin) and rerank metrics.  
  - Token usage (prompt/completion).  
- These logs are **not** included in the HTTP response.

### 3.6 Observability (server-side tuning signals)

- Rerank scoring breakdowns and archetype confidence metrics are recorded in server logs/DB metadata for tuning.
- None of these observability fields are exposed in the HTTP response; only `similarity`, `mode`, `archetype`, and `archetypeBreakdown` are returned publicly.

---

## 4. Modes & Archetypes in the API

### 4.1 Mode handling

- `context.mode` is normalized to `"prospect"`, `"owner"`, or `"navigation"`.
- If missing or invalid, the server infers mode from hints (latest user message plus `pageUrl`/`modelSlug`/`platformSlug` and detected intents) and defaults to `"prospect"`.
- Legacy `"auto"` is not supported; invalid inputs are simply clamped to the allowed set.
- The final `mode` used is always returned in the response.

### 4.2 Archetype handling (internal + dev)

- Archetype is inferred from language and context, combined with any prior vector passed in `context.archetypeVector`.
- `context.archetype` can be supplied as a hint, but the runtime derives the effective archetype internally; tone-only, not fact-changing.
- `archetypeBreakdown.primary` may be `null` when confidence is low; `vector` still carries the weights used for tone/rerank smoothing.
- `archetype` in the response may therefore be `null` on mixed/balanced turns.
- The server must **never** change facts or safety advice based on archetype—only tone and emphasis (as per `V2_REDO_voice-calibration.md` and `V2_REDO_assistant-spec.md`).

### 4.3 Manual archetype override via user phrase (dev feature)

In dev (and optionally in early beta):

- If the latest user message **exactly matches** the pattern:

  > `Please change my archetype to <archetype>.`

  where `<archetype>` is one of:

  - `Loyalist`  
  - `Prestige`  
  - `Analyst`  
  - `Achiever`  
  - `Legacy`  

  (case-insensitive, trailing period optional)

- Then the server:

  1. Interprets this as a **control command**, not a normal QA message.  
  2. Sets the archetype for this interaction to the requested value (and reflects it in `archetypeBreakdown`).  
  3. Returns a simple acknowledgment answer, e.g.:

     ```json
     {
       "answer": "Understood. I’ll answer from the perspective of an Analyst from now on.",
       "mode": "prospect",
       "archetype": "analyst",
       "archetypeBreakdown": { "primary": "analyst", "vector": { "loyalist": 0, "prestige": 0, "analyst": 1, "achiever": 0, "legacy": 0 } },
       "citations": [],
       "guardrail": { "status": "ok", "reason": null },
       "intents": [],
       "topics": [],
       "templates": [],
       "similarity": 0
     }
     ```

  4. Does **not** perform RAG or call the model for a content answer; this is a lightweight server response.

- This feature is primarily for **dev and testing**:
  - It allows testers to explore how different archetype lenses feel.  
  - Clients should not rely on it for production flows.

---

## 5. Future Streaming

- The route is defined as non-streaming for v2.0.  
- In the future, we can add streaming support via SSE or chunked responses:
  - Same request shape.  
  - Server switches to streaming mode if:
    - `Accept: text/event-stream`, or  
    - a future `options.stream` property or internal flag.

The response structure will remain compatible; only delivery will change.

---

## 6. Versioning & Changes

- Current doc version: **0.2 (Draft)** for the Phase 3 runtime.  
- When fields change, update:
  - The version header.  
  - A short “Changelog” section noting what changed (e.g., model changes, new fields, streaming support).

## 7. Changelog

- 0.2 (Draft):
  - Aligned request/response fields to `PerazziAssistantRequest`/`PerazziAssistantResponse` (sessionId at top level, `context.archetypeVector` added, `mode` limited to `prospect|owner|navigation`).  
  - Updated response contract to the live payload (no `debug` block, citations now `{ chunkId, title, sourcePath, excerpt }`, guardrail `{ status, reason }`).  
  - Documented nullable `archetype`, confidence-gated `archetypeBreakdown`, and removed legacy `"auto"` mode language.  
  - Added observability notes and practical request/response examples.
- 0.1 (Draft): Initial draft.
