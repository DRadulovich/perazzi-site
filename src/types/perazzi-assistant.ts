export type PerazziMode = "prospect" | "owner" | "navigation";

export type TextVerbosity = "low" | "medium" | "high";

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
    textVerbosity?: TextVerbosity;
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

export type PerazziAdminDebugUsage = {
  input_tokens?: number;
  cached_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

export type PerazziAdminDebugPayload = {
  thread: {
    previous_response_id_present: boolean;
    store_enabled: boolean;
    thread_reset_required: boolean;
    conversationStrategy: string | null;
    enforced_thread_input: boolean;
  };
  /**
   * Admin-only OpenAI request summary (never includes message text).
   * Present only on OpenAI-backed responses (not early-return handlers).
   */
  openai?: {
    input_item_count: number;
    input_counts_by_role: Record<string, number>;
    input_items: Array<{
      role: ChatRole;
      chars: number;
    }>;
  } | null;
  retrieval: {
    attempted: boolean;
    skipped: boolean;
    reason: string | null;
    chunk_count: number;
    top_titles: string[];
    rerank_enabled: boolean | null;
    rerank_metrics_present: boolean;
  };
  usage: PerazziAdminDebugUsage | null;
  flags: {
    convo_strategy: string | null;
    retrieval_policy: string | null;
    text_verbosity: string | null;
    reasoning_effort: string | null;
    require_general_label: boolean;
    postvalidate_enabled: boolean;
    prompt_cache_retention: string | null;
    prompt_cache_key_present: boolean;
  };
  /** Admin-only output summary signals for deterministic eval assertions. */
  output?: {
    general_unsourced_label_present: boolean;
  } | null;
  triggers?: {
    blocked_intent?: string | null;
    evidenceMode?: string | null;
    evidenceReason?: string | null;
    postvalidate?: {
      triggered: boolean;
      reasons: string[];
    } | null;
  };
};

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

  /**
   * Admin-only structured debug payload (never sent to normal users).
   * Present only when PERAZZI_ADMIN_DEBUG=true and x-perazzi-admin-debug is authorized.
   */
  debug?: PerazziAdminDebugPayload;

  /**
   * Indicates the server could not resume the provided `previous_response_id` and the client
   * should clear its persisted thread state (but keep the visible chat log).
   */
  thread_reset_required?: boolean;

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
