# 9 - CODE FOR: `src/lib/aiLogging.ts`

---

import { Pool } from "pg";
import { type ArchetypeScores, withArchetypeDistribution } from "@/lib/pgpt-insights/archetype-distribution";

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
  } = input;

  const archetypeForRow = archetype ?? archetypeClassification?.archetype ?? null;

  const metadataBase = (metadata ?? {}) as Record<string, unknown>;
  const archetypeScores = archetypeScoresOrDefault(archetypeClassification, archetypeForRow);
  const metadataWithArchetype = withArchetypeDistribution(
    metadataBase,
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

  const values = [
    env,
    endpoint,
    pageUrl ?? null,
    archetypeForRow,
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
    metadataWithArchetype ?? null,
  ];

  try {
    await clientPool.query(query, values);
  } catch (error) {
    console.error("logAiInteraction insert failed", error);
  }
}

---
