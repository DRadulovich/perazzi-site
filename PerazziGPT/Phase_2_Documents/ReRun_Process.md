# Phase 2 — Re-run Process Expectations

This playbook covers when we rerun the ingestion pipeline, who approves it, and how we verify the results across environments.

## 1. Triggers & Cadence
- **Content changes:** any merge to `main` touching `PerazziGPT/`, `docs/`, or other source directories requires at least a dry-run validation.
- **Sanity updates:** until automation exists, manual exports from Sanity (Vision, CLI, or API) should be followed by a rerun.
- **Scheduled refresh:**
  - Weekly: `pnpm ingest:chunks --dry-run --lint --strict` to detect drift (no DB writes).
  - Monthly: full ingestion to preview and production DBs, even if no repo changes, to ensure Sanity data stays current.
- **Ad hoc:** before major launches/events or when stakeholders request updated knowledge (e.g., new dealer list). Requires Digital Experience lead approval.

## 2. Roles & Approvals
- **Digital Experience Lead (David Radulovich):** approves any production ingestion run and reviews coverage reports.
- **Engineering (Codex / dev team):** executes local and preview reruns, maintains scripts, and ensures validation passes.
- **Access policy:** only approved maintainers get production `DATABASE_URL` and `OPENAI_API_KEY`. Credentials live in the Perazzi 1Password vault.

## 3. Pre-run Checklist
1. Pull latest `main` and confirm working tree is clean.
2. Run `pnpm ingest:validate` (dry-run lint) and review the generated coverage report.
3. Confirm environment variables for the target environment are set:
   - `NODE_ENV=development` for local, `preview`, or `production` as appropriate.
   - `DATABASE_URL`, `OPENAI_API_KEY`, `PGVECTOR_DIM`, `PERAZZI_EMBED_MODEL`, etc.
4. Ensure the vector DB is reachable:
   - Local: `./scripts/dev-vector-db.sh up`.
   - Preview/Prod: test connection via `psql` or `pnpm tsx scripts/check-db.ts`.
5. (Optional) Snapshot the target Postgres database (managed services provide automated backups, but trigger manual snapshot if possible).

## 4. Execution Paths
- **Local:** `pnpm ingest:chunks --env local` writes to Dockerized Postgres.
- **Preview/Staging:** `NODE_ENV=preview DATABASE_URL=... pnpm ingest:chunks --env preview` (or equivalent flag). Run after QA approving new content.
- **Production:**
  1. Obtain approval.
  2. `NODE_ENV=production DATABASE_URL=... pnpm ingest:chunks --env production`.
  3. Monitor logs for chunk counts, embedding stats, and upsert status.

## 5. Post-run Verification
- Run `pnpm ingest:chunks --dry-run --doc <path>` for a recently changed document to confirm deterministic chunking.
- Execute a smoke retrieval script (`pnpm tsx scripts/query-chunks.ts --sample "How do I start the bespoke process?"`) to ensure the new data surfaces.
- Review the newly generated coverage report and attach it to the run log/PR (store in `tmp/ingestion-reports/`).
- Check pgvector table row counts and metadata spot checks (`SELECT count(*) FROM perazzi_chunks WHERE metadata->>'type'='shotguns_landing';`).

## 6. Sanity Integration Notes
- Until webhooks are wired, manual Sanity exports should be stored under `PerazziGPT/Sanity_Info/` with a timestamped PR.
- After importing new Sanity data, run `pnpm ingest:chunks --doc PerazziGPT/Sanity_Info/models.json` to update only the affected chunks if desired.
- Future plan: Sanity webhook → GitHub Action triggers `pnpm ingest:chunks --doc <sanity-doc>` automatically. Document any automation design here when it lands.

## 7. Failure Handling
- If ingestion fails mid-run:
  - Capture logs and coverage report for debugging.
  - Do **not** partially deploy; either rerun after fixing errors or restore the previous Postgres snapshot.
  - For production issues, notify stakeholders and coordinate rollback (restore DB backup or re-run previous successful ingestion commit).
- Keep previous embedding baselines (`tmp/ingestion-baseline.json`) to diff against when diagnosing anomalies.

## 8. Documentation & Auditing
- Update `README.md` with rerun instructions so any engineer can follow the process.
- Maintain a lightweight run log (e.g., `PerazziGPT/Phase_2_Documents/Runs.md`) recording date, environment, operator, and outcome.
- Include rerun checklist in PR template: "[ ] Production ingestion run approved and completed" when applicable.

Following this process ensures reruns happen intentionally, with clear ownership and verification across local, preview, and production environments.
