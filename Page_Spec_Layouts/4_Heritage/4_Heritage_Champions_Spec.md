files["4_Heritage_Champions_Spec.md"] = textwrap.dedent("""\
# Heritage & History – Champions & Lineage

## D. Champions & Lineage *(new; editorial gallery, evergreen‑only)*
**Purpose:** Human proof of legacy—evergreen champions and iconic figures presented as a calm “hall of belonging.”

**Fields (per card):** `name`, `title/role`, `quote`, `image: FactoryAsset`, `article?`, `disciplines?`

**States & Interaction:**  
- Desktop grid (3–4 columns); mobile stacked; optional discipline filters (chips).  
- Clicking a card opens profile (reuse `MarqueeFeature` layout or accessible Dialog).

**Motion Grammar:** Soft fade/scale‑in of cards; remove scale for reduced‑motion.

**Performance:** Lazy‑load portraits; hydrate filters only on interaction; prefetch profile on focus/hover.

**A11y:**  
- Filters are buttons with `aria-pressed`; list uses `<ul role="list">`.  
- Dialog accessible (trap, label, ESC to close).  
- **Guardrail:** If no verified evergreen champion is set, show a generic lineage quote card—never a placeholder name.
"""])