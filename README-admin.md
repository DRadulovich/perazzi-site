# PGPT Insights Admin Dashboard

This admin-only slice of the site surfaces PerazziGPT observability and archetype analytics. Access is gated by `withAdminAuth()` (env + optional token).

## Screens

- **Archetype Trend** — stacked daily archetype mix with an average margin overlay, A/B variant split, and live alert stream listening on `archetype_alert`.
  - ![Archetype Trend](docs/images/pgpt-archetype.png)
- **Trigger Terms** — top 20 weekly trigger tokens from `vw_trigger_terms_weekly`, filterable by week.
  - ![Trigger Terms](docs/images/pgpt-triggers.png)
- **Low-Margin Sessions** — sessions where margin <5% on three+ consecutive turns (link back to Session Explorer).
  - ![Low-Margin Sessions](docs/images/pgpt-quality.png)
- **Template Heat-map** — pivot of archetype × intent × template_id derived from log metadata.
  - ![Template Heat-map](docs/images/pgpt-templates.png)

## Notes

- SQL views required: `vw_archetype_daily`, `vw_trigger_terms_weekly`.
- Alert stream assumes database role can `LISTEN archetype_alert` (see `sql/20251220_archetype_margin_alert.sql`).
- Pages reuse the shared admin sidebar; all routes live under `/admin/pgpt-insights/*`.

## Rerank Tuning (Debug)

These flags help tune retrieval reranking/scoring. They only affect ordering (no DB writes) and are intended for local/staging.

- `PERAZZI_ENABLE_RERANK=true` enables reranking (otherwise results remain ordered by vector similarity only).
- `PERAZZI_RERANK_TUNING_V2=true` enables safer “less spiky” boost behavior.
  - `PERAZZI_RERANK_TUNING_V2_MAX_BOOST=0.25` caps total non-semantic boost.
  - `PERAZZI_RERANK_TUNING_V2_BOOST_MIN_BASE=0.15` suppresses boosts for low base similarity.
  - `PERAZZI_RERANK_TUNING_V2_BOOST_RAMP=0.35` ramps boosts up as base similarity improves.
- `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true` logs a compact, no-content JSON summary per retrieval call.
- `PERAZZI_RERANK_DEBUG_BREAKDOWN=true` adds `boostParts`, `boostRaw`, and `boostScale` to the retrieval debug payload (still no chunk content).

## Retrieval Evaluation Harness (Regression)

Use this retrieval-only harness to confirm canonical queries still hit the expected doc families and catch regressions after chunking/metadata changes. The canonical test cases live in `PGPT/V2/AI-Docs/P2/Validation.md`.

### Run

```bash
pnpm perazzi:eval:retrieval --k 12 --rerank on --candidate-limit 60 --json tmp/retrieval-report.json
```

### Requirements

- `DATABASE_URL` (read-only); the script only queries `documents/chunks/embeddings`.
- Embeddings:
  - Online (default): `OPENAI_API_KEY` (or `AI_GATEWAY_URL` + `AI_GATEWAY_TOKEN`), optional `PERAZZI_EMBED_MODEL`.
  - Offline: provide `--embedding-cache <path>` with precomputed vectors.

### Options

- `--k <number>`: top-k results to return (default `12`).
- `--candidate-limit <number>`: candidate pool size when rerank is enabled (default uses `PERAZZI_RERANK_CANDIDATE_LIMIT` logic).
- `--rerank on|off`: toggles reranking (default: env `PERAZZI_ENABLE_RERANK` or `on`).
- `--min-hits <number>`: minimum expected-family hits in top-k to PASS.
- `--json <path>`: JSON report output (default `retrieval-report.json`).
- `--embedding-cache <path>`: offline embeddings JSON (see formats below).

### Embedding Cache Formats

Any of the following JSON shapes are accepted:

```json
{
  "queries": {
    "What's the difference between the MX and the HT platforms?": [0.1, 0.2, 0.3]
  }
}
```

```json
{
  "byId": {
    "prospect-platform-diff": [0.1, 0.2, 0.3]
  }
}
```

```json
[
  { "id": "prospect-platform-diff", "embedding": [0.1, 0.2, 0.3] }
]
```

### Output

- Console: PASS/FAIL per query, rerank status, and top-k `document.path` + `heading_path` with base/final scores.
- JSON report: includes scores, expected-family matches, and summary totals for diffing runs.
