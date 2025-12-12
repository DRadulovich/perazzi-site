import { Pool } from "pg";

export type AiInteractionContext = {
  env: string;
  endpoint: string;
  pageUrl?: string;
  archetype?: string | null;
  sessionId?: string | null;
  userId?: null;
  lowConfidence?: boolean;
  intents?: string[];
  topics?: string[];
  metadata?: Record<string, unknown>;
};

export type AiInteractionLogInput = {
  context: AiInteractionContext;
  model: string;
  usedGateway: boolean;
  prompt: string;
  response: string;
  promptTokens?: number;
  completionTokens?: number;
};

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  pool = new Pool({ connectionString, max: 3 });
  return pool;
}

export async function logAiInteraction(input: AiInteractionLogInput): Promise<void> {
  if (process.env.PERAZZI_AI_LOGGING_ENABLED !== "true") return;

  const clientPool = getPool();
  if (!clientPool) {
    console.error("logAiInteraction: DATABASE_URL is not set; skipping log.");
    return;
  }

  const {
    context: {
      env,
      endpoint,
      pageUrl,
      archetype,
      sessionId,
      userId,
      lowConfidence,
      intents,
      topics,
      metadata,
    },
    model,
    usedGateway,
    prompt,
    response,
    promptTokens,
    completionTokens,
  } = input;

  const query = `
    insert into perazzi_conversation_logs (
      env,
      endpoint,
      page_url,
      archetype,
      session_id,
      user_id,
      model,
      used_gateway,
      prompt,
      response,
      prompt_tokens,
      completion_tokens,
      low_confidence,
      intents,
      topics,
      metadata
    )
    values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
  `;

  const values = [
    env,
    endpoint,
    pageUrl ?? null,
    archetype ?? null,
    sessionId ?? null,
    userId ?? null,
    model,
    usedGateway,
    prompt,
    response,
    promptTokens ?? null,
    completionTokens ?? null,
    lowConfidence ?? null,
    intents ?? null,
    topics ?? null,
    metadata ?? null,
  ];

  try {
    await clientPool.query(query, values);
  } catch (error) {
    console.error("logAiInteraction insert failed", error);
  }
}
