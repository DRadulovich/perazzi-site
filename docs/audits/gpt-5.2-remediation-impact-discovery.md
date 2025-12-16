# GPT-5.2 Responses Remediation Impact Discovery

## Executive Summary (top risks)
- PGPT Insights UIs assume prompt/response text exists; switching logging defaults to omit/truncate (`src/lib/aiLogging.ts`, env sample currently `full`) will empty tables/views that drive QA dashboards.
- Responses payload knobs (temperature, reasoning, text verbosity, prompt cache retention) are parsed in the routes but only partially validated; enabling reasoning while leaving high temperature or invalid retention strings can yield OpenAI errors or silently drop caching.
- Prompt cache key is documented but never sent; wiring it without aligning casing (`in-memory` vs `in_memory`) could create cache misses and confuse retained state for multi-turn (`previous_response_id`).
- Dealer brief helper now normalizes context (adds null fields), so existing tests (`tests/lib/dealer-brief.test.ts`) and any strict equality checks will fail until assertions loosen; other context-sensitive consumers (logging, retrieval hints) may be impacted by added nulls.
- Legacy `runChatCompletion` wrapper remains exported in `src/lib/aiClient.ts`; accidental reuse would bypass Responses-only logging/metrics and any new gating unless deprecated/removed in lockstep with docs.

## Baseline / Change Inventory
- Branch: `GPT-5.2`; merge-base with `origin/main`: `a49806a4d57f22a903be598d0d7d51579ab80170`.
- Git status: dirty (`.env.example` modified before this task; left untouched).
- Diff vs `origin/main`: app/api routes (`perazzi-assistant`, `soul-journey-step`), `aiClient`, `aiLogging`, chat components, types, tests, docs (new audit, updated API contracts). Recent commits show Responses migration, logging controls, text verbosity UI, and temperature defaults change (commit `61028f9 feat(config): add temperature settings...`).
- Tests run: `pnpm test` currently fails `tests/lib/dealer-brief.test.ts` due to context shape drift (extra null fields); all other suites pass.

## Remediation Surface Area Map (knobs/envs)
| Knob / Env var | Read in files | Default / fallback | Passed into OpenAI request | Used by UI | Covered by tests |
| --- | --- | --- | --- | --- | --- |
| `PERAZZI_MODEL` / `PERAZZI_RESPONSES_MODEL` / `PERAZZI_COMPLETIONS_MODEL` | `src/app/api/perazzi-assistant/route.ts:252-268`, `src/app/api/soul-journey-step/route.ts:96-110`, `src/lib/aiClient.ts` (wrapper inputs) | Default `"gpt-5.2"` (`perazzi-assistant`), `"gpt-5.2"` (`soul-journey-step`); trims empty | `createResponseText` in both routes (`model`) | Model surfaced in PGPT Insights log views via DB queries | `tests/api/perazzi-assistant.test.ts` sets env overrides |
| `PERAZZI_MAX_OUTPUT_TOKENS` / `PERAZZI_MAX_COMPLETION_TOKENS` | Same routes as above | Assistant: 3000; Soul Journey: 700; ignores non-numeric | `max_output_tokens` (`createResponseText`) | Token usage shown in PGPT Insights metrics tables | Not explicitly asserted |
| `PERAZZI_ASSISTANT_TEMPERATURE` | `src/app/api/perazzi-assistant/route.ts:112,938-946` | Parsed/clamped; default 1.0 | `temperature` in Responses payload | Not shown in UI; implicit in behavior | Not covered |
| `PERAZZI_SOUL_JOURNEY_TEMPERATURE` | `src/app/api/soul-journey-step/route.ts:13,55-66` | Parsed/clamped; default 0.6 | `temperature` in Responses payload | Not shown in UI | Not covered |
| `PERAZZI_REASONING_EFFORT` | Both routes (`parseReasoningEffort`) | Allowed: none|minimal|low|medium|high|xhigh; else undefined | `reasoning.effort` in Responses payload | Not displayed; may affect latency logged | Not covered |
| `PERAZZI_TEXT_VERBOSITY` | Both routes; default `normalizeTextVerbosity(...) ?? "medium"` in assistant | Assistant route sends `text.verbosity`; Soul Journey sends `textVerbosity` | `text.verbosity` in Responses payload | Chat UI controls (`src/components/chat/VerbosityToggle.tsx`, `ChatInput.tsx`, `ChatPanel.tsx`); state persisted in `useChatState` | Not covered |
| `PERAZZI_PROMPT_CACHE_RETENTION` | Both routes (`parsePromptCacheRetention`), `.env.example` | Allowed strings normalized to `in-memory`/`24h`; invalid -> undefined | `prompt_cache_retention` in Responses payload via wrapper | Not surfaced in UI | Not covered |
| `PERAZZI_PROMPT_CACHE_KEY` | Documented in `.env.example`, guides | Not read anywhere | Never sent (gap) | N/A | N/A |
| `PERAZZI_AI_LOGGING_ENABLED` | `src/lib/aiLogging.ts:121`, routes call `logAiInteraction` | No-op unless `"true"` | Controls DB insert for both routes | PGPT Insights readers depend on rows existing | Not covered |
| `PERAZZI_LOG_TEXT_MODE`, `PERAZZI_LOG_TEXT_MAX_CHARS` | `src/lib/aiLogging.ts:9-24` | Mode defaults to `omitted`, max chars defaults 8000 (cap 100k) | Affects stored prompt/response text | PGPT Insights prompt/response displays and previews | Not covered |
| `PERAZZI_ENABLE_FILE_LOG` | `src/app/api/perazzi-assistant/route.ts:187`, `logInteraction` | Off unless `"true"` | Controls NDJSON audit logging | File at `tmp/logs/perazzi-conversations.ndjson` (dev only) | Not covered |

## Impact Matrix

### Logging
- Change intent: Harden defaults, add structured IDs/metrics for Responses, ensure guardrail/empty outputs handled safely.
- Dependent code paths: `src/lib/aiLogging.ts` (log helper, truncation, metadata), `src/lib/aiClient.ts` (logging within `runChatCompletion`), `src/app/api/perazzi-assistant/route.ts` (logs guardrail blocks and successful Responses with usage/requestId), `src/app/api/soul-journey-step/route.ts` (logs prompts/responses), `logInteraction` console/file logging.
- Env: `PERAZZI_AI_LOGGING_ENABLED`, `PERAZZI_LOG_TEXT_MODE`, `PERAZZI_LOG_TEXT_MAX_CHARS`, `PERAZZI_ENABLE_FILE_LOG`, `DATABASE_URL`.
- DB/storage/UI: Inserts into `perazzi_conversation_logs`; readers in `src/lib/pgpt-insights/queries.ts`, `src/app/admin/pgpt-insights/...`, `src/components/pgpt-insights/*` expect prompt/response fields present. Guardrail block paths also log prompt/response text. File logging writes to `tmp/logs/perazzi-conversations.ndjson`.
- Tests/mocks: None assert logging, but console JSON appears during `tests/api/perazzi-assistant.test.ts`. DB logging currently skipped in tests (no `DATABASE_URL`).
- Docs: logging guidance across `docs/SECURITY/AI-Gateway-Conceptual-Roadmap.md`, `docs/SECURITY/archetype-analysis-security-privacy-audit.md`, `.env.example` defaults to `full`.
- Risks: If defaults tighten (omit/truncate), PGPT Insights screens will show blanks; if structured IDs change, queries parsing `metadata->>'maxScore'`, `guardrailStatus/Reason`, `latencyMs`, `retrievedChunks` may break.

### Temperature + Reasoning
- Change intent: Gate temperature when reasoning enabled; align code/docs.
- Dependent paths: `src/app/api/perazzi-assistant/route.ts` (ASSISTANT_TEMPERATURE=default 1.0; `reasoningEffort` threaded), `src/app/api/soul-journey-step/route.ts` (temperature 0.6), `src/lib/aiClient.ts` (payload assembly without extra validation).
- Env: `PERAZZI_ASSISTANT_TEMPERATURE`, `PERAZZI_SOUL_JOURNEY_TEMPERATURE`, `PERAZZI_REASONING_EFFORT`.
- UI: None directly; behavioral changes visible to chat users.
- Tests: Not asserting temperature; OpenAI mocks ignore temperature. Adjustments should avoid shape changes to `ResponseCreateParams`.
- Docs: `.env.example` lists temperatures (assistant default 1.0, soul journey 0.6; only applied when `reasoning.effort="none"`); `docs/audits/gpt-5.2-responses-migration-audit.md` and API contracts now mirror these defaults.
- Danger zones: Setting reasoning with temperature>2 will clamp (parseTemperature), but enabling reasoning without removing temperature may conflict with planned gating; any added defaults must keep payload shape consistent with tests/mocks.

### Prompt Caching
- Change intent: Wire `prompt_cache_key`, validate retention values.
- Dependent paths: `src/lib/aiClient.ts` supports `prompt_cache_retention` and `prompt_cache_key` but routes only send retention; `parsePromptCacheRetention` in both routes replaces `_` with `-` and only allows `in-memory|24h`.
- Env/docs: `.env.example` documents `PERAZZI_PROMPT_CACHE_RETENTION` as `in_memory|24h` (underscore), `PERAZZI_PROMPT_CACHE_KEY` documented but unused; `docs/GUIDES/AA-HIDE/gpt5.2.md` and `docs/audits/gpt-5.2-responses-migration-audit.md` mention cache key gap.
- UI: None.
- Tests: None; OpenAI mock ignores cache fields.
- Risks: Introducing `prompt_cache_key` without aligning naming may cause API errors or cache misses; retention normalization mismatch (`in_memory` vs `in-memory`) could lead to value being dropped.

### Tests + Mocks
- Change intent: Fix dealer-brief context shape drift; ensure mocks cover Responses contract (usage/request IDs).
- Current state: `tests/lib/dealer-brief.test.ts` fails because `buildDealerBriefRequest` now returns context with extra null fields (`locale`, `archetype`, `archetypeVector`, etc.) vs minimal input. `tests/mocks/openai.ts` mocks `responses.create` returning `{output_text, id, usage}`; `createResponseText` throws if `output_text` empty. `tests/api/perazzi-assistant.test.ts` logs console payloads and expects sanitized messages (system messages dropped).
- Dependent types/builders: `src/lib/dealer-brief.ts` sanitizes context; `src/types/perazzi-assistant.ts` includes `previousResponseId` and `textVerbosity`; `src/components/chat/useChatState.ts` persists `previousResponseId` and `textVerbosity`.
- Risks: Any change to Responses payload shape (usage fields, responseId/requestId) requires mock updates. Assertions using `toEqual` on context will continue to break unless loosened to partial/objectContaining.

### Legacy Wrapper
- Change intent: Deprecate/remove chat-completions wrapper.
- Dependencies: `src/lib/aiClient.ts:79-149` exports `runChatCompletion`; currently unused in code, but referenced in docs (`docs/audits/gpt-5.2-responses-migration-audit.md`, `docs/audits/dealer-authority-audit.md`). Barrel exports absent; only direct import would use it.
- Risks: Silent reuse would bypass Responses-only logging and prompt/response ID capture; removal requires doc updates and any downstream scripts using it.

### Tooling / Typecheck
- Current tooling: `package.json` scripts include `dev/build/start/lint/test` only; no `typecheck`. `tsconfig.json` uses `skipLibCheck: true`, `noEmit: true`. No `.github/workflows` present.
- Impact of adding `typecheck`: Would run `tsc --noEmit` (or `next lint` variant) and may surface implicit any/unused imports in API routes/components; chat UI and server routes are TS with strict mode, so failures likely if missing types around OpenAI responses or context shapes.
- CI: None configured; adding script requires wiring to future CI.

## Logging Data Flow (text)
- Perazzi Assistant: Client (`ChatPanel`/`ChatInput` via `useChatState`) → POST `/api/perazzi-assistant` with messages + context (`previousResponseId`, `textVerbosity`) → `generateAssistantAnswer` builds instructions → `createResponseText` (Responses) → returns `output_text`, `usage`, `response.id`, `_request_id` → `logAiInteraction` writes to `perazzi_conversation_logs` with prompt/response, tokens, guardrail metadata, archetype/classification; also console/file log via `logInteraction`.
- Soul Journey: POST `/api/soul-journey-step` with step/userAnswer → prompt template -> `createResponseText` → `logAiInteraction` (step/title in metadata) → response returned.
- Views/readers: Admin PGPT Insights routes (`src/app/admin/pgpt-insights/...`) fetch rows and expose prompt/response, guardrail fields, retrieved chunks, latency; components (`LogsTableWithDrawer`, `SessionConversationView`, `GuardrailsSection`, `MetricsSection`) display full text and previews. If prompt/response stored as `[omitted]` or empty, these screens will render blanks and derived metrics (prompt length, search filters) degrade.
- Guardrail blocks: In assistant route, guardrail hits short-circuit Responses call, logAiInteraction records `guardrailStatus: "blocked"` with prompt and refusal text; still persists to DB/UI.

## Request Configuration Matrix
- `/api/perazzi-assistant`: Payload `model=resolveModel(...)`, `instructions` (system prompt + tone nudge), `input` sanitized user messages only, `max_output_tokens=resolveMaxOutputTokens` (defaults 3000), `temperature=ASSISTANT_TEMPERATURE` (default 1.0), `reasoning.effort=REASONING_EFFORT` (optional), `text.verbosity=effectiveTextVerbosity` (from client or env), `prompt_cache_retention` from env, `previous_response_id` propagated. No `prompt_cache_key`. Guardrail blocks bypass OpenAI.
- `/api/soul-journey-step`: Payload `model=resolveModel(...)`, `instructions` short craft prompt, `input` concatenated template, `max_output_tokens` default 700, `temperature=SOUL_JOURNEY_TEMPERATURE` (0.6 default), `reasoning.effort` optional, `text.verbosity` optional, `prompt_cache_retention` optional. No `prompt_cache_key`.
- Wrapper `createResponseText` (aiClient): Accepts optional `prompt_cache_key`, `prompt_cache_retention`, `reasoning`, `text`, `previous_response_id`; returns `responseId`, `_request_id` surfaced as `requestId`, `usage`. Throws on empty `output_text`.
- Danger zones: Adding reasoning gating must keep payload shape for mocks/tests; changing temperature defaults must reconcile `.env.example` comments and docs.

## Test Impact Map
- Logging changes: Could affect snapshot/console expectations in `tests/api/perazzi-assistant.test.ts` (console JSON used for manual inspection). DB logging not covered.
- Request payload changes: OpenAI mock in `tests/mocks/openai.ts` only handles `responses.create`; adding new required fields (e.g., `prompt_cache_key`) must be accepted in mock assertions within tests if added.
- Context shape: `tests/lib/dealer-brief.test.ts` fails due to sanitized context; any future strict equality in helpers should use partial matches.
- Suggested assertion strategy (no code change yet): use `expect(request.context).toMatchObject(expected)` in dealer-brief test; for Responses payload tests, assert `expect(mockResponsesCreate).toHaveBeenCalledWith(expect.objectContaining({...}))` to allow new fields.

## Legacy Wrapper Dependency Report
- `runChatCompletion` defined in `src/lib/aiClient.ts` (exports), unused in codebase; no imports found.
- Docs referencing wrapper: `docs/audits/gpt-5.2-responses-migration-audit.md`, `docs/audits/dealer-authority-audit.md` mention legacy path.
- Removal safe if: docs updated; no external scripts import it; logging expectations for completions path are obsolete (only `logAiInteraction` within wrapper would run).

## Tooling Impact
- Adding `typecheck`: would require new script in `package.json`; likely `tsc --noEmit`. Project uses Next 16 with strict TS; failures may surface in API routes that use `any` casts (e.g., rate limit IP lookup) or implicit any in metadata typing.
- CI coverage: none present; any new script would need manual/local execution or new workflow.

## Do Not Break Checklist
- Ensure `PERAZZI_LOG_TEXT_MODE` default is safe (omit/truncate) and PGPT Insights views handle missing prompt/response (preview lengths, search filters).
- Preserve logging metadata keys used by queries (`maxScore`, `guardrailStatus/Reason`, `latencyMs`, `retrievedChunks`, archetype scores) when restructuring.
- When gating temperature/reasoning, keep payload compatible with OpenAI Responses and mocks; update docs/env comments to match defaults.
- Validate `prompt_cache_retention` strings against Responses spec; decide underscore vs hyphen and normalize consistently before sending. Add `prompt_cache_key` without making it required for existing calls.
- Fix dealer-brief context test by relaxing equality or aligning helper output; avoid removing new context fields that might be used in retrieval/logging later.
- If removing `runChatCompletion`, update docs and ensure no downstream tooling depends on it.
- If adding `typecheck`, baseline and address any TS errors in routes/components before enabling in CI.

## Recommended Sequencing
1) Align logging defaults/structured IDs first (centralized impact on storage/UI; ensures dashboards stay coherent).  
2) Fix dealer-brief test/context handling to unblock CI and stabilize helpers.  
3) Wire prompt caching (`prompt_cache_key` + retention validation) to avoid future cache-miss regressions.  
4) Gate temperature with reasoning and reconcile docs/env samples to avoid OpenAI contract errors.  
5) Deprecate/remove legacy `runChatCompletion` with doc updates.  
6) Add `typecheck` script once codebase passes strict TS to avoid adding a failing script by default.
