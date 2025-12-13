export type PerazziLogBase = {
  id: string;
  created_at: string;
  env: string;
  endpoint: string;
  archetype: string | null;
  session_id: string | null;
  model: string | null;
  used_gateway: boolean | null;

  low_confidence: boolean | null;
  intents: string[] | null;
  topics: string[] | null;

  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;

  // QA fields (attached server-side after fetching)
  qa_flag_id?: string | null;
  qa_flag_status?: string | null;
  qa_flag_reason?: string | null;
  qa_flag_notes?: string | null;
  qa_flag_created_at?: string | null;
};

export type PerazziLogRow = PerazziLogBase & {
  prompt: string;
  response: string;
};

export type PerazziLogPreviewRow = PerazziLogBase & {
  prompt_preview: string;
  response_preview: string;
  prompt_len: number;
  response_len: number;
  archetype_confidence?: number | null;
};

export type RagSummary = {
  avg_max_score: number | null;
  min_max_score: number | null;
  max_max_score: number | null;
  total: number;
  low_count: number;
  threshold: number;
};

export type TopChunkRow = {
  chunk_id: string;
  hits: number;
};

export type GuardrailStatRow = {
  guardrail_reason: string | null;
  env: string;
  hits: number;
};

export type GuardrailByArchetypeRow = {
  guardrail_reason: string | null;
  archetype: string | null;
  hits: number;
};

export type GuardrailLogRow = {
  id: string;
  created_at: string;
  env: string;
  archetype: string | null;
  session_id: string | null;
  prompt: string;
  response: string;
  guardrail_reason: string | null;
};

export type ArchetypeIntentRow = {
  archetype: string | null;
  intent: string | null;
  hits: number;
};

export type ArchetypeSummaryRow = {
  archetype: string | null;
  avg_max_score: number | null;
  guardrail_block_rate: number | null;
  low_confidence_rate: number | null;
  total: number;
};

export type DailyTokenUsageRow = {
  day: string;
  env: string;
  endpoint: string;
  model: string | null;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  request_count: number;
};

export type AvgMetricsRow = {
  env: string;
  endpoint: string;
  model: string | null;
  avg_prompt_tokens: number | null;
  avg_completion_tokens: number | null;
  avg_latency_ms: number | null;
  request_count: number;
};

export type QaFlagLookupRow = {
  interaction_id: string;
  id: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

export type QaFlagRow = {
  id: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

export type PgptLogDetail = PerazziLogRow & {
  prompt_tokens: number | null;
  completion_tokens: number | null;
  latency_ms: number | null;
  retrieved_chunks: unknown[];
  archetype_scores?: Record<string, number> | null;
  archetype_confidence?: number | null;
  archetype_decision?: unknown | null;
};

export type PgptLogDetailResponse = {
  log: PgptLogDetail;
  qa_latest: QaFlagRow | null;
  qa_history: QaFlagRow[];
};

export type DailyTrendsRow = {
  day: string; // date string
  request_count: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  avg_latency_ms: number | null;
};

export type DailyLowScoreRateRow = {
  day: string; // date string
  total_scored: number;
  low_count: number;
  threshold: number;
};

// -----------------------------------------------------------------------------
// Session Explorer (full rows + QA lookup)
// -----------------------------------------------------------------------------

export type PgptSessionLogRow = {
  id: string;
  created_at: string;
  env: string;
  endpoint: string;
  archetype: string | null;
  session_id: string | null;
  model: string | null;
  used_gateway: boolean | null;

  // Full content (Pass 1 keeps existing UI behavior)
  prompt: string;
  response: string;

  low_confidence: boolean | null;
  intents: string[] | null;
  topics: string[] | null;

  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;

  // Optional: attached by the page after a QA lookup query
  qa_flag_id?: string | null;
  qa_flag_status?: string | null;
  qa_flag_reason?: string | null;
  qa_flag_notes?: string | null;
  qa_flag_created_at?: string | null;
};

export type QaFlagLatestRow = {
  interaction_id: string;
  id: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

export type PgptSessionMeta = {
  session_id: string;
  interaction_count: number;
  started_at: string | null;
  ended_at: string | null;
  envs: string[];
  endpoints: string[];
  models: string[];
};

export type PgptSessionTimelineRow = {
  id: string;
  created_at: string;
  endpoint: string;
  archetype: string | null;
  archetype_confidence: number | null;
  archetype_scores: Record<string, number> | null;
};

// -----------------------------------------------------------------------------
// Session Summary (dashboard head)
// -----------------------------------------------------------------------------

export type PgptSessionSummary = {
  session_id: string;

  interaction_count: number;
  started_at: string | null;
  ended_at: string | null;

  assistant_count: number;

  blocked_count: number; // assistant-only
  scored_count: number; // assistant-only (maxScore present)
  low_score_count: number; // assistant-only (maxScore < threshold)

  open_qa_count: number; // latest-flag status == open (per interaction)

  top_archetype: string | null;
  top_model: string | null;
};
