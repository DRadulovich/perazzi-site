# Service & Parts – Requests (Service & Parts)

## G. Service Request Flow *(new; form handoff pattern)*
**Purpose:** Collect essentials without friction; no pricing—concierge follow‑up only.

**Fields:**  
- **Contact:** name, email, phone  
- **Service Type:** inspection/refresh, timing/ejector, pattern/POI verification, other  
- **Gun Info:** model/platform, serial, round‑count estimate, recent issues (free text)  
- **Preferred Location:** chosen from network finder  
- **File Upload (optional):** photos/PDF (limits stated)  
- **Consent:** privacy notice checkbox  
- **Submit CTA**

**Interaction:** If embedding third‑party form, click‑to‑load titled iframe; provide fallback link (“Open request form in a new tab”).

**A11y/Perf:** Labels & `aria-describedby`; error messages announced via `aria-live="polite"`; keyboard order logical; file inputs accessible; no long tasks.

---

## H. Parts Request Flow *(new; form handoff pattern)*
**Purpose:** For non‑fitted consumables or upgrade advice; Perazzi confirms fitment path.

**Fields:** Contact; model/serial; parts interest (select or free text); urgency (radio); location; consent; submit.

**Interaction/Perf/A11y:** Same patterns as Service Request.
