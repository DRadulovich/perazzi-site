import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";
import type { ReactNode } from "react";

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

  // Pass 3: QA flag fields (attached server-side after fetching)
  qa_flag_id?: string | null;
  qa_flag_status?: string | null;
  qa_flag_reason?: string | null;
  qa_flag_notes?: string | null;
  qa_flag_created_at?: string | null;
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

type QaFlagLookupRow = {
  interaction_id: string;
  id: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

const LOW_SCORE_THRESHOLD = 0.25;
const LOGS_PAGE_SIZE = 50;
const DEFAULT_DAYS_WINDOW = 30;

const UI_TIMEZONE = "America/Chicago";

const TS_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: UI_TIMEZONE,
  month: "short",
  day: "2-digit",
});

const TS_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: UI_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const QA_REASON_OPTIONS = [
  "hallucination",
  "bad_tone",
  "wrong_retrieval",
  "guardrail_false_positive",
  "guardrail_false_negative",
  "other",
] as const;

const CANONICAL_ARCHETYPE_ORDER = ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"] as const;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function barWidthPct(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return "0%";
  const pct = clamp01(value / max) * 100;
  return `${pct.toFixed(0)}%`;
}

function MiniBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const w = barWidthPct(value, max);

  return (
    <div className="relative h-6 w-full overflow-hidden rounded-md border border-border bg-background">
      {/* background fill */}
      <div
        className="absolute inset-y-0 left-0 bg-muted/70"
        style={{ width: w }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-background/30" aria-hidden="true" />
      {/* foreground number */}
      <div className="relative z-10 flex h-6 items-center justify-end px-2 tabular-nums">
        <span className="text-foreground">{value}</span>
        {label ? <span className="ml-1 text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}

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

function truncate(text: string, length = 200) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function oneLine(text: string): string {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Minimal Markdown renderer (safe, server-side) ---
function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  return trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("mailto:");
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns: Array<{ type: "link" | "code" | "bold" | "italic"; re: RegExp }> = [
    { type: "link", re: /\[([^\]]+)\]\(([^)]+)\)/ },
    { type: "code", re: /`([^`]+)`/ },
    { type: "bold", re: /\*\*([^*]+)\*\*/ },
    { type: "italic", re: /_([^_]+)_/ },
  ];

  while (remaining.length > 0) {
    let earliest:
      | {
          type: "link" | "code" | "bold" | "italic";
          match: RegExpMatchArray;
          index: number;
        }
      | null = null;

    for (const p of patterns) {
      const m = remaining.match(p.re);
      if (!m || m.index === undefined) continue;
      if (!earliest || m.index < earliest.index) earliest = { type: p.type, match: m, index: m.index };
    }

    if (!earliest) {
      out.push(remaining);
      break;
    }

    if (earliest.index > 0) out.push(remaining.slice(0, earliest.index));

    const full = earliest.match[0] ?? "";

    if (earliest.type === "link") {
      const label = earliest.match[1] ?? "";
      const href = earliest.match[2] ?? "";
      if (isSafeHref(href)) {
        out.push(
          <a
            key={`md-link-${key++}`}
            href={href}
            className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
          >
            {label}
          </a>,
        );
      } else {
        out.push(label);
      }
    } else if (earliest.type === "code") {
      const code = earliest.match[1] ?? "";
      out.push(
        <code
          key={`md-code-${key++}`}
          className="rounded border border-border bg-muted/30 px-1 py-0.5 font-mono text-[11px] text-foreground"
        >
          {code}
        </code>,
      );
    } else if (earliest.type === "bold") {
      const content = earliest.match[1] ?? "";
      out.push(
        <strong key={`md-bold-${key++}`} className="font-semibold text-foreground">
          {content}
        </strong>,
      );
    } else if (earliest.type === "italic") {
      const content = earliest.match[1] ?? "";
      out.push(
        <em key={`md-italic-${key++}`} className="italic text-foreground">
          {content}
        </em>,
      );
    }

    remaining = remaining.slice(earliest.index + full.length);
  }

  const withBreaks: ReactNode[] = [];
  for (const node of out) {
    if (typeof node !== "string") {
      withBreaks.push(node);
      continue;
    }

    const parts = node.split("\n");
    parts.forEach((part, idx) => {
      if (part) withBreaks.push(part);
      if (idx < parts.length - 1) withBreaks.push(<br key={`md-br-${key++}`} />);
    });
  }

  return withBreaks;
}

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string | null; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const src = String(markdown ?? "").replace(/\r\n/g, "\n");
  const lines = src.split("\n");

  const blocks: MarkdownBlock[] = [];
  let para: string[] = [];

  let inFence = false;
  let fenceLang: string | null = null;
  let fenceLines: string[] = [];

  const flushPara = () => {
    const text = para.join("\n").trim();
    if (text) blocks.push({ type: "paragraph", text });
    para = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    const fenceMatch = line.match(/^```\s*(\w+)?\s*$/);
    if (fenceMatch) {
      if (!inFence) {
        flushPara();
        inFence = true;
        fenceLang = fenceMatch[1] ?? null;
        fenceLines = [];
      } else {
        blocks.push({ type: "code", lang: fenceLang, code: fenceLines.join("\n") });
        inFence = false;
        fenceLang = null;
        fenceLines = [];
      }
      i += 1;
      continue;
    }

    if (inFence) {
      fenceLines.push(line);
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushPara();
      const level = Math.min(6, headingMatch[1]?.length ?? 1);
      blocks.push({ type: "heading", level, text: headingMatch[2] ?? "" });
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push(String(lines[i]).replace(/^\s*[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push(String(lines[i]).replace(/^\s*\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (line.trim() === "") {
      flushPara();
      i += 1;
      continue;
    }

    para.push(line);
    i += 1;
  }

  if (inFence) {
    blocks.push({ type: "code", lang: fenceLang, code: fenceLines.join("\n") });
  }

  flushPara();
  return blocks;
}

function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) {
    return <div className="text-muted-foreground">(empty)</div>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          const base =
            b.level <= 2
              ? "text-sm font-semibold"
              : b.level === 3
                ? "text-xs font-semibold"
                : "text-xs font-medium";

          return (
            <div key={`md-h-${idx}`} className={`${base} text-foreground`}>
              {renderInlineMarkdown(b.text)}
            </div>
          );
        }

        if (b.type === "code") {
          return (
            <pre
              key={`md-codeblock-${idx}`}
              className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-snug text-foreground"
            >
              <code className="font-mono">{b.code}</code>
            </pre>
          );
        }

        if (b.type === "ul") {
          return (
            <ul key={`md-ul-${idx}`} className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it, j) => (
                <li key={`md-ul-${idx}-${j}`}>{renderInlineMarkdown(it)}</li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={`md-ol-${idx}`} className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it, j) => (
                <li key={`md-ol-${idx}-${j}`}>{renderInlineMarkdown(it)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`md-p-${idx}`} className="text-xs leading-relaxed text-foreground">
            {renderInlineMarkdown(b.text)}
          </p>
        );
      })}
    </div>
  );
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

function formatTimestampShort(value: string): string {
  const raw = String(value ?? "");
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return raw;
  return `${TS_DATE.format(d)} · ${TS_TIME.format(d)}`;
}

function parseScore(score: string | null): number | null {
  if (!score) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function archetypeOrderIndex(archetype: string | null): number {
  if (!archetype) return CANONICAL_ARCHETYPE_ORDER.length;
  const idx = CANONICAL_ARCHETYPE_ORDER.indexOf(archetype as (typeof CANONICAL_ARCHETYPE_ORDER)[number]);
  return idx === -1 ? CANONICAL_ARCHETYPE_ORDER.length : idx;
}

function logRowToneClass(log: PerazziLogRow): string {
  // Priority:
  // 1) guardrail blocked
  // 2) low confidence
  // 3) low maxScore (assistant)
  if (log.guardrail_status === "blocked") return "border-l-4 border-red-500/50 bg-red-500/5";
  if (log.low_confidence === true) return "border-l-4 border-amber-500/50 bg-amber-500/5";

  const s = parseScore(log.max_score);
  if (log.endpoint === "assistant" && s !== null && s < LOW_SCORE_THRESHOLD)
    return "border-l-4 border-yellow-500/50 bg-yellow-500/5";

  return "border-l-4 border-transparent";
}

function buildInsightsHref(params: {
  env?: string;
  endpoint?: string;
  days?: string;
  q?: string;
  page?: string;
  density?: string;
  view?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.env) sp.set("env", params.env);
  if (params.endpoint) sp.set("endpoint", params.endpoint);
  if (params.days) sp.set("days", params.days);
  if (params.q) sp.set("q", params.q);
  if (params.page) sp.set("page", params.page);
  if (params.density) sp.set("density", params.density);
  if (params.view) sp.set("view", params.view);

  const qs = sp.toString();
  return qs ? `/admin/pgpt-insights?${qs}` : "/admin/pgpt-insights";
}

async function fetchQaFlagsForInteractions(interactionIds: string[]): Promise<Map<string, QaFlagLookupRow>> {
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

// --- Windowed comparison helpers for Top Issues strip ---
async function fetchGuardrailBlockedCountWindow(
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

async function fetchAvgLatencyMsWindow(
  envFilter: string | undefined,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number | null> {
  const conditions: string[] = [
    "endpoint in ('assistant', 'soul_journey')",
    "metadata->>'latencyMs' is not null",
  ];
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

async function fetchRagSummaryWindow(
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

function formatDeltaPct(delta: number): string {
  const arrow = delta >= 0 ? "↑" : "↓";
  return `${arrow} ${Math.abs(delta * 100).toFixed(0)}%`;
}

function formatDeltaMs(deltaMs: number): string {
  const arrow = deltaMs >= 0 ? "↑" : "↓";
  const abs = Math.abs(deltaMs);
  return `${arrow} ${Math.round(abs)}ms`;
}

export default async function PgptInsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    env?: string;
    endpoint?: string;
    days?: string;
    q?: string;
    page?: string;
    density?: string;
    view?: string;
  }>;
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
  const densityParam = resolvedSearchParams.density;
  const density = densityParam === "compact" ? "compact" : "comfortable";
  const isCompact = density === "compact";

  // Controls
  const tableDensityClass = isCompact ? "[&_td]:!py-1 [&_th]:!py-1" : "[&_td]:!py-2 [&_th]:!py-2";
  const detailsDefaultOpen = !isCompact;

  // Truncation
  const truncPrimary = isCompact ? 120 : 180;
  const truncSecondary = isCompact ? 120 : 140;

  const viewParam = resolvedSearchParams.view;
  const view = viewParam === "triage" ? "triage" : "full";
  const isTriageView = view === "triage";

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
    prevRagSummary,
    prevGuardrailBlockedCount,
    prevAvgLatencyMs,
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
    typeof daysFilter === "number"
      ? fetchRagSummaryWindow(envFilter, LOW_SCORE_THRESHOLD, daysFilter * 2, daysFilter)
      : Promise.resolve(null),
    typeof daysFilter === "number"
      ? fetchGuardrailBlockedCountWindow(envFilter, daysFilter * 2, daysFilter)
      : Promise.resolve(null),
    typeof daysFilter === "number" ? fetchAvgLatencyMsWindow(envFilter, daysFilter * 2, daysFilter) : Promise.resolve(null),
  ]);

  // Pass 3: canonical archetype ordering (JS sort)
  const orderedArchetypeSummaries = [...archetypeSummaries].sort((a, b) => {
    const ai = archetypeOrderIndex(a.archetype);
    const bi = archetypeOrderIndex(b.archetype);
    if (ai !== bi) return ai - bi;
    return (b.total ?? 0) - (a.total ?? 0);
  });

  const orderedGuardrailByArchetype = [...guardrailByArchetype].sort((a, b) => {
    const ai = archetypeOrderIndex(a.archetype);
    const bi = archetypeOrderIndex(b.archetype);
    if (ai !== bi) return ai - bi;
    if (b.hits !== a.hits) return b.hits - a.hits;
    return String(a.guardrail_reason ?? "").localeCompare(String(b.guardrail_reason ?? ""));
  });

  const orderedArchetypeIntentStats = [...archetypeIntentStats].sort((a, b) => {
    const ai = archetypeOrderIndex(a.archetype);
    const bi = archetypeOrderIndex(b.archetype);
    if (ai !== bi) return ai - bi;
    return b.hits - a.hits;
  });

  const hasNextPage = logsMaybeMore.length > LOGS_PAGE_SIZE;
  const logs = logsMaybeMore.slice(0, LOGS_PAGE_SIZE);

  // Pass 3: attach QA state to current page of logs (single query, no N+1)
  const qaFlagMap = await fetchQaFlagsForInteractions(logs.map((l) => l.id));
  const logsWithQa: PerazziLogRow[] = logs.map((log) => {
    const flag = qaFlagMap.get(log.id);
    return {
      ...log,
      qa_flag_id: flag?.id ?? null,
      qa_flag_status: flag?.status ?? null,
      qa_flag_reason: flag?.reason ?? null,
      qa_flag_notes: flag?.notes ?? null,
      qa_flag_created_at: flag?.created_at ?? null,
    };
  });

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

  const currentHref = buildInsightsHref({
    env: resolvedSearchParams.env,
    endpoint: resolvedSearchParams.endpoint,
    days: resolvedSearchParams.days,
    q: q.length ? q : undefined,
    page: String(page),
    density: resolvedSearchParams.density,
    view: resolvedSearchParams.view,
  });

  // --- Top Issues computation ---
  const comparisonEnabled = typeof daysFilter === "number" && Number.isFinite(daysFilter) && daysFilter > 0;

  const currentLowScoreRate = ragSummary && ragSummary.total > 0 ? ragSummary.low_count / ragSummary.total : null;
  const prevLowScoreRate = prevRagSummary && prevRagSummary.total > 0 ? prevRagSummary.low_count / prevRagSummary.total : null;

  const guardrailDeltaPct =
    comparisonEnabled && typeof prevGuardrailBlockedCount === "number" && prevGuardrailBlockedCount > 0
      ? (guardrailBlockedCount - prevGuardrailBlockedCount) / prevGuardrailBlockedCount
      : null;

  const latencyDeltaMs =
    comparisonEnabled && typeof prevAvgLatencyMs === "number" && prevAvgLatencyMs !== null && avgLatencyMs !== null
      ? avgLatencyMs - prevAvgLatencyMs
      : null;

  const lowScoreDelta =
    comparisonEnabled && currentLowScoreRate !== null && prevLowScoreRate !== null ? currentLowScoreRate - prevLowScoreRate : null;

  type TopIssue = {
    key: string;
    title: string;
    detail: string;
    href: string;
    tone: string;
  };

  const topIssues: TopIssue[] = [];

  if (comparisonEnabled) {
    // Guardrails
    if (guardrailBlockedCount > 0) {
      const pct = guardrailDeltaPct;
      const deltaLabel =
        pct === null
          ? `${guardrailBlockedCount} in window`
          : `${formatDeltaPct(pct)} vs prior ${daysFilter}d`;

      const tone =
        pct !== null && pct >= 0.25 && guardrailBlockedCount >= 5
          ? "border-l-4 border-red-500/50 bg-red-500/5"
          : "border-l-4 border-amber-500/50 bg-amber-500/5";

      topIssues.push({
        key: "guardrails",
        title: "Guardrail blocks",
        detail: deltaLabel,
        href: `${currentHref}#guardrails`,
        tone,
      });
    }

    // Latency
    if (avgLatencyMs !== null && prevAvgLatencyMs !== null && latencyDeltaMs !== null) {
      const tone = latencyDeltaMs >= 150 ? "border-l-4 border-amber-500/50 bg-amber-500/5" : "border-l-4 border-border";
      const detail = `${formatDeltaMs(latencyDeltaMs)} vs prior ${daysFilter}d (now ~${Math.round(avgLatencyMs)}ms)`;
      topIssues.push({
        key: "latency",
        title: "Avg latency",
        detail,
        href: `${currentHref}#metrics`,
        tone,
      });
    }

    // Low-score retrieval
    if (currentLowScoreRate !== null) {
      const ratePct = currentLowScoreRate * 100;
      const delta = lowScoreDelta;

      const needsAttention = ratePct >= 12 || (delta !== null && delta >= 0.05);
      const tone = needsAttention ? "border-l-4 border-yellow-500/50 bg-yellow-500/5" : "border-l-4 border-border";

      const detail =
        delta === null
          ? `${ratePct.toFixed(1)}% below ${LOW_SCORE_THRESHOLD}`
          : `${ratePct.toFixed(1)}% below ${LOW_SCORE_THRESHOLD} (${delta >= 0 ? "↑" : "↓"} ${(Math.abs(delta) * 100).toFixed(1)}pp)`;

      topIssues.push({
        key: "rag",
        title: "Low-score retrieval",
        detail,
        href: `${currentHref}#rag`,
        tone,
      });
    }
  }

  const visibleTopIssues = topIssues.slice(0, 6);

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
          density: resolvedSearchParams.density,
          view: resolvedSearchParams.view,
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
          density: resolvedSearchParams.density,
          view: resolvedSearchParams.view,
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
                className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
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
                className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
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
                className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="7">last 7 days</option>
                <option value="30">last 30 days</option>
                <option value="90">last 90 days</option>
                <option value="all">all time</option>
              </select>
            </label>

            <label className="text-sm">
              Density:
              <select
                name="density"
                defaultValue={resolvedSearchParams.density ?? "comfortable"}
                className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="comfortable">comfortable</option>
                <option value="compact">compact</option>
              </select>
            </label>

            <label className="text-sm">
              View:
              <select
                name="view"
                defaultValue={resolvedSearchParams.view ?? "full"}
                className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="full">full</option>
                <option value="triage">triage</option>
              </select>
            </label>

            <label className="text-sm">
              Search logs:
              <input
                name="q"
                defaultValue={resolvedSearchParams.q ?? ""}
                placeholder="Search prompts/responses…"
                className="ml-2 h-9 w-[320px] max-w-full rounded-md border bg-background px-3 text-sm"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-xs font-medium text-background"
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
              <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(totalRequests)}</div>
              <div className="mt-1 text-xs text-muted-foreground">in window</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tokens</div>
              <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(totalTokens)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {avgTokensPerRequest === null ? "—" : `~${Math.round(avgTokensPerRequest)} / req`}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg latency</div>
              <div className="mt-1 text-base font-semibold tabular-nums">{formatDurationMs(avgLatencyMs)}</div>
              <div className="mt-1 text-xs text-muted-foreground">weighted</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Retrieval avg</div>
              <div className="mt-1 text-base font-semibold tabular-nums">
                {ragSummary ? formatScore(ragSummary.avg_max_score) : "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">assistant maxScore</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Low-score</div>
              <div className="mt-1 text-base font-semibold tabular-nums">
                {ragSummary ? formatCompactNumber(ragSummary.low_count) : "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{`< ${LOW_SCORE_THRESHOLD}`}</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Guardrail blocks</div>
              <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(guardrailBlockedCount)}</div>
              <div className="mt-1 text-xs text-muted-foreground">assistant</div>
            </div>
          </div>
        </section>

        {!isTriageView ? (
          <section id="top-issues" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">Top Issues</h2>
                <p className="text-xs text-muted-foreground">What to look at first (compared to the prior window).</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {comparisonEnabled && typeof daysFilter === "number" ? `last ${daysFilter}d vs prior ${daysFilter}d` : "comparison unavailable"}
              </p>
            </div>

            {!comparisonEnabled ? (
              <p className="text-xs text-muted-foreground">
                Set a bounded time window (e.g. 7/30/90 days) to see deltas vs the previous window.
              </p>
            ) : visibleTopIssues.length === 0 ? (
              <p className="text-xs text-muted-foreground">No obvious regressions vs the previous window for the current scope.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTopIssues.map((issue) => (
                  <Link
                    key={issue.key}
                    href={issue.href}
                    className={`group rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/20 ${issue.tone}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">{issue.title}</div>
                        <div className="text-xs text-muted-foreground">{issue.detail}</div>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
          {/* Desktop left rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-2xl border border-border bg-card shadow-sm p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Sections</div>

              <div className="mt-3 flex flex-col gap-1 text-xs">
                {isTriageView ? (
                  <>
                    <a href="#overview" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Overview
                    </a>
                    <a href="#guardrails" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Guardrails
                    </a>
                    <a href="#logs" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Logs
                    </a>
                    <div className="my-2 border-t border-border" />
                    <Link href="/admin/pgpt-insights/qa" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      QA{qaCountLabel}
                    </Link>
                  </>
                ) : (
                  <>
                    <a href="#top-issues" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/30">
                      <span>Top Issues</span>
                      <span
                        className={`ml-auto inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide tabular-nums ${
                          !comparisonEnabled
                            ? "border-border text-muted-foreground"
                            : visibleTopIssues.length >= 3
                              ? "border-red-500/30 bg-red-500/10 text-red-700"
                              : visibleTopIssues.length >= 1
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                                : "border-border text-muted-foreground"
                        }`}
                      >
                        {comparisonEnabled ? `issues ${visibleTopIssues.length}` : "—"}
                      </span>
                    </a>

                    <a href="#rag" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/30">
                      <span>RAG</span>
                      <span className="ml-auto inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                        {ragSummary ? `avg ${formatScore(ragSummary.avg_max_score)}` : "avg —"}
                      </span>
                    </a>

                    <a href="#guardrails" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/30">
                      <span>Guardrails</span>
                      <span className="ml-auto inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                        {`blk ${formatCompactNumber(guardrailBlockedCount)}`}
                      </span>
                    </a>

                    <a href="#archetypes" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      Archetypes
                    </a>

                    <a href="#metrics" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/30">
                      <span>Metrics</span>
                      <span className="ml-auto inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                        {`lat ${formatDurationMs(avgLatencyMs)}`}
                      </span>
                    </a>

                    <a href="#logs" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/30">
                      <span>Logs</span>
                      <span className="ml-auto inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                        {`p ${page}`}
                      </span>
                    </a>

                    <div className="my-2 border-t border-border" />

                    <Link href="/admin/pgpt-insights/qa" className="rounded-md px-2 py-1 hover:bg-muted/30">
                      QA{qaCountLabel}
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Legend</div>

                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500/70" aria-hidden="true" />
                    <span>Guardrail blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500/70" aria-hidden="true" />
                    <span>Low confidence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500/70" aria-hidden="true" />
                    <span>Low maxScore (&lt; {LOW_SCORE_THRESHOLD})</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                Density: <span className="font-medium text-foreground">{density}</span>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-10">
            {/* Mobile nav + legend */}
            <div className="space-y-3 lg:hidden">
              <nav className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {isTriageView ? (
                  <>
                    <a href="#overview" className="underline underline-offset-4 hover:text-foreground">
                      Overview
                    </a>
                    <a href="#guardrails" className="underline underline-offset-4 hover:text-foreground">
                      Guardrails
                    </a>
                    <a href="#logs" className="underline underline-offset-4 hover:text-foreground">
                      Logs
                    </a>
                    <Link href="/admin/pgpt-insights/qa" className="underline underline-offset-4 hover:text-foreground">
                      QA{qaCountLabel}
                    </Link>
                  </>
                ) : (
                  <>
                    <a href="#top-issues" className="underline underline-offset-4 hover:text-foreground">
                      Top Issues
                    </a>
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
                  </>
                )}
              </nav>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500/70" aria-hidden="true" />
                  <span>Red = guardrail blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500/70" aria-hidden="true" />
                  <span>Amber = low confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500/70" aria-hidden="true" />
                  <span>Yellow = low maxScore (&lt; {LOW_SCORE_THRESHOLD})</span>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  Density: <span className="font-medium text-foreground">{density}</span>
                </div>
              </div>
            </div>

            {/* RAG */}
            {!isTriageView ? (
              <section id="rag" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
                <details open className="group">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-sm font-semibold tracking-wide text-foreground">RAG Health (assistant)</h2>
                        <p className="text-xs text-muted-foreground">Retrieval quality overview from assistant maxScore signals.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ragSummary ? (
                          <>
                            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                              avg {formatScore(ragSummary.avg_max_score)}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                              low {formatCompactNumber(ragSummary.low_count)}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                            no data
                          </span>
                        )}
                        <Chevron />
                      </div>
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
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className={`w-full min-w-[1200px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                            <colgroup>
                              <col className="w-[220px]" />
                              <col className="w-[100px]" />
                              <col className="w-[220px]" />
                              <col className="w-[320px]" />
                              <col className="w-[360px]" />
                              <col className="w-[120px]" />
                            </colgroup>
                            <thead>
                              <tr>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  created_at
                                </th>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  env
                                </th>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  session_id
                                </th>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  prompt
                                </th>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  response
                                </th>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                                  maxScore
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {lowScoreLogs.map((log) => (
                                <tr key={`low-${log.id}`}>
                                  <td className="px-3 py-2 whitespace-normal break-words leading-snug">
                                    <span title={String(log.created_at)} className="tabular-nums">
                                      {formatTimestampShort(String(log.created_at))}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">{log.env}</td>
                                  <td className="px-3 py-2">
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
                                  <td className="px-3 py-2 align-top">
                                    <details className="group" open={detailsDefaultOpen}>
                                      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                        <div className="break-words text-xs leading-snug text-foreground">{truncate(log.prompt ?? "", truncSecondary)}</div>
                                        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                                      </summary>
                                      <pre className="mt-2 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">{log.prompt ?? ""}</pre>
                                    </details>
                                  </td>
                                  <td className="px-3 py-2 align-top">
                                    <details className="group" open={detailsDefaultOpen}>
                                      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                        <div className="break-words text-xs leading-snug text-foreground">{truncate(log.response ?? "", truncSecondary)}</div>
                                        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                                      </summary>
                                      <div className="max-h-[360px] overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground">
                                        <MarkdownView markdown={log.response ?? ""} />
                                      </div>
                                    </details>
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">{log.max_score ?? ""}</td>
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
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className={`w-full min-w-[720px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                            <colgroup>
                              <col className="w-[560px]" />
                              <col className="w-[140px]" />
                            </colgroup>
                            <thead>
                              <tr>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">chunk_id</th>
                                <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {(() => {
                                const maxHits = Math.max(...topChunks.map((c) => c.hits), 1);
                                return topChunks.map((chunk) => (
                                  <tr key={chunk.chunk_id}>
                                    <td className="px-3 py-2 break-words">{chunk.chunk_id}</td>
                                    <td className="px-3 py-2">
                                      <MiniBar value={chunk.hits} max={maxHits} />
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              </section>
            ) : null}

        {/* Guardrails */}
        <section id="guardrails" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
          <details open className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">Guardrail Analytics (assistant)</h2>
                  <p className="text-xs text-muted-foreground">Block reasons, environments, and archetypes.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                    blocked {formatCompactNumber(guardrailBlockedCount)}
                  </span>
                  <Chevron />
                </div>
              </div>
            </summary>

            <div className="mt-4 space-y-3">
              {guardrailStats.length === 0 &&
              orderedGuardrailByArchetype.length === 0 &&
              recentGuardrailBlocks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No guardrail blocks for the current filters.</p>
              ) : (
                <>
                  {guardrailStats.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold">Guardrail hits by reason and env</h3>
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className={`w-full min-w-[720px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                          <colgroup>
                            <col className="w-[420px]" />
                            <col className="w-[140px]" />
                            <col className="w-[140px]" />
                          </colgroup>
                          <thead>
                            <tr>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">reason</th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">env</th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {(() => {
                              const maxHits = Math.max(...guardrailStats.map((r) => r.hits), 1);
                              return guardrailStats.map((row, idx) => (
                                <tr key={`${row.guardrail_reason ?? "none"}-${row.env}-${idx}`}>
                                  <td className="px-3 py-2 break-words">{row.guardrail_reason ?? "(none)"}</td>
                                  <td className="px-3 py-2">{row.env}</td>
                                  <td className="px-3 py-2">
                                    <MiniBar value={row.hits} max={maxHits} />
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {recentGuardrailBlocks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold">Recent guardrail blocks</h3>
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className={`w-full min-w-[1400px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                          <colgroup>
                            <col className="w-[220px]" />
                            <col className="w-[100px]" />
                            <col className="w-[220px]" />
                            <col className="w-[200px]" />
                            <col className="w-[320px]" />
                            <col className="w-[360px]" />
                          </colgroup>
                          <thead>
                            <tr>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                created_at
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                env
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                session_id
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                reason
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                prompt
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                response
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {recentGuardrailBlocks.map((log) => (
                              <tr key={`guardrail-${log.id}`} className="border-l-4 border-red-500/50 bg-red-500/5">
                                <td className="px-3 py-2 whitespace-normal break-words leading-snug">
                                  <span title={String(log.created_at)} className="tabular-nums">
                                    {formatTimestampShort(String(log.created_at))}
                                  </span>
                                </td>
                                <td className="px-3 py-2">{log.env}</td>
                                <td className="px-3 py-2">
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
                                <td className="px-3 py-2">{log.guardrail_reason ?? "(none)"}</td>
                                <td className="px-3 py-2 align-top">
                                  <details className="group" open={detailsDefaultOpen}>
                                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                      <div className="break-words text-xs leading-snug text-foreground">{truncate(log.prompt ?? "", truncSecondary)}</div>
                                      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                                    </summary>
                                    <pre className="mt-2 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">{log.prompt ?? ""}</pre>
                                  </details>
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <details className="group" open={detailsDefaultOpen}>
                                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                      <div className="break-words text-xs leading-snug text-foreground">{truncate(log.response ?? "", truncSecondary)}</div>
                                      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                                    </summary>
                                    <pre className="mt-2 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">{log.response ?? ""}</pre>
                                  </details>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {orderedGuardrailByArchetype.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold">Guardrail hits by reason and archetype</h3>
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className={`w-full min-w-[820px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                          <colgroup>
                            <col className="w-[420px]" />
                            <col className="w-[220px]" />
                            <col className="w-[140px]" />
                          </colgroup>
                          <thead>
                            <tr>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">reason</th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">archetype</th>
                              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {(() => {
                              const maxHits = Math.max(...orderedGuardrailByArchetype.map((r) => r.hits), 1);
                              return orderedGuardrailByArchetype.map((row, idx) => (
                                <tr key={`${row.guardrail_reason ?? "none"}-${row.archetype ?? "unknown"}-${idx}`}>
                                  <td className="px-3 py-2 break-words">{row.guardrail_reason ?? "(none)"}</td>
                                  <td className="px-3 py-2">{row.archetype ?? "(unknown)"}</td>
                                  <td className="px-3 py-2">
                                    <MiniBar value={row.hits} max={maxHits} />
                                  </td>
                                </tr>
                              ));
                            })()}
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
        {!isTriageView ? (
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
                {orderedArchetypeIntentStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No archetype/intent data for the current filters.</p>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Interactions by archetype and intent</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className={`w-full min-w-[760px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                        <colgroup>
                          <col className="w-[220px]" />
                          <col className="w-[400px]" />
                          <col className="w-[140px]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">archetype</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">intent</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {(() => {
                            const maxHits = Math.max(...orderedArchetypeIntentStats.map((r) => r.hits), 1);
                            return orderedArchetypeIntentStats.map((row, idx) => (
                              <tr key={`${row.archetype ?? "unknown"}-${row.intent ?? "none"}-${idx}`}>
                                <td className="px-3 py-2">{row.archetype ?? "(unknown)"}</td>
                                <td className="px-3 py-2 break-words">{row.intent ?? "(none)"}</td>
                                <td className="px-3 py-2">
                                  <MiniBar value={row.hits} max={maxHits} />
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {orderedArchetypeSummaries.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Archetype summary metrics</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className={`w-full min-w-[980px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                        <colgroup>
                          <col className="w-[220px]" />
                          <col className="w-[160px]" />
                          <col className="w-[220px]" />
                          <col className="w-[220px]" />
                          <col className="w-[140px]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">archetype</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg maxScore</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">guardrail block rate</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">low-confidence rate</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {orderedArchetypeSummaries.map((row, idx) => (
                            <tr key={`${row.archetype ?? "unknown"}-${idx}`}>
                              <td className="px-3 py-2">{row.archetype ?? "(unknown)"}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{formatScore(row.avg_max_score)}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{formatRate(row.guardrail_block_rate)}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{formatRate(row.low_confidence_rate)}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.total}</td>
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
        ) : null}

        {/* Metrics */}
        {!isTriageView ? (
          <section id="metrics" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
            <details open className="group">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold tracking-wide text-foreground">Metrics (Tokens &amp; Latency)</h2>
                    <p className="text-xs text-muted-foreground">Cost and responsiveness signals.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                      latency {formatDurationMs(avgLatencyMs)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                      tokens {formatCompactNumber(totalTokens)}
                    </span>
                    <Chevron />
                  </div>
                </div>
              </summary>

              <div className="mt-4 space-y-3">
                {dailyTokenUsage.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No token usage data for the current filters.</p>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Daily token usage</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className={`w-full min-w-[1120px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                        <colgroup>
                          <col className="w-[160px]" />
                          <col className="w-[110px]" />
                          <col className="w-[160px]" />
                          <col className="w-[260px]" />
                          <col className="w-[170px]" />
                          <col className="w-[190px]" />
                          <col className="w-[140px]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">day</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">env</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">endpoint</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">model</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">prompt tokens</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">completion tokens</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">requests</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {dailyTokenUsage.map((row, idx) => (
                            <tr key={`${row.day}-${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                              <td className="px-3 py-2">{String(row.day)}</td>
                              <td className="px-3 py-2">{row.env}</td>
                              <td className="px-3 py-2">{row.endpoint}</td>
                              <td className="px-3 py-2">{row.model ?? "(unknown)"}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.total_prompt_tokens}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.total_completion_tokens}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.request_count}</td>
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
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className={`w-full min-w-[1120px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                        <colgroup>
                          <col className="w-[110px]" />
                          <col className="w-[160px]" />
                          <col className="w-[260px]" />
                          <col className="w-[190px]" />
                          <col className="w-[210px]" />
                          <col className="w-[190px]" />
                          <col className="w-[140px]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">env</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">endpoint</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">model</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg prompt tokens</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg completion tokens</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">avg latency (ms)</th>
                            <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur tabular-nums">requests</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {avgMetrics.map((row, idx) => (
                            <tr key={`${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                              <td className="px-3 py-2">{row.env}</td>
                              <td className="px-3 py-2">{row.endpoint}</td>
                              <td className="px-3 py-2">{row.model ?? "(unknown)"}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.avg_prompt_tokens === null ? "—" : row.avg_prompt_tokens.toFixed(1)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.avg_completion_tokens === null ? "—" : row.avg_completion_tokens.toFixed(1)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.avg_latency_ms === null ? "—" : Math.round(row.avg_latency_ms)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.request_count}</td>
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
        ) : null}

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
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                    page {page}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                    shown {formatCompactNumber(logsWithQa.length)}
                  </span>
                  {q ? (
                    <span
                      className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                      title={q}
                    >
                      search
                    </span>
                  ) : null}
                  <Chevron />
                </div>
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

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className={`w-full min-w-[1400px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                  <colgroup>
                    <col className="w-[200px]" />
                    <col className="w-[100px]" />
                    <col className="w-[130px]" />
                    <col className="w-[220px]" />
                    <col className="w-[900px]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                        created_at
                      </th>
                      <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                        env
                      </th>
                      <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                        endpoint
                      </th>
                      <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                        session_id
                      </th>
                      <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                        triage
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {logsWithQa.map((log) => {
                      const tone = logRowToneClass(log);

                      const hover = "hover:bg-muted/30";
                      const rowClassName = [tone, hover].filter(Boolean).join(" ");

                      const viewHref = log.qa_flag_id
                        ? `/admin/pgpt-insights/qa#flag-${log.qa_flag_id}`
                        : "/admin/pgpt-insights/qa";

                      return (
                        <tr key={log.id} className={rowClassName}>
                          <td className="px-3 py-2 whitespace-normal break-words leading-snug">
                            <span title={String(log.created_at)} className="tabular-nums">
                              {formatTimestampShort(String(log.created_at))}
                            </span>
                          </td>
                          <td className="px-3 py-2">{log.env}</td>
                          <td className="px-3 py-2">{log.endpoint}</td>
                          <td className="px-3 py-2">
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
                          <td className="px-3 py-2 align-top">
                            {(() => {
                              const prompt1 = oneLine(log.prompt ?? "");
                              const response1 = oneLine(log.response ?? "");

                              const intentCount = log.intents?.length ?? 0;
                              const topicCount = log.topics?.length ?? 0;

                              const scoreNum = parseScore(log.max_score);
                              const isLowScore = log.endpoint === "assistant" && scoreNum !== null && scoreNum < LOW_SCORE_THRESHOLD;

                              const isBlocked = log.guardrail_status === "blocked";
                              const isLowConfidence = log.low_confidence === true;

                              return (
                                <details className="group" open={detailsDefaultOpen}>
                                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                    <div className="space-y-2">
                                      <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">
                                          <span className="font-medium text-foreground">P:</span>{" "}
                                          <span className="break-words">{truncate(prompt1, truncPrimary)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          <span className="font-medium text-foreground">A:</span>{" "}
                                          <span className="break-words">{truncate(response1, truncPrimary)}</span>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        {log.archetype ? (
                                          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                            {log.archetype}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                            archetype —
                                          </span>
                                        )}

                                        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                                          intents {intentCount}
                                        </span>
                                        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                                          topics {topicCount}
                                        </span>

                                        {scoreNum !== null ? (
                                          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                                            score {scoreNum.toFixed(3)}
                                          </span>
                                        ) : null}

                                        {isBlocked ? (
                                          <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-700">
                                            blocked
                                          </span>
                                        ) : null}
                                        {isLowConfidence ? (
                                          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700">
                                            low conf
                                          </span>
                                        ) : null}
                                        {isLowScore ? (
                                          <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-yellow-700">
                                            low score
                                          </span>
                                        ) : null}

                                        {log.qa_flag_status === "open" ? (
                                          <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-700">
                                            QA open
                                          </span>
                                        ) : log.qa_flag_status === "resolved" ? (
                                          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                                            QA resolved
                                          </span>
                                        ) : null}

                                        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">
                                          expand
                                        </span>
                                      </div>
                                    </div>
                                  </summary>

                                  <div className="mt-3 space-y-3">
                                    <div className="grid gap-3 lg:grid-cols-2">
                                      <div className="space-y-2">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Prompt</div>
                                        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                                          {log.prompt ?? ""}
                                        </pre>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Response</div>
                                        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                                          {log.response ?? ""}
                                        </pre>
                                      </div>
                                    </div>

                                    <div className="rounded-lg border border-border bg-background p-3">
                                      {log.qa_flag_status === "open" ? (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-700">
                                              Open
                                            </span>
                                            <Link href={viewHref} className="text-[11px] text-blue-600 underline">
                                              View
                                            </Link>
                                          </div>
                                          {log.qa_flag_reason ? (
                                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                              {log.qa_flag_reason}
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          {log.qa_flag_status === "resolved" ? (
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                                                Resolved
                                              </span>
                                              <Link href={viewHref} className="text-[11px] text-blue-600 underline">
                                                View
                                              </Link>
                                            </div>
                                          ) : null}

                                          <form
                                            method="POST"
                                            action="/admin/pgpt-insights/qa/flag"
                                            className="flex flex-wrap items-center gap-1"
                                          >
                                            <input type="hidden" name="interactionId" value={log.id} />
                                            <input type="hidden" name="returnTo" value={currentHref} />

                                            <select
                                              name="reason"
                                              defaultValue="hallucination"
                                              className="h-8 rounded-md border bg-background px-2 text-[11px]"
                                            >
                                              {QA_REASON_OPTIONS.map((opt) => (
                                                <option key={opt} value={opt}>
                                                  {opt}
                                                </option>
                                              ))}
                                            </select>

                                            <input
                                              name="notes"
                                              placeholder="notes…"
                                              maxLength={200}
                                              className="h-8 w-[180px] rounded-md border bg-background px-2 text-[11px]"
                                            />

                                            <button
                                              type="submit"
                                              className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-[11px] text-muted-foreground hover:bg-muted"
                                            >
                                              {log.qa_flag_status === "resolved" ? "Flag again" : "Flag"}
                                            </button>
                                          </form>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </details>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}

                    {logsWithQa.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-3 text-center text-xs text-muted-foreground">
                          No results for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <div>
                  Showing <span className="font-medium text-foreground">{logsWithQa.length}</span> results on this page.
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

          </div>
        </div>
      </main>
    </div>
  );
}
