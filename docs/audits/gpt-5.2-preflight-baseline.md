# GPT-5.2 preflight baseline (2025-12-16T13:35:42-06:00)

- Git: branch `GPT-5.2`, head `66aa4520bb6df39f613ee13a51279fddf2dc4579`, clean worktree.
- Tooling: node `v24.10.0`, pnpm `10.20.0`.
- Env presence: OPENAI_API_KEY/AI_GATEWAY_URL/AI_GATEWAY_TOKEN/DATABASE_URL all unset; PERAZZI_* logging/temperature/cache vars empty.
- Key pnpm scripts: dev (`next dev`), build (`next build`), start (`next start`), lint (`eslint`), test (`vitest`).

## Tests
- `pnpm test` exit code: `1`.
- Failed file: `tests/lib/dealer-brief.test.ts` (payload context mismatch); other suites passed.
- Raw output: `tmp/audit/preflight-gpt-5.2/pnpm-test.txt`.

## Endpoint contracts (dev server http://localhost:3000)
- Root (`/`): 200.
- `/api/perazzi-assistant` scenarios (top-level keys: answer|string, guardrail|object, citations|array, intents|array, topics|array, templates|array, similarity|number, mode|string, archetype|null, archetypeBreakdown|object):
  - Meta origin (“Who built you?”): 200, guardrail.status `ok`, citations empty, archetypeBreakdown present.
  - Meta training (“What are you trained on?”): 200, guardrail.status `ok`, citations empty.
  - Guardrail pricing (“What does a new Perazzi cost?”): 200, guardrail.status `blocked`, reason `pricing`, citations empty, similarity 0.
  - Platform compare (“Explain the difference between the MX platform and the HT platform.”): 500 with `{ error: string }` (“Unexpected error while processing the request.”) — OpenAI/gateway not configured.
- `/api/soul-journey-step` (error shape `{ error: string }`):
  - Missing step: 400 “Missing or invalid step”.
  - Missing userAnswer: 400 “Missing or invalid userAnswer”.
  - Unknown step: 400 “Unknown step”.
  - Success path not attempted (no OpenAI/gateway env).
- Raw responses/headers: `tmp/audit/preflight-gpt-5.2/responses/*`, headers in `tmp/audit/preflight-gpt-5.2/*.headers.txt`.

## PGPT Insights dependencies
- UI routes: `/admin/pgpt-insights`, `/admin/pgpt-insights/qa`.
- API route: `/api/admin/pgpt-insights/log/[id]`.
- Table/column expectations for `perazzi_conversation_logs`: id, created_at, env, endpoint, page_url, archetype, session_id, user_id, model, used_gateway, prompt, response, prompt_tokens, completion_tokens, low_confidence, intents, topics, metadata.
- Metadata keys referenced: maxScore, guardrailStatus, guardrailReason, latencyMs, rerankEnabled, candidateLimit, archetypeSnapped, archetypeConfidenceMargin/archetypeConfidence, archetypeScores (map), retrievedChunks; rerank/archetype decoding tolerates topReturnedChunks/candidateLimit/winner/runnerUp when present.
- Token metrics aggregated from prompt_tokens and completion_tokens; latencyMs averaged when set.
- QA overlays rely on `qa_flags` table (interaction_id join for id/status/reason/notes/created_at).
- DB connectivity check: not connected (DATABASE_URL not set).

## Known baseline issues
- Vitest failure: `tests/lib/dealer-brief.test.ts` expected context differs from produced payload (extra null archetype/model/platform fields).
- OpenAI/gateway not configured, so `/api/perazzi-assistant` platform compare returns 500 and soul-journey success path was skipped.

## Raw artifact paths
- Test log: `tmp/audit/preflight-gpt-5.2/pnpm-test.txt`.
- Endpoint captures: `tmp/audit/preflight-gpt-5.2/responses/` and headers in `tmp/audit/preflight-gpt-5.2/*.headers.txt`.
- Dev server log: `tmp/audit/preflight-gpt-5.2/pnpm-dev.log`.

## Do Not Break checklist
- [ ] Do not change existing API JSON keys/shape for `/api/perazzi-assistant` or `/api/soul-journey-step` unless a task explicitly says so.
- [ ] Keep `perazzi_conversation_logs` insert/select contract usable for PGPT Insights (prompt/response may be omitted/truncated, but UI and queries must not crash).
- [ ] GPT‑5.2 parameter compatibility: `temperature/top_p/logprobs` only allowed when `reasoning.effort = "none"`. Reference: https://platform.openai.com/docs/guides/latest-model
- [ ] Prompt cache retention allowed values are `in_memory` or `24h`. Reference: https://platform.openai.com/docs/guides/prompt-caching
