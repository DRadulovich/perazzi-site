# iOS‑Focused PWA Roadmap (No Offline, No Push)

## Phase 1 — Decisions + Asset Prep
**Decisions (with suggestions)**
- **App name / short name:** “Perazzi USA”
- **Icon source:** `docs/P-PWA-ICON.png` (Feel free to move it to a new location if you need to)
- **Theme + background colors:** Match existing site palette (use the dominant background + brand accent).
- **Start URL / scope:** Use `start_url: "/"` and `scope: "/"`; optional `/?source=pwa` for analytics.
- **Display mode:** Set `display: "standalone"` (required).
- **Orientation:** Default to `portrait`

**Work**
- Finalize naming, colors, and analytics parameters.
- Produce icon sizes: 1024 (master), 512, 192, plus Apple touch sizes (180/167/152).

**Deliverables**
- Icon set + finalized manifest values (names, colors, start_url).

**Done When**
- Assets and decisions are approved and ready to implement.

---

## Phase 2 — Manifest (Installability)
**Decisions (with suggestions)**
- **Manifest location:** Prefer `src/app/manifest.ts` (Next App Router standard).
- **Service worker:** Skip (no offline requirement).
- **Icon purposes:** Use `purpose: "any maskable"` where possible for better iOS/Android rendering.

**Work**
- Add `src/app/manifest.ts` (or `public/manifest.webmanifest`).
- Include `display: "standalone"`, icons, `start_url`, `scope`, `theme_color`, `background_color`.

**Deliverables**
- Manifest route/file in place and referenced by the app.

**Done When**
- Manifest is reachable and validates in a PWA checker.

---

## Phase 3 — iOS Meta + Apple Touch Icons
**Decisions (with suggestions)**
- **Where to add tags:** `src/app/layout.tsx`
- **Status bar style:** `black-translucent`
- **App title for iOS:** `short_name`

**Work**
- Add Apple meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style`.
- Link Apple touch icons (180/167/152) via `<link rel="apple-touch-icon" ...>`.

**Deliverables**
- iOS‑specific metadata + icons wired in layout.

**Done When**
- iOS Safari recognizes the site as installable with the correct icon/title.

---

## Phase 4 — iOS QA + Optional Install Guidance
**Decisions**
- **Test devices/versions:** iOS 16.4+ and 17.x on iPhone + iPad.
- **Install guidance UI:** Optional; a lightweight “Add to Home Screen” hint for iOS can improve adoption.
- **Analytics:** If using `/?source=pwa`, confirm tracking is desired.

**Work**
- Test Add to Home Screen flow and verify standalone launch.
- Check icon sharpness, title truncation, and status bar appearance.
- (Optional) Add a small in‑app iOS install hint.

**Deliverables**
- QA checklist results + any needed tweaks.

**Done When**
- App installs cleanly on iOS and launches in standalone with correct branding.
