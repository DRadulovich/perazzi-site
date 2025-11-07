files["4_Heritage_Factory_Spec.md"] = textwrap.dedent("""\
# Heritage & History – The Factory (Botticino) Photo‑Essay

## E. The Factory — Botticino Photo‑Essay *(new; editorial photo essay)*
**Purpose:** Reveal the sanctum of craft—CNC precision married to hand‑finishing; proof tunnel; wood stores; finishing benches.

**Fields:** Intro paragraph; 6–10 `FactoryAsset` entries (image or silent micro‑video) with captions.

**States & Interaction:**  
- Grid of thumbnails; each opens an accessible lightbox (Radix Dialog) with Next/Prev controls; **ESC** closes; caption always visible and in DOM.

**Motion Grammar:** Thumb fade‑in; lightbox content fades; no flourishes; reduced‑motion → instant dialogs.

**Performance:** Thumbs responsive + lazy; full‑res loaded on open; dimension dialog to prevent CLS; GPU‑accelerate transforms if any.

**A11y:**  
- Dialog has `aria-modal="true"`; `aria-labelledby` points to image title; focus trap; ESC/Close button.  
- Next/Prev buttons `aria-label`ed (“Next photo,” “Previous photo”); announce slide position (“Photo n of m”).  
- Images have meaningful `alt` or `alt=""` with caption text present.
"""])