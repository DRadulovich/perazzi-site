Got it — **no user-selectable reasoning**, but **yes user-selectable verbosity**.

This is a **low-to-medium** change: UI + client state + API request type + server clamping + passing `text.verbosity` into the Responses call. The main “work” is making it **persist** (so it doesn’t reset every refresh) and making the server **ignore junk values** (security / cost control).

Below are **full Codex Task Cards** you can run immediately.

---

# CODEX TASK CARD

* **Title:** Add `TextVerbosity` to assistant request context types
* **Goal:** Introduce an explicit, typed verbosity option (`low|medium|high`) that can be carried from the UI → API route safely.
* **Why it matters (1–2 lines):** If the option isn’t typed, it will become “stringly typed” and drift. This keeps both client and server honest.
* **Scope (in / out):**

  * **In:** Add a `TextVerbosity` union type and add `textVerbosity?: TextVerbosity` to the assistant request context type.
  * **Out:** No runtime behavior changes yet; no UI changes.
* **Preconditions:**

  * You’re working on the `GPT-5.2` branch (or a new branch off it).
  * You can locate the canonical request context type used by `/api/perazzi-assistant`.
* **Files to touch (exact paths):**

  * Likely: `src/types/perazzi-assistant.ts` *(or wherever `PerazziAssistantRequest` / `PerazziAssistantContext` lives)*
* **Step-by-step implementation plan (numbered, very explicit):**

  1. In VS Code, search for `export interface PerazziAssistantRequest` or `PerazziAssistantContext`.
  2. Add a new type near the top of that file:

     * `export type TextVerbosity = "low" | "medium" | "high";`
  3. In the context type (the object that contains `mode`, `archetypeVector`, etc.), add:

     * `textVerbosity?: TextVerbosity;`
  4. Ensure this field is **optional** (so older clients don’t break).
  5. Run TypeScript build/typecheck to confirm no errors.
* **Exact code-change guidance (include snippets/pseudocode only where helpful):**

  ```ts
  export type TextVerbosity = "low" | "medium" | "high";

  export interface PerazziAssistantContext {
    // ...existing fields...
    textVerbosity?: TextVerbosity;
  }
  ```
* **Acceptance criteria:**

  * TypeScript compiles cleanly after adding `TextVerbosity`.
  * `textVerbosity` is optional in the request context type.
  * No API response schema changes.
* **Test plan (commands + what to look for):**

  * `pnpm -s typecheck` (or your repo equivalent) → no errors.
* **Rollback plan:**

  * Revert this commit.
* **Notes for Codex (constraints, style rules, pitfalls):**

  * Don’t add reasoning controls to the types. Only verbosity.
  * Keep the field name stable: use `textVerbosity` (maps cleanly to Responses `text.verbosity` later).
    END TASK CARD

Suggested git commit message: `feat(types): add textVerbosity to Perazzi assistant context`

---

# CODEX TASK CARD

* **Title:** Server: clamp `context.textVerbosity` and pass into Responses call as `text.verbosity`
* **Goal:** Make the server honor the user’s selected verbosity (when valid), otherwise fall back to env/default, and pass it into the Responses API call.
* **Why it matters (1–2 lines):** The UI setting does nothing unless the server applies it — and clamping prevents users from sending garbage / unexpected values.
* **Scope (in / out):**

  * **In:** Read `body.context.textVerbosity`, validate against allowlist, compute `effectiveTextVerbosity`, pass into the Responses request.
  * **Out:** No user-selectable reasoning. No API response contract changes.
* **Preconditions:**

  * The perazzi assistant route is already migrated to Responses (or at least has a single AI call site to update).
* **Files to touch (exact paths):**

  * `src/app/api/perazzi-assistant/route.ts`
  * *(Optional)* `.env.example` (only if you want a documented default env var right now)
* **Step-by-step implementation plan (numbered, very explicit):**

  1. Open `src/app/api/perazzi-assistant/route.ts`.
  2. Find where the request body is parsed and `context` is constructed (it likely merges defaults + `body.context`).
  3. Add a small allowlist + normalizer function in the route file:

     * allowed: `"low" | "medium" | "high"`
     * normalize: `String(value).toLowerCase().trim()`
  4. Compute:

     * `requestedVerbosity = body.context?.textVerbosity`
     * `envDefaultVerbosity = process.env.PERAZZI_TEXT_VERBOSITY ?? "medium"`
     * `effectiveVerbosity = requestedVerbosity if valid else env default if valid else "medium"`
  5. When calling your Responses wrapper (or `client.responses.create`), pass:

     * `text: { verbosity: effectiveVerbosity }`
  6. Add a metadata/logging field (recommended):

     * `interactionContext.metadata.textVerbosity = effectiveVerbosity`
       This helps pgpt-insights tuning later.
  7. Ensure guardrail-block paths (if any) still call logging and don’t crash if `context` is missing.
* **Exact code-change guidance (include snippets/pseudocode only where helpful):**

  ```ts
  const normalizeVerbosity = (value: unknown): "low" | "medium" | "high" | null => {
    const v = typeof value === "string" ? value.toLowerCase().trim() : "";
    if (v === "low" || v === "medium" || v === "high") return v;
    return null;
  };

  const envVerbosity = normalizeVerbosity(process.env.PERAZZI_TEXT_VERBOSITY) ?? "medium";
  const requestedVerbosity = normalizeVerbosity(body.context?.textVerbosity);
  const effectiveVerbosity = requestedVerbosity ?? envVerbosity;

  // pass into Responses:
  // text: { verbosity: effectiveVerbosity }
  ```
* **Acceptance criteria:**

  * If client sends `context.textVerbosity="high"`, the server uses `"high"`.
  * If client sends invalid value (e.g. `"LOUD"`), server falls back to env/default and does not error.
  * Reasoning effort remains server-controlled (no user input affects it).
  * API response schema unchanged.
* **Test plan (commands + what to look for):**

  1. `pnpm dev`
  2. Use DevTools → Network:

     * Send a request with `context.textVerbosity="low"` and confirm responses are noticeably more concise.
     * Send a request with `context.textVerbosity="high"` and confirm responses are more detailed.
     * Send a request with invalid verbosity and confirm no crash + default behavior.
  3. If you log metadata, check pgpt-insights row shows `textVerbosity` (optional but recommended).
* **Rollback plan:**

  * Revert this commit.
* **Notes for Codex (constraints, style rules, pitfalls):**

  * Do not expose reasoning controls via request body.
  * Keep clamping logic server-side even if UI is “safe”.
    END TASK CARD

Suggested git commit message: `feat(api): support client-selected textVerbosity (clamped) for Responses calls`

---

# CODEX TASK CARD

* **Title:** Client state: persist `textVerbosity` in chat context + include in API request payload
* **Goal:** Store the user’s verbosity preference in the existing chat context (localStorage-backed), and include it in every `/api/perazzi-assistant` request.
* **Why it matters (1–2 lines):** Without persistence, users will feel like the setting “doesn’t stick.” Without payload wiring, the server can’t use it.
* **Scope (in / out):**

  * **In:** Add `textVerbosity` to client context, persist it, and ensure reset behavior is sensible.
  * **Out:** No UI controls yet (that’s next card).
* **Preconditions:**

  * `useChatState.ts` exists and is responsible for sending the API request and persisting context (it does in your earlier work).
* **Files to touch (exact paths):**

  * `src/components/chat/useChatState.ts` *(Codex should locate this file; it’s referenced in your system already)*
* **Step-by-step implementation plan (numbered, very explicit):**

  1. Open `src/components/chat/useChatState.ts`.
  2. Find the context object shape being persisted to localStorage (likely contains `mode`, `archetype`, `archetypeVector`, etc.).
  3. Add `textVerbosity?: "low" | "medium" | "high"` to the context state shape (import the type from your types file if available).
  4. When building the request payload (`body = { messages, context, sessionId }`), ensure `context.textVerbosity` is included.
  5. On hydration from localStorage, ensure it’s kept.
  6. On reset:

     * Decide one behavior (pick this and implement consistently):

       * **Recommended:** keep the user’s verbosity preference even on “reset memory” (because it’s UX preference, not identity memory).
       * Alternative: reset it to `"medium"`.
         Implement whichever you prefer — but be explicit and consistent.
* **Exact code-change guidance (include snippets/pseudocode only where helpful):**

  * Add to context type:

    ```ts
    textVerbosity?: "low" | "medium" | "high";
    ```
  * Ensure request body includes it (usually automatic if you send `context`).
* **Acceptance criteria:**

  * After setting `textVerbosity` in state, the next request payload includes it (verify in Network request body).
  * `textVerbosity` persists across refresh via localStorage.
  * Reset behavior is deterministic (either preserved as preference or reset to default).
* **Test plan (commands + what to look for):**

  1. `pnpm dev`
  2. In the browser:

     * Set verbosity (you’ll do UI in the next card, so for now you can temporarily hardcode it to test).
     * Refresh → confirm value persisted (localStorage entry).
     * Send a message → confirm request body includes `context.textVerbosity`.
* **Rollback plan:**

  * Revert this commit.
* **Notes for Codex (constraints, style rules, pitfalls):**

  * Do not use `??` patterns that prevent explicit clearing (similar to your archetype null bug earlier).
  * Keep the field optional; do not break existing stored contexts.
    END TASK CARD

Suggested git commit message: `feat(chat): persist textVerbosity in context and send with assistant requests`

---

# CODEX TASK CARD

* **Title:** UI: add a verbosity selector to the chat input (Concise / Normal / Detailed)
* **Goal:** Add a simple UI control so the user can choose verbosity, and wire it into chat state.
* **Why it matters (1–2 lines):** This is the actual “user-facing switch” that makes the feature real; everything else is plumbing.
* **Scope (in / out):**

  * **In:** Add a dropdown (or segmented buttons) for verbosity and wire it to state.
  * **Out:** No reasoning control; no redesign of chat layout.
* **Preconditions:**

  * Card #3 complete so there’s a place to store and send `textVerbosity`.
* **Files to touch (exact paths):**

  * `src/components/chat/ChatInput.tsx` ([GitHub][1])
  * `src/components/chat/ChatPanel.tsx` *(or whichever component renders `ChatInput`; Codex should locate by searching `<ChatInput`)*
  * *(Optional styling)* `src/components/chat/chat.module.css` (only if you need module styling; current input uses Tailwind-ish classes) ([GitHub][2])
* **Step-by-step implementation plan (numbered, very explicit):**

  1. Open `src/components/chat/ChatInput.tsx`. It currently only accepts `onSend(question)` and `pending`. ([GitHub][1])
  2. Update `ChatInputProps` to accept:

     * `textVerbosity: "low" | "medium" | "high"`
     * `onTextVerbosityChange: (v) => void`
       Keep `onSend` and `pending` unchanged.
  3. Add a small UI control inside the form, ideally above the textarea or below it:

     * Label: “Verbosity”
     * Options: `Concise` (low), `Normal` (medium), `Detailed` (high)
       Use a `<select>` to keep it simple and accessible.
  4. In the component that renders `ChatInput` (likely `ChatPanel.tsx`), pass:

     * `textVerbosity={context.textVerbosity ?? "medium"}`
     * `onTextVerbosityChange={(v) => setContext(prev => ({...prev, textVerbosity: v}))}`
  5. Ensure the selector is disabled while `pending` if you want stable UI during generation (optional).
  6. Confirm keyboard UX:

     * Enter still submits
     * Shift+Enter still inserts newline (your current behavior) ([GitHub][1])
* **Exact code-change guidance (include snippets/pseudocode only where helpful):**
  In `ChatInput.tsx`:

  ```tsx
  interface ChatInputProps {
    onSend: (question: string) => void;
    pending: boolean;
    textVerbosity: "low" | "medium" | "high";
    onTextVerbosityChange: (v: "low" | "medium" | "high") => void;
  }

  // In JSX:
  <label className="text-xs font-semibold text-ink-muted">
    Verbosity
    <select
      className="ml-2 rounded-md border border-subtle bg-card px-2 py-1 text-sm"
      value={textVerbosity}
      onChange={(e) => onTextVerbosityChange(e.target.value as any)}
      disabled={pending}
    >
      <option value="low">Concise</option>
      <option value="medium">Normal</option>
      <option value="high">Detailed</option>
    </select>
  </label>
  ```

  (Codex: replace `as any` with a proper clamp or a typed helper if TS complains.)
* **Acceptance criteria:**

  * Chat UI shows a verbosity selector with 3 options.
  * Changing the selector updates context and persists (refresh retains setting).
  * Network request payload includes `context.textVerbosity` reflecting the selection.
  * Responses visibly change length/style when switching low vs high.
  * No UI regression: sending messages still works; pending still disables send.
* **Test plan (commands + what to look for):**

  1. `pnpm dev`
  2. In the chat UI:

     * Set verbosity to **Concise**, ask a complex question → response should be shorter and more to the point.
     * Set verbosity to **Detailed**, ask the same question → response should be more expanded/structured.
  3. DevTools → Network → request body:

     * Confirm `context.textVerbosity` changes with the selector.
* **Rollback plan:**

  * Revert this commit.
* **Notes for Codex (constraints, style rules, pitfalls):**

  * Do not add reasoning controls.
  * Keep UI minimal and accessible (label + select).
  * Don’t introduce breaking prop changes without updating the parent component.
    END TASK CARD

Suggested git commit message: `feat(chat-ui): add verbosity selector and wire to assistant context`

---

## Quick “how hard is this” summary

* **UI:** ~small (one select)
* **Client state:** medium (persist + payload)
* **Server:** small (clamp + pass to Responses)
* **Risk:** low (because it’s optional + clamped)

If you want, I can also add a tiny follow-up card to **show the current verbosity setting in the chat header** (nice for clarity), but the four above are the core migration from “no UI control” → “real user control that changes model output.”

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/ChatInput.tsx "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/chat.module.css "raw.githubusercontent.com"
