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
  const ARCH_KEYS = new Set(["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"]);

  function parseFloat01(v: string | undefined | null): number | null {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  const qNorm = normalizeShortText(input.q, 500);
  const winner_changed = String((input as any).winner_changed ?? "").trim();
  const margin_lt = String((input as any).margin_lt ?? "").trim();
  const score_archetype = String((input as any).score_archetype ?? "").trim();
  const min = String((input as any).min ?? "").trim();

  const winnerChanged = winner_changed === "true";

  const marginLt = margin_lt ? parseFloat01(margin_lt) : null;

  const scoreArchetype = ARCH_KEYS.has(score_archetype) ? (score_archetype as any) : null;
  const scoreArchetypeMin = scoreArchetype && min ? parseFloat01(min) : null;

  return {
    envFilter: input.envFilter,
    endpointFilter: input.endpointFilter,
    daysFilter: input.daysFilter,
    q: qNorm ? qNorm : undefined,

    grStatus: parseGuardrailStatus(input.gr_status),
    grReason: normalizeShortText(input.gr_reason, 140) || undefined,

    lowConf: parseBoolFilter(input.low_conf),
    score: parseScorePreset(input.score),

    archetype: normalizeShortText(input.archetype, 60) || undefined,
    model: normalizeShortText(input.model, 120) || undefined,

    gateway: parseBoolFilter(input.gateway),
    qa: parseQaFilter(input.qa),

    rerank: parseBoolFilter((input as any).rerank),
    snapped: parseBoolFilter((input as any).snapped),

    winnerChanged,
    marginLt,
    scoreArchetype,
    scoreArchetypeMin,
  };
}

type LogsQueryParts = {
  joinSql: string;
  whereClause: string;
  values: Array<string | number | boolean>;
  nextIndex: number;
};

function buildLogsQueryPartsInternal(args: {
  filters: LogsFilters;
  conditions: string[];
  values: Array<string | number | boolean>;
  idx: number;
}): LogsQueryParts {
  const { filters } = args;
  const conditions = args.conditions;
  const values = args.values;
  let idx = args.idx;

  // Base/global
  if (filters.envFilter) {
    conditions.push(`l.env = $${idx++}`);
    values.push(filters.envFilter);
  }

  if (filters.endpointFilter) {
    conditions.push(`l.endpoint = $${idx++}`);
    values.push(filters.endpointFilter);
  }

  if (filters.daysFilter) {
    conditions.push(`l.created_at >= now() - ($${idx++} || ' days')::interval`);
    values.push(filters.daysFilter);
  }

  // Search over FULL prompt/response, but select previews
  if (filters.q && filters.q.trim().length > 0) {
    conditions.push(`(l.prompt ILIKE $${idx} OR l.response ILIKE $${idx})`);
    values.push(`%${filters.q.trim()}%`);
    idx += 1;
  }

  // Guardrails
  if (filters.grStatus === "blocked") {
    conditions.push(`l.metadata->>'guardrailStatus' = 'blocked'`);
  } else if (filters.grStatus === "not_blocked") {
    conditions.push(`(l.metadata->>'guardrailStatus' is null OR l.metadata->>'guardrailStatus' <> 'blocked')`);
  }

  if (filters.grReason) {
    conditions.push(`l.metadata->>'guardrailReason' = $${idx++}`);
    values.push(filters.grReason);
  }

  // Confidence
  if (filters.lowConf === "true") {
    conditions.push(`l.low_confidence = true`);
  } else if (filters.lowConf === "false") {
    conditions.push(`coalesce(l.low_confidence, false) = false`);
  }

  // maxScore presets
  if (filters.score !== "any") {
    conditions.push(`l.metadata->>'maxScore' is not null`);
    if (filters.score === "lt0.25") {
      conditions.push(`(l.metadata->>'maxScore')::float < 0.25`);
    } else if (filters.score === "lt0.5") {
      conditions.push(`(l.metadata->>'maxScore')::float < 0.5`);
    } else if (filters.score === "0.25-0.5") {
      conditions.push(`(l.metadata->>'maxScore')::float >= 0.25 and (l.metadata->>'maxScore')::float < 0.5`);
    } else if (filters.score === "0.5-0.75") {
      conditions.push(`(l.metadata->>'maxScore')::float >= 0.5 and (l.metadata->>'maxScore')::float < 0.75`);
    } else if (filters.score === "gte0.75") {
      conditions.push(`(l.metadata->>'maxScore')::float >= 0.75`);
    }
  }

  // Archetype / model
  if (filters.archetype) {
    conditions.push(`l.archetype = $${idx++}`);
    values.push(filters.archetype);
  }

  if (filters.model) {
    conditions.push(`l.model = $${idx++}`);
    values.push(filters.model);
  }

  // Gateway
  if (filters.gateway === "true") {
    conditions.push(`l.used_gateway = true`);
  } else if (filters.gateway === "false") {
    conditions.push(`coalesce(l.used_gateway, false) = false`);
  }

  // QA (requires join alias qf)
  if (filters.qa === "open") {
    conditions.push(`qf.qa_flag_id is not null and qf.qa_flag_status = 'open'`);
  } else if (filters.qa === "resolved") {
    conditions.push(`qf.qa_flag_id is not null and qf.qa_flag_status <> 'open'`);
  } else if (filters.qa === "none") {
    conditions.push(`qf.qa_flag_id is null`);
  }

  if (filters.rerank === "true") {
    conditions.push(`coalesce((l.metadata->>'rerankEnabled')::boolean, false) = true`);
  } else if (filters.rerank === "false") {
    conditions.push(`coalesce((l.metadata->>'rerankEnabled')::boolean, false) = false`);
  }

  if (filters.snapped === "true") {
    conditions.push(`coalesce((l.metadata->>'archetypeSnapped')::boolean, false) = true`);
  } else if (filters.snapped === "false") {
    conditions.push(`coalesce((l.metadata->>'archetypeSnapped')::boolean, false) = false`);
  }

  if (filters.marginLt !== null && filters.marginLt !== undefined) {
    conditions.push(
      `coalesce((l.metadata->>'archetypeConfidenceMargin')::float, (l.metadata->>'archetypeConfidence')::float) < $${idx++}`,
    );
    values.push(filters.marginLt);
  }

  if (filters.scoreArchetype && filters.scoreArchetypeMin !== null && filters.scoreArchetypeMin !== undefined) {
    const key = filters.scoreArchetype; // safe enum
    conditions.push(`l.metadata->'archetypeScores' is not null`);
    conditions.push(`(l.metadata->'archetypeScores'->>'${key}')::float >= $${idx++}`);
    values.push(filters.scoreArchetypeMin);
  }

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

  if (filters.winnerChanged) {
    conditions.push(`l.session_id is not null`);
    conditions.push(`prev.prev_archetype is not null`);
    conditions.push(`prev.prev_archetype is distinct from l.archetype`);
  }

  const joinSql = joins.join("\n");

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

  return { joinSql, whereClause, values, nextIndex: idx };
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
  baseValues: Array<string | number | boolean>;
  startIndex: number;
}): LogsQueryParts {
  return buildLogsQueryPartsInternal({
    filters: args.filters,
    conditions: [...args.baseConditions],
    values: [...args.baseValues],
    idx: args.startIndex,
  });
}
