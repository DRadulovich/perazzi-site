# Phase 2 — Retrieval Metadata Schema

Use this schema for every chunk emitted by the ingestion pipeline. Store metadata alongside the chunk payload (e.g., JSON per chunk or columns in Postgres/pgvector) so downstream services can filter, audit, and render answers predictably.

## 1. Core Identifiers
- `id` (string, UUID/slug) — stable document identifier.
- `chunk_id` (string) — `{id}#chunk-{n}` to disambiguate multi-part docs.
- `source_path` (string) — repo-relative path or external file reference.
- `source_url` (string) — canonical public URL if content is live.
- `type` (enum) — e.g., `shotguns_landing`, `bespoke_overview`, `service_home`, `heritage_home`, `dataset`, `athlete_profile`.
- `subtype` (enum) — finer granularity such as `mode=prospect/owner/navigation`, `section=platform/service/heritage`.

## 2. Content Descriptors
- `title` (string) — human-readable heading.
- `summary` (string) — first 1–2 sentences for preview cards.
- `language` (ISO code) — `en`, `it`, etc.
- `audience` (enum) — `prospect`, `owner`, `docent`, `internal`.
- `discipline` (enum) — `ata_trap`, `bunker_trap`, `sporting`, `skeet`, `helice`, `heritage`.
- `platform` (enum/multi) — `mx`, `ht`, `tm`, `bespoke`, `accessories`.
- `persona` (enum) — `first_time_buyer`, `champion`, `service_seeker`, `collector`.

## 3. Regional & Localization
- `region` (enum) — `us`, `eu`, `apac`, etc.
- `market_notes` (string) — clarifications like compliance statements.
- `locale_variant` (string) — handles locale-specific phrasing.

## 4. Operational Fields
- `last_updated` (ISO-8601 date).
- `effective_from` / `expires_on` (date) — for time-bound content or events.
- `source_version` (git SHA, Sanity `_rev`, or version string).
- `source_checksum` (hash) — detect drift between text and embeddings.
- `ingested_at` (timestamp) — when the chunk last entered the vector store.
- `embedding_model` (string) — e.g., `text-embedding-3-small`.
- `token_count` (int) — per chunk, post-cleanup.
- `chunk_index` / `chunk_count` (int) — ordering metadata.
- `embedding_norm` (float) — store to detect low-signal embeddings.

## 5. Access & Safety
- `visibility` (enum) — `public`, `concierge_only`, `staff_only`.
- `confidentiality` (enum) — `public`, `internal`, `restricted`.
- `guardrail_flags` (array) — e.g., `contains_pricing`, `contains_technical_instructions`, `requires_handoff`.
- `pricing_sensitive` (bool) — quick filter for price lists (default `false`).
- `legal_reviewed` / `compliance_reviewed` (date/bool) — track approvals.

## 6. Traceability
- `author` (string).
- `approver` (string).
- `stakeholders` (array of `{name, role}`).
- `license` / `usage_rights` (string) — especially for imagery or third-party quotes.

## 7. Navigation & CTA Hints
- `cta_links` (array) — objects like `{label, url, action}` for direct routing.
- `context_tags` (array) — `cta=dealer`, `intent=fitting`, `workflow=service`.
- `related_entities` (array) — cross-links to model IDs, athlete IDs, event IDs.
- `structured_refs` (array) — e.g., `{"entity_type":"model","entity_id":"mx2000rs"}`.

## 8. Safety & Conversation Handling
- `safety_notes` (string) — explanations for refusal scaffolding.
- `escalation_path` (enum) — `human_concierge`, `dealer_referral`, etc.
- `off_topic_response` (string) — optional canned deflection copy.

## 9. Coverage Checklist
1. **Content ready?** Confirm `summary`, `audience`, `discipline`, `platform`.
2. **Regionally scoped?** Ensure `region`/`locale_variant` are set or default to `global`.
3. **Lifecycle tracked?** Fill `effective_from`/`expires_on` for events and pricing.
4. **Safety flagged?** Mark `guardrail_flags` for anything pricing/legal/technical.
5. **Traceable?** Include `source_version`, `source_checksum`, `author`, `approver`.
6. **Actionable?** Provide `cta_links` or `context_tags` for navigation responses.
7. **Structured joins?** Populate `related_entities` for cross-referencing models, athletes, heritage entries.

## 10. Example Chunk Metadata (YAML)
```yaml
id: shotguns-landing
chunk_id: shotguns-landing#chunk-01
type: shotguns_landing
subtype: prospect_mode
title: Shotguns Landing — Hero Copy
summary: Every target, every story, begins with balance between hands...
language: en
audience: prospect
discipline: sporting
platform: mx
persona: first_time_buyer
region: us
locale_variant: en-US
source_path: PerazziGPT/Live_Site_Narratives/Shotguns_Landing.md
source_url: /shotguns
source_version: 0b5f2a1
source_checksum: 0d6131c8...
last_updated: 2025-11-18
effective_from: 2025-11-01
expires_on: null
ingested_at: 2025-11-18T15:42:00Z
embedding_model: text-embedding-3-small
token_count: 220
chunk_index: 1
chunk_count: 4
embedding_norm: 1.02
visibility: public
confidentiality: public
guardrail_flags: []
pricing_sensitive: false
legal_reviewed: 2025-11-10
author: David Radulovich
approver: David Radulovich
stakeholders:
  - name: David Radulovich
    role: Digital Experience Lead
cta_links:
  - label: Explore Bespoke
    url: /bespoke
    action: open_page
context_tags: [\"cta=dealer\", \"intent=fitting\"]
related_entities:
  - entity_type: discipline
    entity_id: sporting
structured_refs: []
```

Treat this document as the contract between ingestion, the vector store, and the Concierge API. Update it whenever metadata requirements change, keeping version history in git for auditability.
