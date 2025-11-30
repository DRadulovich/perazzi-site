You are an AI code assistant running inside VS Code with access to my full repo.

I want you to AUDIT a specific page in my Next.js app to figure out which content is editable in Sanity vs hard-coded.

**Target route**
- Start from: `XXXXXXXXXX`

**Tech context**
- Framework: Next.js (App Router), React, TypeScript
- CMS: Sanity
- Sanity content is typically loaded via GROQ queries (client.fetch / sanityClient.fetch / useSanityQuery, etc.) and passed down as props.
- Schemas live under: /sanity/schemas (or the closest matching folder in this repo)

---

### Your job

1. Starting from the "Target route" listed above, follow all imports to find every component that contributes visible UI on that page.
   - Only worry about components that actually render something (JSX) on the screen.

2. For each section/component:
   - Identify visible content: headings, body text, labels, button copy, list items, image sources (or key image identifiers).
   - Determine for EACH piece whether it is:
     - **CMS-driven from Sanity** (coming from data loaded via a Sanity query or Sanity-typed props), or
     - **Hard-coded in the codebase** (literal strings, static arrays/objects, static imports, etc).

3. Cross-check with Sanity:
   - Find the Sanity schemas and GROQ queries used to power this page.
   - For any CMS-driven content, note the document type and field name(s) if you can infer them (e.g. `homePage.heroTitle`, `heritageEra.title` etc).

4. Create a **Markdown audit report file** summarizing your findings:
   - Derive a human-readable page name from the target route. For example:
     - `src/app/bespoke/page.tsx` → **Bespoke**
     - `src/app/shotguns/page.tsx` → **Shotguns**
   - Name the report file using this pattern: `<PageName>-Audit-Report.md`.
     - Example: `Bespoke-Audit-Report.md`.
   - Save the file in: `docs/SanityMigration/Page_Audits`.
   - If a report already exists for this page, overwrite it with the latest audit.

   The report should be valid Markdown and follow this structure:

   1. `# Sanity Content Audit – <Page Name>`
   2. `## Overview`
      - Briefly describe what this page does and what this audit covers.
   3. `## Route & Files Scanned`
      - List the primary route file and all key components/files you inspected (with paths).
   4. `## Summary of Content Sources`
      - High-level summary of approximately what percentage of visible content is Sanity-driven vs hard-coded.
      - Short narrative on how “CMS-editable” this page currently is.
   5. `## Detailed Findings by Section`
      - For each major section/component, create a subsection:
        - `### <Section / Component Name>`
        - File path.
        - Bullet list or table of the key visible content pieces and, for each:
          - Whether it is **Sanity CMS** or **Hard-coded**.
          - Where to edit it:
            - If Sanity: document type + field (e.g. `homePage.heroSubtitle`).
            - If hard-coded: file + rough line number or description.
          - Any notes (e.g. “candidate to move into Sanity”, “intentionally static label”).
   6. `## Migration Recommendations`
      - List all visible UI pieces that **should be migrated into Sanity** if we want full non-developer editability.
      - Group them by priority (e.g. High, Medium, Low) if helpful.

5. At the end of the report, include a short **conclusion** section that:
   - Restates the rough percentage of CMS-editable vs hard-coded content.
   - Highlights the top 3–5 most impactful changes to make this page more maintainable and editor-friendly via Sanity.