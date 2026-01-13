# Shop Design Implementation Plan — Approach C (Concierge Commerce)

## Goals
- Bring `/shop` and sub-pages up to the same cinematic visual language and motion quality as the rest of the site.
- Layer in concierge-style guidance and reassurance across the shop funnel.
- Use cinematic background photography in a consistent, intentional way.
- Keep performance, accessibility, and BigCommerce logic intact.

## Non-goals
- No changes to BigCommerce data fetching, checkout flow, or pricing logic.
- No redesign of global navigation or footer.
- No CMS/schema changes unless explicitly requested later.

## Inputs Needed
- Approved background images (desktop-first, with optional tablet/mobile variants) for:
  - Shop hero
  - Shop concierge guidance panel
  - Cinematic strip on list pages
  - Product concierge panel
  - Cart concierge panel / empty cart background
- Final copy for concierge CTAs and reassurance statements.

---

## Step 1 — Concierge Shop Hero + Layout Alignment

Manual steps (if needed):
- Provide the hero photography (file paths or CMS asset IDs) and alt text.
- Approve hero title/subtitle and CTA labels/links.

**TASK CARD 1**
- Create `src/content/shop/hero.ts` with default hero content, including:
  - Title, subtitle, concierge CTA label + href, secondary CTA label + href.
  - Background image(s) and alt text (use placeholders until assets are provided).
- Create `src/components/shop/ShopHero.tsx` (client component) that:
  - Mirrors the cinematic hero language used in `src/components/service/ServiceHero.tsx`.
  - Uses parallax, film grain, overlay gradients, and `homeMotion` transitions.
  - Renders a single `h1` for page semantics.
- Update `src/app/(site)/shop/layout.tsx` to remove top padding so the full-bleed hero sits flush under the nav (same pattern as concierge layout).
- Update `src/app/(site)/shop/page.tsx` and `src/app/(site)/shop/category/[slug]/page.tsx` to:
  - Render `ShopHero` at the top.
  - Remove the current `PageHeading` block so there is only one `h1`.
  - Keep the cart link visible, but move it into the hero CTA row if possible.
- Ensure all new elements are keyboard accessible and do not break SSR/CSR hydration.
- Run `pnpm lint` and `pnpm typecheck`, and fix any issues related to files touched in this TASK CARD.
- At the end, output a non-dev summary of what was completed and what is missing.
  - If fully implemented, output exactly: `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

## Step 2 — Concierge Guidance Panel + Cinematic Bands + Grid Reveal

Manual steps (if needed):
- Provide the background image for the concierge guidance panel and the list-page cinematic strip.
- Approve the 3-step concierge guidance copy and CTA labels.

**TASK CARD 2**
- Create `src/components/shop/ShopConciergePanel.tsx` that:
  - Presents a 3-step concierge guidance block (e.g., “Tell us your discipline → Select fit profile → Book a session”).
  - Uses `src/components/ui/section-reveal` primitives for staggered reveals (no extra JS beyond what exists).
  - Uses a cinematic background via `src/components/ui/section-reveal/section-backdrop.tsx` with scrim/overlay classes.
- Add a list-page cinematic band using `src/components/shotguns/CinematicImageStrip.tsx`.
- Update `src/app/(site)/shop/page.tsx` and `src/app/(site)/shop/category/[slug]/page.tsx` to:
  - Insert `ShopConciergePanel` between the hero and the filters/grid section.
  - Insert the cinematic strip either just before or just after the product grid (pick one placement and keep it consistent).
- Update `src/components/shop/ProductGrid.tsx` to support reveal sequencing without turning it into a client component:
  - Wrap the grid in a `section-reveal-body` container.
  - Add `data-reveal-item` wrappers per card with `--reveal-index` styling for stagger.
- Run `pnpm lint` and `pnpm typecheck`, and fix any issues related to files touched in this TASK CARD.
- At the end, output a non-dev summary of what was completed and what is missing.
  - If fully implemented, output exactly: `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

## Step 3 — Product Page Concierge Layer + Gallery Cinematic Polish

Manual steps (if needed):
- Provide product-page background image and approved concierge copy for this section.
- Approve CTA labels (e.g., “Ask the concierge”, “Book a fitting”).

**TASK CARD 3**
- Create `src/components/shop/ProductConciergePanel.tsx` that:
  - Uses a cinematic background (via `SectionBackdrop`) and overlay/scrim classes.
  - Contains a short concierge reassurance statement and two CTAs.
  - Uses reveal animation (section-reveal primitives or framer-motion) consistent with Step 2.
- Update `src/app/(site)/shop/product/[slug]/page.tsx` to insert the panel after the description/options block.
- Update `src/components/shop/ProductGallery.tsx` to add cinematic polish:
  - Add film grain overlay on the main image.
  - Add subtle scale/opacity transitions for the active image and thumbnail hover states.
- Run `pnpm lint` and `pnpm typecheck`, and fix any issues related to files touched in this TASK CARD.
- At the end, output a non-dev summary of what was completed and what is missing.
  - If fully implemented, output exactly: `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

## Step 4 — Cart Concierge Reassurance + Empty State Lift

Manual steps (if needed):
- Provide cart panel background image and copy for reassurance (shipping, care, concierge access).
- Approve empty cart CTA copy if it should differ from the default.

**TASK CARD 4**
- Create `src/components/shop/CartConciergePanel.tsx` (or reuse `ShopConciergePanel` with a variant prop) that:
  - Adds concierge reassurance and a clear CTA to `/concierge`.
  - Uses cinematic background + overlay styling.
- Update `src/app/(site)/shop/cart/page.tsx` to:
  - Add the concierge panel below the cart list and near the empty state.
  - Add reveal sequencing to cart items using `section-reveal-body` and `data-reveal-item` wrappers.
  - Ensure the empty state still renders cleanly if there are zero items.
- Run `pnpm lint` and `pnpm typecheck`, and fix any issues related to files touched in this TASK CARD.
- At the end, output a non-dev summary of what was completed and what is missing.
  - If fully implemented, output exactly: `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`
