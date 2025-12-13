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
}): LogsFilters {
  const qNorm = normalizeShortText(input.q, 500);

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
  };
}

export function buildLogsQueryParts(filters: LogsFilters): {
  joinSql: string;
  whereClause: string;
  values: Array<string | number | boolean>;
  nextIndex: number;
} {
  const conditions: string[] = [];
  const values: Array<string | number | boolean> = [];
  let idx = 1;

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

  if (filters.q && filters.q.trim().length > 0) {
    conditions.push(`(l.prompt ILIKE $${idx} OR l.response ILIKE $${idx})`);
    values.push(`%${filters.q.trim()}%`);
    idx += 1;
  }

  if (filters.grStatus === "blocked") {
    conditions.push(`l.metadata->>'guardrailStatus' = 'blocked'`);
  } else if (filters.grStatus === "not_blocked") {
    conditions.push(`(l.metadata->>'guardrailStatus' is null OR l.metadata->>'guardrailStatus' <> 'blocked')`);
  }

  if (filters.grReason) {
    conditions.push(`l.metadata->>'guardrailReason' = $${idx++}`);
    values.push(filters.grReason);
  }

  if (filters.lowConf === "true") {
    conditions.push(`l.low_confidence = true`);
  } else if (filters.lowConf === "false") {
    conditions.push(`coalesce(l.low_confidence, false) = false`);
  }

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

  if (filters.archetype) {
    conditions.push(`l.archetype = $${idx++}`);
    values.push(filters.archetype);
  }

  if (filters.model) {
    conditions.push(`l.model = $${idx++}`);
    values.push(filters.model);
  }

  if (filters.gateway === "true") {
    conditions.push(`l.used_gateway = true`);
  } else if (filters.gateway === "false") {
    conditions.push(`coalesce(l.used_gateway, false) = false`);
  }

  if (filters.qa === "open") {
    conditions.push(`qf.qa_flag_id is not null and qf.qa_flag_status = 'open'`);
  } else if (filters.qa === "resolved") {
    conditions.push(`qf.qa_flag_id is not null and qf.qa_flag_status <> 'open'`);
  } else if (filters.qa === "none") {
    conditions.push(`qf.qa_flag_id is null`);
  }

  const joinSql = `
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
  `;

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

  return { joinSql, whereClause, values, nextIndex: idx };
}
