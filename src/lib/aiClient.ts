import OpenAI from "openai";

type RequestContext = {
  requestId?: string;
  userId?: string;
  archetype?: string;
  [key: string]: unknown;
};

type OpenAIConfig = {
  apiKey: string;
  baseURL?: string;
};

export type RunChatCompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
  maxCompletionTokens?: number;
  context?: RequestContext;
  [key: string]: unknown;
};

export type CreateEmbeddingsParams = {
  model: string;
  input: string | string[];
  context?: RequestContext;
} & Omit<OpenAI.Embeddings.EmbeddingCreateParams, "model" | "input"> & {
  [key: string]: unknown;
};

let client: OpenAI | null = null;

function resolveOpenAIConfig(): OpenAIConfig {
  const forceDirect = process.env.AI_FORCE_DIRECT === "true";
  const gatewayUrl = process.env.AI_GATEWAY_URL;
  const gatewayToken = process.env.AI_GATEWAY_TOKEN;
  const apiKey = process.env.OPENAI_API_KEY;

  if (forceDirect) {
    if (!apiKey) {
      throw new Error("AI_FORCE_DIRECT is true but OPENAI_API_KEY is missing");
    }
    return { apiKey };
  }

  if (gatewayUrl && gatewayToken) {
    return { apiKey: gatewayToken, baseURL: gatewayUrl };
  }

  if (apiKey) {
    return { apiKey };
  }

  throw new Error("Missing OpenAI API key or Gateway token");
}

function getOpenAIClient(): OpenAI {
  if (client) return client;

  const { apiKey, baseURL } = resolveOpenAIConfig();
  client = baseURL ? new OpenAI({ apiKey, baseURL }) : new OpenAI({ apiKey });
  return client;
}

export async function runChatCompletion(
  params: RunChatCompletionParams,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const { model, messages, maxCompletionTokens, context: _context, ...rest } = params;
  void _context;

  const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages,
    ...rest,
    ...(maxCompletionTokens !== undefined ? { max_completion_tokens: maxCompletionTokens } : {}),
  };

  const clientInstance = getOpenAIClient();
  return clientInstance.chat.completions.create(completionParams);
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
