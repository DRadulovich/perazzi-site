"use client";

import { FormEvent, useState } from "react";

interface ChatInputProps {
  onSend: (question: string) => void;
  pending: boolean;
}

export function ChatInput({ onSend, pending }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || pending) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        className="h-24 w-full resize-none rounded-2xl border border-subtle bg-card px-4 py-3 text-sm outline-none focus:border-ink"
        placeholder="Ask something about Perazzi, service, or heritage..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={pending}
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
      <div className="flex justify-end gap-3 text-sm">
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="rounded-full bg-ink px-5 py-2 text-card transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted"
        >
          {pending ? "Thinking..." : "Send"}
        </button>
      </div>
    </form>
  );
}
