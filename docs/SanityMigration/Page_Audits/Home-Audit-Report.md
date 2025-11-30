# Sanity Content Audit – Home

## Overview
- Audited the Home page rendered from `src/app/page.tsx` to map all visible UI to either Sanity-driven content or hard-coded strings/media.
- Traced data flow from the `getHome` GROQ query through composed components (hero, timeline, marquee, CTA) plus the site shell (header/footer) and an inline “Need a guide?” block.

## Route & Files Scanned
- `src/app/page.tsx`
- `src/sanity/queries/home.ts`
- `sanity/schemas/documents/homeSingleton.ts` (and referenced `sanity/schemas/champion.ts`)
- `src/content/home/{hero.ts,stages.ts,champion.ts,finale.ts,factory-assets.ts}` (fallbacks)
- `src/components/site-shell.tsx` (+ `src/messages/en.json` for header brand)
- `src/components/home/hero-banner.tsx`
- `src/components/home/timeline-scroller.tsx` and `src/components/home/timeline-item.tsx`
- `src/components/home/marquee-feature.tsx`
- `src/components/home/cta-section.tsx`
- `src/components/chat/ChatTriggerButton.tsx`

## Summary of Content Sources
- Roughly 65% of the primary page content (hero imagery/text, timeline stages, champion block, finale CTA) is sourced from Sanity `homeSingleton` with code-side fallbacks if fields are missing.
- Remaining ~35% is hard-coded: navigation/footer copy, the “Need a guide?” section, hero CTA labels, timeline section headings, marquee background, and manifesto/scroll text.
- The page is moderately CMS-editable: main narrative blocks swap when Sanity is populated, but many labels/supporting paragraphs and an entire guidance section remain static in code.

## Detailed Findings by Section

### Site Shell (Header/Footer) — `src/components/site-shell.tsx`
- Brand label (`Perazzi`) comes from translations `src/messages/en.json` → **Hard-coded (messages)**.
- Primary nav links (`Home`, `Shotguns`, etc.), flyout copy, Build Planner/Store CTAs → **Hard-coded** in `src/components/primary-nav.tsx`.
- Footer headline/body (“Purpose-built competition shotguns…”) and Explore/Support link text → **Hard-coded** in `site-shell.tsx`.
- Chat widget presence toggled by prop; no Sanity content.

### Hero Banner — `src/components/home/hero-banner.tsx`
- Background image/alt/caption and hero heading words: `homeData.hero` → **Sanity CMS** (`homeSingleton.hero.background/tagline/subheading`; fallback `src/content/home/hero.ts` + `factory-assets.ts` if missing).
- Manifest headline text shown via `subheading ?? tagline` → **Sanity CMS** with fallback.
- Caption under hero image → **Sanity CMS** caption on `hero.background`.
- CTA button label “Ask the concierge” and payload question → **Hard-coded** in component (~lines 94-110).
- Secondary link “Explore shotguns” (/shotguns) → **Hard-coded**.
- Scroll indicator text “Scroll” and icon → **Hard-coded** in `scroll-indicator.tsx`.
- Manifesto overlay copy (four lines) and close button text → **Hard-coded** in `hero-banner.tsx`.

### Craftsmanship Timeline — `src/components/home/timeline-scroller.tsx` + `timeline-item.tsx`
- Stage titles, bodies, media (image url/alt/caption/aspect) → **Sanity CMS** `homeSingleton.timelineStages[]` (`title`, `body`, `media`) mapped via `mapStages`; fallback `src/content/home/stages.ts` if absent.
- Section headings/eyebrow copy: “Craftsmanship Journey”, “Three rituals…”, “Scroll through each stage…”, “Fitting Timeline”, mobile instructions, button text “Show more/Collapse” → **Hard-coded** in `timeline-scroller.tsx`.
- Background image behind section (`/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg`) → **Hard-coded asset** from `public`.

### “Need a guide?” Section — inline in `src/app/page.tsx`
- Heading “Need a guide?”, paragraph explaining concierge, ChatTrigger label “Ask about platforms” + payload question, link text “Explore shotguns”, and descriptive list for HT/MX/TM plus closing paragraph → **Hard-coded** in route file.

### Champion Marquee — `src/components/home/marquee-feature.tsx`
- Featured champion name/title/quote/image and optional article title/slug → **Sanity CMS**: `homeSingleton.featuredChampion` reference to `champion` doc (`name`, `title`, `quote`, `image.alt/url`, `articles[0].slug/title`) or fallback `homeSingleton.marqueeInline` (`quote`, `credit`, `image`). If both missing, code falls back to `src/content/home/champion.ts`.
- Eyebrow “Champion spotlight” label, background image (`/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg`), button arrow glyph → **Hard-coded**.

### Finale CTA — `src/components/home/cta-section.tsx`
- Body copy and CTA labels/links → **Sanity CMS** `homeSingleton.finale.{text,ctaPrimary{label,href},ctaSecondary{label,href}}`; required fields or component hides/uses fallback `src/content/home/finale.ts`.
- Section title “Join the legacy” → **Hard-coded** in component.

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels and payload questions passed in from callers (hero, guide section) are **Hard-coded** at call sites; component itself is purely presentational/behavioral.

### Sanity Query & Mapping — `src/sanity/queries/home.ts`
- GROQ targets `*[_type == "homeSingleton"][0]` selecting `hero`, `timelineStages`, `featuredChampion`, `marqueeInline`, `finale`.
- Mapping functions apply fallbacks from `src/content/home/*` when Sanity is missing or incomplete; images mapped through `imageWithMeta` → `FactoryAsset`.

## Migration Recommendations
- High: Move the entire “Need a guide?” block (heading, paragraphs, bullets, CTA/link labels/payload text) into `homeSingleton` or a referenced object to let editors adjust guidance without code changes.
- High: Make hero CTAs editable (label + concierge question + secondary link label/href) alongside hero copy in Sanity.
- Medium: Externalize timeline section framing copy (“Craftsmanship Journey”, subheading, instructions, Fitting Timeline label/button text) into Sanity or i18n messages.
- Medium: Expose marquee background asset and eyebrow “Champion spotlight” text in Sanity to align with chosen champion/story.
- Low: Move header/footer marketing sentences and nav/support link labels into a global settings/menus document for full CMS control.
- Low: Allow manifesto overlay lines and scroll indicator text to be managed (Sanity or translation) if they need future edits.

## Conclusion
- Estimated CMS-editable vs hard-coded: ~65% CMS (hero, stages, champion/marquee content, finale CTA) vs ~35% hard-coded (nav/footer, guide section, CTA labels/questions, section headings/backgrounds).
- Top impact changes to improve editor control: (1) CMS-ify the “Need a guide?” section, (2) make hero and concierge CTA labels/questions editable, (3) move timeline framing copy into Sanity, (4) let editors set marquee background/eyebrow text, (5) centralize nav/footer messaging in a site settings doc.
