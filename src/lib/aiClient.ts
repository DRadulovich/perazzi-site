import { isPromptDebugEnabled, summarizeResponsesCreatePayload } from "@/lib/aiDebug";
import { logAiInteraction, type AiInteractionContext } from "@/lib/aiLogging";
import { logTlsDiagForOpenAI } from "@/lib/tlsDiag";
import OpenAI from "openai";

type OpenAIConfig = {
  apiKey: string;
  baseURL?: string;
  usedGateway: boolean;
};

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
let openAiBaseUrl: string | undefined;

function ensureApiKey(apiKey: string | undefined): string {
  if (!apiKey) {
    throw new Error("Missing OpenAI API key or Gateway token");
  }
  return apiKey;
}

function resolveGatewayConfig(url?: string, token?: string): OpenAIConfig | null {
  if (!url || !token) return null;
  openAiBaseUrl = url;
  return { apiKey: token, baseURL: url, usedGateway: true };
}

function resolveDirectConfig(apiKey: string | undefined): OpenAIConfig {
  const resolvedKey = ensureApiKey(apiKey);
  openAiBaseUrl = undefined;
  return { apiKey: resolvedKey, usedGateway: false };
}

function resolveOpenAIConfig(): OpenAIConfig {
  const forceDirect = process.env.AI_FORCE_DIRECT === "true";
  const gatewayConfig = resolveGatewayConfig(process.env.AI_GATEWAY_URL, process.env.AI_GATEWAY_TOKEN);
  if (forceDirect) return resolveDirectConfig(process.env.OPENAI_API_KEY);
  if (gatewayConfig) return gatewayConfig;
  return resolveDirectConfig(process.env.OPENAI_API_KEY);
}

function getOpenAIClient(): OpenAI {
  if (client) return client;

  const { apiKey, baseURL, usedGateway } = resolveOpenAIConfig();
  usingGateway = usedGateway;
  client = baseURL ? new OpenAI({ apiKey, baseURL }) : new OpenAI({ apiKey });
  return client;
}

function resolveChatPrompt(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] | undefined,
  contextForLog: AiInteractionContext,
): string {
  const userMessages = (messages ?? []).filter((msg) => msg.role === "user");
  const lastUserMessages = userMessages.slice(-1);
  const fallbackPrompt = lastUserMessages
    .map((msg) => normalizeMessageContent(msg.content))
    .filter(Boolean)
    .join("\n\n");

  const metadata = contextForLog.metadata as { loggedPrompt?: unknown } | undefined;
  if (metadata && typeof metadata.loggedPrompt === "string") {
    return metadata.loggedPrompt;
  }

  return fallbackPrompt;
}

function buildChatLogContext(context?: AiInteractionContext): AiInteractionContext | null {
  if (!context) return null;
  const defaultEnv = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
  return {
    ...context,
    env: context.env ?? defaultEnv,
  };
}

function buildChatLogPayload(options: {
  model: string;
  messages?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  completion: OpenAI.Chat.Completions.ChatCompletion;
  contextForLog: AiInteractionContext;
  latencyMs: number;
}) {
  const { model, messages, completion, contextForLog, latencyMs } = options;
  const prompt = resolveChatPrompt(messages, contextForLog);
  const responseText = normalizeMessageContent(completion.choices?.[0]?.message?.content);
  const promptTokens = completion.usage?.prompt_tokens ?? undefined;
  const completionTokens = completion.usage?.completion_tokens ?? undefined;
  const responseId = completion.id ?? undefined;
  const baseMetadata: Record<string, unknown> = contextForLog.metadata ?? {};
  const metadataWithLatency = {
    ...baseMetadata,
    latencyMs,
  };

  return {
    context: { ...contextForLog, metadata: metadataWithLatency },
    model,
    usedGateway: usingGateway,
    prompt,
    response: responseText,
    promptTokens,
    completionTokens,
    responseId,
    usage: completion.usage,
  };
}

async function safeLogAiInteraction(payload: Parameters<typeof logAiInteraction>[0]) {
  try {
    await logAiInteraction(payload);
  } catch (error) {
    console.error("logAiInteraction failed", error);
  }
}

async function logChatCompletionInteraction(options: {
  context?: AiInteractionContext;
  model: string;
  messages?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  completion: OpenAI.Chat.Completions.ChatCompletion;
  latencyMs: number;
}) {
  const { context, model, messages, completion, latencyMs } = options;
  const contextForLog = buildChatLogContext(context);
  if (contextForLog) {
    const logPayload = buildChatLogPayload({
      model,
      messages,
      completion,
      contextForLog,
      latencyMs,
    });
    await safeLogAiInteraction(logPayload);
  }
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
  if (allow !== true) {
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
  };
  if (maxCompletionTokens !== undefined) {
    completionParams.max_completion_tokens = maxCompletionTokens;
  }

  const clientInstance = getOpenAIClient();
  const start = Date.now();
  const completion = await clientInstance.chat.completions.create(completionParams);
  const latencyMs = Date.now() - start;

  await logChatCompletionInteraction({ context, model, messages, completion, latencyMs });
  return completion;
}

function buildReasoningConfig(
  reasoning?: ResponseCreateParams["reasoning"] | null,
  reasoningEffort?: OpenAI.ReasoningEffort | null,
): ResponseCreateParams["reasoning"] | undefined {
  if (reasoningEffort === undefined && !reasoning) return undefined;

  const mergedReasoning = reasoning ? { ...reasoning } : undefined;
  if (reasoningEffort !== undefined) {
    return mergedReasoning ? { ...mergedReasoning, effort: reasoningEffort } : { effort: reasoningEffort };
  }
  return mergedReasoning;
}

function buildTextConfig(
  text?: ResponseCreateParams["text"],
  textVerbosity?: OpenAI.Responses.ResponseTextConfig["verbosity"],
): ResponseCreateParams["text"] | undefined {
  if (textVerbosity === undefined && !text) return undefined;

  const mergedText = text ? { ...text } : undefined;
  if (textVerbosity !== undefined) {
    return mergedText ? { ...mergedText, verbosity: textVerbosity } : { verbosity: textVerbosity };
  }
  return mergedText;
}

function normalizeModel(rest: Record<string, unknown>): string {
  const modelValue = rest.model;
  return typeof modelValue === "string" ? modelValue.toLowerCase() : "";
}

function isGpt5SamplingAllowed(model: string, effortValue: string | undefined): boolean {
  if (effortValue && effortValue !== "none") return false;
  if (model.startsWith("gpt-5.2-pro")) return false;
  return model.startsWith("gpt-5.2") || model.startsWith("gpt-5.1");
}

function shouldAllowSampling(
  model: string,
  resolvedReasoning?: ResponseCreateParams["reasoning"] | null,
): boolean {
  if (!model.startsWith("gpt-5")) return true;

  const effortValue =
    typeof resolvedReasoning?.effort === "string"
      ? resolvedReasoning.effort.toLowerCase()
      : undefined;

  return isGpt5SamplingAllowed(model, effortValue);
}

function resolveAlias<T>(primary: T | undefined | null, alias: T | undefined | null): T | undefined | null {
  return primary ?? alias;
}

function isOpenAiStoreEnabled(): boolean {
  return process.env.PERAZZI_OPENAI_STORE === "true";
}

type BuildResponsesPayloadOptions = {
  baseParams: Record<string, unknown>;
  resolvedMaxTokens?: number | null;
  resolvedReasoning?: ResponseCreateParams["reasoning"] | null;
  resolvedText?: ResponseCreateParams["text"];
  resolvedPromptCacheRetention?: ResponseCreateParams["prompt_cache_retention"];
  resolvedPromptCacheKey?: string | null;
  resolvedPreviousResponseId?: string | null;
  allowSamplingParams: boolean;
  temperature?: number | null;
  top_p?: number | null;
  logprobs?: number | boolean | null;
  top_logprobs?: number | null;
  openAiStoreEnabled: boolean;
};

function setIfDefined(payload: Record<string, unknown>, key: string, value: unknown) {
  if (value !== undefined) {
    payload[key] = value;
  }
}

function applyOptionalFields(payload: Record<string, unknown>, fields: Record<string, unknown>) {
  Object.entries(fields).forEach(([key, value]) => setIfDefined(payload, key, value));
}

function applySamplingParams(
  payload: Record<string, unknown>,
  options: Pick<
    BuildResponsesPayloadOptions,
    "allowSamplingParams" | "temperature" | "top_p" | "logprobs" | "top_logprobs"
  >,
) {
  if (!options.allowSamplingParams) return;
  setIfDefined(payload, "temperature", options.temperature ?? undefined);
  setIfDefined(payload, "top_p", options.top_p ?? undefined);
  setIfDefined(payload, "logprobs", options.logprobs);
  setIfDefined(payload, "top_logprobs", options.top_logprobs ?? undefined);
}

function buildResponsesRequestPayload(options: BuildResponsesPayloadOptions): Record<string, unknown> {
  const {
    baseParams,
    allowSamplingParams,
    openAiStoreEnabled,
    ...rest
  } = options;

  const requestPayload: Record<string, unknown> = { ...baseParams };

  applyOptionalFields(requestPayload, {
    max_output_tokens: rest.resolvedMaxTokens ?? undefined,
    reasoning: rest.resolvedReasoning ?? undefined,
    text: rest.resolvedText ?? undefined,
    prompt_cache_retention: rest.resolvedPromptCacheRetention,
    prompt_cache_key: rest.resolvedPromptCacheKey ?? undefined,
    previous_response_id: rest.resolvedPreviousResponseId ?? undefined,
  });
  applySamplingParams(requestPayload, {
    allowSamplingParams,
    temperature: rest.temperature,
    top_p: rest.top_p,
    logprobs: rest.logprobs,
    top_logprobs: rest.top_logprobs,
  });
  if (openAiStoreEnabled) {
    requestPayload.store = true;
  }

  return requestPayload;
}

function logResponsesRequestDebug(requestPayload: Record<string, unknown>) {
  if (!isPromptDebugEnabled()) return;
  try {
    console.info(
      "[PERAZZI_DEBUG_PROMPT] openai.responses.create request",
      JSON.stringify(summarizeResponsesCreatePayload(requestPayload)),
    );
  } catch (error) {
    console.warn("[PERAZZI_DEBUG_PROMPT] Failed to summarize OpenAI request payload", error);
  }
}

function logResponsesResponseDebug(
  response: OpenAI.Responses.Response,
  requestId: string | undefined,
) {
  if (!isPromptDebugEnabled()) return;
  console.info(
    "[PERAZZI_DEBUG_PROMPT] openai.responses.create response",
    JSON.stringify({
      responseId: response.id ?? null,
      requestId: requestId ?? null,
      usage: response.usage ?? null,
    }),
  );
}

function ensureNonEmptyOutput(outputText: string, responseId?: string, requestId?: string) {
  if (!outputText.trim()) {
    throw new Error(
      `OpenAI returned empty output_text (responseId=${responseId ?? "unknown"}, requestId=${requestId ?? "unknown"})`,
    );
  }
}

function resolveResponsesOptions(
  params: CreateResponseTextParams,
): BuildResponsesPayloadOptions {
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

  const baseParams = rest as Record<string, unknown>;
  const resolvedReasoning = buildReasoningConfig(reasoning, reasoningEffort);
  const model = normalizeModel(baseParams);

  return {
    baseParams,
    resolvedMaxTokens: resolveAlias(maxOutputTokens, max_output_tokens),
    resolvedReasoning,
    resolvedText: buildTextConfig(text, textVerbosity),
    resolvedPromptCacheRetention: resolveAlias(promptCacheRetention, prompt_cache_retention),
    resolvedPromptCacheKey: resolveAlias(promptCacheKey, prompt_cache_key),
    resolvedPreviousResponseId: resolveAlias(previousResponseId, previous_response_id),
    allowSamplingParams: shouldAllowSampling(model, resolvedReasoning),
    temperature,
    top_p,
    logprobs,
    top_logprobs,
    openAiStoreEnabled: isOpenAiStoreEnabled(),
  };
}

export async function createResponseText(
  params: CreateResponseTextParams,
): Promise<CreateResponseTextResult> {
  const requestPayload = buildResponsesRequestPayload(resolveResponsesOptions(params));

  const clientInstance = getOpenAIClient();
  logTlsDiagForOpenAI("openai.responses", openAiBaseUrl, usingGateway);
  logResponsesRequestDebug(requestPayload);
  const response = await clientInstance.responses.create(requestPayload as ResponseCreateParams);

  const requestId = (response as { _request_id?: string })._request_id;
  const outputText = response.output_text ?? "";
  logResponsesResponseDebug(response, requestId);
  ensureNonEmptyOutput(outputText, response.id, requestId);

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
  const embeddingParams: CreateEmbeddingsParams = { ...params };
  delete embeddingParams.context;

  const clientInstance = getOpenAIClient();
  logTlsDiagForOpenAI("openai.embeddings", openAiBaseUrl, usingGateway);
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
