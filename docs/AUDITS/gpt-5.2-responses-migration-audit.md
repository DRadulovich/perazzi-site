# GPT-5.2 Responses Migration Audit

## Executive Summary
- Primary assistant and soul-journey routes now call the OpenAI Responses API (default `gpt-5.2`) via a shared wrapper; verbosity/reasoning/prompt-cache knobs are plumbed.
- Gaps to address: logging defaults still encourage storing full prompts/responses, the assistant route now runs at temperature `1.0` (env-configurable; only valid when `reasoning.effort="none"`), prompt cache key is documented but never sent, and Responses usage metrics omit reasoning tokens/request IDs in structured logs.
- Legacy chat-completions wrapper remains in `aiClient.ts` (unused), which could invite regressions if reused.
- Verification runs: `pnpm typecheck` (no script defined), `pnpm test` failed `tests/lib/dealer-brief.test.ts` (context shape mismatch), `pnpm lint` fails with pre-existing repo-wide lint errors (scripts, pages, insights UI).

## Change Inventory
- git status: clean
- git rev-parse --abbrev-ref HEAD: `GPT-5.2`
- git merge-base HEAD origin/main: `a49806a4d57f22a903be598d0d7d51579ab80170`
- git diff --name-status origin/main...HEAD:
  ```
  M	.env.example
  M	PerazziGPT/Phase_3_Documents/API_Contract.md
  M	V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-3/V2_REDO_api-contract.md
  M	docs/audits/dealer-authority-audit.md
  M	src/app/(site)/fschat/page.tsx
  M	src/app/api/perazzi-assistant/route.ts
  M	src/app/api/soul-journey-step/route.ts
  M	src/components/chat/ChatInput.tsx
  M	src/components/chat/ChatPanel.tsx
  A	src/components/chat/VerbosityToggle.tsx
  M	src/components/chat/useChatState.ts
  M	src/components/primary-nav.tsx
  M	src/hooks/usePerazziAssistant.ts
  M	src/lib/aiClient.ts
  M	src/lib/aiLogging.ts
  M	src/types/perazzi-assistant.ts
  M	tests/api/perazzi-assistant.test.ts
  M	tests/lib/perazzi-zr1-flags.test.ts
  M	tests/mocks/openai.ts
  ```
- git diff --stat origin/main...HEAD:
  ```
   .env.example                                       |  22 +++-
   PerazziGPT/Phase_3_Documents/API_Contract.md       |   9 +-
   V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-3/V2_REDO_api-contract.md |  18 ++-
   docs/audits/dealer-authority-audit.md              |   8 +-
   src/app/(site)/fschat/page.tsx                     |  11 +-
   src/app/api/perazzi-assistant/route.ts             | 143 ++++++++++++++++++---
   src/app/api/soul-journey-step/route.ts             | 137 +++++++++++++++-----
   src/components/chat/ChatInput.tsx                  |  14 +-
   src/components/chat/ChatPanel.tsx                  |  12 +-
   src/components/chat/VerbosityToggle.tsx            |  56 ++++++++
   src/components/chat/useChatState.ts                |  24 +++-
   src/components/primary-nav.tsx                     |   2 +-
   src/hooks/usePerazziAssistant.ts                   |   3 +
   src/lib/aiClient.ts                                |  93 ++++++++++++++
   src/lib/aiLogging.ts                               |  66 +++++++++-
   src/types/perazzi-assistant.ts                     |  10 ++
   tests/api/perazzi-assistant.test.ts                |  28 ++--
   tests/lib/perazzi-zr1-flags.test.ts                |   2 +-
   tests/mocks/openai.ts                              |   2 +
  ```
- git log --oneline --decorate --graph --max-count=50 (top):
  ```
  * 19605ef (HEAD -> GPT-5.2) updata rerank to 200
  * a158061 feat(logging): make prompt/response storage configurable (omit|truncate|full)
  * 9677c34 feat(logging): make prompt/response storage configurable (omit|truncate|full)
  * 55fa59d TOGGLE
  * 642a8fd (origin/GPT-5.2, feature/GPT-5.2) 1
  * b7a74e6 feat(chat): integrate textVerbosity handling in ChatInput and ChatPanel components
  * e9a5410 feat(chat): persist textVerbosity in context and send with assistant requests
  * daa35f1 feat(api): support client-selected textVerbosity (clamped) for Responses calls
  * 3c5c6dd feat(types): add textVerbosity to Perazzi assistant context
  * 67553a6 feat(chat): update searchParams type to Promise and resolve in FullScreenChatPage chore(api): remove temperature parameter from createResponseText in assistant route chore(api): remove temperature parameter from createResponseText in soul journey route
  ```

## OpenAI Usage Map
| Callsite | API used | Model default | Token cap param | Notes |
| --- | --- | --- | --- | --- |
| `src/app/api/perazzi-assistant/route.ts:createResponseText` | Responses (`client.responses.create`) | `PERAZZI_MODEL`/`PERAZZI_RESPONSES_MODEL`/`PERAZZI_COMPLETIONS_MODEL` fallback → default `"gpt-5.2"` | `max_output_tokens` (env default 3000, includes reasoning tokens) | Sends `instructions` + sanitized chat messages as `input`; temperature `1.0`; threads `reasoning.effort`, `text.verbosity`, `prompt_cache_retention`, and `previous_response_id`; logs usage via `input_tokens`/`output_tokens`. |
| `src/app/api/soul-journey-step/route.ts:createResponseText` | Responses | Same resolution as above (default `"gpt-5.2"`) | `max_output_tokens` (env default 700) | Single-turn templated prompt; temperature `0.6`; optional `reasoning.effort`, `text.verbosity`, `prompt_cache_retention`; logs input/output tokens. |
| `src/lib/aiClient.ts:createResponseText` | Responses wrapper | Caller-provided | `max_output_tokens` (resolves aliases) | Maps optional `reasoning`, `text.verbosity`, `prompt_cache_retention`, `prompt_cache_key`, `previous_response_id`; parses `_request_id`; throws when `output_text` is empty. |
| `src/lib/aiClient.ts:runChatCompletion` | Chat Completions | Caller-provided | `max_completion_tokens` | Legacy path (unused in current tree); logs prompt/response text and usage with `completion_tokens`. |

## Findings
- **High — Logging defaults risk prompt leakage (`src/lib/aiLogging.ts`, `.env.example`)**: Logging only requires `PERAZZI_AI_LOGGING_ENABLED="true"` and the example env sets `PERAZZI_LOG_TEXT_MODE=full` with max chars 100k, so full user prompts/responses are persisted by default (including guardrail blocks). Mitigation: default to `omitted` or `truncate`, and require an explicit opt-in for full bodies; consider redacting guardrail-only logs.
- **Medium — Temperature defaults + reasoning gating (`src/app/api/perazzi-assistant/route.ts`)**: Responses calls use `temperature: 1.0` (env `PERAZZI_ASSISTANT_TEMPERATURE`, clamped 0–2). OpenAI only accepts temperature when `reasoning.effort="none"`; add gating to drop sampling params when reasoning is enabled and keep docs/env in sync with the 1.0 default.
- **Medium — Responses usage metrics incomplete (`src/app/api/perazzi-assistant/route.ts`, `src/lib/aiLogging.ts`)**: Logging maps `response.usage.input_tokens`/`output_tokens` into `prompt_tokens`/`completion_tokens` but drops `reasoning_tokens` and does not surface `request_id`/`response_id` outside metadata. Mitigation: add explicit fields for reasoning tokens and IDs to logs/DB schema, or adjust dashboards to read them from metadata.
- **Medium — Prompt caching knobs partly wired (`src/lib/aiClient.ts`, `.env.example`)**: `PERAZZI_PROMPT_CACHE_RETENTION` is forwarded (using `"in-memory"`/`"24h"`), but the documented `PERAZZI_PROMPT_CACHE_KEY` is never applied to requests; retention value uses hyphenated form while the sample env comment uses `in_memory` (API compatibility to be confirmed). Mitigation: plumb `prompt_cache_key` and verify retention strings against the latest Responses spec.
- **Low — Legacy chat-completions wrapper remains (`src/lib/aiClient.ts`)**: `runChatCompletion` still targets `client.chat.completions.create`; not used today but could be mistakenly invoked and bypass Responses-specific logging/guards. Mitigation: remove or clearly deprecate/guard it to prevent accidental reuse.
- **Medium — Test coverage gap (`tests/lib/dealer-brief.test.ts`)**: `pnpm test` fails (`context` deep equality now includes null archetype/locale/platform/model fields). Mitigation: update the test fixture to match the new context shape or adjust the builder to keep the prior minimal shape. Typecheck script is absent, and lint fails widely (pre-existing) — both should be addressed separately.

## Risks & Regressions to Watch
- Token cap now counts reasoning tokens; with `max_output_tokens` at 3000/700, long prompts + high reasoning effort could truncate visible output.
- Default logging setup stores full user content unless envs are tightened; guardrail blocks are logged with user prompts as well.
- Prompt cache retention string (`in-memory` vs `in_memory`) and missing cache key could lead to cache misses or API errors once enabled.
- Temperature increase (1.0) may broaden variance and drift from brand tone relative to earlier 0.4 setting.
- Multi-turn `previous_response_id` is threaded from the client; ensure clients treat it as optional to avoid broken threads.

## Recommended Follow-up Task Cards
1) Harden AI logging defaults for Responses (omit/truncate by default, store request/response IDs and reasoning tokens safely).  
2) Decide and align Responses temperature/max-token behavior with the contract (update code or docs/tests accordingly).  
3) Wire prompt cache key and validate retention string against the current Responses spec.  
4) Remove or deprecate the legacy chat-completions wrapper to prevent accidental fallback.  
5) Fix `tests/lib/dealer-brief.test.ts` failure (context shape) and add a `typecheck` script/run to CI.  
