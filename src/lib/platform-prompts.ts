import type { ChatTriggerPayload } from "@/lib/chat-trigger";

const PLATFORM_MESSAGES: Record<string, { question: string }> = {
  ht: {
    question:
      "Give me an overview of the High Tech platform's ballast, rib scheme, and fitting philosophy, and outline when to begin with the removable-trigger High Tech standard grade versus the fixed-trigger High Tech S.",
  },
  mx: {
    question:
      "Explain the MX platform lineage, balance, and trigger feel, then clarify how to choose between the removable-trigger MX8 standard grade and the fixed-trigger MX12 starting point.",
  },
  tm: {
    question:
      "Describe what defines the TM platform, why its removable-trigger builds excel in bunker and live-pigeon disciplines, and what a shooter should know before commissioning one.",
  },
  dc: {
    question:
      "Walk me through the DC platform—its detachable-coil trigger group, weight distribution, and which shooters typically pursue this removable-trigger architecture.",
  },
  sho: {
    question:
      "Share how the SHO sidelock platform differs within Perazzi's heritage, what disciplines or collectors it serves, and the hallmarks to expect from these removable-trigger builds.",
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
    question: `Help me understand the ${slug.toUpperCase()} platform and which configurations I should start from.`,
    context: { platformSlug: normalized, ...extraContext },
  };
}
