## CODEX TASK CARD PASS

### 1) Section 6 — Objective

Fix the client bug where **server-returned `archetype: null` does not actually clear the stored archetype label**, because the client uses `??` fallback logic. Also ensure the **reset phrase clears both `archetype` and `archetypeVector`** and that we don’t accidentally rehydrate stale values via fallback merging + localStorage persistence.

---

### 2) Repo touchpoints

**File:** `src/components/chat/useChatState.ts` ([GitHub][1])

Key locations:

* **Reset detection + effectiveContext construction** (already sets `archetype` / `archetypeVector` to `null` when reset phrase matches). ([GitHub][1])
* **Post-response context update** currently uses:

  * `archetype: data.archetype ?? prev.archetype ?? null`
  * `archetypeVector: data.archetypeBreakdown?.vector ?? prev.archetypeVector ?? null`
    This is the bug: `??` treats `null` as fallback, so `data.archetype = null` cannot clear prior state. ([GitHub][1])
* **LocalStorage hydration** merges stored context into current context on mount, so if the post-response update reintroduces stale archetype, it will persist again. ([GitHub][1])

---

### 3) Proposed Task Cards (do NOT write the full cards yet)

**Card count: 1**

#### Card #1 — Fix null-clearing semantics for archetype + vector (and make reset “sticky clear”)

**Scope**

* Replace nullish fallback for `archetype` so **explicit `null` from server clears** the stored value.

  * Only fall back to `prev.archetype` when `data.archetype === undefined`, not when it is `null`.
* Apply the same rule to `archetypeVector` (only fall back when the server didn’t send one).
* Ensure the **reset phrase** keeps `archetype` and `archetypeVector` cleared and doesn’t rehydrate from the response merge step.
* Keep everything else in `useChatState` untouched.

**Files to touch**

* `src/components/chat/useChatState.ts`

**Acceptance criteria**

* If the server response includes `archetype: null`, the stored client context becomes `archetype: null` (no “cling to previous”). ([GitHub][1])
* If the server response omits `archetype` (undefined), the client keeps the previous archetype (backward compatible safety).
* Reset phrase (“Please clear your memory of my archetype.”) results in:

  * `context.archetype === null`
  * `context.archetypeVector === null`
  * and the post-response update does **not** reintroduce old values.
* No UI regression: chat still sends/receives messages; localStorage continues to persist normally.

**Test notes**

* Local DevTools verification:

  * Trigger a mixed-confidence response where server returns `archetype:null` and confirm context clears immediately.
  * Trigger reset phrase and confirm localStorage stored context has archetype/vector null.
* Optional: add a dev-only assertion block (not required) that simulates the merge logic.

**Dependencies**

* None.

---

### 4) External / Manual Tasks

* None (no DB/Supabase, no env vars).

---

### 5) Risks & gotchas

* In JavaScript, **`null` and `undefined` behave differently with `??`**, and we *want* to treat them differently here. A careless refactor could reintroduce the bug.
* Make sure we don’t accidentally wipe archetype when the server truly didn’t send the field (backward compatibility).

---

### 6) Ready to write Task Cards checklist

Before generating Card #1:

* Confirm we’re editing the exact post-response merge line in `useChatState.ts` (`archetype: data.archetype ?? prev.archetype ?? null`). ([GitHub][1])
* Confirm reset phrase logic is still in `sendMessage` (it is). ([GitHub][1])
* You can run locally and inspect:

  * Network response JSON (does it return `archetype: null` on mixed turns?)
  * LocalStorage entry `perazzi-chat-history` to verify persistence.

When you say **“Create Task Card #1”**, I’ll write the single detailed Codex Task Card for that card only.

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/chat/useChatState.ts "raw.githubusercontent.com"
