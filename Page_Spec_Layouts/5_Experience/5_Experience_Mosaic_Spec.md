files["5_Experience_Mosaic_Spec.md"] = textwrap.dedent("""\
# Experience Perazzi – Moments That Matter (Mosaic)

## F. Moments That Matter — Photo/Video Mosaic *(new; editorial gallery)*
**Purpose:** A gentle mosaic of experience images (fitting, first pattern on proof tunnel, demo smiles) to convey feeling.

**Fields:** 6–12 `FactoryAsset` entries (stills preferred; short, silent loops allowed) with captions.

**States & Interaction:** Thumbnails open accessible lightbox (Radix Dialog) with Next/Prev + captions; ESC closes; announce slide position.

**Motion:** Thumb fade‑in; dialog fade (~200ms); reduced‑motion = instant open/close; no transforms.

**Image/Video:** Stills sized to grid; `next/image` placeholders; loops are silent with poster; captions describe moment and place.

**Performance:** Lazy‑load thumbs; fetch full‑res on open; pre‑size dialog to prevent CLS.

**A11y:** Dialog `aria-modal="true"`, `aria-labelledby`; focus trap; ESC closes; Next/Prev have `aria-label` (“Next photo”/“Previous photo”); announce “Photo X of Y”; JS‑off fallback: anchors to full‑size image + caption on page.
"""])