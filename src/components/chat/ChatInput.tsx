"use client";

import { FormEvent, useState } from "react";
import type { TextVerbosity } from "@/types/perazzi-assistant";

interface ChatInputProps extends Readonly<{
  onSend: (question: string) => void;
  pending: boolean;
  textVerbosity: TextVerbosity;
  onTextVerbosityChange: (verbosity: TextVerbosity) => void;
}> {}

export function ChatInput({
  onSend,
  pending,
  textVerbosity,
  onTextVerbosityChange,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleVerbosityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as TextVerbosity;
    if (next === "low" || next === "medium" || next === "high") {
      onTextVerbosityChange(next);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || pending) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-ink-muted">
        <label className="flex items-center gap-2">
          <span>Verbosity</span>
          <select
            className="rounded-lg border border-subtle bg-card px-2 py-1 text-sm font-normal text-ink shadow-sm transition hover:border-ink focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:border-subtle disabled:text-ink-muted"
            value={textVerbosity}
            onChange={handleVerbosityChange}
            disabled={pending}
            aria-label="Choose response verbosity"
          >
            <option value="low">Concise</option>
            <option value="medium">Normal</option>
            <option value="high">Detailed</option>
          </select>
        </label>
      </div>
      <div className="relative">
        <label htmlFor="perazzi-chat-input" className="sr-only">
          Ask the Perazzi concierge
        </label>
        <textarea
          id="perazzi-chat-input"
          className="h-24 w-full resize-none rounded-2xl border border-subtle bg-card px-4 py-3 pr-20 text-sm sm:text-base outline-none focus:border-ink focus-ring"
          placeholder="Ask something about Perazzi, service, or heritage..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={pending}
          inputMode="text"
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!pending && value.trim()) {
                onSend(value.trim());
                setValue("");
              }
            }
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <button
            type="submit"
            disabled={pending || !value.trim()}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-card shadow-sm transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted"
          >
            <span className="sr-only">Send</span>
            <span className="text-base leading-none">{pending ? "…" : "↑"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
