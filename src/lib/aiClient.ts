import OpenAI from "openai";
import { logAiInteraction, type AiInteractionContext } from "@/lib/aiLogging";

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

export async function runChatCompletion(
  params: RunChatCompletionParams,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const { model, messages, maxCompletionTokens, context, ...rest } = params;

  const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages,
    ...rest,
    ...(maxCompletionTokens !== undefined ? { max_completion_tokens: maxCompletionTokens } : {}),
  };

  const clientInstance = getOpenAIClient();
  const completion = await clientInstance.chat.completions.create(completionParams);

  if (context) {
    const defaultEnv = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
    const contextForLog: AiInteractionContext = {
      ...context,
      env: context.env ?? defaultEnv,
    };

    const userMessages = (messages ?? []).filter((msg) => msg.role === "user");
    const lastUserMessages = userMessages.slice(-3);

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

    try {
      await logAiInteraction({
        context: contextForLog,
        model,
        usedGateway: usingGateway,
        prompt,
        response: responseText,
        promptTokens,
        completionTokens,
      });
    } catch (error) {
      console.error("logAiInteraction failed", error);
    }
  }

  return completion;
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
