# PerazziGPT Guide (Non-Dev)

This guide explains, in plain language, how to update the PerazziGPT knowledge base using VSCode. No coding required.

## What PerazziGPT is
PerazziGPT is the on-site assistant that answers questions using the official Perazzi documents. It reads a defined list of approved source files and builds an internal knowledge base from them.

## What you are allowed to change
- The source documents under `PGPT/V2/`.
- The official corpus list (the manifest) that says which files are active.

Do not edit scripts or database code unless you are told to.

## Where the official document list lives
The source list is here:
`PGPT/V2/AI-Docs/P2/Source-Corpus.md`

Only documents listed there as `Status: active` will be used.

## Using VSCode (quick steps)
1) Open the repository folder in VSCode.
2) Open the file you want to edit in the left sidebar.
3) Save changes (Cmd+S).
4) Use the Terminal panel (View -> Terminal) to run the commands below.

## Standard workflow (safe and recommended)
Run these in order:

1) Audit (read-only): shows which docs are missing data and need repair.
   `pnpm ingest:v2 -- --audit`

2) Dry run (read-only): previews exactly what would change.
   `pnpm ingest:v2:dry-run`

3) Full run (writes data + embeddings): applies updates.
   `pnpm ingest:v2:full`

If the full run fails, just run it again. It is designed to recover safely.

## How to add a new document
1) Place the new file under `PGPT/V2/`.
2) Add a row for the file in `Source-Corpus.md`.
   - Set `Status` to `active`.
   - Set `Embed_Mode` to `full` unless told otherwise.
3) Run the standard workflow above.

## Output meanings
- NEW: the document is new in the database.
- UPDATED: the document changed.
- REPAIR: the document did not change, but data was missing and is being fixed.
- SKIPPED: nothing to do.

## Common issues and fixes
- Missing env vars: check `.env.local` exists and has `DATABASE_URL`.
- Network or rate limits: wait a few minutes and re-run.
- "Another ingest run is already in progress": wait for the other run to finish.

## When to ask for help
- You see repeated failures after two re-runs.
- You are unsure how to classify a document in the manifest.
- You need to change anything outside `PGPT/V2/`.

