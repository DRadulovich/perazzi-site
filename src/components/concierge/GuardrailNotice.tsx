"use client";

import type { PerazziAssistantResponse } from "@/types/perazzi-assistant";

export type GuardrailStatus = PerazziAssistantResponse["guardrail"]["status"] | undefined | null;

type GuardrailNoticeProps = Readonly<{
  status?: GuardrailStatus;
}>;

export function GuardrailNotice({ status }: GuardrailNoticeProps) {
  if (!status || status === "ok") return null;

  if (status === "low_confidence") {
    return (
      <output
        aria-live="polite"
        className="block rounded-2xl border border-border/70 bg-card/60 px-4 py-3 type-body-sm leading-relaxed text-ink shadow-soft backdrop-blur-sm"
      >
        This answer is based on limited information and may be incomplete.
      </output>
    );
  }

  if (status === "blocked") {
    return (
      <output
        aria-live="polite"
        className="block rounded-2xl border border-border/70 bg-card/60 px-4 py-3 type-body-sm leading-relaxed text-ink shadow-soft backdrop-blur-sm"
      >
        Policy-limited answer.
      </output>
    );
  }

  return null;
}
