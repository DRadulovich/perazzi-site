import {
  type AssistantResponseMeta,
  type ChatEntry,
  type ChatContextShape,
  type UseChatStateOptions,
  useChatState,
} from "@/components/chat/useChatState";
import type {
  PerazziMode,
  Archetype,
  ArchetypeVector,
  TextVerbosity,
} from "@/types/perazzi-assistant";

export type PlatformSlug = "mx" | "ht" | "tm" | "dc" | "sho";

export type AssistantContext = {
  pageUrl?: string;
  mode?: PerazziMode | "heritage";
  platformSlug?: PlatformSlug;
  modelSlug?: string;
  locale?: string;
  /** Sticky archetype hint from the last response. */
  archetype?: Archetype | null;
  /** Previous archetype vector from the last response, used for smoothing. */
  archetypeVector?: ArchetypeVector | null;
  /** Preferred verbosity for assistant text responses. */
  textVerbosity?: TextVerbosity;
};

export type UsePerazziAssistantOptions = {
  storageKey?: string;
  initialContext?: AssistantContext;
  initialMessages?: ChatEntry[];
  onResponseMeta?: (meta: AssistantResponseMeta) => void;
};

export function usePerazziAssistant(options: UsePerazziAssistantOptions = {}) {
  const {
    messages,
    pending,
    isTyping,
    error,
    context,
    setContext,
    sendMessage,
    updateContext,
    appendLocal,
    clearConversation,
  } = useChatState(options.initialMessages ?? [], {
    storageKey: options.storageKey,
    initialContext: options.initialContext as ChatContextShape | undefined,
    onResponseMeta: options.onResponseMeta as UseChatStateOptions["onResponseMeta"],
  });

  return {
    messages,
    pending,
    isTyping,
    error,
    context: context as AssistantContext,
    setContext,
    updateContext: updateContext as (patch: Partial<AssistantContext>) => void,
    appendLocal,
    sendMessage,
    clearConversation,
  };
}
