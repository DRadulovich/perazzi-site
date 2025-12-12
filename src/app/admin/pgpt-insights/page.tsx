import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";

type PerazziLogRow = {
  id: string;
  created_at: string;
  env: string;
  endpoint: string;
  archetype: string | null;
  session_id: string | null;
  model: string | null;
  used_gateway: boolean | null;
  prompt: string;
  response: string;
  low_confidence: boolean | null;
  intents: string[] | null;
  topics: string[] | null;
  max_score: string | null;
};

type RagSummary = {
  avg_max_score: number | null;
  min_max_score: number | null;
  max_max_score: number | null;
  total: number;
  low_count: number;
  threshold: number;
};

type TopChunkRow = {
  chunk_id: string;
  hits: number;
};

type GuardrailStatRow = {
  guardrail_reason: string | null;
  env: string;
  hits: number;
};

type GuardrailByArchetypeRow = {
  guardrail_reason: string | null;
  archetype: string | null;
  hits: number;
};

type GuardrailLogRow = {
  id: string;
  created_at: string;
  env: string;
  archetype: string | null;
  session_id: string | null;
  prompt: string;
  response: string;
  guardrail_reason: string | null;
};

type ArchetypeIntentRow = {
  archetype: string | null;
  intent: string | null;
  hits: number;
};

type ArchetypeSummaryRow = {
  archetype: string | null;
  avg_max_score: number | null;
  guardrail_block_rate: number | null;
  low_confidence_rate: number | null;
  total: number;
};

type DailyTokenUsageRow = {
  day: string;
  env: string;
  endpoint: string;
  model: string | null;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  request_count: number;
};

type AvgMetricsRow = {
  env: string;
  endpoint: string;
  model: string | null;
  avg_prompt_tokens: number | null;
  avg_completion_tokens: number | null;
  avg_latency_ms: number | null;
  request_count: number;
};

const LOW_SCORE_THRESHOLD = 0.25;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchLogs(envFilter?: string, endpointFilter?: string): Promise<PerazziLogRow[]> {
  const conditions: string[] = [];
  const values: (string | boolean)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    values.push(envFilter);
  }

  if (endpointFilter) {
    conditions.push(`endpoint = $${idx++}`);
    values.push(endpointFilter);
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const query = `
    select
      id,
      created_at,
      env,
      endpoint,
      archetype,
      session_id,
      model,
      used_gateway,
      prompt,
      response,
      low_confidence,
      intents,
      topics,
      metadata->>'maxScore' as max_score
    from perazzi_conversation_logs
    ${whereClause}
    order by created_at desc
    limit 100;
  `;

  const { rows } = await pool.query<PerazziLogRow>(query, values);
  return rows;
}

async function fetchRagSummary(envFilter?: string, daysFilter?: number): Promise<RagSummary | null> {
  const threshold = LOW_SCORE_THRESHOLD;
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'maxScore' is not null"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const thresholdParamIndex = idx;
  params.push(threshold);

  const query = `
    select
      avg((metadata->>'maxScore')::float) as avg_max_score,
      min((metadata->>'maxScore')::float) as min_max_score,
      max((metadata->>'maxScore')::float) as max_max_score,
      count(*) as total,
      sum(case when (metadata->>'maxScore')::float < $${thresholdParamIndex} then 1 else 0 end) as low_count
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
  `;

  const { rows } = await pool.query(query, params);
  const row = rows[0] as {
    avg_max_score: number | string | null;
    min_max_score: number | string | null;
    max_max_score: number | string | null;
    total: number | string;
    low_count: number | string | null;
  } | undefined;

  if (!row || Number(row.total) === 0) return null;

  return {
    avg_max_score: row.avg_max_score === null ? null : Number(row.avg_max_score),
    min_max_score: row.min_max_score === null ? null : Number(row.min_max_score),
    max_max_score: row.max_max_score === null ? null : Number(row.max_max_score),
    total: Number(row.total ?? 0),
    low_count: Number(row.low_count ?? 0),
    threshold,
  };
}

async function fetchLowScoreLogs(
  envFilter?: string,
  threshold = LOW_SCORE_THRESHOLD,
  daysFilter?: number,
): Promise<PerazziLogRow[]> {
  const conditions: string[] = [
    "endpoint = 'assistant'",
    "metadata->>'maxScore' is not null",
    `(metadata->>'maxScore')::float < $THRESHOLD`,
  ];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const thresholdParamIndex = idx;
  params.push(threshold);
  const conditionSql = conditions.join(" and ").replace("$THRESHOLD", `$${thresholdParamIndex}`);

  const query = `
    select
      id,
      created_at,
      env,
      endpoint,
      archetype,
      session_id,
      model,
      used_gateway,
      prompt,
      response,
      low_confidence,
      intents,
      topics,
      metadata->>'maxScore' as max_score
    from perazzi_conversation_logs
    where ${conditionSql}
    order by created_at desc
    limit 50;
  `;

  const { rows } = await pool.query<PerazziLogRow>(query, params);
  return rows;
}

async function fetchTopChunks(envFilter?: string, limit = 20, daysFilter?: number): Promise<TopChunkRow[]> {
  const conditions: string[] = ["l.endpoint = 'assistant'"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`l.env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`l.created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const limitParamIndex = idx;
  params.push(limit);

  const query = `
    select
      (chunk->>'chunkId') as chunk_id,
      count(*) as hits
    from perazzi_conversation_logs l,
      jsonb_array_elements(coalesce(l.metadata->'retrievedChunks', '[]'::jsonb)) as chunk
    where ${conditions.join(" and ")}
    group by chunk_id
    order by hits desc
    limit $${limitParamIndex};
  `;

  const { rows } = await pool.query<{ chunk_id: string; hits: string | number }>(query, params);
  return rows.map((row) => ({ chunk_id: row.chunk_id, hits: Number(row.hits) }));
}

async function fetchGuardrailStats(envFilter?: string, daysFilter?: number): Promise<GuardrailStatRow[]> {
  const conditions: string[] = [
    "endpoint = 'assistant'",
    "metadata->>'guardrailStatus' = 'blocked'",
  ];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const query = `
    select
      metadata->>'guardrailReason' as guardrail_reason,
      env,
      count(*) as hits
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by guardrail_reason, env
    order by hits desc;
  `;

  const { rows } = await pool.query<{ guardrail_reason: string | null; env: string; hits: string | number }>(
    query,
    params,
  );
  return rows.map((row) => ({ guardrail_reason: row.guardrail_reason, env: row.env, hits: Number(row.hits) }));
}

async function fetchGuardrailByArchetype(envFilter?: string, daysFilter?: number): Promise<GuardrailByArchetypeRow[]> {
  const conditions: string[] = [
    "endpoint = 'assistant'",
    "metadata->>'guardrailStatus' = 'blocked'",
  ];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const query = `
    select
      metadata->>'guardrailReason' as guardrail_reason,
      archetype,
      count(*) as hits
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by guardrail_reason, archetype
    order by hits desc;
  `;

  const { rows } = await pool.query<{
    guardrail_reason: string | null;
    archetype: string | null;
    hits: string | number;
  }>(query, params);
  return rows.map((row) => ({
    guardrail_reason: row.guardrail_reason,
    archetype: row.archetype,
    hits: Number(row.hits),
  }));
}

async function fetchRecentGuardrailBlocks(
  envFilter?: string,
  limit = 20,
  daysFilter?: number,
): Promise<GuardrailLogRow[]> {
  const conditions: string[] = [
    "endpoint = 'assistant'",
    "metadata->>'guardrailStatus' = 'blocked'",
  ];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const limitParamIndex = idx;
  params.push(limit);

  const query = `
    select
      id,
      created_at,
      env,
      archetype,
      session_id,
      prompt,
      response,
      metadata->>'guardrailReason' as guardrail_reason
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    order by created_at desc
    limit $${limitParamIndex};
  `;

  const { rows } = await pool.query<GuardrailLogRow>(query, params);
  return rows;
}

async function fetchArchetypeIntentStats(
  envFilter?: string,
  daysFilter?: number,
): Promise<ArchetypeIntentRow[]> {
  const conditions: string[] = ["endpoint = 'assistant'", "archetype is not null", "intents is not null"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const query = `
    select
      archetype,
      unnest(intents) as intent,
      count(*) as hits
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by archetype, intent
    order by hits desc;
  `;

  const { rows } = await pool.query<{ archetype: string | null; intent: string | null; hits: string | number }>(
    query,
    params,
  );
  return rows.map((row) => ({
    archetype: row.archetype,
    intent: row.intent,
    hits: Number(row.hits),
  }));
}

async function fetchArchetypeSummary(
  envFilter?: string,
  daysFilter?: number,
): Promise<ArchetypeSummaryRow[]> {
  const conditions: string[] = ["endpoint = 'assistant'", "archetype is not null"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const query = `
    select
      archetype,
      avg((metadata->>'maxScore')::float) as avg_max_score,
      case when count(*) > 0 then
        sum(case when metadata->>'guardrailStatus' = 'blocked' then 1 else 0 end)::float / count(*)
      else null end as guardrail_block_rate,
      case when count(*) > 0 then
        sum(case when low_confidence = true then 1 else 0 end)::float / count(*)
      else null end as low_confidence_rate,
      count(*) as total
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by archetype
    order by archetype;
  `;

  const { rows } = await pool.query<{
    archetype: string | null;
    avg_max_score: string | number | null;
    guardrail_block_rate: string | number | null;
    low_confidence_rate: string | number | null;
    total: string | number;
  }>(query, params);

  return rows.map((row) => ({
    archetype: row.archetype,
    avg_max_score: row.avg_max_score === null ? null : Number(row.avg_max_score),
    guardrail_block_rate:
      row.guardrail_block_rate === null || row.guardrail_block_rate === undefined
        ? null
        : Number(row.guardrail_block_rate),
    low_confidence_rate:
      row.low_confidence_rate === null || row.low_confidence_rate === undefined
        ? null
        : Number(row.low_confidence_rate),
    total: Number(row.total),
  }));
}

async function fetchDailyTokenUsage(
  envFilter?: string,
  daysFilter?: number,
): Promise<DailyTokenUsageRow[]> {
  const conditions: string[] = ["endpoint in ('assistant', 'soul_journey')"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const query = `
    select
      date_trunc('day', created_at)::date as day,
      env,
      endpoint,
      model,
      sum(coalesce(prompt_tokens, 0)) as total_prompt_tokens,
      sum(coalesce(completion_tokens, 0)) as total_completion_tokens,
      count(*) as request_count
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by day, env, endpoint, model
    order by day desc, env, endpoint, model;
  `;

  const { rows } = await pool.query<{
    day: string;
    env: string;
    endpoint: string;
    model: string | null;
    total_prompt_tokens: string | number;
    total_completion_tokens: string | number;
    request_count: string | number;
  }>(query, params);

  return rows.map((row) => ({
    day: row.day,
    env: row.env,
    endpoint: row.endpoint,
    model: row.model,
    total_prompt_tokens: Number(row.total_prompt_tokens ?? 0),
    total_completion_tokens: Number(row.total_completion_tokens ?? 0),
    request_count: Number(row.request_count ?? 0),
  }));
}

async function fetchAvgMetrics(envFilter?: string, daysFilter?: number): Promise<AvgMetricsRow[]> {
  const conditions: string[] = ["endpoint in ('assistant', 'soul_journey')"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
    params.push(daysFilter);
    idx += 1;
  }

  const query = `
    select
      env,
      endpoint,
      model,
      avg(prompt_tokens) as avg_prompt_tokens,
      avg(completion_tokens) as avg_completion_tokens,
      avg((metadata->>'latencyMs')::float) as avg_latency_ms,
      count(*) as request_count
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by env, endpoint, model
    order by env, endpoint, model;
  `;

  const { rows } = await pool.query<{
    env: string;
    endpoint: string;
    model: string | null;
    avg_prompt_tokens: string | number | null;
    avg_completion_tokens: string | number | null;
    avg_latency_ms: string | number | null;
    request_count: string | number;
  }>(query, params);

  return rows.map((row) => ({
    env: row.env,
    endpoint: row.endpoint,
    model: row.model,
    avg_prompt_tokens: row.avg_prompt_tokens === null ? null : Number(row.avg_prompt_tokens),
    avg_completion_tokens: row.avg_completion_tokens === null ? null : Number(row.avg_completion_tokens),
    avg_latency_ms: row.avg_latency_ms === null ? null : Number(row.avg_latency_ms),
    request_count: Number(row.request_count ?? 0),
  }));
}

function truncate(text: string, length = 200) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(3);
}

function formatRate(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export default async function PgptInsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ env?: string; endpoint?: string; days?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  const envFilter =
    resolvedSearchParams.env && resolvedSearchParams.env !== "all"
      ? resolvedSearchParams.env
      : undefined;
  const endpointFilter =
    resolvedSearchParams.endpoint && resolvedSearchParams.endpoint !== "all"
      ? resolvedSearchParams.endpoint
      : undefined;
  const daysParam = resolvedSearchParams.days;
  const daysFilter =
    daysParam && daysParam !== "all"
      ? Number.parseInt(daysParam, 10) || undefined
      : undefined;

  const [
    logs,
    ragSummary,
    lowScoreLogs,
    topChunks,
    guardrailStats,
    guardrailByArchetype,
    recentGuardrailBlocks,
    archetypeIntentStats,
    archetypeSummaries,
    dailyTokenUsage,
    avgMetrics,
  ] =
    await Promise.all([
      fetchLogs(envFilter, endpointFilter),
      fetchRagSummary(envFilter, daysFilter),
      fetchLowScoreLogs(envFilter, LOW_SCORE_THRESHOLD, daysFilter),
      fetchTopChunks(envFilter, 20, daysFilter),
      fetchGuardrailStats(envFilter, daysFilter),
      fetchGuardrailByArchetype(envFilter, daysFilter),
      fetchRecentGuardrailBlocks(envFilter, 20, daysFilter),
      fetchArchetypeIntentStats(envFilter, daysFilter),
      fetchArchetypeSummary(envFilter, daysFilter),
      fetchDailyTokenUsage(envFilter, daysFilter),
      fetchAvgMetrics(envFilter, daysFilter),
    ]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-xl font-semibold tracking-tight">PerazziGPT Insights</h1>
          <span className="text-xs uppercase text-muted-foreground">Workshop · Internal</span>
        </header>

        <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Filters</h2>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="GET">
            <label className="text-sm">
              Env:
              <select
                name="env"
                defaultValue={resolvedSearchParams.env ?? "all"}
                className="ml-2 rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="all">all</option>
                <option value="local">local</option>
                <option value="preview">preview</option>
                <option value="production">production</option>
              </select>
            </label>
            <label className="text-sm">
              Endpoint:
              <select
                name="endpoint"
                defaultValue={resolvedSearchParams.endpoint ?? "all"}
                className="ml-2 rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="all">all</option>
                <option value="assistant">assistant</option>
                <option value="soul_journey">soul_journey</option>
              </select>
            </label>
            <label className="text-sm">
              Time window:
              <select
                name="days"
                defaultValue={resolvedSearchParams.days ?? "30"}
                className="ml-2 rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="7">last 7 days</option>
                <option value="30">last 30 days</option>
                <option value="90">last 90 days</option>
                <option value="all">all time</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background"
            >
              Apply filters
            </button>
          </form>
        </section>

        <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">RAG Health (assistant)</h2>
            <p className="text-xs text-muted-foreground">Retrieval quality overview from assistant maxScore signals.</p>
          </div>
          {!ragSummary ? (
            <p className="text-xs text-muted-foreground">No maxScore data yet for the current filters.</p>
          ) : (
            <div className="flex flex-wrap gap-3 text-xs">
              <div>Avg maxScore: {formatScore(ragSummary.avg_max_score)}</div>
              <div>Min maxScore: {formatScore(ragSummary.min_max_score)}</div>
              <div>Max maxScore: {formatScore(ragSummary.max_max_score)}</div>
              <div>Total: {ragSummary.total}</div>
              <div>
                Low-score (&lt; {ragSummary.threshold}): {ragSummary.low_count}
              </div>
            </div>
          )}

          {lowScoreLogs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">
                Low-score interactions (maxScore &lt; {LOW_SCORE_THRESHOLD})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">created_at</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">env</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">session_id</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">prompt</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">response</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">maxScore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lowScoreLogs.map((log) => (
                      <tr key={`low-${log.id}`}>
                        <td className="px-2 py-1 whitespace-nowrap">{String(log.created_at)}</td>
                        <td className="px-2 py-1">{log.env}</td>
                        <td className="px-2 py-1">
                          {log.session_id ? (
                            <Link
                              href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                              className="text-blue-600 underline"
                            >
                              {log.session_id}
                            </Link>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">{truncate(log.prompt ?? "", 160)}</td>
                        <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">{truncate(log.response ?? "", 160)}</td>
                        <td className="px-2 py-1">{log.max_score ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {topChunks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">Top retrieved chunks</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">chunk_id</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">hits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topChunks.map((chunk) => (
                      <tr key={chunk.chunk_id}>
                        <td className="px-2 py-1">{chunk.chunk_id}</td>
                        <td className="px-2 py-1">{chunk.hits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Guardrail Analytics (assistant)</h2>
            <p className="text-xs text-muted-foreground">Block reasons, environments, and archetypes for assistant requests.</p>
          </div>
          {guardrailStats.length === 0 && guardrailByArchetype.length === 0 && recentGuardrailBlocks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No guardrail blocks for the current filters.</p>
          ) : (
            <>
              {guardrailStats.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold">Guardrail hits by reason and env</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">reason</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">env</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">hits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {guardrailStats.map((row, idx) => (
                          <tr key={`${row.guardrail_reason ?? "none"}-${row.env}-${idx}`}>
                            <td className="px-2 py-1">{row.guardrail_reason ?? "(none)"}</td>
                            <td className="px-2 py-1">{row.env}</td>
                            <td className="px-2 py-1">{row.hits}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {recentGuardrailBlocks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold">Recent guardrail blocks</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">created_at</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">env</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">session_id</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">reason</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">prompt</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">response</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recentGuardrailBlocks.map((log) => (
                          <tr key={`guardrail-${log.id}`}>
                            <td className="px-2 py-1 whitespace-nowrap">{String(log.created_at)}</td>
                            <td className="px-2 py-1">{log.env}</td>
                            <td className="px-2 py-1">
                              {log.session_id ? (
                                <Link
                                  href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                                  className="text-blue-600 underline"
                                >
                                  {log.session_id}
                                </Link>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="px-2 py-1">{log.guardrail_reason ?? "(none)"}</td>
                            <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">{truncate(log.prompt ?? "", 160)}</td>
                            <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">{truncate(log.response ?? "", 160)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {guardrailByArchetype.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold">Guardrail hits by reason and archetype</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">reason</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">archetype</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">hits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {guardrailByArchetype.map((row, idx) => (
                          <tr key={`${row.guardrail_reason ?? "none"}-${row.archetype ?? "unknown"}-${idx}`}>
                            <td className="px-2 py-1">{row.guardrail_reason ?? "(none)"}</td>
                            <td className="px-2 py-1">{row.archetype ?? "(unknown)"}</td>
                            <td className="px-2 py-1">{row.hits}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Archetype &amp; Intent Analytics</h2>
            <p className="text-xs text-muted-foreground">Volume by archetype/intent plus summary health for each persona.</p>
          </div>

          {archetypeIntentStats.length === 0 ? (
            <p className="text-xs text-muted-foreground">No archetype/intent data for the current filters.</p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">Interactions by archetype and intent</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">archetype</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">intent</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">hits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {archetypeIntentStats.map((row, idx) => (
                      <tr key={`${row.archetype ?? "unknown"}-${row.intent ?? "none"}-${idx}`}>
                        <td className="px-2 py-1">{row.archetype ?? "(unknown)"}</td>
                        <td className="px-2 py-1">{row.intent ?? "(none)"}</td>
                        <td className="px-2 py-1">{row.hits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {archetypeSummaries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">Archetype summary metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">archetype</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">avg maxScore</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">guardrail block rate</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">low-confidence rate</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {archetypeSummaries.map((row, idx) => (
                      <tr key={`${row.archetype ?? "unknown"}-${idx}`}>
                        <td className="px-2 py-1">{row.archetype ?? "(unknown)"}</td>
                        <td className="px-2 py-1">{formatScore(row.avg_max_score)}</td>
                        <td className="px-2 py-1">{formatRate(row.guardrail_block_rate)}</td>
                        <td className="px-2 py-1">{formatRate(row.low_confidence_rate)}</td>
                        <td className="px-2 py-1">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Metrics (Tokens &amp; Latency)</h2>
            <p className="text-xs text-muted-foreground">Cost and responsiveness signals by day, env, endpoint, and model.</p>
          </div>
          {dailyTokenUsage.length === 0 ? (
            <p className="text-xs text-muted-foreground">No token usage data for the current filters.</p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">Daily token usage</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">day</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">env</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">endpoint</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">model</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">prompt tokens</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">completion tokens</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dailyTokenUsage.map((row, idx) => (
                      <tr key={`${row.day}-${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                        <td className="px-2 py-1">{String(row.day)}</td>
                        <td className="px-2 py-1">{row.env}</td>
                        <td className="px-2 py-1">{row.endpoint}</td>
                        <td className="px-2 py-1">{row.model ?? "(unknown)"}</td>
                        <td className="px-2 py-1">{row.total_prompt_tokens}</td>
                        <td className="px-2 py-1">{row.total_completion_tokens}</td>
                        <td className="px-2 py-1">{row.request_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {avgMetrics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">Average tokens &amp; latency per request</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">env</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">endpoint</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">model</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">avg prompt tokens</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">avg completion tokens</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">avg latency (ms)</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {avgMetrics.map((row, idx) => (
                      <tr key={`${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                        <td className="px-2 py-1">{row.env}</td>
                        <td className="px-2 py-1">{row.endpoint}</td>
                        <td className="px-2 py-1">{row.model ?? "(unknown)"}</td>
                        <td className="px-2 py-1">
                          {row.avg_prompt_tokens === null ? "—" : row.avg_prompt_tokens.toFixed(1)}
                        </td>
                        <td className="px-2 py-1">
                          {row.avg_completion_tokens === null ? "—" : row.avg_completion_tokens.toFixed(1)}
                        </td>
                        <td className="px-2 py-1">
                          {row.avg_latency_ms === null ? "—" : Math.round(row.avg_latency_ms)}
                        </td>
                        <td className="px-2 py-1">{row.request_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">Recent Interactions</h2>
              <p className="text-xs text-muted-foreground">Latest assistant and soul_journey exchanges for quick triage.</p>
            </div>
            <Link href="/admin/pgpt-insights/qa" className="text-xs text-blue-600 underline">
              QA Review
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">created_at</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">env</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">endpoint</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">session_id</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">prompt</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">response</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">maxScore</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">low_confidence</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">intents</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">topics</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">QA</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-2 py-1 whitespace-nowrap">{String(log.created_at)}</td>
                    <td className="px-2 py-1">{log.env}</td>
                    <td className="px-2 py-1">{log.endpoint}</td>
                    <td className="px-2 py-1">
                      {log.session_id ? (
                        <Link
                          href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                          className="text-blue-600 underline"
                        >
                          {log.session_id}
                        </Link>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">{truncate(log.prompt ?? "", 200)}</td>
                    <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">{truncate(log.response ?? "", 200)}</td>
                    <td className="px-2 py-1">{log.max_score ?? ""}</td>
                    <td className="px-2 py-1">{log.low_confidence === null ? "" : String(log.low_confidence)}</td>
                    <td className="px-2 py-1">{log.intents ? log.intents.join(", ") : ""}</td>
                    <td className="px-2 py-1">{log.topics ? log.topics.join(", ") : ""}</td>
                    <td className="px-2 py-1">
                      <form method="POST" action="/admin/pgpt-insights/qa/flag" className="inline-flex">
                        <input type="hidden" name="interactionId" value={log.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                        >
                          Flag
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No results for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
