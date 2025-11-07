files["2_Shotguns_Disciplines_Spec.md"] = textwrap.dedent("""\
# Disciplines → Trap / Skeet / Sporting Clays

## 1) Purpose & Emotional Arc
Speak to **how** you shoot—calm mentor tone. Affirm belonging to the discipline and Perazzi’s role in enabling your style.

## 2) Component Stack (per discipline)

### A. **Discipline Hero** *(reuse)*
Brief ethos line; action image; breadcrumb; high‑contrast heading.

### B. **Overview & Philosophy** *(reuse)*
120–180 words on discipline demands and Perazzi’s approach (POI, swing, ergonomics).

### C. **Recommended Platforms** *(reuse)*
Cards for best‑fit platforms (e.g., MX for doubles stability; HT RS for adjustable POI; TM for singles). Include short rationale per card.

### D. **Setup & Tuning Module** *(collapsible “editorial guidance”)*
**Purpose:** Compact recipe to set expectations; not a spec sheet.  
**Fields:**  
- **POI Range Band:** e.g., Trap ≈ 70/30 – 80/20; Skeet ≈ 50/50; Sporting ≈ 50/50–60/40  
- **Common Barrel Lengths:** e.g., Trap 32–34″; Skeet 28–30″; Sporting 30–32″  
- **Rib Style Notes:** High/adjustable aids rising targets; flat/low ramp for versatile sight picture  
**Interaction:** `@radix-ui/react-collapsible`; default open on desktop, closed on mobile.  
**Motion/A11y:** Height/opacity transitions; `aria-expanded` on trigger; content focusable; reduced‑motion → instant.

### E. **Champion Spotlight** *(reuse; guardrailed)*
Discipline‑specific evergreen quote + image; optional link to Champions page.

### F. **Related Reading** *(reuse)*
2–3 tutorials/interviews; link list with descriptive text.

### G. **CTASection – “Begin Your Fitting”** *(normalized)*

## 3) Data Bindings (Discipline)
- Discipline overview & imagery  
- Recommended platform ids + rationales  
- Setup recipe fields (as above)  
- Champion (evergreen)  
- Related articles

## 4) State / Variation (Discipline)
Modules stack on mobile; recipe collapsible on small screens; reduced‑motion disables animations; localized; dark/light tokens.

## 5) Tech Notes & Fallbacks (Discipline)
Same base stack; recipe uses lightweight JS; if JS absent, show content expanded.

## 6) No‑Regrets (Discipline)
Clear “editorial guidance” label on recipe; keyboard accessibility verified; CTA present and high‑contrast; analytics for card clicks, recipe toggles, CTA.
""")