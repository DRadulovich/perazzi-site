import { NextResponse } from "next/server";
import { createResponseText } from "@/lib/aiClient";
import { getSoulArtisanPromptForStep } from "@/lib/soulJourneyPrompts";
import { logAiInteraction, type AiInteractionContext } from "@/lib/aiLogging";
import {
  resolveModel,
  resolveMaxOutputTokens,
  parseReasoningEffort,
  parseTextVerbosity,
  parsePromptCacheRetention,
  parsePromptCacheKey,
  parseTemperature,
  isUsingGateway,
} from "@/lib/perazziAiConfig";

const DEFAULT_MODEL = "gpt-5.2";
const OPENAI_MODEL = resolveModel(DEFAULT_MODEL);
const MAX_OUTPUT_TOKENS = resolveMaxOutputTokens(700);
const REASONING_EFFORT = parseReasoningEffort(process.env.PERAZZI_REASONING_EFFORT);
const TEXT_VERBOSITY = parseTextVerbosity(process.env.PERAZZI_TEXT_VERBOSITY);
const PROMPT_CACHE_RETENTION = parsePromptCacheRetention(process.env.PERAZZI_PROMPT_CACHE_RETENTION);
const PROMPT_CACHE_KEY = parsePromptCacheKey(process.env.PERAZZI_PROMPT_CACHE_KEY);
const SOUL_JOURNEY_TEMPERATURE = parseTemperature(
  process.env.PERAZZI_SOUL_JOURNEY_TEMPERATURE,
  0.6,
);
const INSTRUCTIONS =
  "You are a Perazzi master craftsperson. Stay concise (1–2 paragraphs), grounded in the station's craft, and follow the provided prompt exactly. Do not mention prompts, websites, or meta-instructions.";

type SoulJourneyRequest = {
  step: string;
  userAnswer: string;
  title?: string;
  sessionId?: string | null;
};

type RequestParseResult =
  | { ok: true; data: SoulJourneyRequest }
  | { ok: false; response: NextResponse };

type PromptBuildResult =
  | { ok: true; prompt: string; titleLine: string; trimmedAnswer: string }
  | { ok: false; response: NextResponse };

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

function parseRequestBody(body: unknown): RequestParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, response: badRequest("Invalid request body") };
  }

  const { step, userAnswer, title, sessionId } = body as Record<string, unknown>;

  if (typeof step !== "string" || step.length === 0) {
    return { ok: false, response: badRequest("Missing or invalid step") };
  }

  if (typeof userAnswer !== "string" || userAnswer.length === 0) {
    return { ok: false, response: badRequest("Missing or invalid userAnswer") };
  }

  const parsedTitle = typeof title === "string" && title.length > 0 ? title : undefined;
  const parsedSessionId = typeof sessionId === "string" ? sessionId : null;

  return {
    ok: true,
    data: { step, userAnswer, title: parsedTitle, sessionId: parsedSessionId },
  };
}

function buildPromptForStep(step: string, userAnswer: string, title?: string): PromptBuildResult {
  const template = getSoulArtisanPromptForStep(step);
  if (!template) {
    return { ok: false, response: badRequest("Unknown step") };
  }

  const trimmedAnswer = userAnswer.trim();
  const titleLine = title ? `Step title: ${title}\n\n` : "";
  const prompt = template.replaceAll("{{USER_ANSWER}}", trimmedAnswer);

  return { ok: true, prompt, titleLine, trimmedAnswer };
}

function buildInteractionContext({
  step,
  title,
  sessionId,
  trimmedAnswer,
}: {
  step: string;
  title?: string;
  sessionId?: string | null;
  trimmedAnswer: string;
}): AiInteractionContext {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";

  return {
    env,
    endpoint: "soul_journey",
    pageUrl: "/the-build/why-a-perazzi-has-a-soul",
    archetype: null,
    sessionId: sessionId ?? null,
    userId: null,
    lowConfidence: false,
    metadata: {
      step,
      title,
      loggedPrompt: trimmedAnswer,
    },
  };
}

async function logInteractionSafely({
  context,
  model,
  input,
  response,
}: {
  context: AiInteractionContext;
  model: string;
  input: string;
  response: Awaited<ReturnType<typeof createResponseText>>;
}): Promise<void> {
  try {
    await logAiInteraction({
      context,
      model,
      usedGateway: isUsingGateway(),
      prompt: input,
      response: response.text,
      promptTokens: response.usage?.input_tokens ?? undefined,
      completionTokens: response.usage?.output_tokens ?? undefined,
      responseId: response.responseId,
      requestId: response.requestId,
      usage: response.usage,
    });
  } catch (logError) {
    console.error("logAiInteraction failed", logError);
  }
}

export async function POST(req: Request) {
  try {
    const parsedBody = parseRequestBody(await req.json());
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const { step, userAnswer, title, sessionId } = parsedBody.data;

    const promptResult = buildPromptForStep(step, userAnswer, title);
    if (!promptResult.ok) {
      return promptResult.response;
    }

    const { prompt, titleLine, trimmedAnswer } = promptResult;
    const input = `${titleLine}${prompt}`;
    const context = buildInteractionContext({ step, title, sessionId, trimmedAnswer });

    const response = await createResponseText({
      model: OPENAI_MODEL,
      temperature: SOUL_JOURNEY_TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      instructions: INSTRUCTIONS,
      input,
      reasoningEffort: REASONING_EFFORT,
      textVerbosity: TEXT_VERBOSITY,
      promptCacheRetention: PROMPT_CACHE_RETENTION,
      promptCacheKey: PROMPT_CACHE_KEY,
    });

    await logInteractionSafely({ context, model: OPENAI_MODEL, input, response });

    const paragraph = response.text?.trim();
    if (!paragraph) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }

    return NextResponse.json({ paragraph });
  } catch (error) {
    console.error("[soul-journey-step]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
