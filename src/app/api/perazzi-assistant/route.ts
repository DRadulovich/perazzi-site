import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import type {
  ChatMessage,
  PerazziAssistantRequest,
  PerazziAssistantResponse,
  RetrievedChunk,
} from "@/types/perazzi-assistant";
import {
  retrievePerazziContext,
  OpenAIConnectionError,
  isConnectionError,
} from "@/lib/perazzi-retrieval";
import { detectRetrievalHints, buildResponseTemplates } from "@/lib/perazzi-intents";
import type { RetrievalHints } from "@/lib/perazzi-intents";

const LOW_CONFIDENCE_THRESHOLD = Number(process.env.PERAZZI_LOW_CONF_THRESHOLD ?? 0.1);
const LOW_CONFIDENCE_MESSAGE =
  "I’m not certain enough to answer this accurately from the information I have. For a definitive answer, please contact Perazzi directly or consider rephrasing your question.";
const BLOCKED_RESPONSES: Record<string, string> = {
  pricing:
    "I’m not able to discuss pricing details. Please reach out to an authorized Perazzi dealer or the Perazzi team for official information.",
  gunsmithing:
    "Technical modifications and repairs must be handled by authorized Perazzi experts. Let me connect you with the right service channel.",
  legal:
    "Perazzi can’t provide legal guidance. Please consult local authorities or qualified professionals for this topic.",
};

const OPENAI_MODEL = process.env.PERAZZI_COMPLETIONS_MODEL ?? "gpt-4.1-mini";
const PHASE_ONE_SPEC = fs.readFileSync(
  path.join(process.cwd(), "docs", "assistant-spec.md"),
  "utf8",
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ENABLE_FILE_LOG = process.env.PERAZZI_ENABLE_FILE_LOG === "true";
const CONVERSATION_LOG_PATH = path.join(
  process.cwd(),
  "tmp",
  "logs",
  "perazzi-conversations.ndjson",
);

function getLowConfidenceThreshold() {
  const value = Number(process.env.PERAZZI_LOW_CONF_THRESHOLD ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PerazziAssistantRequest>;
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const sanitizedMessages = sanitizeMessages(body!.messages!);
    const latestQuestion = getLatestUserContent(sanitizedMessages);
    const hints = detectRetrievalHints(latestQuestion, body?.context);
    const guardrailBlock = detectBlockedIntent(sanitizedMessages);
    if (guardrailBlock) {
      logInteraction(body!, [], 0, "blocked", guardrailBlock.reason, hints);
      return NextResponse.json<PerazziAssistantResponse>({
        answer: guardrailBlock.message,
        guardrail: { status: "blocked", reason: guardrailBlock.reason },
        citations: [],
        similarity: 0,
      });
    }

    const responseTemplates = buildResponseTemplates(hints);
    const retrieval = await retrievePerazziContext(body as PerazziAssistantRequest, hints);
    if (retrieval.maxScore < getLowConfidenceThreshold()) {
      logInteraction(
        body!,
        retrieval.chunks,
        retrieval.maxScore,
        "low_confidence",
        undefined,
        hints,
        responseTemplates,
      );
      return NextResponse.json<PerazziAssistantResponse>({
        answer: LOW_CONFIDENCE_MESSAGE,
        guardrail: { status: "low_confidence", reason: "retrieval_low" },
        citations: [],
        similarity: retrieval.maxScore,
      });
    }

    const answer = await generateAssistantAnswer(
      sanitizedMessages,
      body?.context,
      retrieval.chunks,
      responseTemplates,
    );

    logInteraction(body!, retrieval.chunks, retrieval.maxScore, "ok", undefined, hints, responseTemplates);
    return NextResponse.json<PerazziAssistantResponse>({
      answer,
      citations: retrieval.chunks.map(({ chunkId, title, sourcePath }) => ({
        chunkId,
        title,
        sourcePath,
      })),
      guardrail: { status: "ok" },
      similarity: retrieval.maxScore,
    });
  } catch (error) {
    console.error("Perazzi assistant error", error);
    if (error instanceof OpenAIConnectionError) {
      return NextResponse.json(
        { error: "We’re having trouble reaching the Perazzi knowledge service. Please try again in a moment." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Unexpected error while processing the request." },
      { status: 500 },
    );
  }
}

function validateRequest(
  body: Partial<PerazziAssistantRequest> | undefined,
): string | null {
  if (!body) return "Missing request body.";
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return "messages must be a non-empty array.";
  }
  const hasUserMessage = body.messages.some((msg) => msg.role === "user");
  if (!hasUserMessage) {
    return "At least one user message is required.";
  }
  return null;
}

export function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({ role: msg.role, content: msg.content ?? "" }));
}

export function detectBlockedIntent(messages: ChatMessage[]) {
  const combined = messages
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content)
    .join(" ")
    .toLowerCase();
  if (/\b(price|pricing|cost|cheap|affordable)\b/.test(combined)) {
    return { reason: "pricing", message: BLOCKED_RESPONSES.pricing };
  }
  if (/\b(gunsmith|modify|modification|trigger job)\b/.test(combined)) {
    return { reason: "gunsmithing", message: BLOCKED_RESPONSES.gunsmithing };
  }
  if (/\b(legal|law|export|import|regulation)\b/.test(combined)) {
    return { reason: "legal", message: BLOCKED_RESPONSES.legal };
  }
  return null;
}

function getLatestUserContent(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].content ?? null;
    }
  }
  return null;
}

async function generateAssistantAnswer(
  sanitizedMessages: ChatMessage[],
  context: PerazziAssistantRequest["context"],
  chunks: RetrievedChunk[],
  templates: string[],
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context, chunks, templates);
  const finalMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...sanitizedMessages,
  ];

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.4,
      max_completion_tokens: 800,
      messages: finalMessages,
    });
  } catch (error) {
    if (isConnectionError(error)) {
      throw new OpenAIConnectionError("Unable to reach OpenAI completions endpoint", { cause: error });
    }
    throw error;
  }

  return completion.choices[0]?.message?.content ?? LOW_CONFIDENCE_MESSAGE;
}

export function buildSystemPrompt(
  context: PerazziAssistantRequest["context"],
  chunks: RetrievedChunk[],
  templates: string[] = [],
): string {
  const docSnippets = chunks
    .map(
      (chunk) =>
        `[${chunk.chunkId}] ${chunk.content}\nSource: ${chunk.title} (${chunk.sourcePath})`,
    )
    .join("\n\n");
  const contextSummary = [
    context?.mode ? `Mode: ${context.mode}` : null,
    context?.modelSlug ? `Model: ${context.modelSlug}` : null,
    context?.pageUrl ? `Page URL: ${context.pageUrl}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const templateGuidance = templates.length
    ? `\nResponse structure guidelines:\n${templates
        .map((template) => `- ${template}`)
        .join("\n")}\n`
    : "";

  return `${PHASE_ONE_SPEC}

Context: ${contextSummary || "General Perazzi concierge inquiry"}

Use the following retrieved references when relevant:
${docSnippets || "(No additional references available for this request.)"}

${templateGuidance}When composing responses:
- Write in polished Markdown with short paragraphs separated by blank lines.
- Use bold subheadings or bullet lists when outlining model comparisons, steps, or care tips.
- Keep sentences concise and avoid filler; every line should feel written from the Perazzi workshop floor.
- If you are not certain, clearly state the limitation and offer to connect the user with Perazzi staff.`;
}

function logInteraction(
  body: PerazziAssistantRequest,
  chunks: RetrievedChunk[],
  maxScore: number,
  status: "ok" | "low_confidence" | "blocked",
  reason?: string,
  hints?: RetrievalHints,
  templates?: string[],
) {
  const data = {
    type: "perazzi-assistant-log",
    timestamp: new Date().toISOString(),
    question: body.messages.find((m) => m.role === "user")?.content ?? "",
    context: body.context ?? {},
    retrieved: chunks.map(({ chunkId, score }) => ({ chunkId, score })),
    maxScore,
    guardrail: { status, reason },
    intents: hints?.intents ?? [],
    topics: hints?.topics ?? [],
    templates: templates ?? [],
  };
  console.info(JSON.stringify(data));
  if (ENABLE_FILE_LOG) {
    appendEvalLog(data);
  }
}

function appendEvalLog(entry: Record<string, any>) {
  try {
    fs.mkdirSync(path.dirname(CONVERSATION_LOG_PATH), { recursive: true });
    fs.appendFileSync(CONVERSATION_LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // Ignore logging failures to avoid impacting response flow
  }
}
