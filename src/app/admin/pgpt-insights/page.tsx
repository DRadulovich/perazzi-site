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

  guardrail_status: string | null;
  guardrail_reason: string | null;
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
const LOGS_PAGE_SIZE = 50;
const DEFAULT_DAYS_WINDOW = 30;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChipRow({ items, max = 4 }: { items?: string[] | null; max?: number }) {
  if (!items || items.length === 0) return null;
  const shown = items.slice(0, max);
  const remaining = items.length - shown.length;

  return (
    <div className="flex max-w-[260px] flex-wrap gap-1">
      {shown.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
        >
          {item}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
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

function formatCompactNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.round(value));
}

function formatDurationMs(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

function parseScore(score: string | null): number | null {
  if (!score) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

function logRowToneClass(log: PerazziLogRow): string {
  // Priority:
  // 1) guardrail blocked
  // 2) low confidence
  // 3) low maxScore (assistant)
  if (log.guardrail_status === "blocked") return "bg-red-500/5";
  if (log.low_confidence === true) return "bg-amber-500/5";

  const s = parseScore(log.max_score);
  if (log.endpoint === "assistant" && s !== null && s < LOW_SCORE_THRESHOLD) return "bg-yellow-500/5";

  return "";
}

function buildInsightsHref(params: {
  env?: string;
  endpoint?: string;
  days?: string;
  q?: string;
  page?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.env) sp.set("env", params.env);
  if (params.endpoint) sp.set("endpoint", params.endpoint);
  if (params.days) sp.set("days", params.days);
  if (params.q) sp.set("q", params.q);
  if (params.page) sp.set("page", params.page);

  const qs = sp.toString();
  return qs ? `/admin/pgpt-insights?${qs}` : "/admin/pgpt-insights";
}

async function fetchLogs(args: {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  q?: string;
  limit: number;
  offset: number;
}): Promise<PerazziLogRow[]> {
  const { envFilter, endpointFilter, daysFilter, q, limit, offset } = args;

  const conditions: string[] = [];
  const values: (string | number | boolean)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    values.push(envFilter);
  }

  if (endpointFilter) {
    conditions.push(`endpoint = $${idx++}`);
    values.push(endpointFilter);
  }

  if (daysFilter) {
    conditions.push(`created_at >= now() - ($${idx++} || ' days')::interval`);
    values.push(daysFilter);
  }

  if (q && q.trim().length > 0) {
    conditions.push(`(prompt ILIKE $${idx} OR response ILIKE $${idx})`);
    values.push(`%${q.trim()}%`);
    idx += 1;
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const limitParamIndex = idx++;
  values.push(limit);

  const offsetParamIndex = idx++;
  values.push(offset);

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
      metadata->>'maxScore' as max_score,
      metadata->>'guardrailStatus' as guardrail_status,
      metadata->>'guardrailReason' as guardrail_reason
    from perazzi_conversation_logs
    ${whereClause}
    order by created_at desc
    limit $${limitParamIndex}
    offset $${offsetParamIndex};
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
      metadata->>'maxScore' as max_score,
      metadata->>'guardrailStatus' as guardrail_status,
      metadata->>'guardrailReason' as guardrail_reason
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
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'guardrailStatus' = 'blocked'"];
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
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'guardrailStatus' = 'blocked'"];
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
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'guardrailStatus' = 'blocked'"];
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

async function fetchArchetypeIntentStats(envFilter?: string, daysFilter?: number): Promise<ArchetypeIntentRow[]> {
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

async function fetchArchetypeSummary(envFilter?: string, daysFilter?: number): Promise<ArchetypeSummaryRow[]> {
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
      row.low_confidence_rate === null || row.low_confidence_rate === undefined ? null : Number(row.low_confidence_rate),
    total: Number(row.total),
  }));
}

async function fetchDailyTokenUsage(envFilter?: string, daysFilter?: number): Promise<DailyTokenUsageRow[]> {
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

async function fetchOpenQaFlagCount(): Promise<number> {
  try {
    const { rows } = await pool.query<{ open_count: string | number }>(
      `select count(*) as open_count from qa_flags where status = 'open';`,
    );
    return Number(rows[0]?.open_count ?? 0);
  } catch (error) {
    console.error("[pgpt-insights] Failed to fetch open QA flag count", error);
    return 0;
  }
}

export default async function PgptInsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ env?: string; endpoint?: string; days?: string; q?: string; page?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  const envFilter =
    resolvedSearchParams.env && resolvedSearchParams.env !== "all" ? resolvedSearchParams.env : undefined;

  const endpointFilter =
    resolvedSearchParams.endpoint && resolvedSearchParams.endpoint !== "all"
      ? resolvedSearchParams.endpoint
      : undefined;

  // Default behavior: last 30 days, unless explicitly "all"
  const daysParam = resolvedSearchParams.days;
  const daysFilter =
    daysParam === "all"
      ? undefined
      : Number.parseInt(daysParam ?? String(DEFAULT_DAYS_WINDOW), 10) || DEFAULT_DAYS_WINDOW;

  const qRaw = (resolvedSearchParams.q ?? "").trim();
  const q = qRaw.length > 0 ? qRaw.slice(0, 500) : "";
  const page = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1);
  const offset = (page - 1) * LOGS_PAGE_SIZE;

  const [
    logsMaybeMore,
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
    qaOpenFlagCount,
  ] = await Promise.all([
    fetchLogs({
      envFilter,
      endpointFilter,
      daysFilter,
      q: q.length ? q : undefined,
      limit: LOGS_PAGE_SIZE + 1,
      offset,
    }),
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
    fetchOpenQaFlagCount(),
  ]);

  const hasNextPage = logsMaybeMore.length > LOGS_PAGE_SIZE;
  const logs = logsMaybeMore.slice(0, LOGS_PAGE_SIZE);

  const totalRequests = dailyTokenUsage.reduce((sum, row) => sum + row.request_count, 0);
  const totalPromptTokens = dailyTokenUsage.reduce((sum, row) => sum + row.total_prompt_tokens, 0);
  const totalCompletionTokens = dailyTokenUsage.reduce((sum, row) => sum + row.total_completion_tokens, 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const avgTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : null;

  const guardrailBlockedCount = guardrailStats.reduce((sum, row) => sum + row.hits, 0);

  const latencyRollup = avgMetrics.reduce(
    (acc, row) => {
      if (row.avg_latency_ms === null || Number.isNaN(row.avg_latency_ms) || row.request_count <= 0) return acc;
      acc.numerator += row.avg_latency_ms * row.request_count;
      acc.denominator += row.request_count;
      return acc;
    },
    { numerator: 0, denominator: 0 },
  );

  const avgLatencyMs = latencyRollup.denominator > 0 ? latencyRollup.numerator / latencyRollup.denominator : null;

  const scopeSummary = [
    envFilter ? `env: ${envFilter}` : "env: all",
    endpointFilter ? `endpoint: ${endpointFilter}` : "endpoint: all",
    daysFilter ? `last ${daysFilter} days` : "all time",
  ].join(" · ");

  const qaCountLabel = qaOpenFlagCount > 0 ? ` (${qaOpenFlagCount})` : "";

  const prevHref =
    page > 1
      ? buildInsightsHref({
          env: resolvedSearchParams.env,
          endpoint: resolvedSearchParams.endpoint,
          days: resolvedSearchParams.days,
          q: q.length ? q : undefined,
          page: String(page - 1),
        })
      : null;

  const nextHref =
    hasNextPage
      ? buildInsightsHref({
          env: resolvedSearchParams.env,
          endpoint: resolvedSearchParams.endpoint,
          days: resolvedSearchParams.days,
          q: q.length ? q : undefined,
          page: String(page + 1),
        })
      : null;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-14 space-y-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Perazzi · Workshop</p>
            <h1 className="text-2xl font-semibold tracking-tight">PerazziGPT Insights</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase text-muted-foreground">Internal</span>
            <Link href="/admin/pgpt-insights/qa" className="text-xs text-blue-600 underline">
              QA Review{qaCountLabel}
            </Link>
          </div>
        </header>

        <section id="filters" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Filters</h2>
          <p className="text-xs text-muted-foreground">
            Scope the analytics sections by env/endpoint/time window. The search field only affects the Recent Interactions
            list.
          </p>

          <form className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap" method="GET">
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
                defaultValue={resolvedSearchParams.days ?? String(DEFAULT_DAYS_WINDOW)}
                className="ml-2 rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="7">last 7 days</option>
                <option value="30">last 30 days</option>
                <option value="90">last 90 days</option>
                <option value="all">all time</option>
              </select>
            </label>

            <label className="text-sm">
              Search logs:
              <input
                name="q"
                defaultValue={resolvedSearchParams.q ?? ""}
                placeholder="Search prompts/responses…"
                className="ml-2 w-[260px] max-w-full rounded-md border bg-background px-2 py-1 text-sm"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background"
            >
              Apply filters
            </button>
          </form>
        </section>

        <section id="overview" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">Overview</h2>
              <p className="text-xs text-muted-foreground">High-level signals for the current scope.</p>
            </div>
            <p className="text-xs text-muted-foreground">{scopeSummary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Requests</div>
              <div className="mt-1 text-base font-semibold">{formatCompactNumber(totalRequests)}</div>
              <div className="mt-1 text-xs text-muted-foreground">in window</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tokens</div>
              <div className="mt-1 text-base font-semibold">{formatCompactNumber(totalTokens)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {avgTokensPerRequest === null ? "—" : `~${Math.round(avgTokensPerRequest)} / req`}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg latency</div>
              <div className="mt-1 text-base font-semibold">{formatDurationMs(avgLatencyMs)}</div>
              <div className="mt-1 text-xs text-muted-foreground">weighted</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Retrieval avg</div>
              <div className="mt-1 text-base font-semibold">
                {ragSummary ? formatScore(ragSummary.avg_max_score) : "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">assistant maxScore</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Low-score</div>
              <div className="mt-1 text-base font-semibold">
                {ragSummary ? formatCompactNumber(ragSummary.low_count) : "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{`< ${LOW_SCORE_THRESHOLD}`}</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Guardrail blocks</div>
              <div className="mt-1 text-base font-semibold">{formatCompactNumber(guardrailBlockedCount)}</div>
              <div className="mt-1 text-xs text-muted-foreground">assistant</div>
            </div>
          </div>
        </section>

        <nav className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <a href="#rag" className="underline underline-offset-4 hover:text-foreground">
            RAG
          </a>
          <a href="#guardrails" className="underline underline-offset-4 hover:text-foreground">
            Guardrails
          </a>
          <a href="#archetypes" className="underline underline-offset-4 hover:text-foreground">
            Archetypes
          </a>
          <a href="#metrics" className="underline underline-offset-4 hover:text-foreground">
            Metrics
          </a>
          <a href="#logs" className="underline underline-offset-4 hover:text-foreground">
            Logs
          </a>
          <Link href="/admin/pgpt-insights/qa" className="underline underline-offset-4 hover:text-foreground">
            QA{qaCountLabel}
          </Link>
        </nav>

        {/* RAG */}
        <section id="rag" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
          <details open className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">RAG Health (assistant)</h2>
                  <p className="text-xs text-muted-foreground">Retrieval quality overview from assistant maxScore signals.</p>
                </div>
                <Chevron />
              </div>
            </summary>

            <div className="mt-4 space-y-3">
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
                  <h3 className="text-xs font-semibold">Low-score interactions (maxScore &lt; {LOW_SCORE_THRESHOLD})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">created_at</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">env</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">session_id</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">prompt</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">response</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">maxScore</th>
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
                            <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                              {truncate(log.prompt ?? "", 160)}
                            </td>
                            <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                              {truncate(log.response ?? "", 160)}
                            </td>
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
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">chunk_id</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">hits</th>
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
            </div>
          </details>
        </section>

        {/* Guardrails */}
        <section id="guardrails" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
          <details open className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">Guardrail Analytics (assistant)</h2>
                  <p className="text-xs text-muted-foreground">Block reasons, environments, and archetypes.</p>
                </div>
                <Chevron />
              </div>
            </summary>

            <div className="mt-4 space-y-3">
              {guardrailStats.length === 0 &&
              guardrailByArchetype.length === 0 &&
              recentGuardrailBlocks.length === 0 ? (
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
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">reason</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">env</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">hits</th>
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
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">created_at</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">env</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">session_id</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">reason</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">prompt</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">response</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {recentGuardrailBlocks.map((log) => (
                              <tr key={`guardrail-${log.id}`} className="bg-red-500/5">
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
                                <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                                  {truncate(log.prompt ?? "", 160)}
                                </td>
                                <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                                  {truncate(log.response ?? "", 160)}
                                </td>
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
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">reason</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">archetype</th>
                              <th className="px-2 py-1 text-left font-medium text-muted-foreground">hits</th>
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
            </div>
          </details>
        </section>

        {/* Archetypes */}
        <section id="archetypes" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
          <details open className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">Archetype &amp; Intent Analytics</h2>
                  <p className="text-xs text-muted-foreground">Volume by archetype/intent plus summary health.</p>
                </div>
                <Chevron />
              </div>
            </summary>

            <div className="mt-4 space-y-3">
              {archetypeIntentStats.length === 0 ? (
                <p className="text-xs text-muted-foreground">No archetype/intent data for the current filters.</p>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold">Interactions by archetype and intent</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">archetype</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">intent</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">hits</th>
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
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">archetype</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">avg maxScore</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">guardrail block rate</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">low-confidence rate</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">total</th>
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
            </div>
          </details>
        </section>

        {/* Metrics */}
        <section id="metrics" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
          <details open className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">Metrics (Tokens &amp; Latency)</h2>
                  <p className="text-xs text-muted-foreground">Cost and responsiveness signals.</p>
                </div>
                <Chevron />
              </div>
            </summary>

            <div className="mt-4 space-y-3">
              {dailyTokenUsage.length === 0 ? (
                <p className="text-xs text-muted-foreground">No token usage data for the current filters.</p>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold">Daily token usage</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">day</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">env</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">endpoint</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">model</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">prompt tokens</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">completion tokens</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">requests</th>
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
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">env</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">endpoint</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">model</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">avg prompt tokens</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">avg completion tokens</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">avg latency (ms)</th>
                          <th className="px-2 py-1 text-left font-medium text-muted-foreground">requests</th>
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
            </div>
          </details>
        </section>

        {/* Logs */}
        <section id="logs" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
          <details open className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">Recent Interactions</h2>
                  <p className="text-xs text-muted-foreground">
                    Paginated log viewer (search applies only here). Rows are tinted for fast triage.
                  </p>
                </div>
                <Chevron />
              </div>
            </summary>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Page {page}</span>
                  {q ? (
                    <>
                      {" "}
                      · Search: <span className="font-medium text-foreground">“{q}”</span>
                    </>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {prevHref ? (
                    <Link href={prevHref} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground opacity-60">Previous</span>
                  )}

                  {nextHref ? (
                    <Link href={nextHref} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground opacity-60">Next</span>
                  )}

                  <Link href="/admin/pgpt-insights/qa" className="ml-2 text-xs text-blue-600 underline">
                    QA Review{qaCountLabel}
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">created_at</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">env</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">endpoint</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">session_id</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">prompt</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">response</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">maxScore</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">low_confidence</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">intents</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">topics</th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">QA</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {logs.map((log) => {
                      const tone = logRowToneClass(log);
                      const score = parseScore(log.max_score);

                      const hover = "hover:bg-muted/30";
                      const rowClassName = [tone, hover].filter(Boolean).join(" ");

                      return (
                        <tr key={log.id} className={rowClassName}>
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
                          <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                            {truncate(log.prompt ?? "", 200)}
                          </td>
                          <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                            {truncate(log.response ?? "", 200)}
                          </td>
                          <td className="px-2 py-1">
                            {score === null ? "" : score.toFixed(3)}
                            {log.guardrail_status === "blocked" && log.guardrail_reason ? (
                              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                blocked: {log.guardrail_reason}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-2 py-1">{log.low_confidence === null ? "" : String(log.low_confidence)}</td>
                          <td className="px-2 py-1 align-top">
                            <ChipRow items={log.intents} />
                          </td>
                          <td className="px-2 py-1 align-top">
                            <ChipRow items={log.topics} />
                          </td>
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
                      );
                    })}

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

              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <div>
                  Showing <span className="font-medium text-foreground">{logs.length}</span> results on this page.
                </div>
                <div className="flex items-center gap-2">
                  {prevHref ? (
                    <Link href={prevHref} className="rounded-md border px-2 py-1 hover:bg-muted">
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-md border px-2 py-1 opacity-60">Previous</span>
                  )}
                  {nextHref ? (
                    <Link href={nextHref} className="rounded-md border px-2 py-1 hover:bg-muted">
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-md border px-2 py-1 opacity-60">Next</span>
                  )}
                </div>
              </div>
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}