import type { ChatTriggerPayload } from "@/lib/chat-trigger";

const PLATFORM_MESSAGES: Record<string, { question: string }> = {
  ht: {
    question:
      "Give me a full overview of the HT platform and build philosophy, and outline what the purpose is between the fixed trigger High Tech S compared to the removable trigger High Tech models.",
  },
  mx: {
    question:
      "Explain the MX platform lineage, balance, and trigger feel, then clarify how to choose between the removable-trigger MX8 and the fixed-trigger MX12 models.",
  },
  tm: {
    question:
      "Describe what defines the TM platform, why its removable-trigger builds excel in american trap, and what a shooter should know before commissioning one.",
  },
  dc: {
    question:
      "Walk me through the DC platform—its detachable-coil trigger group, weight distribution, and which shooters typically pursue this removable-trigger architecture.",
  },
  sho: {
    question:
      "Share how the SHO sidelock platform differs within Perazzi's heritage, what disciplines or collectors it serves, and the hallmarks to expect from these heritage builds.",
  },
};

export function buildPlatformPrompt(
  slug: string,
  extraContext: ChatTriggerPayload["context"] = {},
): ChatTriggerPayload {
  const normalized = slug.toLowerCase();
  const entry = PLATFORM_MESSAGES[normalized];
  if (entry) {
    return {
      question: entry.question,
      context: { platformSlug: normalized, ...extraContext },
    };
  }
  return {
    question: `Help me understand the ${slug.toUpperCase()} platform and which model configurations I should start from.`,
    context: { platformSlug: normalized, ...extraContext },
  };
}
