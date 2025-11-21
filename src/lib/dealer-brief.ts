import type { AssistantContext } from "@/hooks/usePerazziAssistant";
import type { ChatMessage, PerazziAssistantRequest } from "@/types/perazzi-assistant";

const DEALER_BRIEF_PROMPT =
  "Summarize this conversation as a brief for an authorized Perazzi dealer. Include shooter’s disciplines, experience level, preferences, discussed platforms, and suggested next steps in a short, dealer-friendly format. Use clear section labels.";

export function buildDealerBriefRequest(
  messages: ChatMessage[],
  context: AssistantContext,
): PerazziAssistantRequest {
  return {
    messages: [...messages, { role: "user", content: DEALER_BRIEF_PROMPT }],
    context,
    summaryIntent: "dealer_brief",
  };
}

export function getDealerBriefPrompt() {
  return DEALER_BRIEF_PROMPT;
}
