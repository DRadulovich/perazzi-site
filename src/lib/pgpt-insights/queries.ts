import { pool } from "../db";
import { LOW_SCORE_THRESHOLD } from "./constants";
import { buildLogsQueryParts, parseLogsFilters, type LogsFilters } from "./log-filters";
import type {
  PerazziLogRow,
  PerazziLogPreviewRow,
  RagSummary,
  TopChunkRow,
  GuardrailStatRow,
  GuardrailByArchetypeRow,
  GuardrailLogRow,
  ArchetypeIntentRow,
  ArchetypeSummaryRow,
  DailyTokenUsageRow,
  AvgMetricsRow,
  QaFlagLookupRow,
  DailyTrendsRow,
  DailyLowScoreRateRow,
} from "./types";

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchQaFlagsForInteractions(interactionIds: string[]): Promise<Map<string, QaFlagLookupRow>> {
  const ids = interactionIds.filter(isUuidLike);
  if (ids.length === 0) return new Map();

  const { rows } = await pool.query<QaFlagLookupRow>(
    `
      select distinct on (interaction_id)
        interaction_id::text as interaction_id,
        id,
        status,
        reason,
        notes,
        created_at
      from qa_flags
      where interaction_id = any($1::uuid[])
      order by interaction_id, (status = 'open') desc, created_at desc;
    `,
    [ids],
  );

  const out = new Map<string, QaFlagLookupRow>();
  for (const row of rows) out.set(row.interaction_id, row);
  return out;
}

export async function fetchLogs(args: {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  q?: string;

  gr_status?: string;
  gr_reason?: string;
  low_conf?: string;
  score?: string;
  archetype?: string;
  model?: string;
  gateway?: string;
  qa?: string;

  limit: number;
  offset: number;
}): Promise<PerazziLogPreviewRow[]> {
  const filters: LogsFilters = parseLogsFilters({
    envFilter: args.envFilter,
    endpointFilter: args.endpointFilter,
    daysFilter: args.daysFilter,
    q: args.q,

    gr_status: args.gr_status,
    gr_reason: args.gr_reason,
    low_conf: args.low_conf,
    score: args.score,
    archetype: args.archetype,
    model: args.model,
    gateway: args.gateway,
    qa: args.qa,
  });

  const { joinSql, whereClause, values, nextIndex } = buildLogsQueryParts(filters);

  const limitIndex = nextIndex;
  values.push(args.limit);

  const offsetIndex = nextIndex + 1;
  values.push(args.offset);

  const query = `
    select
      l.id,
      l.created_at,
      l.env,
      l.endpoint,
      l.archetype,
      l.session_id,
      l.model,
      l.used_gateway,

      left(l.prompt, 800) as prompt_preview,
      left(l.response, 800) as response_preview,
      char_length(l.prompt) as prompt_len,
      char_length(l.response) as response_len,

      l.low_confidence,
      l.intents,
      l.topics,
      l.metadata->>'maxScore' as max_score,
      l.metadata->>'guardrailStatus' as guardrail_status,
      l.metadata->>'guardrailReason' as guardrail_reason,

      qf.qa_flag_id,
      qf.qa_flag_status,
      qf.qa_flag_reason,
      qf.qa_flag_notes,
      qf.qa_flag_created_at
    from perazzi_conversation_logs l
    ${joinSql}
    ${whereClause}
    order by l.created_at desc
    limit $${limitIndex}
    offset $${offsetIndex};
  `;

  const { rows } = await pool.query<PerazziLogPreviewRow>(query, values);
  return rows;
}

export async function fetchRagSummary(envFilter?: string, daysFilter?: number): Promise<RagSummary | null> {
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

export async function fetchLowScoreLogs(
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

export async function fetchTopChunks(envFilter?: string, limit = 20, daysFilter?: number): Promise<TopChunkRow[]> {
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

export async function fetchGuardrailStats(envFilter?: string, daysFilter?: number): Promise<GuardrailStatRow[]> {
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

export async function fetchGuardrailByArchetype(envFilter?: string, daysFilter?: number): Promise<GuardrailByArchetypeRow[]> {
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

export async function fetchRecentGuardrailBlocks(
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

export async function fetchArchetypeIntentStats(envFilter?: string, daysFilter?: number): Promise<ArchetypeIntentRow[]> {
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

export async function fetchArchetypeSummary(envFilter?: string, daysFilter?: number): Promise<ArchetypeSummaryRow[]> {
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

export async function fetchDailyTokenUsage(envFilter?: string, daysFilter?: number): Promise<DailyTokenUsageRow[]> {
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

export async function fetchAvgMetrics(envFilter?: string, daysFilter?: number): Promise<AvgMetricsRow[]> {
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

export async function fetchOpenQaFlagCount(): Promise<number> {
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

// --- Windowed comparison helpers for Top Issues strip ---
export async function fetchGuardrailBlockedCountWindow(
  envFilter: string | undefined,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number> {
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'guardrailStatus' = 'blocked'"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }

  // Window: [now - startDaysAgo, now - endDaysAgo)
  conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
  params.push(startDaysAgo);
  idx += 1;

  conditions.push(`created_at < now() - ($${idx} || ' days')::interval`);
  params.push(endDaysAgo);
  idx += 1;

  const query = `
    select count(*) as hits
    from perazzi_conversation_logs
    where ${conditions.join(" and ")};
  `;

  const { rows } = await pool.query<{ hits: string | number }>(query, params);
  return Number(rows[0]?.hits ?? 0);
}

export async function fetchAvgLatencyMsWindow(
  envFilter: string | undefined,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number | null> {
  const conditions: string[] = ["endpoint in ('assistant', 'soul_journey')", "metadata->>'latencyMs' is not null"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }

  conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
  params.push(startDaysAgo);
  idx += 1;

  conditions.push(`created_at < now() - ($${idx} || ' days')::interval`);
  params.push(endDaysAgo);
  idx += 1;

  const query = `
    select avg((metadata->>'latencyMs')::float) as avg_latency_ms
    from perazzi_conversation_logs
    where ${conditions.join(" and ")};
  `;

  const { rows } = await pool.query<{ avg_latency_ms: string | number | null }>(query, params);
  const v = rows[0]?.avg_latency_ms;
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function fetchRagSummaryWindow(
  envFilter: string | undefined,
  threshold: number,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<RagSummary | null> {
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'maxScore' is not null"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }

  conditions.push(`created_at >= now() - ($${idx} || ' days')::interval`);
  params.push(startDaysAgo);
  idx += 1;

  conditions.push(`created_at < now() - ($${idx} || ' days')::interval`);
  params.push(endDaysAgo);
  idx += 1;

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
    where ${conditions.join(" and ")};
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

export async function fetchDailyTrends(args: {
  envFilter?: string;
  endpointFilter?: string;
  days: number;
}): Promise<DailyTrendsRow[]> {
  const { envFilter, endpointFilter, days } = args;

  const conditions: string[] = [];
  const params: Array<string | number> = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }

  if (endpointFilter && endpointFilter !== "all") {
    conditions.push(`endpoint = $${idx++}`);
    params.push(endpointFilter);
  } else {
    conditions.push(`endpoint in ('assistant', 'soul_journey')`);
  }

  conditions.push(`created_at >= now() - ($${idx++} || ' days')::interval`);
  params.push(days);

  const query = `
    select
      date_trunc('day', created_at)::date as day,
      count(*) as request_count,
      sum(coalesce(prompt_tokens, 0)) as total_prompt_tokens,
      sum(coalesce(completion_tokens, 0)) as total_completion_tokens,
      avg((metadata->>'latencyMs')::float) as avg_latency_ms
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by day
    order by day asc;
  `;

  const { rows } = await pool.query<{
    day: string;
    request_count: string | number;
    total_prompt_tokens: string | number;
    total_completion_tokens: string | number;
    avg_latency_ms: string | number | null;
  }>(query, params);

  return rows.map((r) => ({
    day: String(r.day),
    request_count: Number(r.request_count ?? 0),
    total_prompt_tokens: Number(r.total_prompt_tokens ?? 0),
    total_completion_tokens: Number(r.total_completion_tokens ?? 0),
    avg_latency_ms: r.avg_latency_ms === null ? null : Number(r.avg_latency_ms),
  }));
}

export async function fetchDailyLowScoreRate(args: {
  envFilter?: string;
  days: number;
  threshold: number;
}): Promise<DailyLowScoreRateRow[]> {
  const { envFilter, days, threshold } = args;

  const conditions: string[] = [`endpoint = 'assistant'`];
  const params: Array<string | number> = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }

  conditions.push(`created_at >= now() - ($${idx++} || ' days')::interval`);
  params.push(days);

  const thresholdIndex = idx++;
  params.push(threshold);

  const query = `
    select
      date_trunc('day', created_at)::date as day,
      count(*) filter (where metadata->>'maxScore' is not null) as total_scored,
      sum(case
        when metadata->>'maxScore' is not null and (metadata->>'maxScore')::float < $${thresholdIndex}
        then 1 else 0 end) as low_count
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by day
    order by day asc;
  `;

  const { rows } = await pool.query<{ day: string; total_scored: string | number; low_count: string | number }>(
    query,
    params,
  );

  return rows.map((r) => ({
    day: String(r.day),
    total_scored: Number(r.total_scored ?? 0),
    low_count: Number(r.low_count ?? 0),
    threshold,
  }));
}

export async function fetchAssistantRequestCountWindow(
  envFilter: string | undefined,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number> {
  const conditions: string[] = [`endpoint = 'assistant'`];
  const params: Array<string | number> = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }

  conditions.push(`created_at >= now() - ($${idx++} || ' days')::interval`);
  params.push(startDaysAgo);

  conditions.push(`created_at < now() - ($${idx++} || ' days')::interval`);
  params.push(endDaysAgo);

  const query = `
    select count(*) as hits
    from perazzi_conversation_logs
    where ${conditions.join(" and ")};
  `;

  const { rows } = await pool.query<{ hits: string | number }>(query, params);
  return Number(rows[0]?.hits ?? 0);
}
