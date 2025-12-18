import OpenAI from "openai";
import { logAiInteraction, type AiInteractionContext } from "@/lib/aiLogging";

type OpenAIConfig = {
  apiKey: string;
  baseURL?: string;
  usedGateway: boolean;
};

function isPromptDebugEnabled(): boolean {
  return process.env.PERAZZI_DEBUG_PROMPT === "true";
}

function countTextChars(value: unknown): number {
  if (typeof value === "string") return value.length;
  return 0;
}

function countContentChars(content: unknown): number {
  if (typeof content === "string") return content.length;
  if (Array.isArray(content)) {
    return content.reduce((sum, part) => {
      if (typeof part === "string") return sum + part.length;
      if (part && typeof part === "object") {
        const candidate = part as Record<string, unknown>;
        if (typeof candidate.text === "string") return sum + candidate.text.length;
        if (typeof candidate.input_text === "string") return sum + candidate.input_text.length;
        if (typeof candidate.content === "string") return sum + candidate.content.length;
      }
      return sum;
    }, 0);
  }
  return 0;
}

function summarizeResponsesCreatePayload(payload: Record<string, unknown>) {
  const instructions = payload.instructions;
  const input = payload.input;
  const previousResponseId = payload.previous_response_id;
  const store = payload.store;
  const promptCacheKey = payload.prompt_cache_key;

  const inputItems: Array<{ type: string; role?: string; chars: number }> = [];
  const countsByType: Record<string, number> = {};
  const countsByRole: Record<string, number> = {};
  let inputTotalChars = 0;

  if (typeof input === "string") {
    inputItems.push({ type: "input_text", chars: input.length });
    inputTotalChars += input.length;
    countsByType.input_text = 1;
  } else if (Array.isArray(input)) {
    input.forEach((item) => {
      if (typeof item === "string") {
        inputItems.push({ type: "input_text", chars: item.length });
        inputTotalChars += item.length;
        countsByType.input_text = (countsByType.input_text ?? 0) + 1;
        return;
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const role = typeof obj.role === "string" ? obj.role : undefined;
        const type = typeof obj.type === "string" ? obj.type : role ? "message" : "object";
        const chars = countContentChars(obj.content);
        inputItems.push({ type, role, chars });
        inputTotalChars += chars;
        countsByType[type] = (countsByType[type] ?? 0) + 1;
        if (role) {
          countsByRole[role] = (countsByRole[role] ?? 0) + 1;
        }
        return;
      }
      inputItems.push({ type: "unknown", chars: 0 });
      countsByType.unknown = (countsByType.unknown ?? 0) + 1;
    });
  }

  const instructionsChars = countTextChars(instructions);

  return {
    keys: Object.keys(payload).sort(),
    model: typeof payload.model === "string" ? payload.model : null,
    hasInstructions: instructionsChars > 0,
    instructionsChars,
    inputItemCount: inputItems.length,
    inputItems,
    inputTotalChars,
    inputCountsByType: countsByType,
    inputCountsByRole: Object.keys(countsByRole).length ? countsByRole : undefined,
    previous_response_id_present: typeof previousResponseId === "string" && previousResponseId.length > 0,
    store_present: Object.prototype.hasOwnProperty.call(payload, "store"),
    store_value:
      typeof store === "boolean" || store === null ? (store as boolean | null) : undefined,
    prompt_cache_key_present: typeof promptCacheKey === "string" && promptCacheKey.length > 0,
    prompt_cache_key_chars: countTextChars(promptCacheKey),
  };
}

export type RunChatCompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
  maxCompletionTokens?: number;
  context?: AiInteractionContext;
  [key: string]: unknown;
};

export type CreateEmbeddingsParams = {
  model: string;
  input: string | string[];
  context?: AiInteractionContext;
} & Omit<OpenAI.Embeddings.EmbeddingCreateParams, "model" | "input"> & {
  [key: string]: unknown;
};

type ResponseCreateParams = OpenAI.Responses.ResponseCreateParamsNonStreaming;

export type CreateResponseTextParams = ResponseCreateParams & {
  maxOutputTokens?: number;
  reasoningEffort?: OpenAI.ReasoningEffort | null;
  textVerbosity?: OpenAI.Responses.ResponseTextConfig["verbosity"];
  promptCacheRetention?: ResponseCreateParams["prompt_cache_retention"];
  promptCacheKey?: string;
  previousResponseId?: string;
  logprobs?: number | boolean | null;
  top_logprobs?: number | null;
};

export type CreateResponseTextResult = {
  text: string;
  responseId?: string;
  requestId?: string;
  usage?: OpenAI.Responses.ResponseUsage;
  raw?: OpenAI.Responses.Response;
};

let client: OpenAI | null = null;
let usingGateway = false;

function resolveOpenAIConfig(): OpenAIConfig {
  const forceDirect = process.env.AI_FORCE_DIRECT === "true";
  const gatewayUrl = process.env.AI_GATEWAY_URL;
  const gatewayToken = process.env.AI_GATEWAY_TOKEN;
  const apiKey = process.env.OPENAI_API_KEY;

  if (forceDirect) {
    if (!apiKey) {
      throw new Error("AI_FORCE_DIRECT is true but OPENAI_API_KEY is missing");
    }
    return { apiKey, usedGateway: false };
  }

  if (gatewayUrl && gatewayToken) {
    return { apiKey: gatewayToken, baseURL: gatewayUrl, usedGateway: true };
  }

  if (apiKey) {
    return { apiKey, usedGateway: false };
  }

  throw new Error("Missing OpenAI API key or Gateway token");
}

function getOpenAIClient(): OpenAI {
  if (client) return client;

  const { apiKey, baseURL, usedGateway } = resolveOpenAIConfig();
  usingGateway = usedGateway;
  client = baseURL ? new OpenAI({ apiKey, baseURL }) : new OpenAI({ apiKey });
  return client;
}

/**
 * @deprecated Legacy Chat Completions path. Prefer createResponseText() (Responses API).
 * Disabled by default to prevent accidental regressions.
 * To use, set PERAZZI_ALLOW_CHAT_COMPLETIONS=true (local/dev only).
 */
export async function runChatCompletion(
  params: RunChatCompletionParams,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const allow = process.env.PERAZZI_ALLOW_CHAT_COMPLETIONS === "true";
  if (!allow) {
    throw new Error(
      "runChatCompletion is deprecated and disabled by default. " +
        "Set PERAZZI_ALLOW_CHAT_COMPLETIONS=true to enable (local/dev only).",
    );
  }
  const { model, messages, maxCompletionTokens, context, ...rest } = params;

  const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages,
    ...rest,
    ...(maxCompletionTokens !== undefined ? { max_completion_tokens: maxCompletionTokens } : {}),
  };

  const clientInstance = getOpenAIClient();
  const start = Date.now();
  const completion = await clientInstance.chat.completions.create(completionParams);
  const latencyMs = Date.now() - start;

  if (context) {
    const defaultEnv = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
    const contextForLog: AiInteractionContext = {
      ...context,
      env: context.env ?? defaultEnv,
    };

    const userMessages = (messages ?? []).filter((msg) => msg.role === "user");
    const lastUserMessages = userMessages.slice(-1);

    const fallbackPrompt = lastUserMessages
      .map((msg) => normalizeMessageContent(msg.content))
      .filter(Boolean)
      .join("\n\n");

    let overridePrompt: string | undefined;
    const metadata = contextForLog.metadata as { loggedPrompt?: unknown } | undefined;
    if (metadata && typeof metadata.loggedPrompt === "string") {
      overridePrompt = metadata.loggedPrompt;
    }

    const prompt = overridePrompt ?? fallbackPrompt;

    const responseText = normalizeMessageContent(completion.choices?.[0]?.message?.content);
    const promptTokens = completion.usage?.prompt_tokens ?? undefined;
    const completionTokens = completion.usage?.completion_tokens ?? undefined;
    const responseId = completion.id ?? undefined;

    const baseMetadata = (contextForLog.metadata ?? {}) as Record<string, unknown>;
    const metadataWithLatency = {
      ...baseMetadata,
      latencyMs,
    };

    try {
      await logAiInteraction({
        context: { ...contextForLog, metadata: metadataWithLatency },
        model,
        usedGateway: usingGateway,
        prompt,
        response: responseText,
        promptTokens,
        completionTokens,
        responseId,
        usage: completion.usage,
      });
    } catch (error) {
      console.error("logAiInteraction failed", error);
    }
  }

  return completion;
}

export async function createResponseText(
  params: CreateResponseTextParams,
): Promise<CreateResponseTextResult> {
  const {
    temperature,
    top_p,
    logprobs,
    top_logprobs,
    maxOutputTokens,
    reasoningEffort,
    textVerbosity,
    promptCacheRetention,
    promptCacheKey,
    previousResponseId,
    max_output_tokens,
    reasoning,
    text,
    prompt_cache_retention,
    prompt_cache_key,
    previous_response_id,
    ...rest
  } = params;

  const resolvedMaxTokens = maxOutputTokens ?? max_output_tokens;
  const resolvedReasoning =
    reasoningEffort !== undefined || reasoning
      ? {
          ...(reasoning ?? {}),
          ...(reasoningEffort !== undefined ? { effort: reasoningEffort } : {}),
        }
      : undefined;
  const resolvedText =
    textVerbosity !== undefined || text
      ? {
          ...(text ?? {}),
          ...(textVerbosity !== undefined ? { verbosity: textVerbosity } : {}),
        }
      : undefined;
  const resolvedPromptCacheRetention = promptCacheRetention ?? prompt_cache_retention;
  const resolvedPromptCacheKey = promptCacheKey ?? prompt_cache_key;
  const resolvedPreviousResponseId = previousResponseId ?? previous_response_id;
  const model = typeof (rest as Record<string, unknown>).model === "string"
    ? (rest as Record<string, string>).model.toLowerCase()
    : "";

  const isGpt5 = model.startsWith("gpt-5");
  const isGpt52Pro = model.startsWith("gpt-5.2-pro");
  const isGpt52 = model.startsWith("gpt-5.2") && !isGpt52Pro;
  const isGpt51 = model.startsWith("gpt-5.1");
  const samplingModelAllowed = isGpt52 || isGpt51;

  const effortValue = (resolvedReasoning as { effort?: unknown } | undefined)?.effort;
  const effort = typeof effortValue === "string" ? effortValue.toLowerCase() : undefined;
  const reasoningAllowsSampling = !resolvedReasoning || effort === "none";

  const allowSamplingParams = !isGpt5 ? true : samplingModelAllowed && reasoningAllowsSampling;

  const clientInstance = getOpenAIClient();
  const requestPayload: Record<string, unknown> = {
    ...rest,
    ...(resolvedMaxTokens !== undefined ? { max_output_tokens: resolvedMaxTokens } : {}),
    ...(resolvedReasoning ? { reasoning: resolvedReasoning } : {}),
    ...(resolvedText ? { text: resolvedText } : {}),
    ...(resolvedPromptCacheRetention !== undefined
      ? { prompt_cache_retention: resolvedPromptCacheRetention }
      : {}),
    ...(resolvedPromptCacheKey !== undefined ? { prompt_cache_key: resolvedPromptCacheKey } : {}),
    ...(resolvedPreviousResponseId !== undefined
      ? { previous_response_id: resolvedPreviousResponseId }
      : {}),
    ...(allowSamplingParams && temperature !== undefined ? { temperature } : {}),
    ...(allowSamplingParams && top_p !== undefined ? { top_p } : {}),
    ...(allowSamplingParams && logprobs !== undefined ? { logprobs } : {}),
    ...(allowSamplingParams && top_logprobs !== undefined ? { top_logprobs } : {}),
  };

  if (isPromptDebugEnabled()) {
    try {
      console.info(
        "[PERAZZI_DEBUG_PROMPT] openai.responses.create request",
        JSON.stringify(summarizeResponsesCreatePayload(requestPayload)),
      );
    } catch (error) {
      console.warn("[PERAZZI_DEBUG_PROMPT] Failed to summarize OpenAI request payload", error);
    }
  }

  const response = await clientInstance.responses.create(requestPayload as ResponseCreateParams);

  const requestId = (response as { _request_id?: string })._request_id;
  const outputText = response.output_text ?? "";

  if (isPromptDebugEnabled()) {
    try {
      console.info(
        "[PERAZZI_DEBUG_PROMPT] openai.responses.create response",
        JSON.stringify({
          responseId: response.id ?? null,
          requestId: requestId ?? null,
          usage: response.usage ?? null,
        }),
      );
    } catch (error) {
      console.warn("[PERAZZI_DEBUG_PROMPT] Failed to serialize OpenAI response usage", error);
    }
  }

  if (!outputText.trim()) {
    throw new Error(
      `OpenAI returned empty output_text (responseId=${response.id ?? "unknown"}, requestId=${requestId ?? "unknown"})`,
    );
  }

  return {
    text: outputText,
    responseId: response.id,
    requestId,
    usage: response.usage ?? undefined,
    raw: response,
  };
}

export async function createEmbeddings(
  params: CreateEmbeddingsParams,
): Promise<OpenAI.Embeddings.CreateEmbeddingResponse> {
  const { model, input, context: _context, ...rest } = params;
  void _context;

  const embeddingParams: OpenAI.Embeddings.EmbeddingCreateParams = {
    model,
    input,
    ...rest,
  };

  const clientInstance = getOpenAIClient();
  return clientInstance.embeddings.create(embeddingParams);
}

function normalizeMessageContent(
  content: OpenAI.Chat.Completions.ChatCompletionMessageParam["content"] | OpenAI.Chat.Completions.ChatCompletionMessage["content"],
): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if ("text" in part && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}
