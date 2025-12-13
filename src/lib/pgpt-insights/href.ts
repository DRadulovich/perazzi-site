export function buildInsightsHref(params: {
  env?: string;
  endpoint?: string;
  days?: string;
  q?: string;
  page?: string;
  density?: string;
  view?: string;

  gr_status?: string;
  gr_reason?: string;
  low_conf?: string;
  score?: string;
  archetype?: string;
  model?: string;
  gateway?: string;
  qa?: string;
}): string {
  const sp = new URLSearchParams();

  const set = (key: string, value: string | undefined) => {
    if (!value) return;
    sp.set(key, value);
  };

  set("env", params.env);
  set("endpoint", params.endpoint);
  set("days", params.days);
  set("q", params.q);
  set("page", params.page);
  set("density", params.density);
  set("view", params.view);

  set("gr_status", params.gr_status);
  set("gr_reason", params.gr_reason);
  set("low_conf", params.low_conf);
  set("score", params.score);
  set("archetype", params.archetype);
  set("model", params.model);
  set("gateway", params.gateway);
  set("qa", params.qa);

  const qs = sp.toString();
  return qs ? `/admin/pgpt-insights?${qs}` : "/admin/pgpt-insights";
}
