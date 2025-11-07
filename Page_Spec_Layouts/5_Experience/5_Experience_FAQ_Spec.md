files["5_Experience_FAQ_Spec.md"] = textwrap.dedent("""\
# Experience Perazzi – FAQs (“Before You Come”)

## G. FAQs — “Before You Come” *(new; compact Q/A + optional JSON‑LD)*
**Purpose:** Remove anxieties—travel, dress, safety, photography, language, timing.

**Fields:** 3–6 Q/A pairs; optional link to policy page.

**States & Interaction:** Static list by default; mobile may use collapsible Q/A (Radix Collapsible).

**Motion:** None or subtle; reduced‑motion = instant.

**Performance:** Lightweight; if JSON‑LD present, render server‑side; no layout shift.

**A11y:** Each question is a heading (`<h3>`), answer follows as paragraph; collapsible triggers with `aria-expanded`/`aria-controls`; all text meets 4.5:1 contrast.
"""])
