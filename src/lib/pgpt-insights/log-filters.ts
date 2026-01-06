import { appendDaysFilter } from "./query-helpers";

export type GuardrailStatusFilter = "any" | "blocked" | "not_blocked";
export type BoolFilter = "any" | "true" | "false";
export type ScorePreset = "any" | "lt0.25" | "lt0.5" | "0.25-0.5" | "0.5-0.75" | "gte0.75";
export type QaFilter = "any" | "open" | "resolved" | "none";

export type LogsFilters = {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  q?: string;

  grStatus: GuardrailStatusFilter;
  grReason?: string;

  lowConf: BoolFilter;
  score: ScorePreset;

  archetype?: string;
  model?: string;

  gateway: BoolFilter;
  qa: QaFilter;

  rerank: BoolFilter;
  snapped: BoolFilter;

  winnerChanged?: boolean;
  marginLt?: number | null;
  scoreArchetype?: "Loyalist" | "Prestige" | "Analyst" | "Achiever" | "Legacy" | null;
  scoreArchetypeMin?: number | null;
};

type ScoreArchetypeKey = NonNullable<LogsFilters["scoreArchetype"]>;

const SCORE_ARCHETYPE_KEYS = new Set<string>(["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"]);

function isScoreArchetype(value: string): value is ScoreArchetypeKey {
  return SCORE_ARCHETYPE_KEYS.has(value);
}

function normalizeShortText(value: unknown, maxLen: number): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function parseGuardrailStatus(v: unknown): GuardrailStatusFilter {
  const s = String(v ?? "");
  if (s === "blocked" || s === "not_blocked" || s === "any") return s;
  return "any";
}

function parseBoolFilter(v: unknown): BoolFilter {
  const s = String(v ?? "");
  if (s === "true" || s === "false" || s === "any") return s;
  return "any";
}

function parseScorePreset(v: unknown): ScorePreset {
  const s = String(v ?? "");
  if (s === "lt0.25" || s === "lt0.5" || s === "0.25-0.5" || s === "0.5-0.75" || s === "gte0.75" || s === "any") {
    return s;
  }
  return "any";
}

function parseQaFilter(v: unknown): QaFilter {
  const s = String(v ?? "");
  if (s === "open" || s === "resolved" || s === "none" || s === "any") return s;
  return "any";
}

function parseFloat01(v: string | undefined | null): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function parseLogsFilters(input: {
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
}): LogsFilters {
  const qNorm = normalizeShortText(input.q, 500);
  const winner_changed = String(input.winner_changed ?? "").trim();
  const margin_lt = String(input.margin_lt ?? "").trim();
  const score_archetype = String(input.score_archetype ?? "").trim();
  const min = String(input.min ?? "").trim();

  const winnerChanged = winner_changed === "true";

  const marginLt = margin_lt ? parseFloat01(margin_lt) : null;

  const scoreArchetype = isScoreArchetype(score_archetype) ? score_archetype : null;
  const scoreArchetypeMin = scoreArchetype && min ? parseFloat01(min) : null;

  return {
    envFilter: input.envFilter,
    endpointFilter: input.endpointFilter,
    daysFilter: input.daysFilter,
    q: qNorm || undefined,

    grStatus: parseGuardrailStatus(input.gr_status),
    grReason: normalizeShortText(input.gr_reason, 140) || undefined,

    lowConf: parseBoolFilter(input.low_conf),
    score: parseScorePreset(input.score),

    archetype: normalizeShortText(input.archetype, 60) || undefined,
    model: normalizeShortText(input.model, 120) || undefined,

    gateway: parseBoolFilter(input.gateway),
    qa: parseQaFilter(input.qa),

    rerank: parseBoolFilter(input.rerank),
    snapped: parseBoolFilter(input.snapped),

    winnerChanged,
    marginLt,
    scoreArchetype,
    scoreArchetypeMin,
  };
}

type LogsQueryValue = string | number | boolean;

type LogsQueryParts = {
  joinSql: string;
  whereClause: string;
  values: LogsQueryValue[];
  nextIndex: number;
};

type LogsQueryState = {
  conditions: string[];
  values: LogsQueryValue[];
  idx: number;
};

const GUARDRAIL_STATUS_CONDITIONS: Record<Exclude<GuardrailStatusFilter, "any">, string> = {
  blocked: `l.metadata->>'guardrailStatus' = 'blocked'`,
  not_blocked: `(l.metadata->>'guardrailStatus' is null OR l.metadata->>'guardrailStatus' <> 'blocked')`,
};

const SCORE_PRESET_CONDITIONS: Record<Exclude<ScorePreset, "any">, string> = {
  "lt0.25": `(l.metadata->>'maxScore')::float < 0.25`,
  "lt0.5": `(l.metadata->>'maxScore')::float < 0.5`,
  "0.25-0.5": `(l.metadata->>'maxScore')::float >= 0.25 and (l.metadata->>'maxScore')::float < 0.5`,
  "0.5-0.75": `(l.metadata->>'maxScore')::float >= 0.5 and (l.metadata->>'maxScore')::float < 0.75`,
  "gte0.75": `(l.metadata->>'maxScore')::float >= 0.75`,
};

const QA_CONDITIONS: Record<Exclude<QaFilter, "any">, string> = {
  open: `qf.qa_flag_id is not null and qf.qa_flag_status = 'open'`,
  resolved: `qf.qa_flag_id is not null and qf.qa_flag_status <> 'open'`,
  none: `qf.qa_flag_id is null`,
};

function addParamCondition(state: LogsQueryState, condition: string, value: LogsQueryValue): void {
  state.conditions.push(`${condition} $${state.idx++}`);
  state.values.push(value);
}

function addSearchFilter(state: LogsQueryState, q?: string): void {
  if (!q) return;
  const trimmed = q.trim();
  if (!trimmed) return;
  const token = `$${state.idx++}`;
  state.conditions.push(`(l.prompt ILIKE ${token} OR l.response ILIKE ${token})`);
  state.values.push(`%${trimmed}%`);
}

function addBooleanFilter(state: LogsQueryState, filter: BoolFilter, trueCondition: string, falseCondition: string): void {
  if (filter === "true") {
    state.conditions.push(trueCondition);
  } else if (filter === "false") {
    state.conditions.push(falseCondition);
  }
}

function addBaseFilters(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.envFilter) {
    addParamCondition(state, "l.env =", filters.envFilter);
  }

  if (filters.endpointFilter) {
    addParamCondition(state, "l.endpoint =", filters.endpointFilter);
  }

  state.idx = appendDaysFilter({
    conditions: state.conditions,
    params: state.values,
    idx: state.idx,
    days: filters.daysFilter,
    column: "l.created_at",
  });
}

function addGuardrailFilters(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.grStatus !== "any") {
    state.conditions.push(GUARDRAIL_STATUS_CONDITIONS[filters.grStatus]);
  }

  if (filters.grReason) {
    addParamCondition(state, "l.metadata->>'guardrailReason' =", filters.grReason);
  }
}

function addConfidenceFilters(state: LogsQueryState, filters: LogsFilters): void {
  addBooleanFilter(state, filters.lowConf, "l.low_confidence = true", "coalesce(l.low_confidence, false) = false");
}

function addScorePresetFilters(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.score !== "any") {
    state.conditions.push(`l.metadata->>'maxScore' is not null`, SCORE_PRESET_CONDITIONS[filters.score]);
  }
}

function addArchetypeModelFilters(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.archetype) {
    addParamCondition(state, "l.archetype =", filters.archetype);
  }

  if (filters.model) {
    addParamCondition(state, "l.model =", filters.model);
  }
}

function addGatewayFilter(state: LogsQueryState, filters: LogsFilters): void {
  addBooleanFilter(state, filters.gateway, "l.used_gateway = true", "coalesce(l.used_gateway, false) = false");
}

function addQaFilters(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.qa !== "any") {
    state.conditions.push(QA_CONDITIONS[filters.qa]);
  }
}

function addRerankFilter(state: LogsQueryState, filters: LogsFilters): void {
  addBooleanFilter(
    state,
    filters.rerank,
    "coalesce((l.metadata->>'rerankEnabled')::boolean, false) = true",
    "coalesce((l.metadata->>'rerankEnabled')::boolean, false) = false",
  );
}

function addSnappedFilter(state: LogsQueryState, filters: LogsFilters): void {
  addBooleanFilter(
    state,
    filters.snapped,
    "coalesce((l.metadata->>'archetypeSnapped')::boolean, false) = true",
    "coalesce((l.metadata->>'archetypeSnapped')::boolean, false) = false",
  );
}

function addMarginFilter(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.marginLt !== null && filters.marginLt !== undefined) {
    addParamCondition(
      state,
      "coalesce((l.metadata->>'archetypeConfidenceMargin')::float, (l.metadata->>'archetypeConfidence')::float) <",
      filters.marginLt,
    );
  }
}

function addScoreArchetypeFilter(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.scoreArchetype && filters.scoreArchetypeMin !== null && filters.scoreArchetypeMin !== undefined) {
    const key = filters.scoreArchetype;
    const scoreIndex = state.idx++;
    state.conditions.push(
      `l.metadata->'archetypeScores' is not null`,
      `(l.metadata->'archetypeScores'->>'${key}')::float >= $${scoreIndex}`,
    );
    state.values.push(filters.scoreArchetypeMin);
  }
}

function addWinnerChangedFilters(state: LogsQueryState, filters: LogsFilters): void {
  if (filters.winnerChanged) {
    state.conditions.push(
      `l.session_id is not null`,
      `prev.prev_archetype is not null`,
      `prev.prev_archetype is distinct from l.archetype`,
    );
  }
}

function buildJoinSql(filters: LogsFilters): string {
  const joins: string[] = [
    `
      left join lateral (
        select
          id::text as qa_flag_id,
          status as qa_flag_status,
          reason as qa_flag_reason,
          notes as qa_flag_notes,
          created_at as qa_flag_created_at
        from qa_flags
        where interaction_id = l.id
        order by (status = 'open') desc, created_at desc
        limit 1
      ) qf on true
    `,
  ];

  if (filters.winnerChanged) {
    joins.push(`
      left join lateral (
        select p.archetype as prev_archetype
        from perazzi_conversation_logs p
        where p.session_id = l.session_id
          and p.created_at < l.created_at
        order by p.created_at desc
        limit 1
      ) prev on true
    `);
  }

  return joins.join("\n");
}

function buildLogsQueryPartsInternal(args: {
  filters: LogsFilters;
  conditions: string[];
  values: LogsQueryValue[];
  idx: number;
}): LogsQueryParts {
  const state: LogsQueryState = {
    conditions: args.conditions,
    values: args.values,
    idx: args.idx,
  };

  addBaseFilters(state, args.filters);
  addSearchFilter(state, args.filters.q);
  addGuardrailFilters(state, args.filters);
  addConfidenceFilters(state, args.filters);
  addScorePresetFilters(state, args.filters);
  addArchetypeModelFilters(state, args.filters);
  addGatewayFilter(state, args.filters);
  addQaFilters(state, args.filters);
  addRerankFilter(state, args.filters);
  addSnappedFilter(state, args.filters);
  addMarginFilter(state, args.filters);
  addScoreArchetypeFilter(state, args.filters);
  addWinnerChangedFilters(state, args.filters);

  const joinSql = buildJoinSql(args.filters);
  const whereClause = state.conditions.length ? `where ${state.conditions.join(" and ")}` : "";

  return { joinSql, whereClause, values: state.values, nextIndex: state.idx };
}

export function buildLogsQueryParts(filters: LogsFilters): LogsQueryParts {
  return buildLogsQueryPartsInternal({ filters, conditions: [], values: [], idx: 1 });
}

/**
 * Pass 3: Same logic as buildLogsQueryParts, but allows “base conditions” (e.g. session_id = $1).
 * Caller controls startIndex so parameter numbering remains correct.
 */
export function buildLogsQueryPartsWithBase(args: {
  filters: LogsFilters;
  baseConditions: string[];
  baseValues: LogsQueryValue[];
  startIndex: number;
}): LogsQueryParts {
  return buildLogsQueryPartsInternal({
    filters: args.filters,
    conditions: [...args.baseConditions],
    values: [...args.baseValues],
    idx: args.startIndex,
  });
}
