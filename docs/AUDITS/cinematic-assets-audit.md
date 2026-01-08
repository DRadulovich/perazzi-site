# Cinematic Assets Audit (Public Site)

Generated: 2026-01-07

## Scope
- Public site only.
- Focus: assets referenced via `/cinematic_background_photos/*.jpg`.
- Exclusions: admin routes, ARIA labels, error messages.

## Summary
Three cinematic image assets are referenced in code and fixtures, but the `public/cinematic_background_photos` directory is absent and ignored by git. These must be located or replaced before migrating all imagery into Sanity.

## Missing assets (by path)
| Asset path | Referenced in | Notes |
| --- | --- | --- |
| `/cinematic_background_photos/p-web-25.jpg` | `src/content/build/index.ts:22`, `src/app/(site)/bespoke/page.tsx:34` | Used as cinematic strip 1 fallback. |
| `/cinematic_background_photos/p-web-16.jpg` | `src/content/build/index.ts:31`, `src/app/(site)/bespoke/page.tsx:40` | Used as cinematic strip 2 fallback. |
| `/cinematic_background_photos/p-web-2.jpg` | `src/content/heritage/index.ts:58`, `src/components/heritage/SerialLookup.tsx:58` | Used as serial lookup background fallback. |

## Evidence of missing local files
- `public/cinematic_background_photos` is listed in `.gitignore` (`.gitignore:58`).
- The directory is not present in this workspace (`ls public/cinematic_background_photos` fails).
- No files matching `p-web-2.jpg`, `p-web-16.jpg`, or `p-web-25.jpg` exist in the repo (`find` returned no matches).

## Proposed Sanity mapping (once assets are recovered)
| Usage | Proposed Sanity field | Notes |
| --- | --- | --- |
| Bespoke cinematic strip 1 | `bespokeHome.cinematicStrips[0].image` | Source from `/cinematic_background_photos/p-web-25.jpg`. |
| Bespoke cinematic strip 2 | `bespokeHome.cinematicStrips[1].image` | Source from `/cinematic_background_photos/p-web-16.jpg`. |
| Heritage serial lookup background | `heritageHome.serialLookupUi.backgroundImage` | Source from `/cinematic_background_photos/p-web-2.jpg`. |

## Reconciliation options
1) Recover originals (preferred)
   - Locate the original assets from the design source or asset library.
   - Upload to Sanity and map to the fields above.
   - Remove reliance on static paths after confirming CMS data is present.

2) Replace with approved alternatives
   - If originals cannot be found, choose substitute imagery from the existing asset pool.
   - Update the seed map to point to the replacement assets in Sanity.
   - Keep static fallback values only as a last-resort safety net.

3) Defer and keep placeholders
   - Leave cinematic strips as-is until editorial selects replacements.
   - This delays full zero-diff migration for the bespoke and heritage backgrounds.

## Next actions
- Confirm whether the cinematic assets exist outside the repo (they are ignored by git).
- Provide or approve replacements if originals cannot be retrieved.
- Once confirmed, upload to Sanity and update the seed map.
