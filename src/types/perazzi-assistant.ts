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
    platformSlug?: string | null;
    mode?: string | null;
    locale?: string | null;
  };
  summaryIntent?: string | null;
}

export interface Citation {
  chunkId: string;
  title: string;
  sourcePath: string;
  excerpt?: string;
}

export interface PerazziAssistantResponse {
  answer: string;
  citations: Citation[];
  guardrail: {
    status: "ok" | "low_confidence" | "blocked";
    reason: string | null;
  };
  intents: string[];
  topics: string[];
  templates: string[];
  similarity?: number;
}

export interface RetrievedChunk extends Citation {
  content: string;
  baseScore?: number;
  score: number;
}

export type LegacyNotePayload = {
  answers: string[];
};
