"use client";

import { FormEvent, useState } from "react";
import { ArrowUp } from "lucide-react";
import { VerbosityToggle } from "@/components/chat/VerbosityToggle";
import { Textarea } from "@/components/ui";
import type { TextVerbosity } from "@/types/perazzi-assistant";

type ChatInputProps = Readonly<{
  onSend: (question: string) => void;
  pending: boolean;
  textVerbosity: TextVerbosity;
  onTextVerbosityChange: (verbosity: TextVerbosity) => void;
}>;

export function ChatInput({
  onSend,
  pending,
  textVerbosity,
  onTextVerbosityChange,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || pending) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <VerbosityToggle value={textVerbosity} onChange={onTextVerbosityChange} disabled={pending} />
      <div className="relative">
        <label htmlFor="perazzi-chat-input" className="sr-only">
          Ask the Perazzi concierge
        </label>
        <Textarea
          id="perazzi-chat-input"
          className="h-24 px-4 py-3 pr-20"
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
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-canvas shadow-soft transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted"
          >
            <span className="sr-only">Send</span>
            <span className="type-body-sm leading-none">
              {pending
                ? "…"
                : <ArrowUp className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
