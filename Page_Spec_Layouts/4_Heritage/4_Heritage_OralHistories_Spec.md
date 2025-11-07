files["4_Heritage_OralHistories_Spec.md"] = textwrap.dedent("""\
# Heritage & History – Oral Histories (optional)

## F. Oral Histories *(new; short interview/quote snippets)*
**Purpose:** Evergreen micro‑voices from masters and champions (pull‑quotes with optional audio & transcript).

**Fields:** `title`, `quote`, `attribution`, `audioSrc?`, `transcriptHtml?`, `image?`

**States & Interaction:**  
- Play/pause with keyboard (Space), click, or touch; transcript toggle expands beneath.  
- Grid or stacked list by screen size.

**Motion Grammar:** Minimal (button state changes); reduced‑motion unaffected.

**Performance:** Defer audio load until play; expose duration/time; keep UI lightweight.

**A11y:**  
- Native `<audio controls>` or fully accessible custom controls; keyboard operable; labelled play/pause.  
- Transcript always available in DOM (toggle reveals); parity for deaf/HoH users.  
- No auto‑play; visible focus states.
"""])