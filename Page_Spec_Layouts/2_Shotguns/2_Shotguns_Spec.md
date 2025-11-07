files["2_Shotguns_Spec.md"] = textwrap.dedent("""\
# Shotguns – Component Architecture & Interaction Spec (Amended)
## Purpose & Emotional Impact
This section is the quiet gallery of Perazzi’s instruments: not a catalog, but a lineage of platforms shaped for mastery. We guide the visitor from platforms → disciplines → fit & feel → personal artistry—affirming that selection is an act of identity, not transaction.

---

## Section-wide Data Bindings (recap)
- **Platform/Frame:** MX / High Tech / TM; fixed-trigger counterparts MX12 / HTS linked from Trigger Explainer and At-a-Glance.
- **Discipline:** Trap / Skeet / Sporting with Setup Recipe fields.
- **Gauge:** Cards & primer content.
- **Grade:** Gallery and wood selector.
- **Champion:** Spotlights on series/discipline pages; use *evergreen* quotes, otherwise fall back to a generic lineage line.
- **Factory Asset:** Hero/engineering imagery.
- **Article:** Related reading modules.

---

## Section-wide State & Variation
- **Responsive:** Grids → stacks; rails → carousels with visible controls; recipes collapsible on mobile; CTAs normalized.
- **Reduced-motion:** Disable pinning, parallax, and stagger; use simple fades or none; collapsibles open/close instantly; rails degrade to lists.
- **Locales:** `next-intl` across all pages; translated titles, blurbs, and alt/captions; avoid text baked into images.
- **Dark/Light:** Tokenized backgrounds; diagram colors invert for contrast; maintain ≥ 4.5:1 contrast everywhere.

---

## Tech Notes & Fallbacks
- **Primary stack:** Next 15 (App Router / RSC / TS), Tailwind + Radix, Sanity (read-only CDN), `next/image` + Cloudinary (unsigned delivery URLs), CSS/WAAPI + Framer Motion (GSAP only for long/tightly choreographed sequences), Vercel Analytics.
- **Fallbacks:** Carousels degrade to lists; collapsibles default open; lightbox degrades to simple links; CMS misses → serve evergreen editorial copy; if motion fails → sections stay static; if Cloudinary unreachable → `next/image` native fallback.

---

## No‑Regrets Checklist (section)
- **Performance:** Page heroes remain LCP; defer below‑fold media; **CLS ≤ 0.05** via `aspect-ratio`/fixed containers.
- **A11y:** Keyboard-first flows for galleries, rails, and links; visible focus; `aria-*` on rails/collapsibles; captions for imagery; locale strings present.
- **Content discipline:** Evergreen champion quotes only; descriptive (non‑promotional) captions; “Begin Your Fitting” as primary CTA and “Request a Visit” as secondary, consistently invitation‑led.
""")