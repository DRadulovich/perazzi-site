## CODEX TASK CARD PASS

### 1) Section 4 — Objective

**Phase 3: Mode inference + consistency (stop fighting yourself).**
Make “mode” a **server-owned, consistently inferred** value (prospect / owner / navigation), then **persist it back into the client context** so the next turn uses the same mode. Also **neutralize the client-only `"heritage"` mode** so it can’t leak into the backend (which only supports `prospect|owner|navigation`). ([GitHub][1])

---

### 2) Repo touchpoints (files + key functions/classes)

**`src/app/api/perazzi-assistant/route.ts`**

* `detectRetrievalHints(...)` call + `effectiveMode` assignment currently expects `hints?.mode` and falls back to `body.context.mode`. ([GitHub][2])
* `validateRequest()` does **not** validate mode values (so invalid strings can slip in). ([GitHub][2])

**`src/lib/perazzi-intents.ts`**

* `export type RetrievalHints = { intents, topics, focusEntities, keywords }` currently has **no mode**. ([GitHub][3])
* `detectRetrievalHints(latestQuestion, context)` is the right centralized place to infer `mode` (Option A). ([GitHub][3])

**`src/components/chat/useChatState.ts`**

* Builds `effectiveContext` for the API request and sends `mode: payload.context?.mode ?? context.mode` (currently untyped string). ([GitHub][4])
* After response, it **does not persist `data.mode`** into context (only archetype + vector). ([GitHub][4])

**Type reality check**

* Backend mode union is only `"prospect" | "owner" | "navigation"`. No `"heritage"`. ([GitHub][1])

---

### 3) Proposed Task Cards (do NOT write the full cards yet)

#### Card count: **4**

---

#### Card #1 — Add `mode` to `RetrievalHints` + infer it in `detectRetrievalHints()` (Option A)

**Scope**

* Extend `RetrievalHints` to include `mode?: PerazziMode` (or `mode: PerazziMode` if we decide it should always be set).
* Implement a small `inferMode()` inside `detectRetrievalHints()` using patterns:

  * **Owner** signals: “my gun”, “serial”, “service”, “maintenance”, “timing”, “repair”, “cleaning”, etc.
  * **Navigation** signals: “where can I find”, “link”, “page”, “show me”, “contact”, “dealer”, etc.
  * Default: **prospect**
* Respect existing context mode as “sticky” *when valid* (e.g., if already owner and no strong navigation signal, keep owner).

**Files to touch**

* `src/lib/perazzi-intents.ts`

**Acceptance criteria**

* `RetrievalHints` type includes `mode` and TypeScript compiles without `any`.
* `detectRetrievalHints()` returns a valid `mode` for:

  * “How often should I service my gun?” → `owner`
  * “Where can I find a dealer / link me to…” → `navigation`
  * “Explain MX8 vs High Tech” → `prospect`
* If `context.mode` is already `owner` or `navigation`, and the message is neutral, mode stays the same (prevents flapping).
* No behavior change to guardrails; this is classification-only.

**Test notes**

* Add a small dev-only self-test block (similar to archetypes) OR verify via quick Node/route smoke:

  * Make 3 manual prompts to `/api/perazzi-assistant` and inspect `mode` in response JSON.

**Dependencies**

* None.

---

#### Card #2 — Route: stop expecting phantom `hints?.mode` + remove `any` by using real `RetrievalHints`

**Scope**

* In `route.ts`, change `const hints: any = ...` to strongly typed `RetrievalHints`.
* Keep `effectiveMode` derivation, but now it should reliably work because hints includes mode.
* Add a tiny runtime safety normalization (optional but recommended): if anything unexpected comes in, clamp to `"prospect"` rather than trusting invalid client strings.

**Files to touch**

* `src/app/api/perazzi-assistant/route.ts`

**Acceptance criteria**

* `route.ts` no longer uses `any` for `hints`.
* `effectiveMode` is always one of `prospect|owner|navigation`.
* If the client sends `context.mode = "heritage"` (or any garbage), server still returns a valid mode (via hints inference / clamping).
* API response schema unchanged (already returns `mode`).

**Test notes**

* `pnpm dev`, then:

  * send a request with a neutral message but `context.mode:"heritage"` and confirm response has `mode:"prospect"` (or whatever your inference chooses), not `"heritage"`.
  * send owner/navigation prompts and confirm response.mode matches.

**Dependencies**

* Card #1.

---

#### Card #3 — Client: persist server-returned `mode` into chat context

**Scope**

* In `useChatState.ts`, after `const data = await res.json()`, update `setContext` so:

  * `context.mode = data.mode` when defined
* Keep existing archetype/archetypeVector persistence behavior intact.

**Files to touch**

* `src/components/chat/useChatState.ts`

**Acceptance criteria**

* After a response includes `mode`, local chat context stores it (and persists to localStorage).
* Next request payload includes the updated `context.mode` (visible in DevTools Network request body).
* No breaking changes to the UI; existing chat still works.

**Test notes**

* Run locally, open DevTools:

  * Ask an owner-ish question (“I need service/maintenance for my gun…”) → response mode should become `owner`
  * Immediately ask a follow-up → confirm request includes `context.mode:"owner"`

**Dependencies**

* Card #2 recommended (so server mode is reliable), but this card can technically land anytime.

---

#### Card #4 — Client: resolve `"heritage"` mode (map to `"navigation"` before sending)

**Scope**

* Before sending API requests, normalize outgoing `context.mode`:

  * If `"heritage"` → send `"navigation"`
  * If unknown string → omit / fall back to existing safe value
* Keep any “heritage-ness” expressed via `pageUrl` (which already drives archetype signals like `page:heritage`). ([GitHub][5])

**Files to touch**

* `src/components/chat/useChatState.ts`

**Acceptance criteria**

* If UI context contains `mode:"heritage"`, the API request sends `mode:"navigation"` (verify in Network payload).
* Backend never receives `mode:"heritage"` from this client path anymore.
* No changes to API response schema or chat rendering.

**Test notes**

* Force context.mode in dev (or via whatever UI sets it) to `"heritage"`, send a message, confirm payload mode is `"navigation"`.

**Dependencies**

* None (but pairs nicely with Card #3).

---

### 4) External / Manual Tasks (outside the repo)

* **None required** (no DB, no Supabase, no ingestion).
* Optional: if you deploy to Vercel, just deploy normally—no env var changes needed for this phase.

---

### 5) Risks & gotchas

* Mode inference heuristics can misclassify edge cases (“service” could be owner or prospect). Mitigation: keep weights simple, prefer stickiness from previous valid context, and only switch modes on strong signals.
* If you map `"heritage" → "navigation"`, ensure you still get “heritage tone” via **pageUrl/topics** (you already do: `pageUrl` containing heritage/history boosts legacy/loyalist). ([GitHub][5])
* Don’t let mode changes affect guardrails: pricing/legal/gunsmithing blocks stay upstream and unchanged.

---

### 6) Ready to write Task Cards checklist

Before generating Card #1:

* Confirm we’re implementing **Option A** (mode lives in `RetrievalHints` + `detectRetrievalHints()`), which matches the current route expectation. ([GitHub][2])
* Confirm backend mode union remains exactly `prospect|owner|navigation` (no “heritage” in backend). ([GitHub][1])
* You can run `pnpm dev` and hit `/api/perazzi-assistant` locally (for quick mode verification).
* You’re ready to inspect DevTools Network payloads (for client context persistence + heritage mapping).

(Stopping here. When you say **“Create Task Card #1”**, I’ll write the single detailed Codex Task Card for Card #1 only.)

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/types/perazzi-assistant.ts "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/api/perazzi-assistant/route.ts "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-intents.ts "raw.githubusercontent.com"
[4]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/chat/useChatState.ts "raw.githubusercontent.com"
[5]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-archetypes.ts "raw.githubusercontent.com"
