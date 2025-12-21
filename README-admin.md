# PGPT Insights Admin Dashboard

This admin-only slice of the site surfaces PerazziGPT observability and archetype analytics. Access is gated by `withAdminAuth()` (env + optional token).

## Screens

- **Archetype Trend** — stacked daily archetype mix with an average margin overlay, A/B variant split, and live alert stream listening on `archetype_alert`.
  - ![Archetype Trend](docs/images/pgpt-archetype.png)
- **Trigger Terms** — top 20 weekly trigger tokens from `vw_trigger_terms_weekly`, filterable by week.
  - ![Trigger Terms](docs/images/pgpt-triggers.png)
- **Low-Margin Sessions** — sessions where margin <5% on three+ consecutive turns (link back to Session Explorer).
  - ![Low-Margin Sessions](docs/images/pgpt-quality.png)
- **Template Heat-map** — pivot of archetype × intent × template_id derived from log metadata.
  - ![Template Heat-map](docs/images/pgpt-templates.png)

## Notes

- SQL views required: `vw_archetype_daily`, `vw_trigger_terms_weekly`.
- Alert stream assumes database role can `LISTEN archetype_alert` (see `sql/20251220_archetype_margin_alert.sql`).
- Pages reuse the shared admin sidebar; all routes live under `/admin/pgpt-insights/*`.
