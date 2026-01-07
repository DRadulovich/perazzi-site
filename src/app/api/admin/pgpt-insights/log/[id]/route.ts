import { NextResponse } from "next/server";

import { pool } from "../../../../../../lib/db";
import type { PgptLogDetailResponse, QaFlagRow } from "../../../../../../lib/pgpt-insights/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const PROTOTYPE_POLLUTION_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isObjectWithSafeKey(value: unknown, key: string): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !PROTOTYPE_POLLUTION_KEYS.has(key) &&
    Object.prototype.hasOwnProperty.call(value, key)
  );
}

function readNestedValue(obj: unknown, path: string[]): unknown | null {
  let current: unknown = obj;
  for (const key of path) {
    if (!isObjectWithSafeKey(current, key)) return null;
    const descriptor = Object.getOwnPropertyDescriptor(current as Record<string, unknown>, key);
    if (!descriptor || descriptor.get || descriptor.set) return null;
    current = descriptor.value as unknown;
  }
  return current;
}

function readNestedNumber(obj: unknown, path: string[]): number | null {
  return toNumberOrNull(readNestedValue(obj, path));
}

function readNestedObject(obj: unknown, path: string[]): Record<string, unknown> | null {
  const value = readNestedValue(obj, path);
  if (value === null || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function toRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

type LogRow = {
  id: string;
  created_at: string;
  env: string;
  endpoint: string;
  archetype: string | null;
  session_id: string | null;
  model: string | null;
  used_gateway: boolean | null;
  metadata: unknown | null;
  page_url?: string | null;
  user_id?: string | null;
  mode?: string | null;
  prompt: string | null;
  response: string | null;
  low_confidence: boolean | null;
  intents: string[] | null;
  topics: string[] | null;
  prompt_tokens: string | number | null | undefined;
  completion_tokens: string | number | null | undefined;
  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;
  latency_ms: string | number | null | undefined;
  retrieved_chunks: unknown;
  archetype_scores: Record<string, number> | null;
  archetype_confidence: number | null;
  archetype_decision: unknown | null;
};

type TokenCounts = {
  promptTokens: number | null;
  completionTokens: number | null;
  cachedTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
};

function computeTokenCounts(row: LogRow): TokenCounts {
  const promptTokens = toNumberOrNull(row.prompt_tokens);
  const completionTokens = toNumberOrNull(row.completion_tokens);

  const metadataObj = toRecordOrNull(row.metadata);
  const responseUsage = readNestedObject(metadataObj, ["responseUsage"]);

  const cachedTokens =
    readNestedNumber(metadataObj, ["cachedTokens"]) ??
    readNestedNumber(responseUsage, ["input_tokens_details", "cached_tokens"]);
  const reasoningTokens =
    readNestedNumber(metadataObj, ["reasoningTokens"]) ??
    readNestedNumber(responseUsage, ["output_tokens_details", "reasoning_tokens"]);
  const totalTokens =
    readNestedNumber(metadataObj, ["totalTokens"]) ??
    readNestedNumber(responseUsage, ["total_tokens"]) ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null);

  return {
    promptTokens,
    completionTokens,
    cachedTokens,
    reasoningTokens,
    totalTokens,
  };
}

function normalizeLatencyMs(value: LogRow["latency_ms"]): number | null {
  return toNumberOrNull(value);
}

function normalizeRetrievedChunks(value: LogRow["retrieved_chunks"]): unknown[] {
  return Array.isArray(value) ? value : [];
}

function buildLogPayload(row: LogRow): PgptLogDetailResponse["log"] {
  const { promptTokens, completionTokens, cachedTokens, reasoningTokens, totalTokens } = computeTokenCounts(row);

  return {
    id: String(row.id),
    created_at: String(row.created_at),
    env: String(row.env),
    endpoint: String(row.endpoint),
    archetype: row.archetype ?? null,
    session_id: row.session_id ?? null,
    model: row.model ?? null,
    used_gateway: row.used_gateway ?? null,
    metadata: row.metadata ?? null,
    page_url: row.page_url ?? null,
    user_id: row.user_id ?? null,
    prompt: row.prompt ?? "",
    response: row.response ?? "",
    low_confidence: row.low_confidence ?? null,
    intents: row.intents ?? null,
    topics: row.topics ?? null,
    max_score: row.max_score ?? null,
    guardrail_status: row.guardrail_status ?? null,
    guardrail_reason: row.guardrail_reason ?? null,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    cached_tokens: cachedTokens,
    reasoning_tokens: reasoningTokens,
    total_tokens: totalTokens,
    latency_ms: normalizeLatencyMs(row.latency_ms),
    retrieved_chunks: normalizeRetrievedChunks(row.retrieved_chunks),
    archetype_scores: row.archetype_scores ?? null,
    archetype_confidence: row.archetype_confidence ?? null,
    archetype_decision: row.archetype_decision ?? null,
    mode: row.mode ?? null,
  };
}

export async function GET(
  _: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> },
) {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const params = await Promise.resolve(context.params);
  const id = params.id;

  if (!isUuidLike(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query<LogRow>(
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
        metadata,
        page_url,
        user_id,
        prompt,
        response,
        low_confidence,
        intents,
        topics,
        prompt_tokens,
        completion_tokens,
        metadata->>'maxScore' as max_score,
        metadata->>'guardrailStatus' as guardrail_status,
        metadata->>'guardrailReason' as guardrail_reason,
        (nullif(metadata->>'latencyMs',''))::float as latency_ms,
        coalesce(metadata->'retrievedChunks', '[]'::jsonb) as retrieved_chunks,
        metadata->'archetypeScores' as archetype_scores,
        (metadata->>'archetypeConfidence')::float as archetype_confidence,
        metadata->'archetypeDecision' as archetype_decision,
        metadata->>'mode' as mode
      from perazzi_conversation_logs
      where id = $1::uuid
      limit 1;
      `,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const r = rows[0];

    const { rows: qa_history } = await pool.query<QaFlagRow>(
      `
      select id, status, reason, notes, created_at
      from qa_flags
      where interaction_id = $1::uuid
      order by created_at desc;
      `,
      [id],
    );

    const { rows: qa_latest_rows } = await pool.query<QaFlagRow>(
      `
      select id, status, reason, notes, created_at
      from qa_flags
      where interaction_id = $1::uuid
      order by (status = 'open') desc, created_at desc
      limit 1;
      `,
      [id],
    );

    const qa_latest = qa_latest_rows[0] ?? null;

    const payload: PgptLogDetailResponse = {
      log: buildLogPayload(r),
      qa_latest,
      qa_history,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[pgpt-insights] detail route error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
