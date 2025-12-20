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

export async function POST(req: Request) {
  try {
    const { step, userAnswer, title, sessionId } = await req.json();

    if (!step || typeof step !== "string") {
      return NextResponse.json({ error: "Missing or invalid step" }, { status: 400 });
    }
    if (!userAnswer || typeof userAnswer !== "string") {
      return NextResponse.json({ error: "Missing or invalid userAnswer" }, { status: 400 });
    }

    const template = getSoulArtisanPromptForStep(step);
    if (!template) {
      return NextResponse.json({ error: "Unknown step" }, { status: 400 });
    }

    const trimmedAnswer = userAnswer.trim();
    const prompt = template.replaceAll("{{USER_ANSWER}}", trimmedAnswer);
    const titleLine = title && typeof title === "string" ? `Step title: ${title}\n\n` : "";

    const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
    const context: AiInteractionContext = {
      env,
      endpoint: "soul_journey",
      pageUrl: "/the-build/why-a-perazzi-has-a-soul",
      archetype: null,
      sessionId: sessionId ?? null,
      userId: null,
      lowConfidence: false,
      metadata: {
        step,
        title: title && typeof title === "string" ? title : undefined,
        loggedPrompt: trimmedAnswer,
      },
    };

    const instructions =
      "You are a Perazzi master craftsperson. Stay concise (1–2 paragraphs), grounded in the station's craft, and follow the provided prompt exactly. Do not mention prompts, websites, or meta-instructions.";

    const response = await createResponseText({
      model: OPENAI_MODEL,
      temperature: SOUL_JOURNEY_TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      instructions,
      input: `${titleLine}${prompt}`,
      reasoningEffort: REASONING_EFFORT,
      textVerbosity: TEXT_VERBOSITY,
      promptCacheRetention: PROMPT_CACHE_RETENTION,
      promptCacheKey: PROMPT_CACHE_KEY,
    });

    try {
      await logAiInteraction({
        context,
        model: OPENAI_MODEL,
        usedGateway: isUsingGateway(),
        prompt: `${titleLine}${prompt}`,
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
