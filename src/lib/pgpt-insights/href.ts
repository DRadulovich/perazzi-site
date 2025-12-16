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
  winner_changed?: string;
  margin_lt?: string;
  score_archetype?: string;
  min?: string;
  rerank?: string;
  snapped?: string;
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
  set("winner_changed", params.winner_changed);
  set("margin_lt", params.margin_lt);
  set("score_archetype", params.score_archetype);
  set("min", params.min);
  set("rerank", params.rerank);
  set("snapped", params.snapped);

  const qs = sp.toString();
  return qs ? `/admin/pgpt-insights?${qs}` : "/admin/pgpt-insights";
}
