
# Journal – Category Pages

Routes:
- `/journal/stories-of-craft`
- `/journal/champion-interviews`
- `/journal/news`

## F. Category Header *(reuse `SectionHeader`)*
**Purpose:** Reinforce category voice; optional featured story.  
**Fields:** Title (H1), subtitle, optional featured article.  
**Motion/Perf/A11y:** Minimal; strong contrast; no layout shift.

## G. Article Grid + Filters *(new)*
**Purpose:** Help readers browse with intention.  
**Fields:**  
- **Sort:** Newest, Oldest, Longest, Shortest  
- **Filter:** `tags[]`, `author[]`  
- **Grid:** 12–24 cards per page  
**States & Interaction:** Paginate via numbered pager or “Load more”; **no infinite scroll**; preserve state in URL; prefetch next page when near viewport; on filter change, update results and announce count.  
**Motion/Perf/A11y:** Subtle fade on results changes (off in reduced‑motion); server‑side pagination (ISR); reserve grid height; controls labeled with `aria-label="Filters"`; results region `aria-live="polite"`; keyboardable pagination.
