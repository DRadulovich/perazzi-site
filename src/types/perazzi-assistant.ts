export type PerazziMode = "prospect" | "owner" | "navigation";

export type Archetype =
  | "loyalist"
  | "prestige"
  | "analyst"
  | "achiever"
  | "legacy";

export type ArchetypeVector = Record<Archetype, number>;

export interface ArchetypeBreakdown {
  /** Primary inferred archetype for this interaction (after smoothing). */
  primary: Archetype | null;
  /** Normalized weights for each archetype; usually sum ≈ 1. */
  vector: ArchetypeVector;
  /** Optional human-readable explanation of why this breakdown was chosen (dev/debug only). */
  reasoning?: string;
  /** Optional list of signal names that contributed to this breakdown (dev/debug only). */
  signalsUsed?: string[];
}

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface PerazziAssistantRequest {
  messages: ChatMessage[];
  sessionId?: string;
  /** Optional previous Responses ID to enable multi-turn state. */
  previousResponseId?: string | null;
  context?: {
    pageUrl?: string | null;
    modelSlug?: string | null;
    platformSlug?: string | null;
    mode?: PerazziMode | null;
    locale?: string | null;
    /** Sticky archetype hint from the client (e.g. last known primary archetype). */
    archetype?: Archetype | null;
    /** Previous archetype vector from the last interaction, for smoothing across turns. */
    archetypeVector?: ArchetypeVector | null;
    /** Optional previous Responses ID to enable multi-turn state. */
    previousResponseId?: string | null;
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

  /** OpenAI Responses ID for this turn (when generated). */
  responseId?: string | null;

  /**
   * Mode that PerazziGPT used when answering this request (prospect, owner, navigation).
   * Optional for backward compatibility while we wire this through the API.
   */
  mode?: PerazziMode | null;

  /**
   * Primary archetype used for voice/tone in this response.
   * Optional for backward compatibility.
   */
  archetype?: Archetype | null;

  /**
   * Full archetype profile for this interaction, including weights and debug info.
   * Optional for backward compatibility.
   */
  archetypeBreakdown?: ArchetypeBreakdown;

  similarity?: number;
}

export interface RetrievedChunk extends Citation {
  content: string;
  score: number;
  baseScore?: number;
  documentPath?: string;
  headingPath?: string | null;
  category?: string | null;
  docType?: string | null;
}

export type LegacyNotePayload = {
  answers: string[];
};
