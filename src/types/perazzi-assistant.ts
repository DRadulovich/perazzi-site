export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface PerazziAssistantRequest {
  messages: ChatMessage[];
  context?: {
    pageUrl?: string | null;
    modelSlug?: string | null;
    mode?: string | null;
    locale?: string | null;
  };
}

export interface Citation {
  chunkId: string;
  title: string;
  sourcePath: string;
}

export interface PerazziAssistantResponse {
  answer: string;
  citations?: Citation[];
  guardrail: {
    status: "ok" | "low_confidence" | "blocked";
    reason?: string | null;
  };
  similarity?: number;
}

export interface RetrievedChunk extends Citation {
  content: string;
  score: number;
}
