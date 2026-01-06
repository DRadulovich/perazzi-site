import { pool } from "../db";
import { LOW_SCORE_THRESHOLD } from "./constants";
import { errorMessage } from "./error-utils";
import {
  buildLogsQueryParts,
  buildLogsQueryPartsWithBase,
  parseLogsFilters,
  type BoolFilter,
  type LogsFilters,
} from "./log-filters";
import { appendDaysFilter } from "./query-helpers";
import type {
  PerazziLogRow,
  PerazziLogPreviewRow,
  PgptSessionLogRow,
  PgptSessionMeta,
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
  QaFlagLatestRow,
  DailyTrendsRow,
  DailyLowScoreRateRow,
  PgptSessionSummary,
  PgptSessionTimelineRow,
  ArchetypeDailyRow,
  TriggerTermRow,
  TemplateUsageRow,
  LowMarginSessionRow,
  ArchetypeVariantSplitRow,
} from "./types";
type PgNumeric = string | number;
type PgNumericNullable = PgNumeric | null;

export type DataHealthSnapshot = {
  ok: boolean;
  checked_at: string;
  latency_ms: number | null;
  last_log_at: string | null;
  total: number | null;
  last_hour: number | null;
  last_24h: number | null;
  last_7d: number | null;
  error?: string;
};

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
  winner_changed?: string;
  margin_lt?: string;
  score_archetype?: string;
  min?: string;
  rerank?: string;
  snapped?: string;

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
    winner_changed: args.winner_changed,
    margin_lt: args.margin_lt,
    score_archetype: args.score_archetype,
    min: args.min,
    rerank: args.rerank,
    snapped: args.snapped,
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
      l.metadata as metadata,
      l.metadata->>'logTextMode' as log_text_mode,
      (l.metadata->>'logTextMaxChars')::int as log_text_max_chars,
      (l.metadata->>'promptTextTruncated')::boolean as prompt_text_truncated,
      (l.metadata->>'responseTextTruncated')::boolean as response_text_truncated,
      (l.metadata->>'promptTextOmitted')::boolean as prompt_text_omitted,
      (l.metadata->>'responseTextOmitted')::boolean as response_text_omitted,
      (l.metadata->>'rerankEnabled')::boolean as rerank_enabled,
      (l.metadata->>'archetypeSnapped')::boolean as archetype_snapped,
      coalesce((l.metadata->>'archetypeConfidenceMargin')::float, (l.metadata->>'archetypeConfidence')::float) as archetype_confidence_margin,
      (l.metadata->>'archetypeConfidence')::float as archetype_confidence,

      left(coalesce(l.prompt, ''), 800) as prompt_preview,
      left(coalesce(l.response, ''), 800) as response_preview,
      char_length(coalesce(l.prompt, '')) as prompt_len,
      char_length(coalesce(l.response, '')) as response_len,

      l.low_confidence,
      l.intents,
      l.topics,
      l.metadata->>'maxScore' as max_score,
      l.metadata->>'guardrailStatus' as guardrail_status,
      l.metadata->>'guardrailReason' as guardrail_reason,
      coalesce((l.metadata->>'cachedTokens')::int, (l.metadata->'responseUsage'->'input_tokens_details'->>'cached_tokens')::int) as cached_tokens,
      coalesce((l.metadata->>'reasoningTokens')::int, (l.metadata->'responseUsage'->'output_tokens_details'->>'reasoning_tokens')::int) as reasoning_tokens,
      coalesce(
        (l.metadata->>'totalTokens')::int,
        (l.metadata->'responseUsage'->>'total_tokens')::int,
        case when l.prompt_tokens is null or l.completion_tokens is null then null else l.prompt_tokens + l.completion_tokens end
      ) as total_tokens,

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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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
    avg_max_score: PgNumericNullable;
    min_max_score: PgNumericNullable;
    max_max_score: PgNumericNullable;
    total: PgNumeric;
    low_count: PgNumericNullable;
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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`l.env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  idx = appendDaysFilter({ conditions, params, idx, days: daysFilter, column: "l.created_at" });

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

  const { rows } = await pool.query<{ chunk_id: string; hits: PgNumeric }>(query, params);
  return rows.map((row) => ({ chunk_id: row.chunk_id, hits: Number(row.hits) }));
}

export async function fetchGuardrailStats(envFilter?: string, daysFilter?: number): Promise<GuardrailStatRow[]> {
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'guardrailStatus' = 'blocked'"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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

  const { rows } = await pool.query<{ guardrail_reason: string | null; env: string; hits: PgNumeric }>(
    query,
    params,
  );
  return rows.map((row) => ({ guardrail_reason: row.guardrail_reason, env: row.env, hits: Number(row.hits) }));
}

export async function fetchGuardrailByArchetype(envFilter?: string, daysFilter?: number): Promise<GuardrailByArchetypeRow[]> {
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'guardrailStatus' = 'blocked'"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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
    hits: PgNumeric;
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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

  const limitParamIndex = idx;
  params.push(limit);

  const query = `
    select
      id,
      created_at,
      env,
      archetype,
      session_id,
      metadata as metadata,
      metadata->>'logTextMode' as log_text_mode,
      (metadata->>'logTextMaxChars')::int as log_text_max_chars,
      (metadata->>'promptTextTruncated')::boolean as prompt_text_truncated,
      (metadata->>'responseTextTruncated')::boolean as response_text_truncated,
      (metadata->>'promptTextOmitted')::boolean as prompt_text_omitted,
      (metadata->>'responseTextOmitted')::boolean as response_text_omitted,
      prompt,
      response,
      metadata->>'guardrailReason' as guardrail_reason
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    order by created_at desc
    limit $${limitParamIndex}::int;
  `;

  const { rows } = await pool.query<GuardrailLogRow>(query, params);
  return rows;
}

export async function fetchArchetypeIntentStats(envFilter?: string, daysFilter?: number): Promise<ArchetypeIntentRow[]> {
  const conditions: string[] = ["endpoint = 'assistant'", "archetype is not null", "intents is not null"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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

  const { rows } = await pool.query<{ archetype: string | null; intent: string | null; hits: PgNumeric }>(
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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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
    avg_max_score: PgNumericNullable;
    guardrail_block_rate: PgNumericNullable;
    low_confidence_rate: PgNumericNullable;
    total: PgNumeric;
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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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
    total_prompt_tokens: PgNumeric;
    total_completion_tokens: PgNumeric;
    request_count: PgNumeric;
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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx}`);
    params.push(envFilter);
    idx += 1;
  }
  appendDaysFilter({ conditions, params, idx, days: daysFilter });

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
    avg_prompt_tokens: PgNumericNullable;
    avg_completion_tokens: PgNumericNullable;
    avg_latency_ms: PgNumericNullable;
    request_count: PgNumeric;
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
    const { rows } = await pool.query<{ open_count: PgNumeric }>(
      `select count(*) as open_count from qa_flags where status = 'open';`,
    );
    return Number(rows[0]?.open_count ?? 0);
  } catch (error) {
    console.error("[pgpt-insights] Failed to fetch open QA flag count", error);
    return 0;
  }
}

export async function fetchDataHealth(envFilter?: string): Promise<DataHealthSnapshot> {
  const startedAt = Date.now();
  const params: PgNumeric[] = [];
  const conditions: string[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

  try {
    const { rows } = await pool.query<{
      last_log_at: string | null;
      total: PgNumericNullable;
      last_hour: PgNumericNullable;
      last_24h: PgNumericNullable;
      last_7d: PgNumericNullable;
    }>(
      `
        select
          max(created_at)::text as last_log_at,
          count(*) as total,
          count(*) filter (where created_at >= now() - interval '1 hour') as last_hour,
          count(*) filter (where created_at >= now() - interval '24 hours') as last_24h,
          count(*) filter (where created_at >= now() - interval '7 days') as last_7d
        from perazzi_conversation_logs
        ${whereClause};
      `,
      params,
    );

    const row = rows[0] ?? {};
    return {
      ok: true,
      checked_at: new Date().toISOString(),
      latency_ms: Date.now() - startedAt,
      last_log_at: row.last_log_at ?? null,
      total: row.total === null || row.total === undefined ? null : Number(row.total),
      last_hour: row.last_hour === null || row.last_hour === undefined ? null : Number(row.last_hour),
      last_24h: row.last_24h === null || row.last_24h === undefined ? null : Number(row.last_24h),
      last_7d: row.last_7d === null || row.last_7d === undefined ? null : Number(row.last_7d),
    };
  } catch (error) {
    console.error("[pgpt-insights] fetchDataHealth failed", error);
    return {
      ok: false,
      checked_at: new Date().toISOString(),
      latency_ms: Date.now() - startedAt,
      last_log_at: null,
      total: null,
      last_hour: null,
      last_24h: null,
      last_7d: null,
      error: errorMessage(error),
    };
  }
}

// --- Windowed comparison helpers for Top Issues strip ---
export async function fetchGuardrailBlockedCountWindow(
  envFilter: string | undefined,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number> {
  const conditions: string[] = ["endpoint = 'assistant'", "metadata->>'guardrailStatus' = 'blocked'"];
  const params: PgNumeric[] = [];
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

  const query = `
    select count(*) as hits
    from perazzi_conversation_logs
    where ${conditions.join(" and ")};
  `;

  const { rows } = await pool.query<{ hits: PgNumeric }>(query, params);
  return Number(rows[0]?.hits ?? 0);
}

export async function fetchAvgLatencyMsWindow(
  envFilter: string | undefined,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number | null> {
  const conditions: string[] = ["endpoint in ('assistant', 'soul_journey')", "metadata->>'latencyMs' is not null"];
  const params: PgNumeric[] = [];
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

  const query = `
    select avg((metadata->>'latencyMs')::float) as avg_latency_ms
    from perazzi_conversation_logs
    where ${conditions.join(" and ")};
  `;

  const { rows } = await pool.query<{ avg_latency_ms: PgNumericNullable }>(query, params);
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
  const params: PgNumeric[] = [];
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
    avg_max_score: PgNumericNullable;
    min_max_score: PgNumericNullable;
    max_max_score: PgNumericNullable;
    total: PgNumeric;
    low_count: PgNumericNullable;
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
  const params: PgNumeric[] = [];
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

  appendDaysFilter({ conditions, params, idx, days });

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
    request_count: PgNumeric;
    total_prompt_tokens: PgNumeric;
    total_completion_tokens: PgNumeric;
    avg_latency_ms: PgNumericNullable;
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
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }

  idx = appendDaysFilter({ conditions, params, idx, days });

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

  const { rows } = await pool.query<{ day: string; total_scored: PgNumeric; low_count: PgNumeric }>(
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

export async function fetchArchetypeDailySeries(days: number): Promise<ArchetypeDailyRow[]> {
  const capDays = Math.max(1, Math.min(days, 180));
  try {
    const { rows } = await pool.query<{
      day: string;
      archetype: string | null;
      cnt: PgNumeric;
      avg_margin: PgNumericNullable;
    }>(
      `
        select
          day::date as day,
          archetype,
          cnt,
          avg_margin
        from vw_archetype_daily
        where day >= current_date - ($1 || ' days')::interval
        order by day asc, archetype;
      `,
      [capDays],
    );

    return rows.map((r) => ({
      day: String(r.day),
      archetype: r.archetype,
      cnt: Number(r.cnt ?? 0),
      avg_margin: r.avg_margin === null || r.avg_margin === undefined ? null : Number(r.avg_margin),
    }));
  } catch (error) {
    console.error("[pgpt-insights] fetchArchetypeDailySeries failed", error);
    return [];
  }
}

export async function fetchArchetypeMarginSummary(days: number): Promise<number | null> {
  const capDays = Math.max(1, Math.min(days, 180));
  try {
    const { rows } = await pool.query<{ avg_margin: PgNumericNullable }>(
      `
        select avg(
          coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float)
        ) as avg_margin
        from perazzi_conversation_logs
        where endpoint = 'assistant'
          and created_at >= now() - ($1 || ' days')::interval;
      `,
      [capDays],
    );
    const value = rows[0]?.avg_margin;
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  } catch (error) {
    console.error("[pgpt-insights] fetchArchetypeMarginSummary failed", error);
    return null;
  }
}

export async function fetchArchetypeVariantSplit(days: number): Promise<ArchetypeVariantSplitRow[]> {
  const capDays = Math.max(1, Math.min(days, 180));
  try {
    const { rows } = await pool.query<{
      variant: string | null;
      total: PgNumeric;
      avg_margin: PgNumericNullable;
    }>(
      `
        select
          coalesce(metadata->>'archetypeVariant', 'unknown') as variant,
          count(*) as total,
          avg(coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float)) as avg_margin
        from perazzi_conversation_logs
        where endpoint = 'assistant'
          and created_at >= now() - ($1 || ' days')::interval
        group by variant
        order by total desc;
      `,
      [capDays],
    );

    return rows.map((r) => ({
      variant: r.variant,
      total: Number(r.total ?? 0),
      avg_margin: r.avg_margin === null || r.avg_margin === undefined ? null : Number(r.avg_margin),
    }));
  } catch (error) {
    console.error("[pgpt-insights] fetchArchetypeVariantSplit failed", error);
    return [];
  }
}

export async function fetchTriggerTermWeeks(limit = 12): Promise<string[]> {
  try {
    const capped = Math.max(1, Math.min(limit, 52));
    const { rows } = await pool.query<{ week: string }>(
      `
        select distinct week::date as week
        from vw_trigger_terms_weekly
        order by week desc
        limit $1;
      `,
      [capped],
    );
    return rows.map((r) => String(r.week));
  } catch (error) {
    console.error("[pgpt-insights] fetchTriggerTermWeeks failed", error);
    return [];
  }
}

export async function fetchTriggerTermsForWeek(rawWeek: string, limit = 20): Promise<TriggerTermRow[]> {
    const safeLimit = Math.max(1, Math.min(limit, 100));

  // Ensure the week string is in ISO YYYY-MM-DD format to avoid Postgres
  // time-zone parsing errors such as "time zone \"gmt-0600\" not recognized".
  const isoWeek = (() => {
    // Fast, regex-free ISO date check: YYYY-MM-DD.
    const isIso = (s: string): boolean =>
      s.length === 10 && s[4] === "-" && s[7] === "-" &&
      !Number.isNaN(Date.parse(s));

    if (isIso(rawWeek)) return rawWeek;

    const parsed = new Date(rawWeek);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
  })();
  if (!isoWeek) {
    console.warn("[pgpt-insights] fetchTriggerTermsForWeek called with unparseable week:", rawWeek);
    return [];
  }
  try {
    const { rows } = await pool.query<{
      week: string;
      token: string;
      hits: PgNumeric;
    }>(
      `
        select week::date as week, token, hits
        from vw_trigger_terms_weekly
        where week = date_trunc('week', $1::date)
        order by hits desc
        limit $2;
      `,
            [isoWeek, safeLimit],
    );
    return rows.map((r) => ({
      week: String(r.week),
      token: r.token,
      hits: Number(r.hits ?? 0),
    }));
  } catch (error) {
    console.error("[pgpt-insights] fetchTriggerTermsForWeek failed", error);
    return [];
  }
}

export async function fetchTemplateUsageHeatmap(days: number): Promise<TemplateUsageRow[]> {
  const capDays = Math.max(1, Math.min(days, 180));
  try {
    const { rows } = await pool.query<{
      archetype: string | null;
      intent: string | null;
      template: string | null;
      hits: PgNumeric;
    }>(
      `
        select
          archetype,
          intent,
          template,
          count(*) as hits
        from (
          select
            archetype,
            unnest(intents) as intent,
            jsonb_array_elements_text(metadata->'templates') as template
          from perazzi_conversation_logs
          where endpoint = 'assistant'
            and metadata ? 'templates'
            and created_at >= now() - ($1 || ' days')::interval
        ) t
        where template is not null and trim(template) <> ''
        group by archetype, intent, template
        order by hits desc;
      `,
      [capDays],
    );

    return rows.map((r) => ({
      archetype: r.archetype,
      intent: r.intent,
      template: r.template,
      hits: Number(r.hits ?? 0),
    }));
  } catch (error) {
    console.error("[pgpt-insights] fetchTemplateUsageHeatmap failed", error);
    return [];
  }
}

export async function fetchLowMarginSessions(args: {
  days: number;
  marginThreshold?: number;
  minStreak?: number;
  limit?: number;
  rowLimit?: number;
}): Promise<LowMarginSessionRow[]> {
  const days = Math.max(1, Math.min(args.days, 180));
  const marginThreshold = args.marginThreshold ?? 0.05;
  const minStreak = Math.max(1, args.minStreak ?? 3);
  const limit = Math.max(1, Math.min(args.limit ?? 50, 500));
  const rowLimit = Math.max(1000, Math.min(args.rowLimit ?? 50000, 200000));

  const { rows } = await pool.query<{
    session_id: string | null;
    env: string | null;
    created_at: string;
    margin: PgNumericNullable;
  }>(
    `
      select
        session_id,
        env,
        created_at::text as created_at,
        coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float) as margin
      from perazzi_conversation_logs
      where endpoint = 'assistant'
        and session_id is not null
        and created_at >= now() - ($1 || ' days')::interval
      order by session_id asc, created_at asc
      limit $2;
    `,
    [days, rowLimit],
  );

  type SessionState = {
    env: string | null;
    first: string | null;
    last: string | null;
    longest: number;
    lowCount: number;
    lastMargin: number | null;
    streak: number;
  };

  const sessions = new Map<string, SessionState>();

  rows.forEach((row) => {
    const sessionId = row.session_id;
    if (!sessionId) return;
    const margin =
      row.margin === null || row.margin === undefined ? null : Number(row.margin);
    const isLow = margin !== null && Number.isFinite(margin) && margin < marginThreshold;

    const state: SessionState = sessions.get(sessionId) ?? {
      env: row.env ?? null,
      first: null,
      last: null,
      longest: 0,
      lowCount: 0,
      lastMargin: null,
      streak: 0,
    };

    state.first = state.first ?? row.created_at;
    state.last = row.created_at;
    state.env = state.env ?? row.env ?? null;
    state.lastMargin = margin;

    if (isLow) {
      state.streak += 1;
      state.lowCount += 1;
      if (state.streak > state.longest) state.longest = state.streak;
    } else {
      state.streak = 0;
    }

    sessions.set(sessionId, state);
  });

  const filtered = Array.from(sessions.entries())
    .filter(([, state]) => state.longest >= minStreak)
    .map<LowMarginSessionRow>(([session_id, state]) => ({
      session_id,
      env: state.env,
      first_seen: state.first,
      last_seen: state.last,
      longest_streak: state.longest,
      low_turn_count: state.lowCount,
      last_margin: state.lastMargin,
    }))
    .sort((a, b) => {
      if (b.longest_streak !== a.longest_streak) return b.longest_streak - a.longest_streak;
      const dateA = a.last_seen ? Date.parse(a.last_seen) : 0;
      const dateB = b.last_seen ? Date.parse(b.last_seen) : 0;
      return dateB - dateA;
    });

  return filtered.slice(0, limit);
}

export async function fetchAssistantRequestCountWindow(
  envFilter: string | undefined,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number> {
  const conditions: string[] = [`endpoint = 'assistant'`];
  const params: PgNumeric[] = [];
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

  const { rows } = await pool.query<{ hits: PgNumeric }>(query, params);
  return Number(rows[0]?.hits ?? 0);
}

export async function fetchArchetypeSnapSummary(
  envFilter?: string,
  daysFilter?: number,
  rerank?: BoolFilter,
  snappedFilter?: BoolFilter,
  marginLt?: number | null,
): Promise<{ total: number; snapped_count: number; mixed_count: number; unknown_count: number }> {
  const conditions: string[] = ["endpoint = 'assistant'"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }
  idx = appendDaysFilter({ conditions, params, idx, days: daysFilter });

  if (rerank === "true") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = true`);
  } else if (rerank === "false") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = false`);
  }

  if (snappedFilter === "true") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = true`);
  } else if (snappedFilter === "false") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = false`);
  }

  if (marginLt !== null && marginLt !== undefined) {
    conditions.push(
      `coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float) < $${idx++}`,
    );
    params.push(marginLt);
  }

  const query = `
    select
      count(*) as total,
      count(*) filter (where metadata->>'archetypeSnapped' = 'true') as snapped_count,
      count(*) filter (where metadata->>'archetypeSnapped' = 'false') as mixed_count,
      count(*) filter (where metadata->>'archetypeSnapped' is null) as unknown_count
    from perazzi_conversation_logs
    where ${conditions.join(" and ")};
  `;

  const { rows } = await pool.query(query, params);
  const r = rows[0] ?? {};
  return {
    total: Number(r.total ?? 0),
    snapped_count: Number(r.snapped_count ?? 0),
    mixed_count: Number(r.mixed_count ?? 0),
    unknown_count: Number(r.unknown_count ?? 0),
  };
}

export async function fetchRerankEnabledSummary(
  envFilter?: string,
  daysFilter?: number,
  rerank?: BoolFilter,
  snapped?: BoolFilter,
  marginLt?: number | null,
): Promise<{
  total: number;
  rerank_on_count: number;
  rerank_off_count: number;
  unknown_count: number;
  avg_candidate_limit: number | null;
}> {
  const conditions: string[] = ["endpoint = 'assistant'"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }
  idx = appendDaysFilter({ conditions, params, idx, days: daysFilter });

  if (rerank === "true") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = true`);
  } else if (rerank === "false") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = false`);
  }

  if (snapped === "true") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = true`);
  } else if (snapped === "false") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = false`);
  }

  if (marginLt !== null && marginLt !== undefined) {
    conditions.push(
      `coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float) < $${idx++}`,
    );
    params.push(marginLt);
  }

  const query = `
    select
      count(*) as total,
      count(*) filter (where metadata->>'rerankEnabled' = 'true') as rerank_on_count,
      count(*) filter (where metadata->>'rerankEnabled' = 'false') as rerank_off_count,
      count(*) filter (where metadata->>'rerankEnabled' is null) as unknown_count,
      avg((metadata->>'candidateLimit')::float) as avg_candidate_limit
    from perazzi_conversation_logs
    where ${conditions.join(" and ")};
  `;

  const { rows } = await pool.query(query, params);
  const r = rows[0] ?? {};
  const avg = r.avg_candidate_limit === null || r.avg_candidate_limit === undefined ? null : Number(r.avg_candidate_limit);
  return {
    total: Number(r.total ?? 0),
    rerank_on_count: Number(r.rerank_on_count ?? 0),
    rerank_off_count: Number(r.rerank_off_count ?? 0),
    unknown_count: Number(r.unknown_count ?? 0),
    avg_candidate_limit: Number.isFinite(avg as number) ? (avg as number) : null,
  };
}

export async function fetchArchetypeMarginHistogram(
  envFilter?: string,
  daysFilter?: number,
  rerank?: BoolFilter,
  snapped?: BoolFilter,
  marginLt?: number | null,
): Promise<Array<{ bucket_order: number; bucket_label: string; hits: number }>> {
  const conditions: string[] = ["endpoint = 'assistant'"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }
  idx = appendDaysFilter({ conditions, params, idx, days: daysFilter });

  if (rerank === "true") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = true`);
  } else if (rerank === "false") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = false`);
  }

  if (snapped === "true") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = true`);
  } else if (snapped === "false") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = false`);
  }

  if (marginLt !== null && marginLt !== undefined) {
    conditions.push(
      `coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float) < $${idx++}`,
    );
    params.push(marginLt);
  }

  const query = `
    with base as (
      select
        coalesce(
          (metadata->>'archetypeConfidenceMargin')::float,
          (metadata->>'archetypeConfidence')::float
        ) as v
      from perazzi_conversation_logs
      where ${conditions.join(" and ")}
    ),
    bucketed as (
      select
        case
          when v is null then 0
          when v < 0.02 then 1
          when v < 0.05 then 2
          when v < 0.08 then 3
          when v < 0.12 then 4
          when v < 0.20 then 5
          else 6
        end as bucket_order,
        case
          when v is null then 'missing'
          when v < 0.02 then '<2%'
          when v < 0.05 then '2–5%'
          when v < 0.08 then '5–8%'
          when v < 0.12 then '8–12%'
          when v < 0.20 then '12–20%'
          else '≥20%'
        end as bucket_label
      from base
    )
    select bucket_order, bucket_label, count(*) as hits
    from bucketed
    group by bucket_order, bucket_label
    order by bucket_order asc;
  `;

  const { rows } = await pool.query<{
    bucket_order: PgNumericNullable;
    bucket_label: string | null;
    hits: PgNumericNullable;
  }>(query, params);
  return rows.map((r) => ({
    bucket_order: Number(r.bucket_order ?? 0),
    bucket_label: String(r.bucket_label ?? ""),
    hits: Number(r.hits ?? 0),
  }));
}

export async function fetchDailyArchetypeSnapRate(args: {
  envFilter?: string;
  days: number;
  rerank?: BoolFilter;
  snapped?: BoolFilter;
  marginLt?: number | null;
}): Promise<Array<{ day: string; snapped_count: number; mixed_count: number; total_classified: number }>> {
  const { envFilter, days, rerank, snapped, marginLt } = args;

  const conditions: string[] = ["endpoint = 'assistant'"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }

  idx = appendDaysFilter({ conditions, params, idx, days });

  if (rerank === "true") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = true`);
  } else if (rerank === "false") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = false`);
  }

  if (snapped === "true") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = true`);
  } else if (snapped === "false") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = false`);
  }

  if (marginLt !== null && marginLt !== undefined) {
    conditions.push(
      `coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float) < $${idx++}`,
    );
    params.push(marginLt);
  }

  const query = `
    select
      date_trunc('day', created_at)::date as day,
      count(*) filter (where metadata->>'archetypeSnapped' = 'true') as snapped_count,
      count(*) filter (where metadata->>'archetypeSnapped' = 'false') as mixed_count,
      count(*) filter (where metadata->>'archetypeSnapped' in ('true','false')) as total_classified
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by day
    order by day asc;
  `;

  const { rows } = await pool.query<{
    day: string;
    snapped_count: PgNumericNullable;
    mixed_count: PgNumericNullable;
    total_classified: PgNumericNullable;
  }>(query, params);
  return rows.map((r) => ({
    day: String(r.day),
    snapped_count: Number(r.snapped_count ?? 0),
    mixed_count: Number(r.mixed_count ?? 0),
    total_classified: Number(r.total_classified ?? 0),
  }));
}

export async function fetchDailyRerankEnabledRate(args: {
  envFilter?: string;
  days: number;
  rerank?: BoolFilter;
  snapped?: BoolFilter;
  marginLt?: number | null;
}): Promise<
  Array<{
    day: string;
    rerank_on_count: number;
    rerank_off_count: number;
    total_flagged: number;
    avg_candidate_limit: number | null;
  }>
> {
  const { envFilter, days, rerank, snapped, marginLt } = args;

  const conditions: string[] = ["endpoint = 'assistant'"];
  const params: PgNumeric[] = [];
  let idx = 1;

  if (envFilter) {
    conditions.push(`env = $${idx++}`);
    params.push(envFilter);
  }

  idx = appendDaysFilter({ conditions, params, idx, days });

  if (rerank === "true") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = true`);
  } else if (rerank === "false") {
    conditions.push(`coalesce((metadata->>'rerankEnabled')::boolean, false) = false`);
  }

  if (snapped === "true") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = true`);
  } else if (snapped === "false") {
    conditions.push(`coalesce((metadata->>'archetypeSnapped')::boolean, false) = false`);
  }

  if (marginLt !== null && marginLt !== undefined) {
    conditions.push(
      `coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float) < $${idx++}`,
    );
    params.push(marginLt);
  }

  const query = `
    select
      date_trunc('day', created_at)::date as day,
      count(*) filter (where metadata->>'rerankEnabled' = 'true') as rerank_on_count,
      count(*) filter (where metadata->>'rerankEnabled' = 'false') as rerank_off_count,
      count(*) filter (where metadata->>'rerankEnabled' in ('true','false')) as total_flagged,
      avg((metadata->>'candidateLimit')::float) as avg_candidate_limit
    from perazzi_conversation_logs
    where ${conditions.join(" and ")}
    group by day
    order by day asc;
  `;

  const { rows } = await pool.query<{
    day: string;
    rerank_on_count: PgNumericNullable;
    rerank_off_count: PgNumericNullable;
    total_flagged: PgNumericNullable;
    avg_candidate_limit: PgNumericNullable;
  }>(query, params);
  return rows.map((r) => {
    const avg =
      r.avg_candidate_limit === null || r.avg_candidate_limit === undefined ? null : Number(r.avg_candidate_limit);
    return {
      day: String(r.day),
      rerank_on_count: Number(r.rerank_on_count ?? 0),
      rerank_off_count: Number(r.rerank_off_count ?? 0),
      total_flagged: Number(r.total_flagged ?? 0),
      avg_candidate_limit: Number.isFinite(avg as number) ? (avg as number) : null,
    };
  });
}

// -----------------------------------------------------------------------------
// Session Explorer
// -----------------------------------------------------------------------------

function isUuidLikeSession(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Pass 1: full logs for the session page (keeps current UI behavior).
 * Pass 2 will switch the session list to previews + drawer detail fetch.
 */
export async function fetchSessionLogsFull(sessionId: string): Promise<PgptSessionLogRow[]> {
  const { rows } = await pool.query<PgptSessionLogRow>(
    `
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
        metadata->>'guardrailReason' as guardrail_reason,
        coalesce((metadata->>'cachedTokens')::int, (metadata->'responseUsage'->'input_tokens_details'->>'cached_tokens')::int) as cached_tokens,
        coalesce((metadata->>'reasoningTokens')::int, (metadata->'responseUsage'->'output_tokens_details'->>'reasoning_tokens')::int) as reasoning_tokens,
        coalesce(
          (metadata->>'totalTokens')::int,
          (metadata->'responseUsage'->>'total_tokens')::int,
          case when prompt_tokens is null or completion_tokens is null then null else prompt_tokens + completion_tokens end
        ) as total_tokens
      from perazzi_conversation_logs
      where session_id = $1
      order by created_at asc;
    `,
    [sessionId],
  );

  return rows;
}

export async function fetchSessionTimelineRows(args: {
  sessionId: string;
  limit: number;
  offset: number;
}): Promise<PgptSessionTimelineRow[]> {
  const { rows } = await pool.query<PgptSessionTimelineRow>(
    `
      select
        id,
        created_at::text as created_at,
        endpoint,
        archetype,
        coalesce((metadata->>'archetypeConfidenceMargin')::float, (metadata->>'archetypeConfidence')::float) as archetype_confidence_margin,
        (metadata->>'archetypeConfidence')::float as archetype_confidence,
        (metadata->>'archetypeSnapped')::boolean as archetype_snapped,
        (metadata->>'rerankEnabled')::boolean as rerank_enabled,
        metadata->'archetypeScores' as archetype_scores
      from perazzi_conversation_logs
      where session_id = $1
      order by created_at asc
      limit $2
      offset $3;
    `,
    [args.sessionId, args.limit, args.offset],
  );

  return rows;
}

/**
 * Pass 2+ (not used in Pass 1): preview-only rows for scan mode.
 * Mirrors the logs list fields and includes latest QA via lateral join.
 */
export async function fetchSessionLogsPreview(args: {
  sessionId: string;
  q?: string;

  gr_status?: string;
  low_conf?: string;
  score?: string;
  qa?: string;
  winner_changed?: string;
  margin_lt?: string;
  score_archetype?: string;
  min?: string;
  rerank?: string;
  snapped?: string;

  limit: number;
  offset: number;
}): Promise<PerazziLogPreviewRow[]> {
  const filters: LogsFilters = parseLogsFilters({
    q: args.q,

    gr_status: args.gr_status,
    low_conf: args.low_conf,
    score: args.score,
    qa: args.qa,
    winner_changed: args.winner_changed,
    margin_lt: args.margin_lt,
    score_archetype: args.score_archetype,
    min: args.min,
    rerank: args.rerank,
    snapped: args.snapped,
  });

  // Base condition: session scope must always apply
  const { joinSql, whereClause, values, nextIndex } = buildLogsQueryPartsWithBase({
    filters,
    baseConditions: [`l.session_id = $1`],
    baseValues: [args.sessionId],
    startIndex: 2,
  });

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
      l.metadata as metadata,
      l.metadata->>'logTextMode' as log_text_mode,
      (l.metadata->>'logTextMaxChars')::int as log_text_max_chars,
      (l.metadata->>'promptTextTruncated')::boolean as prompt_text_truncated,
      (l.metadata->>'responseTextTruncated')::boolean as response_text_truncated,
      (l.metadata->>'promptTextOmitted')::boolean as prompt_text_omitted,
      (l.metadata->>'responseTextOmitted')::boolean as response_text_omitted,
      (l.metadata->>'rerankEnabled')::boolean as rerank_enabled,
      (l.metadata->>'archetypeSnapped')::boolean as archetype_snapped,
      coalesce((l.metadata->>'archetypeConfidenceMargin')::float, (l.metadata->>'archetypeConfidence')::float) as archetype_confidence_margin,
      (l.metadata->>'archetypeConfidence')::float as archetype_confidence,

      left(coalesce(l.prompt, ''), 800) as prompt_preview,
      left(coalesce(l.response, ''), 800) as response_preview,
      char_length(coalesce(l.prompt, '')) as prompt_len,
      char_length(coalesce(l.response, '')) as response_len,

      l.low_confidence,
      l.intents,
      l.topics,
      l.metadata->>'maxScore' as max_score,
      l.metadata->>'guardrailStatus' as guardrail_status,
      l.metadata->>'guardrailReason' as guardrail_reason,
      coalesce((l.metadata->>'cachedTokens')::int, (l.metadata->'responseUsage'->'input_tokens_details'->>'cached_tokens')::int) as cached_tokens,
      coalesce((l.metadata->>'reasoningTokens')::int, (l.metadata->'responseUsage'->'output_tokens_details'->>'reasoning_tokens')::int) as reasoning_tokens,
      coalesce(
        (l.metadata->>'totalTokens')::int,
        (l.metadata->'responseUsage'->>'total_tokens')::int,
        case when l.prompt_tokens is null or l.completion_tokens is null then null else l.prompt_tokens + l.completion_tokens end
      ) as total_tokens,

      qf.qa_flag_id,
      qf.qa_flag_status,
      qf.qa_flag_reason,
      qf.qa_flag_notes,
      qf.qa_flag_created_at
    from perazzi_conversation_logs l
    ${joinSql}
    ${whereClause}
    order by l.created_at asc
    limit $${limitIndex}
    offset $${offsetIndex};
  `;

  const { rows } = await pool.query<PerazziLogPreviewRow>(query, values);
  return rows;
}

export async function fetchSessionConversationLogs(args: {
  sessionId: string;
  q?: string;

  gr_status?: string;
  low_conf?: string;
  score?: string;
  qa?: string;
  winner_changed?: string;
  margin_lt?: string;
  score_archetype?: string;
  min?: string;
  rerank?: string;
  snapped?: string;

  limit: number;
  offset: number;
}): Promise<PerazziLogRow[]> {
  const filters: LogsFilters = parseLogsFilters({
    q: args.q,

    gr_status: args.gr_status,
    low_conf: args.low_conf,
    score: args.score,
    qa: args.qa,
    winner_changed: args.winner_changed,
    margin_lt: args.margin_lt,
    score_archetype: args.score_archetype,
    min: args.min,
    rerank: args.rerank,
    snapped: args.snapped,
  });

  const { joinSql, whereClause, values, nextIndex } = buildLogsQueryPartsWithBase({
    filters,
    baseConditions: [`l.session_id = $1`],
    baseValues: [args.sessionId],
    startIndex: 2,
  });

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
      l.metadata as metadata,
      l.metadata->>'logTextMode' as log_text_mode,
      (l.metadata->>'logTextMaxChars')::int as log_text_max_chars,
      (l.metadata->>'promptTextTruncated')::boolean as prompt_text_truncated,
      (l.metadata->>'responseTextTruncated')::boolean as response_text_truncated,
      (l.metadata->>'promptTextOmitted')::boolean as prompt_text_omitted,
      (l.metadata->>'responseTextOmitted')::boolean as response_text_omitted,
      l.prompt,
      l.response,
      l.low_confidence,
      l.intents,
      l.topics,
      l.metadata->>'maxScore' as max_score,
      l.metadata->>'guardrailStatus' as guardrail_status,
      l.metadata->>'guardrailReason' as guardrail_reason,
      coalesce((l.metadata->>'cachedTokens')::int, (l.metadata->'responseUsage'->'input_tokens_details'->>'cached_tokens')::int) as cached_tokens,
      coalesce((l.metadata->>'reasoningTokens')::int, (l.metadata->'responseUsage'->'output_tokens_details'->>'reasoning_tokens')::int) as reasoning_tokens,
      coalesce(
        (l.metadata->>'totalTokens')::int,
        (l.metadata->'responseUsage'->>'total_tokens')::int,
        case when l.prompt_tokens is null or l.completion_tokens is null then null else l.prompt_tokens + l.completion_tokens end
      ) as total_tokens
    from perazzi_conversation_logs l
    ${joinSql}
    ${whereClause}
    order by l.created_at asc
    limit $${limitIndex}
    offset $${offsetIndex};
  `;

  const { rows } = await pool.query<PerazziLogRow>(query, values);
  return rows;
}

/**
 * Optional: metadata for a session header / summary (not used yet in Pass 1).
 */
export async function fetchSessionMeta(sessionId: string): Promise<PgptSessionMeta> {
  const { rows } = await pool.query<{
    session_id: string;
    interaction_count: PgNumeric;
    started_at: string | null;
    ended_at: string | null;
    envs: string[] | null;
    endpoints: string[] | null;
    models: string[] | null;
  }>(
    `
      select
        $1::text as session_id,
        count(*) as interaction_count,
        min(created_at)::text as started_at,
        max(created_at)::text as ended_at,
        array_remove(array_agg(distinct env), null) as envs,
        array_remove(array_agg(distinct endpoint), null) as endpoints,
        array_remove(array_agg(distinct model), null) as models
      from perazzi_conversation_logs
      where session_id = $1;
    `,
    [sessionId],
  );

  const r = rows[0];
  return {
    session_id: sessionId,
    interaction_count: Number(r?.interaction_count ?? 0),
    started_at: r?.started_at ?? null,
    ended_at: r?.ended_at ?? null,
    envs: r?.envs ?? [],
    endpoints: r?.endpoints ?? [],
    models: r?.models ?? [],
  };
}

/**
 * Pass 1: keep current behavior (QA fetched in a separate query) but move SQL out of page.
 * Later passes can inline this via lateral join or reuse preview query’s QA columns.
 */
export async function fetchLatestQaFlagsForInteractionIds(
  interactionIds: string[],
): Promise<Map<string, QaFlagLatestRow>> {
  const ids = interactionIds.filter(isUuidLikeSession);
  if (ids.length === 0) return new Map();

  const { rows } = await pool.query<QaFlagLatestRow>(
    `
      select distinct on (interaction_id)
        interaction_id::text as interaction_id,
        id::text as id,
        status,
        reason,
        notes,
        created_at::text as created_at
      from qa_flags
      where interaction_id = any($1::uuid[])
      order by interaction_id, (status = 'open') desc, created_at desc;
    `,
    [ids],
  );

  const out = new Map<string, QaFlagLatestRow>();
  for (const row of rows) out.set(row.interaction_id, row);
  return out;
}

export async function fetchSessionSummary(
  sessionId: string,
  lowScoreThreshold: number,
): Promise<PgptSessionSummary> {
  const { rows } = await pool.query<{
    session_id: string;

    interaction_count: PgNumeric;
    started_at: string | null;
    ended_at: string | null;

    assistant_count: PgNumeric;

    blocked_count: PgNumeric;
    scored_count: PgNumeric;
    low_score_count: PgNumeric;

    open_qa_count: PgNumeric;

    top_archetype: string | null;
    top_model: string | null;
  }>(
    `
      with logs as (
        select
          id,
          created_at,
          endpoint,
          archetype,
          model,
          metadata
        from perazzi_conversation_logs
        where session_id = $1
      ),
      latest_flags as (
        select distinct on (interaction_id)
          interaction_id::text as interaction_id,
          id::text as id,
          status,
          reason,
          notes,
          created_at::text as created_at
        from qa_flags
        where interaction_id in (select id from logs)
        order by interaction_id, (status = 'open') desc, created_at desc
      ),
      agg as (
        select
          count(*) as interaction_count,
          min(created_at)::text as started_at,
          max(created_at)::text as ended_at,

          count(*) filter (where endpoint = 'assistant') as assistant_count,

          count(*) filter (
            where endpoint = 'assistant' and metadata->>'guardrailStatus' = 'blocked'
          ) as blocked_count,

          count(*) filter (
            where endpoint = 'assistant' and metadata->>'maxScore' is not null
          ) as scored_count,

          count(*) filter (
            where endpoint = 'assistant'
              and metadata->>'maxScore' is not null
              and (metadata->>'maxScore')::float < $2
          ) as low_score_count
        from logs
      ),
      open_qa as (
        select count(*) as open_qa_count
        from latest_flags
        where status = 'open'
      ),
      top_archetype as (
        select archetype
        from logs
        where archetype is not null
        group by archetype
        order by count(*) desc, archetype asc
        limit 1
      ),
      top_model as (
        select model
        from logs
        where model is not null
        group by model
        order by count(*) desc, model asc
        limit 1
      )
      select
        $1::text as session_id,

        agg.interaction_count,
        agg.started_at,
        agg.ended_at,

        agg.assistant_count,

        agg.blocked_count,
        agg.scored_count,
        agg.low_score_count,

        (select open_qa_count from open_qa) as open_qa_count,

        (select archetype from top_archetype) as top_archetype,
        (select model from top_model) as top_model
      from agg;
    `,
    [sessionId, lowScoreThreshold],
  );

  const r = rows[0];

  return {
    session_id: sessionId,

    interaction_count: Number(r?.interaction_count ?? 0),
    started_at: r?.started_at ?? null,
    ended_at: r?.ended_at ?? null,

    assistant_count: Number(r?.assistant_count ?? 0),

    blocked_count: Number(r?.blocked_count ?? 0),
    scored_count: Number(r?.scored_count ?? 0),
    low_score_count: Number(r?.low_score_count ?? 0),

    open_qa_count: Number(r?.open_qa_count ?? 0),

    top_archetype: r?.top_archetype ?? null,
    top_model: r?.top_model ?? null,
  };
}
