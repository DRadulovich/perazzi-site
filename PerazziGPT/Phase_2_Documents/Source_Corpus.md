# Phase 2 — Source Corpus Inventory

This manifest lists all content types eligible for ingestion, their priority order, and pricing-sensitive fields to exclude at chunk time. Update the priority or exclusions here as new sources are added.

## Priority Order Overview
1. **Phase 1 Specs & Voice** — Foundational behavior, tone, and guardrails.
2. **Brand & Heritage Guides** — Deep ethos references that inform narrative answers.
3. **Live Site Narratives** — Canonical descriptions of key experiences (shotguns landing, bespoke, service, heritage) until CMS pages are ingested directly.
4. **Company & Ownership Docs** — Dealers, service centers, events, athletes, consumer notices.
5. **Gun Information** — Technical references (rib heights, manufacture years, model database export).
6. **Sanity Exports** — Structured CMS data (models, assets, schemas) for future automation.
7. **Pricing & Models** — CSV price lists and accessory tables; only non-pricing metadata should be embedded.

## Detailed Inventory

### 1. Phase 1 Specs & Voice (Highest Priority)
- `PerazziGPT/Phase_1_Documents/Use_Case_Depth.md`
- `PerazziGPT/Phase_1_Documents/Non_Negotiable_Guardrails.md`
- `PerazziGPT/Phase_1_Documents/Voice_Calibration.md`
- `docs/assistant-spec.md`

**Notes:** Embed in full. Tag with `audience=internal`, `visibility=concierge_only` for prompt usage.

### 2. Brand & Heritage Guides
- `PerazziGPT/Brand_Info/Perazzi Brand Bible.md`
- `PerazziGPT/Brand_Info/Perazzi Brand Ethos and Personality.md`
- `PerazziGPT/Brand_Info/Perazzi Writing Tone.md`

**Notes:** Embed entire docs; flag any pricing mentions (none currently). Mark `audience=internal`, `confidentiality=internal`.

### 3. Live Site Narratives (Proxy for CMS Pages)
- `PerazziGPT/Live_Site_Narratives/Shotguns_Landing.md`
- `PerazziGPT/Live_Site_Narratives/Bespoke_Journey.md`
- `PerazziGPT/Live_Site_Narratives/Service_Philosophy.md`
- `PerazziGPT/Live_Site_Narratives/Heritage_Timeline.md`

**Notes:** Treat as public-facing content; embed fully.

### 4. Company & Ownership Docs
- `PerazziGPT/Company_Info/Athletes.md`
- `PerazziGPT/Company_Info/Authorized_Dealers.md`
- `PerazziGPT/Company_Info/Recommended_Service_Centers.md`
- `PerazziGPT/Company_Info/Scheduled_Events.md`
- `PerazziGPT/Company_Info/Consumer_Warning_Notice.md`
- `PerazziGPT/Company_Info/Olympic_Medals.json`

**Notes:** Embed text fields; for JSON, chunk entries by athlete/event. No pricing present.

### 5. Gun Information
- `PerazziGPT/Gun_Info/Manufacture_Year.md`
- `PerazziGPT/Gun_Info/Rib_Information.md`
- `PerazziGPT/Gun_Info/Sanity_Model_Database.json`

**Notes:** Embed textual sections and structured entries; ensure chunking keeps per-model context intact.

### 6. Sanity Exports (Reference Only for Now)
- `PerazziGPT/Sanity_Info/models.json`
- `PerazziGPT/Sanity_Info/models-with-assets.json`
- `PerazziGPT/Sanity_Info/models-with-assets.ndjson`
- `PerazziGPT/Sanity_Info/models-with-schema.ndjson`

**Notes:** Do not embed directly until automation is ready. Use for schema reference; flag as `visibility=internal`. (Can be moved up the priority ladder once ingestion scripts parse them.)

### 7. Pricing & Models (Selective Embedding)
- `PerazziGPT/Pricing_And_Models/*.csv`
  - `Accessories_Retail_Price_List.csv`
  - `Barrels_Retail_Price_List.csv`
  - `ExtraCharges_Retail_Price_List.csv`
  - `Parts_Price_List.csv`
  - `Shotguns_Retail_Price_List.csv`
  - `StocksAndForends_Retail_Price_List.csv`
  - `TriggerGroups_Retail_Price_List.csv`
  - `Upgrades_Retail_Price_List.csv`

**Exclusion Policy:**
- Extract only descriptive metadata (e.g., accessory category names, model codes, option descriptions) if useful.
- Exclude numeric pricing columns (`MSRP`, `Price`, `Retail`, `Dealer`, etc.) at chunk time.
- Flag any chunk derived from these files with `pricing_sensitive=true` and `guardrail_flags=["contains_pricing_fields"]` even though prices are removed, so downstream logic can decide whether to cite them.

## Processing Guidelines
- Maintain this ordering when building the ingestion queue to ensure prompt-defining docs enter the vector store first.
- For future sources (e.g., Sanity GROQ exports, SITE_DOCUMENTS/), append here with priority, notes, and exclusion rules.
- If a document mixes pricing and narrative, split into separate chunks/documents so only narrative sections are embedded.
