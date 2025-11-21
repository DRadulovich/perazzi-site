import {
  type AssistantResponseMeta,
  type ChatEntry,
  type ChatContextShape,
  type UseChatStateOptions,
  useChatState,
} from "@/components/chat/useChatState";

export type PlatformSlug = "mx" | "ht" | "tm" | "dc" | "sho";

export type AssistantContext = {
  pageUrl?: string;
  mode?: "prospect" | "owner" | "navigation" | "heritage";
  platformSlug?: PlatformSlug;
  modelSlug?: string;
  locale?: string;
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
  };
}
