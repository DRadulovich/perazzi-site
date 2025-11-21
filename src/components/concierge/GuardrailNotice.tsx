"use client";

type GuardrailStatus = "ok" | "low_confidence" | "blocked" | string | undefined | null;

export function GuardrailNotice({ status }: { status?: GuardrailStatus }) {
  if (!status || status === "ok") return null;

  if (status === "low_confidence") {
    return (
      <div className="rounded-2xl border border-subtle bg-subtle/40 px-4 py-3 text-sm text-ink">
        This answer is based on limited information and may be incomplete.
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="rounded-2xl border border-subtle bg-subtle/40 px-4 py-3 text-sm text-ink">
        Policy-limited answer.
      </div>
    );
  }

  return null;
}
