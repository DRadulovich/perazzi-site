# PerazziGPT v2 – Concierge API Contract

> Version: 0.1 (Draft)  
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
  "messages": [
    { "role": "system", "content": "optional client system (ignored in v2.0)" },
    { "role": "user", "content": "Help me choose between MX2000 and High Tech." }
  ],
  "context": {
    "pageUrl": "/shotguns",
    "modelSlug": "mx2000",
    "mode": "auto",
    "locale": "en-US",
    "sessionId": "optional-session-id",
    "archetype": null,
    "debug": true
  }
}
```

### 1.1 `messages`

- Follows the standard OpenAI Chat API format.  
- In v2.0, **client-supplied `system` messages are ignored** for safety.
  - The server always prepends its own canonical system prompt built from:
    - `V2_REDO_assistant-spec.md`  
    - `V2_REDO_non-negotiable-guardrails.md`  
    - `V2_REDO_voice-calibration.md`  
    - `V2_REDO_use-case-depth.md`  

The last `user` message is what we use for:

- Mode classification (if `mode: "auto"`),  
- Archetype inference (unless overridden),  
- Retrieval query embedding.

### 1.2 `context` (optional)

```ts
interface PerazziContext {
  pageUrl?: string | null;   // e.g. "/shotguns/mx8"
  modelSlug?: string | null; // e.g. "mx8", if on a specific model page
  mode?: "prospect" | "owner" | "navigation" | "auto"; // default "auto"
  locale?: string | null;    // e.g. "en-US", "it-IT"
  sessionId?: string | null; // optional conversation/session identifier
  archetype?: "loyalist" | "prestige" | "analyst" | "achiever" | "legacy" | null;
  debug?: boolean;           // if true, include extra debug info in response
}
```

- `mode`:
  - `"auto"` (default): server infers mode from the user message and context.  
  - `"prospect"`, `"owner"`, `"navigation"`: hints that may override or bias mode detection.
- `archetype`:
  - Optional override for the current request.  
  - Typically `null` and inferred internally, but in **dev** we also support a manual override phrase (see §4.3).
- `sessionId`:
  - Optional opaque string used to tie multiple requests together for future stateful behavior (e.g., remembered archetype).  
- `debug`:
  - If `true`, response may include additional debug info (`debug` block) for dev tools.

---

## 2. Response

```json
{
  "answer": "calm concierge answer here...",
  "mode": "prospect",
  "archetype": "analyst",
  "citations": [
    {
      "chunkId": "7e4dc699-0b09-4d2e-bb36-1f3a2674beef",
      "documentPath": "V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-G_Roles-and-Stations_Checkering.md",
      "headingPath": "Part II > 2-G Checkering > 3.4 Typical Decisions & Tradeoffs",
      "category": "making-a-perazzi",
      "docType": "craftsmanship-handbook"
    }
  ],
  "guardrail": {
    "status": "ok",
    "reason": null,
    "message": null
  },
  "debug": {
    "maxSimilarity": 0.78,
    "topChunks": [
      {
        "chunkId": "7e4dc699-0b09-4d2e-bb36-1f3a2674beef",
        "similarity": 0.78
      }
    ],
    "archetypeSource": "inferred", // or "manual"
    "notes": []
  }
}
```

### 2.1 Fields

- `answer` (string)  
  - The final assistant reply. v2.0 is non-streaming by default; we may add SSE later.

- `mode` (string)  
  - The mode actually used for behavior in this response:
    - `"prospect"`, `"owner"`, or `"navigation"`.  
  - Exposed so the front-end can display or tag responses differently.

- `archetype` (string)  
  - The archetype lens used for this response:
    - `"loyalist"`, `"prestige"`, `"analyst"`, `"achiever"`, `"legacy"`.  
  - In **dev**, it is returned explicitly so you and early testers can see which lens is active.  
  - In production, you may choose to hide this field or gate it behind `debug`.

- `citations` (array) – optional but recommended

  ```ts
  interface Citation {
    chunkId: string;       // UUID from `chunks.id`
    documentPath: string;  // from `documents.path`
    headingPath?: string;  // from `chunks.heading_path`
    category?: string;     // from `documents.category`
    docType?: string;      // from `documents.doc_type`
  }
  ```

  - The server should include at least the top 1–3 chunks that heavily informed the answer.

- `guardrail` (object)

  ```ts
  interface GuardrailInfo {
    status: "ok" | "low_confidence" | "blocked";
    reason: string | null;   // e.g. "retrieval_low", "pricing", "gunsmithing", "scope"
    message: string | null;  // optional user-facing short explanation
  }
  ```

  - `status`:
    - `"ok"` – no guardrail concerns.  
    - `"low_confidence"` – retrieval signal too weak; answer should be cautious/qualified.  
    - `"blocked"` – we cannot answer (pricing, gunsmithing, legal, etc.).  
  - `reason`:
    - `retrieval_low` – top similarity below configured threshold.  
    - `pricing`, `gunsmithing`, `scope`, etc.  
  - `message` (optional):
    - A short, user-friendly description (e.g., “This question involves gunsmithing work that must be handled by authorized specialists.”).

- `debug` (object, optional)

  - Only present when:
    - `context.debug === true`, or  
    - The server is running in a dev environment.  
  - Contains:
    - `maxSimilarity` – highest similarity score from vector search.  
    - `topChunks` – list of `{ chunkId, similarity }`.  
    - `archetypeSource` – e.g., `"inferred"` or `"manual"`.  
    - `notes` – any extra internal notes for debugging.

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
  - Token usage (prompt/completion).  
- These logs are **not** included in the HTTP response.

---

## 4. Modes & Archetypes in the API

### 4.1 Mode handling

- If `context.mode` is provided:
  - `"prospect"`, `"owner"`, or `"navigation"`:
    - Server uses this as **strong hint** for behavior & retrieval filters.  
  - `"auto"` or omitted:
    - Server infers mode from:
      - user message,  
      - pageUrl,  
      - modelSlug.  

- The final `mode` used is always returned in the response.

### 4.2 Archetype handling (internal + dev)

- By default, archetype is **inferred internally** based on language and behavior over time.  
- If `context.archetype` is provided:
  - Valid values:
    - `"loyalist"`, `"prestige"`, `"analyst"`, `"achiever"`, `"legacy"`.  
  - Server treats that as an explicit override for this request (and may store it per-session if desired).  
  - `archetype` field in the response reflects the lens actually used.
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
  2. Sets the archetype for this session/context to the requested value.
     - e.g., store in memory keyed by `sessionId`, or simply reflect it in the response and let the client reuse it.
  3. Returns a simple acknowledgment answer, e.g.:

     ```json
     {
       "answer": "Understood. I’ll answer from the perspective of an Analyst from now on.",
       "mode": "prospect",
       "archetype": "analyst",
       "citations": [],
       "guardrail": { "status": "ok", "reason": null, "message": null }
     }
     ```

  4. Does **not** perform RAG or call the model for a content answer; this is a lightweight server response.

- This feature is primarily for **dev and testing**:
  - It allows testers to explore how different archetype lenses feel.  
  - In production, you may restrict this behavior or gate it behind `context.debug`.

---

## 5. Future Streaming

- The route is defined as non-streaming for v2.0.  
- In the future, we can add streaming support via SSE or chunked responses:
  - Same request shape.  
  - Server switches to streaming mode if:
    - `Accept: text/event-stream`, or  
    - `context.debug` + some internal flag, or  
    - a future `options.stream` property.

The response structure will remain compatible; only delivery will change.

---

## 6. Versioning & Changes

- This contract is v2.0.  
- When fields change, update:
  - The version header,  
  - A short “Changelog” section noting what changed (e.g., model changes, new fields, streaming support).
