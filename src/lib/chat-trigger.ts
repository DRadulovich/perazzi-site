export type ChatContextInput = {
  pageUrl?: string;
  modelSlug?: string;
  platformSlug?: string;
  mode?: string;
  locale?: string;
};

export type ChatTriggerPayload = {
  question?: string;
  context?: ChatContextInput;
};

export const CHAT_TRIGGER_EVENT = "perazzi-chat-open";

export function triggerChat(payload: ChatTriggerPayload = {}) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<ChatTriggerPayload>(CHAT_TRIGGER_EVENT, {
    detail: payload,
  });
  window.dispatchEvent(event);
}
