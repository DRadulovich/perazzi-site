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
        className="block rounded-2xl border border-subtle bg-subtle/40 px-4 py-3 text-sm sm:text-base leading-relaxed text-ink"
      >
        This answer is based on limited information and may be incomplete.
      </output>
    );
  }

  if (status === "blocked") {
    return (
      <output
        aria-live="polite"
        className="block rounded-2xl border border-subtle bg-subtle/40 px-4 py-3 text-sm sm:text-base leading-relaxed text-ink"
      >
        Policy-limited answer.
      </output>
    );
  }

  return null;
}
