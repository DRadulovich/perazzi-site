import { NextResponse } from "next/server";

import { pool } from "../../../../../../lib/db";
import type { PgptLogDetailResponse, QaFlagRow } from "../../../../../../lib/pgpt-insights/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
    type LogRow = {
      id: string;
      created_at: string;
      env: string;
      endpoint: string;
      archetype: string | null;
      session_id: string | null;
      model: string | null;
      used_gateway: boolean | null;
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
        metadata->'archetypeDecision' as archetype_decision
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
      log: {
        id: String(r.id),
        created_at: String(r.created_at),
        env: String(r.env),
        endpoint: String(r.endpoint),
        archetype: r.archetype ?? null,
        session_id: r.session_id ?? null,
        model: r.model ?? null,
        used_gateway: r.used_gateway ?? null,
        prompt: r.prompt ?? "",
        response: r.response ?? "",
        low_confidence: r.low_confidence ?? null,
        intents: r.intents ?? null,
        topics: r.topics ?? null,
        max_score: r.max_score ?? null,
        guardrail_status: r.guardrail_status ?? null,
        guardrail_reason: r.guardrail_reason ?? null,
        prompt_tokens: r.prompt_tokens === null || r.prompt_tokens === undefined ? null : Number(r.prompt_tokens),
        completion_tokens: r.completion_tokens === null || r.completion_tokens === undefined ? null : Number(r.completion_tokens),
        latency_ms: r.latency_ms === null || r.latency_ms === undefined ? null : Number(r.latency_ms),
        retrieved_chunks: Array.isArray(r.retrieved_chunks) ? r.retrieved_chunks : [],
        archetype_scores: r.archetype_scores ?? null,
        archetype_confidence: r.archetype_confidence ?? null,
        archetype_decision: r.archetype_decision ?? null,
      },
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
