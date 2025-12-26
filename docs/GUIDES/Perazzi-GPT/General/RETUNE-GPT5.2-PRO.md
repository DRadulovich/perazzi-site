Below is a **full Task Card Pass Summary** that takes your repo from **“GPT‑5.2 migration works, but is risky/inconsistent in a few places”** → **“polished, consistent, safe-by-default, tests green, docs aligned”**.

I’m anchoring each task to **real files + real symbols/env vars that exist in your GPT‑5.2 branch right now**, so we don’t drift later. (I’m also explicitly calling out the “do not break” constraints—especially PGPT Insights + logging.)

---

## TASK CARD PASS SUMMARY (from current GPT‑5.2 branch → polished final)

### [X] **TASK CARD 00 — Preflight snapshot + “don’t break” invariants**

**Goal:** Freeze today’s behavior so every remediation is measured, not vibes.

**Codex must do:**

* Confirm branch / base:

  * `git rev-parse --abbrev-ref HEAD` should be `GPT-5.2`
  * `git status` clean
* Run and record:

  * `pnpm test` (expected failure: `tests/lib/dealer-brief.test.ts` per your audit)
  * `pnpm dev` and hit:

    * `/api/perazzi-assistant`
    * `/api/soul-journey-step`
* Capture a short “baseline contract” list:

  * What keys the endpoints return today
  * Whether `previous_response_id` is being sent/returned (if applicable)
  * Whether PGPT Insights pages load + what they display

**Invariants Codex must protect for all later cards:**

* **No breaking changes** to existing API JSON response shapes unless a task explicitly says so.
* **`perazzi_conversation_logs` table contract must remain usable** by queries/UI (prompt/response fields can be omitted/truncated, but the UI should not crash). Queries currently assume prompt/response exist as strings. ([GitHub][1])
* **GPT‑5.2 parameter rules** must be respected: `temperature/top_p/logprobs` only allowed with `reasoning.effort = none`. ([OpenAI Platform][2])
* Prompt caching retention values must be **`in_memory` or `24h`**. ([OpenAI Platform][3])

---

### [X] **TASK CARD 01 — Fix prompt cache retention + wire prompt cache key end-to-end**

**Problem it fixes:** Both routes currently normalize `PERAZZI_PROMPT_CACHE_RETENTION` to `"in-memory"` (hyphen), which is **not a valid value** per OpenAI docs (valid: `in_memory`, `24h`). ([OpenAI Platform][3])
Also `.env.example` documents `PERAZZI_PROMPT_CACHE_KEY`, but routes never pass it—even though `aiClient.createResponseText` supports it. ([GitHub][1])

**Files & hotspots:**

* `src/app/api/perazzi-assistant/route.ts`

  * `parsePromptCacheRetention()` currently `.replace("_", "-")` and allows `"in-memory"`. ([GitHub][4])
  * call to `createResponseText({ promptCacheRetention: ... })` (add `promptCacheKey`). ([GitHub][5])
* `src/app/api/soul-journey-step/route.ts`

  * same parse + call site. ([GitHub][6])
* `src/lib/aiClient.ts`

  * already supports `promptCacheRetention` + `promptCacheKey` and forwards to `prompt_cache_retention` + `prompt_cache_key`. ([GitHub][7])
* `.env.example` (align comments + defaults). ([GitHub][1])

**End state:**

* `parsePromptCacheRetention()` returns only:

  * `"in_memory"` or `"24h"` (and **never** `"in-memory"`).
* Routes read:

  * `PERAZZI_PROMPT_CACHE_RETENTION`
  * `PERAZZI_PROMPT_CACHE_KEY`
* Routes pass both into `createResponseText(...)` using wrapper keys:

  * `promptCacheRetention`
  * `promptCacheKey`
* No behavior change unless env vars are set; then it should *work* instead of error.

**Acceptance:**

* With env `PERAZZI_PROMPT_CACHE_RETENTION=in_memory` → request contains `"prompt_cache_retention": "in_memory"`.
* With env `PERAZZI_PROMPT_CACHE_KEY=abc` → request contains `"prompt_cache_key": "abc"`.
* No 400s from OpenAI when caching is enabled.

---

### [X] **TASK CARD 02 — Enforce GPT‑5.2 parameter compatibility (temperature/top_p/logprobs gating)**

**Problem it fixes:** Your routes send `temperature` (assistant defaults to 1.0; soul journey defaults to 0.6). That’s **fine only when reasoning effort is `none`**. If you flip `PERAZZI_REASONING_EFFORT=high`, OpenAI will reject requests that include `temperature/top_p/logprobs`. ([OpenAI Platform][2])

**Where to fix (best-practice):**

* Centralize in `src/lib/aiClient.ts:createResponseText` so *every* caller is protected. ([GitHub][7])

**Codex must implement this rule:**

* If resolved reasoning effort is anything other than `"none"`:

  * Do **not** send `temperature`
  * Do **not** send `top_p`
  * Do **not** send `logprobs`
* If reasoning effort is `"none"` or undefined:

  * Allow temperature/top_p/logprobs as normal.

**Why centralizing is key:** The assistant route passes `temperature` always. ([GitHub][5])
The soul route passes `temperature` always. ([GitHub][6])
So if you fix only one route, the other will still blow up.

**Acceptance:**

* With `PERAZZI_REASONING_EFFORT=high`, verify `mockResponsesCreate` (tests) or actual request (dev logging) contains **no `temperature` field**.
* With `PERAZZI_REASONING_EFFORT=none`, temperature still passes through.
* Add a regression test that fails if temperature is present when reasoning != none.

---

### [X] **TASK CARD 03 — Correct reasoning effort parsing (remove invalid “minimal”; align to OpenAI)**

**Problem it fixes:** Both routes currently allow `minimal` as a value in the allowed set. ([GitHub][4])
OpenAI’s GPT‑5.2 guidance lists supported effort values as: `"none" | "low" | "medium" | "high" | "xhigh"` (no `"minimal"`). ([OpenAI Platform][2])

**Files:**

* `src/app/api/perazzi-assistant/route.ts` → `parseReasoningEffort()` allowed set includes `"minimal"`. ([GitHub][4])
* `src/app/api/soul-journey-step/route.ts` → same. ([GitHub][6])
* `.env.example` should document the allowed values accurately. ([GitHub][1])

**End state:**

* Allowed set is exactly: `none, low, medium, high, xhigh`
* Invalid values → `undefined` (so the request doesn’t include reasoning config).

**Acceptance:**

* Setting `PERAZZI_REASONING_EFFORT=minimal` results in reasoning being omitted (or coerced to `none`, but pick one policy and document it).
* No runtime “invalid reasoning effort” errors.

---

### [X] **TASK CARD 04 — Temperature policy alignment (code ↔ env.example ↔ docs)**

**Problem it fixes:** There’s a documented/expected temp mismatch floating around (audit called out “docs say 0.4; assistant runs 1.0”). Your **runtime config** is:

* Assistant: `PERAZZI_ASSISTANT_TEMPERATURE` default 1.0 ([GitHub][5])
* Soul Journey: `PERAZZI_SOUL_JOURNEY_TEMPERATURE` default 0.6 ([GitHub][6])

**Codex must:**

* Decide a single source of truth:

  * Either: “defaults live in `.env.example`”
  * Or: “defaults live in code fallback”
* Then update:

  * `.env.example` comments + values
  * API contract docs (you listed two contract files earlier in the audit JSON)
  * Any places that still mention 0.4 as a hardcoded expectation

**Important constraint:** This card must not change behavior unless you explicitly choose to change the defaults. Safer default is: keep behavior, fix docs.

**Acceptance:**

* Assistant docs mention: temperature is configurable; default currently 1.0 (unless env overrides), **and only applies when reasoning is `none`**. ([OpenAI Platform][2])
* No dangling “0.4” claims remain.

---

### [X] **TASK CARD 05 — Logging hardening without breaking PGPT Insights**

**Problem it fixes:** `.env.example` currently enables AI logging and sets **full prompt/response storage** (`PERAZZI_LOG_TEXT_MODE=full`)—high leakage risk. ([GitHub][1])
Meanwhile PGPT Insights queries/UI expect to render prompt/response fields, so if you flip everything to “omit”, the UI must degrade gracefully (not crash, not show misleading metrics). ([GitHub][1])

**Current logging behavior (important details):**

* Logging is gated by `PERAZZI_AI_LOGGING_ENABLED === "true"`. ([GitHub][8])
* Text mode defaults to `"omitted"` in code, but env example forces `"full"`. ([GitHub][8])
* Omitted mode stores literal placeholder `"[omitted]"`. ([GitHub][8])
* Log inserts into `perazzi_conversation_logs` with prompt/response strings. ([GitHub][8])

**Codex must deliver:**

* A **safe-by-default** logging posture, while keeping PGPT Insights usable.
* Recommended approach:

  1. Change `.env.example` defaults to:

     * `PERAZZI_LOG_TEXT_MODE=truncate`
     * `PERAZZI_LOG_TEXT_MAX_CHARS=8000` (or smaller)
     * Consider setting `PERAZZI_AI_LOGGING_ENABLED=false` in example (optional; decide based on your intended onboarding flow).
  2. Update PGPT Insights UI to explicitly label `[omitted]` / truncated content and avoid “copy full prompt” UX when it’s not stored.

**Acceptance:**

* PGPT Insights pages still load and show rows even when prompt/response are omitted/truncated.
* `.env.example` no longer encourages full prompt persistence by default. ([GitHub][1])

---

### [X] **TASK CARD 06 — Usage metrics enrichment for Responses (cached tokens + reasoning tokens + IDs surfaced)**

**Problem it fixes:** You’re already storing `responseUsage` + IDs inside metadata in `logAiInteraction`. ([GitHub][8])
But PGPT Insights queries currently surface only `prompt_tokens` and `completion_tokens`. ([GitHub][1])
Responses usage can include:

* `input_tokens_details.cached_tokens`
* `output_tokens_details.reasoning_tokens` ([OpenAI Platform][9])

**Codex must:**

* Standardize usage extraction into explicit metadata keys for easier querying:

  * `cachedTokens`
  * `reasoningTokens`
  * `totalTokens`
  * (optionally) `inputTokens`, `outputTokens` for consistency
* Update:

  * `src/lib/aiLogging.ts` to derive/store these when `usage` exists. ([GitHub][8])
  * `src/lib/pgpt-insights/queries.ts` to select/display them. ([GitHub][1])
  * `src/app/api/admin/pgpt-insights/log/[id]/route.ts` to return them in a stable way (either as top-level fields or inside metadata). ([GitHub][10])
  * `src/components/pgpt-insights/*` to render them (no crashes if missing).

**Hard constraint:** Avoid DB migrations unless absolutely necessary; prefer metadata additive fields (your current schema already stores metadata). ([GitHub][8])

**Acceptance:**

* PGPT Insights shows cached + reasoning tokens when present, otherwise shows “—”.
* No query crashes when metadata doesn’t include these keys.

---

### [X] **TASK CARD 07 — Fix the dealer-brief test regression the audit found**

**Problem it fixes:** `tests/lib/dealer-brief.test.ts` expects `request.context` to equal the original context exactly: `expect(request.context).toEqual(context)`. ([GitHub][11])
But your dealer brief builder now normalizes context (adds null fields), so strict deep equality fails.

**Codex must choose one policy:**

* **Policy A (recommended):** Update test to assert a *subset*:

  * `expect(request.context).toMatchObject(context)`
* **Policy B:** Change builder to preserve minimal context shape (riskier if those nulls are intentional/used elsewhere).

**Acceptance:**

* `pnpm test` passes (this is currently your only failing suite per discovery).
* No other tests need loosening.

---

### [X] **TASK CARD 08 — Add regression tests for the GPT‑5.2 “gotchas”**

**Goal:** Prevent future “silent re-breaks” of the exact things that bit you during migration.

**Codex must add tests that lock in:**

1. **Temperature gating:** If reasoning effort != none, `createResponseText` must not pass `temperature/top_p/logprobs`. ([GitHub][7])
2. **Prompt caching retention values:** only `in_memory|24h` are forwarded. ([OpenAI Platform][3])
3. **Prompt cache key forwarding:** if env set, request includes `prompt_cache_key`. ([GitHub][7])

**Likely files:**

* `tests/mocks/openai.ts` (mock exists; may need to assert call args) ([GitHub][12])
* Add new tests near existing API/lib tests.

**Acceptance:**

* Tests fail if someone reintroduces `"in-memory"` or forgets gating logic.

---

### [X] **TASK CARD 09 — Deprecate or remove legacy Chat Completions wrapper (`runChatCompletion`)**

**Problem it fixes:** `src/lib/aiClient.ts` still exports `runChatCompletion` calling `client.chat.completions.create`. ([GitHub][7])
Even if unused, it’s an “accidental footgun”: someone can re-import it later and bypass your Responses-only rules/metrics.

**Codex must do one of these (choose safest):**

* **Option A (soft deprecate):**

  * Add `/** @deprecated */` and a runtime guard:

    * Throw unless `PERAZZI_ALLOW_CHAT_COMPLETIONS=true`
* **Option B (hard remove):**

  * Remove export + implementation
  * Fix any imports (should be none, per discovery)
  * Update docs referencing it

**Acceptance:**

* No code path can silently use chat completions without an explicit opt-in.
* `pnpm test` still passes.

---

### [X] **TASK CARD 10 — Add a `typecheck` script and make it green**

**Problem it fixes:** There is no `typecheck` script right now; package scripts are dev/build/start/lint/test. ([GitHub][13])
If you want “clean install,” you want at least **tests + typecheck** as a baseline.

**Codex must:**

* Add to `package.json`:

  * `"typecheck": "tsc --noEmit"`
* Run it and fix any new TypeScript errors that surface (scope-limit fixes to GPT‑5.2 touched files first).

**Acceptance:**

* `pnpm run typecheck` succeeds.
* `pnpm test` succeeds.

---

### [X] **TASK CARD 11 — Optional polish: centralize shared OpenAI/perazzi config parsing**

**Why optional:** This is a code-quality refactor, not strictly required for correctness, but it’s how you prevent future drift.

**Current duplication:**

* Both routes re-implement:

  * model resolution
  * max token resolution
  * parseReasoningEffort
  * parseTextVerbosity
  * parsePromptCacheRetention
  * parseTemperature
  * isUsingGateway
    (see both route files). ([GitHub][5])

**Codex would:**

* Create a shared module (example) `src/lib/perazziAiConfig.ts` exporting:

  * `resolveModel()`, `resolveMaxOutputTokens()`, `parseReasoningEffort()`, `parseTextVerbosity()`, `parsePromptCacheRetention()`, `parseTemperature()`, `isUsingGateway()`
* Update both routes to import from it.
* No behavior change allowed (pure refactor).

**Acceptance:**

* Both routes compile and behave identically.
* Reduced duplication → fewer “one route fixed, other route broken” moments.

---

## Recommended order to run these task cards (least risky → most)

1. **[X] 00 Preflight snapshot**
2. **[X] 07 Fix dealer-brief test** (unblocks tests)
3. **[X] 01 Prompt cache retention + key** (currently incorrect value path)
4. **[X] 02 GPT‑5.2 parameter gating** (prevents runtime 400s when reasoning is enabled) ([OpenAI Platform][2])
5. **[X] 03 Reasoning effort parsing cleanup** ([OpenAI Platform][2])
6. **[X] 05 Logging hardening** (security + UX impact) ([GitHub][8])
7. **[X] 06 Usage metrics enrichment + PGPT insights UI updates** ([OpenAI Platform][9])
8. **[X] 08 Regression tests for gotchas**
9. **[X] 09 Deprecate/remove runChatCompletion** ([GitHub][7])
10. **[X] 10 Add typecheck + make green** ([GitHub][13])
11. **[X] 11 Optional refactor**

---

When you’re ready, paste the **title** of the first Task Card you want fully built out (e.g., “TASK CARD 01 — Fix prompt cache retention + wire prompt cache key end-to-end”), and I’ll expand it into a full Codex-ready card with step-by-step instructions, exact acceptance criteria, and rollback plan.

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/lib/pgpt-insights/queries.ts "raw.githubusercontent.com"
[2]: https://platform.openai.com/docs/guides/latest-model "Using GPT-5.2 | OpenAI API"
[3]: https://platform.openai.com/docs/guides/prompt-caching "Prompt caching | OpenAI API"
[4]: https://github.com/DRadulovich/perazzi-site/blob/61028f969918acaf2eda430aca14d69268d5aa0a/src/lib/aiClient.ts "perazzi-site/src/lib/aiClient.ts at 61028f969918acaf2eda430aca14d69268d5aa0a · DRadulovich/perazzi-site · GitHub"
[5]: https://github.com/DRadulovich/perazzi-site/blob/61028f969918acaf2eda430aca14d69268d5aa0a/src/lib/aiClient.ts?plain=1 "perazzi-site/src/lib/aiClient.ts at 61028f969918acaf2eda430aca14d69268d5aa0a · DRadulovich/perazzi-site · GitHub"
[6]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/app/api/soul-journey-step/route.ts "raw.githubusercontent.com"
[7]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/lib/aiClient.ts "raw.githubusercontent.com"
[8]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/lib/aiLogging.ts "raw.githubusercontent.com"
[9]: https://platform.openai.com/docs/api-reference/responses "Responses | OpenAI API Reference"
[10]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/app/api/admin/pgpt-insights/log/%5Bid%5D/route.ts "raw.githubusercontent.com"
[11]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/tests/lib/dealer-brief.test.ts "raw.githubusercontent.com"
[12]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/tests/mocks/openai.ts "raw.githubusercontent.com"
[13]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/package.json "raw.githubusercontent.com"
