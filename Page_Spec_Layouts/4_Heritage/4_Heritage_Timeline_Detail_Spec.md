files["4_Heritage_Timeline_Detail_Spec.md"] = textwrap.dedent("""\
# Heritage & History – Milestone Detail Drawer (optional)

## C. Milestone Detail Drawer *(new; optional deep‑dive)*
**Purpose:** Let users open a non‑modal drawer or Radix Dialog for deeper context (e.g., MX8 creation around Mexico City 1968; Daniele’s early years; 2012 legacy; 2023 partnership).

**Fields:** `eventId`, `detailHtml`, `gallery?: FactoryAsset[]`, `related?: Article[]`

**States & Interaction:**  
- Opens via “Learn more” from an event; arrow‑key nav within gallery; **ESC** closes.  
- Non‑modal edge drawer preferred on desktop; fallback to Radix Dialog for modal.

**Motion Grammar:** Drawer slides in (~200 ms ease‑out), content fades; reduced‑motion = no transition.

**Performance:** Load detail payload on demand; pre‑measure container to avoid CLS; lazy‑load gallery on open.

**A11y:** `aria-labelledby`/`aria-describedby`; focus trap; return focus to trigger on close; images have alt/captions; links descriptive; sequential tab order.
""")