files["3_Bespoke_Experts_Spec.md"] = textwrap.dedent("""\
# Bespoke Build – Expert Guides

## D. Expert Guides *(new; analogous to `MarqueeFeature` + card grid)*

**Purpose:** Humanize the journey by introducing the masters who will shape your Perazzi (e.g., fitter, stockmaker, engraver).

**Fields (per expert):**
- `id: string`  
- `name: string`  
- `role: string` (e.g., “Master Stockmaker”)  
- `bioShort: string` (80–120 chars, editorial)  
- `headshot: FactoryAsset` (square)  
- `quote?: string` (evergreen)  
- `profileHref?: string` (optional link to full profile)

**Interaction & Layout:** 
- Grid of cards (2–3 columns desktop, 1 column on mobile).  
- Each card focusable; optional “Meet your team” Dialog (Radix) with deeper bio & images.  
- Consider reusing `MarqueeFeature` if a single hero expert is highlighted; otherwise implement `ExpertCard`.

**Motion:** 
- Subtle fade/scale-in per card (0.98→1, ~250 ms, ease-out).  
- Remove scale under `prefers-reduced-motion` and reduce timing.

**A11y:** 
- Dialog: `aria-modal`, `aria-labelledby`, focus trap, ESC to close.  
- Headshots have meaningful `alt` or `alt=""` if purely decorative; role and name in text; ensure 4.5:1 contrast.
""")
