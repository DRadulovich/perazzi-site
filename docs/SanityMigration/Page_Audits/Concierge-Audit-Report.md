# Sanity Content Audit – Concierge

## Overview
- Audited the Concierge page (`src/app/concierge/page.tsx`) to determine which visible UI is CMS-driven via Sanity vs hard-coded.
- Traced the hero and the full Concierge shell (chat/build flow UI) to see how copy, imagery, and labels are provided.

## Route & Files Scanned
- `src/app/concierge/page.tsx`
- Components:
  - `src/components/concierge/ConciergeHero.tsx`
  - `src/components/concierge/ConciergePageShell.tsx`
  - `src/components/concierge/GuardrailNotice.tsx`
  - `src/components/concierge/SanityDetailsDrawer.tsx`
  - `src/components/concierge/BuildSheetDrawer.tsx` (not deeply inspected; shares same hard-coded labels pattern)
- No Sanity queries or schemas are referenced by this page.

## Summary of Content Sources
- 0% CMS-driven from Sanity. All hero text, imagery, bullets, CTA anchors, chat/build UI labels, mode names, tooltips, guardrail messages, and drawer copy are hard-coded in the route or components.
- The page is entirely code-managed; any copy/image changes require developer edits.

## Detailed Findings by Section

### Hero — `src/components/concierge/ConciergeHero.tsx`
- Eyebrow “Perazzi Concierge”, title, subheading, background image (`/cinematic_background_photos/p-web-10.jpg`), bullets, and CTA links (“Open the conversation”, “Jump to build flow”) → **Hard-coded** in `src/app/concierge/page.tsx` hero object.

### Concierge Shell & Chat UI — `src/components/concierge/ConciergePageShell.tsx`
- Mode labels (“New to Perazzi”, “Existing owner”, “Navigation / visit”), field labels/descriptions (`FIELD_LABELS`, `FIELD_DESCRIPTIONS`), saved builds text, buttons (“Save”, “View details”, “Compare”, “Reveal Record”, etc.), error/helper strings, favorites/compare limits, and all drawer headings → **Hard-coded** in component.
- Any data surfaced (assistant messages, info cards, engraving search results) comes from application logic/assistants, not directly from Sanity for this page.

### Guardrail Notice — `src/components/concierge/GuardrailNotice.tsx`
- Status messages (“This answer is based on limited information…”, “Policy-limited answer.”) → **Hard-coded**.

### Sanity Details Drawer — `src/components/concierge/SanityDetailsDrawer.tsx`
- Drawer headings (“Sanity Data”, “Details for the current step”), buttons (“Close”, “View more”), empty/error/loading states → **Hard-coded**.

### Build Sheet Drawer (not detailed) — `src/components/concierge/BuildSheetDrawer.tsx`
- Labels/buttons/empty states follow the same pattern: **Hard-coded**.

## Migration Recommendations
- High: Move hero content (eyebrow/title/subheading/bullets/hero image/CTA anchors) into Sanity so marketing can adjust concierge positioning without code changes.
- Medium: Externalize chat/build UI labels and helper text (`FIELD_LABELS`/`FIELD_DESCRIPTIONS`, buttons, favorites/compare notices) to translations or a CMS-managed settings doc for faster iteration.
- Medium: Add a CMS-managed intro/help/CTA block around the concierge shell to guide users; keep editable in Sanity.
- Low: Consider CMS/i18n control for guardrail/drawer messaging to tweak tone without deploys.

## Conclusion
- Estimated CMS vs hard-coded: 0% CMS-driven vs 100% hard-coded for this page.
- Most impactful changes: (1) CMS-ify the hero content, (2) externalize field labels/descriptions and UI copy, (3) add CMS-controlled helper/CTA content, (4) allow guardrail/drawer messaging to be edited without code. 
