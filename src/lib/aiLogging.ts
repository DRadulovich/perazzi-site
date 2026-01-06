import { Pool } from "pg";
import { getPgSslDiagnostics, getPgSslOptions } from "@/lib/pgSsl";
import { logTlsDiagForDb } from "@/lib/tlsDiag";
import { type ArchetypeScores, withArchetypeDistribution } from "@/lib/pgpt-insights/archetype-distribution";

const TEXT_PLACEHOLDER = "[omitted]" as const;

type LogTextMode = "omitted" | "truncate" | "full";

function resolveLogTextMode(): LogTextMode {
  const raw = (process.env.PERAZZI_LOG_TEXT_MODE ?? "omitted").toLowerCase().trim();
  if (raw === "full" || raw === "truncate" || raw === "omitted") return raw;
  return "omitted";
}

function resolveMaxChars(): number {
  const n = Number.parseInt(process.env.PERAZZI_LOG_TEXT_MAX_CHARS ?? "8000", 10);
  if (!Number.isFinite(n) || n <= 0) return 8000;
  return Math.min(n, 100_000);
}

function applyTextMode(value: string | null | undefined, mode: LogTextMode, maxChars: number): string {
  if (mode === "omitted") return TEXT_PLACEHOLDER;
  const text = (value ?? "").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

const ARCHETYPE_NAME_MAP: Record<string, keyof ArchetypeScores> = {
  loyalist: "Loyalist",
  prestige: "Prestige",
  analyst: "Analyst",
  achiever: "Achiever",
  legacy: "Legacy",
};

const NEUTRAL_ARCHETYPE_SCORES: ArchetypeScores = {
  Loyalist: 0.2,
  Prestige: 0.2,
  Analyst: 0.2,
  Achiever: 0.2,
  Legacy: 0.2,
};

export type AiInteractionContext = {
  env: string;
  endpoint: string;
  pageUrl?: string;
  archetype?: string | null;
  archetypeClassification?: {
    archetype: string | null;
    archetypeScores?: ArchetypeScores;
    archetypeDecision?: unknown;
  };
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
  prompt?: string;
  response?: string;
  promptTokens?: number;
  completionTokens?: number;
  responseId?: string | null;
  requestId?: string | null;
  usage?: unknown;
};

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const sslOptions = getPgSslOptions();
  const { sslMode, hasCa } = getPgSslDiagnostics();
  logTlsDiagForDb("pg.aiLogging.pool", connectionString, sslMode, { hasCa });
  pool = new Pool({ connectionString, ssl: sslOptions, max: 3 });
  return pool;
}

function deriveOneHotScores(archetype?: string | null): ArchetypeScores | null {
  if (!archetype) return null;
  const key = ARCHETYPE_NAME_MAP[archetype.toLowerCase()];
  if (!key) return null;
  return {
    Loyalist: key === "Loyalist" ? 1 : 0,
    Prestige: key === "Prestige" ? 1 : 0,
    Analyst: key === "Analyst" ? 1 : 0,
    Achiever: key === "Achiever" ? 1 : 0,
    Legacy: key === "Legacy" ? 1 : 0,
  };
}

function archetypeScoresOrDefault(
  archetypeClassification?: AiInteractionContext["archetypeClassification"],
  archetype?: string | null,
): ArchetypeScores {
  if (archetypeClassification?.archetypeScores) {
    return archetypeClassification.archetypeScores;
  }
  const oneHot = deriveOneHotScores(archetype);
  if (oneHot) return oneHot;
  return NEUTRAL_ARCHETYPE_SCORES;
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const clone = { ...metadata };
  const sensitiveKeys = ["loggedPrompt", "prompt", "userPrompt", "userMessage", "messages"];
  for (const key of sensitiveKeys) {
    if (key in clone) {
      delete clone[key];
    }
  }
  return clone;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toOptionalNumber(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function extractUsageMetrics(usage: unknown): {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  reasoningTokens?: number;
} {
  if (!usage || typeof usage !== "object") return {};
  const inputTokens = toOptionalNumber((usage as { input_tokens?: unknown })?.input_tokens);
  const outputTokens = toOptionalNumber((usage as { output_tokens?: unknown })?.output_tokens);
  const cachedTokens = toOptionalNumber(
    (usage as { input_tokens_details?: { cached_tokens?: unknown } })?.input_tokens_details?.cached_tokens,
  );
  const reasoningTokens = toOptionalNumber(
    (usage as { output_tokens_details?: { reasoning_tokens?: unknown } })?.output_tokens_details?.reasoning_tokens,
  );
  const totalTokensFromUsage = toOptionalNumber((usage as { total_tokens?: unknown })?.total_tokens);
  const totalTokens =
    totalTokensFromUsage ??
    (inputTokens !== undefined && outputTokens !== undefined ? inputTokens + outputTokens : undefined);

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedTokens,
    reasoningTokens,
  };
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
      archetypeClassification,
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
    responseId,
    requestId,
    usage,
  } = input;

  const mode = resolveLogTextMode();
  const maxChars = resolveMaxChars();
  const archetypeForRow = archetype ?? archetypeClassification?.archetype ?? null;

  const rawPrompt = (prompt ?? "").trim();
  const rawResponse = (response ?? "").trim();

  const promptTextOmitted = mode === "omitted" && rawPrompt.length > 0;
  const responseTextOmitted = mode === "omitted" && rawResponse.length > 0;
  const promptTextTruncated = mode === "truncate" && rawPrompt.length > maxChars;
  const responseTextTruncated = mode === "truncate" && rawResponse.length > maxChars;

  const metadataBase = sanitizeMetadata(metadata ?? {});
  const usageMetrics = extractUsageMetrics(usage);
  const metadataWithIds = {
    ...metadataBase,
    ...(responseId ? { responseId } : {}),
    ...(requestId ? { requestId } : {}),
    ...(usage ? { responseUsage: usage } : {}),
    ...(usageMetrics.inputTokens === undefined ? {} : { inputTokens: usageMetrics.inputTokens }),
    ...(usageMetrics.outputTokens === undefined ? {} : { outputTokens: usageMetrics.outputTokens }),
    ...(usageMetrics.cachedTokens === undefined ? {} : { cachedTokens: usageMetrics.cachedTokens }),
    ...(usageMetrics.reasoningTokens === undefined ? {} : { reasoningTokens: usageMetrics.reasoningTokens }),
    ...(usageMetrics.totalTokens === undefined ? {} : { totalTokens: usageMetrics.totalTokens }),
    logTextMode: mode,
    logTextMaxChars: maxChars,
    promptTextOmitted,
    responseTextOmitted,
    promptTextTruncated,
    responseTextTruncated,
  };
  const archetypeScores = archetypeScoresOrDefault(archetypeClassification, archetypeForRow);
  const metadataWithArchetype = withArchetypeDistribution(
    metadataWithIds,
    archetypeScores,
    archetypeClassification?.archetypeDecision,
  );

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

  const promptForInsert = applyTextMode(rawPrompt, mode, maxChars);
  const responseForInsert = applyTextMode(rawResponse, mode, maxChars);

  const values = [
    env,
    endpoint,
    pageUrl ?? null,
    archetypeForRow,
    sessionId ?? null,
    userId ?? null,
    model,
    usedGateway,
    promptForInsert,
    responseForInsert,
    promptTokens ?? null,
    completionTokens ?? null,
    lowConfidence ?? null,
    intents ?? null,
    topics ?? null,
    metadataWithArchetype ?? null,
  ];

  try {
    await clientPool.query(query, values);
  } catch (error) {
    console.error("logAiInteraction insert failed", error);
  }
}
