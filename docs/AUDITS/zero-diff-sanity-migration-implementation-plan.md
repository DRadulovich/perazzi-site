# Zero-Diff Sanity Migration Implementation Plan

Generated: 2026-01-08

## Current State
- Audits already complete:
  - `docs/audits/content-source-audit.md`
  - `docs/audits/content-source-audit.json`
  - `docs/audits/cinematic-assets-audit.md`
  - `docs/audits/hardcoded-to-sanity-migration-plan.md`
  - `docs/audits/sanity-content-reference-map.md`
- Sanity dataset snapshot exists (production) and shows populated singletons and collections.
- Known gaps from the snapshot: `homeSingleton.finale`, `heritageHome.oralHistories`, `grade.engravingGallery`, `grade.woodImages`, and `siteSettings` footer/social/SEO.

## Scope
- In scope: public site user-facing copy (marketing copy + system UI labels) and all fixture/config content that renders on the public site; all photos not already in Sanity assets.
- Exclusions: admin pages, ARIA labels, and error messages.
- Goal: zero-diff migration (no visual or copy changes during or after the move).

## Definition of Done
- Every public route’s copy and imagery are sourced from Sanity (or explicit Sanity-backed fallbacks) with no UI changes.
- All non-CMS images referenced in the public UI are uploaded to Sanity and wired to fields.
- Sanity schemas cover all migrated fields; no duplicate imports.
- QA confirms parity for all audited routes and shared UI (nav, footer, flyouts, CTAs, SEO metadata).

## Phased Implementation Plan (Each Phase = One Full Pass)

### Phase 1 — Scope Lock + Baseline Snapshot
Purpose: freeze requirements and confirm what already exists in Sanity so we do not duplicate work.
- Inputs: `docs/audits/content-source-audit.md`, `docs/audits/sanity-content-reference-map.md`.
- Tasks:
  - Confirm route list and exclusions (admin, ARIA, error messages).
  - Confirm dataset and API version used for the snapshot.
  - Mark the pages and sections already populated in Sanity as “do not migrate.”
- Outputs:
  - A locked scope checklist (append to this plan).
- Exit criteria:
  - All in-scope routes and components are explicitly listed, with exclusions confirmed.

### Phase 2 — Reconciliation Pass (Gap Matrix)
Purpose: produce a single source of truth for what still needs to be migrated.
- Inputs: `docs/audits/content-source-audit.md`, `docs/audits/sanity-content-reference-map.md`, `docs/audits/cinematic-assets-audit.md`.
- Tasks:
  - For each in-scope route/component, map hardcoded or fixture content to an existing Sanity field or a required new field.
  - Mark each item as one of: already in CMS, missing in CMS, no schema field.
  - Include images and background assets.
- Outputs:
  - `docs/audits/migration-gap-matrix.md` (table of content items + Sanity mapping + status).
- Exit criteria:
  - Every in-scope content item is mapped and statused.

### Phase 3 — Schema Delta Pass (If Needed)
Purpose: add any missing fields or document types required by the gap matrix.
- Inputs: `docs/audits/migration-gap-matrix.md`.
- Tasks:
  - Identify all items marked “no schema field.”
  - Define or extend Sanity schemas to cover missing content (documents and fields).
  - Validate schema builds locally; deploy schema updates.
- Outputs:
  - Schema change list and updated schemas in `sanity/schemas/**`.
- Exit criteria:
  - All “no schema field” items have a CMS home.

### Phase 4 — Asset Ingestion Pass
Purpose: move all non-CMS imagery into Sanity assets.
- Inputs: `docs/audits/cinematic-assets-audit.md`, `docs/audits/migration-gap-matrix.md`.
- Tasks:
  - Upload local/remote images to Sanity.
  - Attach assets to their target fields with alt text.
  - Record mappings for each asset path or URL.
- Outputs:
  - Asset upload log and resolved field mappings.
- Exit criteria:
  - Every image referenced in the UI has a Sanity asset + field mapping.

### Phase 5 — Content Seeding Pass
Purpose: populate Sanity with the hardcoded/fixture content that is still missing.
- Inputs: `docs/audits/migration-gap-matrix.md`.
- Tasks:
  - Seed text and structured content from `src/content/**`, `src/config/**`, and hardcoded strings.
  - Prefer scripted imports for bulk items, manual entry for small sets.
  - Verify no duplication against existing Sanity docs.
- Outputs:
  - Content import log and updated Sanity content.
- Exit criteria:
  - All “missing in CMS” items are populated.

### Phase 6 — Code Wiring Pass (Zero-Diff)
Purpose: switch content consumption to Sanity while keeping output identical.
- Inputs: updated schemas + populated content.
- Tasks:
  - Update queries and component data bindings to read from Sanity fields.
  - Keep existing hardcoded values as fallbacks during transition.
  - Limit to public site routes/components; exclude admin, ARIA, and error messages.
- Outputs:
  - Code updates that replace hardcoded content with Sanity-backed data.
- Exit criteria:
  - All public UI content is driven by Sanity with fallbacks in place.

### Phase 7 — Parity QA Pass
Purpose: ensure zero visual and copy diffs between pre- and post-migration.
- Inputs: updated code + populated Sanity content.
- Tasks:
  - Spot-check every public route and shared UI (nav, footer, flyouts, CTAs, SEO).
  - Validate image rendering and responsive breakpoints.
  - Fix any mismatches by adjusting CMS content, not code, where possible.
- Outputs:
  - QA checklist with pass/fail notes.
- Exit criteria:
  - All in-scope routes match baseline output.

## Notes and Guardrails
- No admin pages, ARIA labels, or error messages are moved into Sanity.
- System UI labels and marketing copy are in scope.
- Fixtures in `src/content/**` and `src/config/**` are included if they render on the public site.

